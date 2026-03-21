import type { APIRoute } from "astro";
import {
  and,
  db,
  eq,
  LoyaltyLedger,
  LoyaltyTier,
  Order,
  UserProfile,
} from "astro:db";

const ALLOWED_STATUS = new Set([
  "PENDING",
  "PAID",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

const ALLOWED_PAYMENT = new Set([
  "UNPAID",
  "AUTH",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

function safeRedirectTo(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (!raw.startsWith("/admin/")) return fallback;
  return raw;
}

function getPaymentMethod(order: unknown): "CASH" | "CARD" | null {
  const meta = ((order as Record<string, unknown> | null)?.addressSnapshot ?? {}) as Record<string, unknown>;
  const pm = String(meta.paymentMethod ?? "").toUpperCase();
  if (pm === "CASH" || pm === "CARD") return pm;
  return null;
}

function calcPointsFromSubtotal(subtotalCents: number) {
  const POINTS_PER_EURO = 10;
  return Math.max(0, Math.floor((Number(subtotalCents) * POINTS_PER_EURO) / 100));
}

async function awardXpOnce(params: {
  orderId: number;
  userId: number;
  subtotalCents: number;
  paymentMethod: "CASH" | "CARD";
}) {
  const { orderId, userId, subtotalCents, paymentMethod } = params;

  const [exists] = await db
    .select({ id: LoyaltyLedger.id })
    .from(LoyaltyLedger)
    .where(
      and(
        eq(LoyaltyLedger.userId, userId),
        eq(LoyaltyLedger.orderId, orderId),
        eq(LoyaltyLedger.reason, "ORDER_PAID")
      )
    )
    .limit(1);

  if (exists) return;

  const points = calcPointsFromSubtotal(subtotalCents);
  if (points <= 0) return;

  await db.insert(LoyaltyLedger).values({
    userId,
    orderId,
    pointsDelta: points,
    reason: "ORDER_PAID",
    meta: {
      paymentMethod,
      awardedAt: new Date().toISOString(),
    },
  });

  const [profile] = await db
    .select({
      id: UserProfile.id,
      pointsBalance: UserProfile.pointsBalance,
      tierId: UserProfile.tierId,
    })
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  const current = Number(profile?.pointsBalance ?? 0);
  const next = current + points;

  if (!profile) {
    await db.insert(UserProfile).values({
      userId,
      pointsBalance: next,
      updatedAt: new Date(),
    });
  } else {
    await db
      .update(UserProfile)
      .set({ pointsBalance: next, updatedAt: new Date() })
      .where(eq(UserProfile.id, profile.id));
  }

  const tiers = await db
    .select({
      id: LoyaltyTier.id,
      minPoints: LoyaltyTier.minPoints,
      active: LoyaltyTier.active,
    })
    .from(LoyaltyTier)
    .where(eq(LoyaltyTier.active, true));

  const best = tiers
    .filter((tier) => Number(tier.minPoints) <= next)
    .sort((a, b) => Number(b.minPoints) - Number(a.minPoints))[0];

  if (!best) return;

  let profileId = profile?.id ?? null;
  let currentTierId = Number(profile?.tierId ?? 0);

  if (!profileId) {
    const [freshProfile] = await db
      .select({
        id: UserProfile.id,
        tierId: UserProfile.tierId,
      })
      .from(UserProfile)
      .where(eq(UserProfile.userId, userId))
      .limit(1);

    profileId = freshProfile?.id ?? null;
    currentTierId = Number(freshProfile?.tierId ?? 0);
  }

  if (profileId && currentTierId !== Number(best.id)) {
    await db
      .update(UserProfile)
      .set({ tierId: best.id, updatedAt: new Date() })
      .where(eq(UserProfile.id, profileId));
  }
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  const allowed = user && (user.role === "ADMIN" || user.role === "STAFF");
  if (!allowed) {
    return context.redirect("/admin/login");
  }

  const publicId = String(context.params.publicId ?? "").trim();
  if (!publicId) {
    return new Response("Missing publicId", { status: 400 });
  }

  const [order] = await db
    .select({
      id: Order.id,
      publicId: Order.publicId,
      userId: Order.userId,
      status: Order.status,
      paymentStatus: Order.paymentStatus,
      subtotalCents: Order.subtotalCents,
      addressSnapshot: Order.addressSnapshot,
      updatedAt: Order.updatedAt,
    })
    .from(Order)
    .where(eq(Order.publicId, publicId))
    .limit(1);

  if (!order) {
    return new Response("Order not found", { status: 404 });
  }

  const form = await context.request.formData();
  const redirectTo = safeRedirectTo(form.get("redirectTo"), `/admin/pedidos/${publicId}`);

  const statusRaw = String(form.get("status") ?? "").trim().toUpperCase();
  const paymentRaw = String(form.get("paymentStatus") ?? "").trim().toUpperCase();

  const patch: {
    status?: OrderStatus;
    paymentStatus?: OrderPaymentStatus;
    updatedAt?: Date;
  } = {};

  type OrderStatus =
    | "PENDING"
    | "PAID"
    | "ACCEPTED"
    | "PREPARING"
    | "READY"
    | "OUT_FOR_DELIVERY"
    | "DELIVERED"
    | "CANCELLED";

  type OrderPaymentStatus =
    | "UNPAID"
    | "AUTH"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";

  let nextStatus = String(order.status);
  let nextPayment = String(order.paymentStatus);

  if (statusRaw) {
    if (!ALLOWED_STATUS.has(statusRaw)) {
      return new Response("Invalid status", { status: 400 });
    }
    patch.status = statusRaw as OrderStatus;
    nextStatus = statusRaw;
  }

  if (paymentRaw) {
    if (!ALLOWED_PAYMENT.has(paymentRaw)) {
      return new Response("Invalid payment status", { status: 400 });
    }
    patch.paymentStatus = paymentRaw as OrderPaymentStatus;
    nextPayment = paymentRaw;
  }

  const method = getPaymentMethod(order);

  if (method === "CASH" && nextStatus === "DELIVERED" && nextPayment !== "PAID") {
    patch.paymentStatus = "PAID";
    nextPayment = "PAID";
  }

  if (Object.keys(patch).length === 0) {
    return context.redirect(redirectTo);
  }

  patch.updatedAt = new Date();

  await db.update(Order).set(patch).where(eq(Order.id, order.id));

  try {
    if (order.userId && method) {
      const userId = Number(order.userId);

      const shouldAwardCard =
        method === "CARD" &&
        nextPayment === "PAID" &&
        String(order.paymentStatus) !== "PAID";

      const shouldAwardCash =
        method === "CASH" &&
        nextStatus === "DELIVERED" &&
        String(order.status) !== "DELIVERED";

      if (shouldAwardCard || shouldAwardCash) {
        await awardXpOnce({
          orderId: order.id,
          userId,
          subtotalCents: Number(order.subtotalCents ?? 0),
          paymentMethod: method,
        });
      }
    }
  } catch (error) {
    console.error("[loyalty] award failed", error);
  }

  return context.redirect(redirectTo);
};