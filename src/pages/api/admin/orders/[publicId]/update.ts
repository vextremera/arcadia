import type { APIRoute } from "astro";
import {
  db,
  Order,
  UserProfile,
  LoyaltyLedger,
  LoyaltyTier,
  eq,
  and,
} from "astro:db";

const ALLOWED_STATUS = new Set([
  "PENDING",
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

function getPaymentMethod(order: any): "CASH" | "CARD" | null {
  const meta = (order?.addressSnapshot ?? {}) as any;
  const pm = String(meta?.paymentMethod ?? "").toUpperCase();
  if (pm === "CASH" || pm === "CARD") return pm;
  return null;
}

function calcPointsFromSubtotal(subtotalCents: number) {
  // 10 puntos por € -> subtotalCents * 10 / 100
  // 11,70€ => 117 puntos
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

  // Evitar duplicados por orden (si ya se otorgó XP para este pedido)
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

  // Insert ledger
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

  // Upsert profile (simple: select -> insert/update)
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

  // Calcular tier (mejor tier cuyo minPoints <= puntos)
  const tiers = await db
    .select({
      id: LoyaltyTier.id,
      minPoints: LoyaltyTier.minPoints,
      active: LoyaltyTier.active,
    })
    .from(LoyaltyTier)
    .where(eq(LoyaltyTier.active, true));

  const best = tiers
    .filter((t) => Number(t.minPoints) <= next)
    .sort((a, b) => Number(b.minPoints) - Number(a.minPoints))[0];

  if (best) {
    // Necesitamos el id del profile (si acabamos de insertarlo, volvemos a leer)
    let profileId = profile?.id ?? null;
    if (!profileId) {
      const [p2] = await db
        .select({ id: UserProfile.id, tierId: UserProfile.tierId })
        .from(UserProfile)
        .where(eq(UserProfile.userId, userId))
        .limit(1);
      profileId = p2?.id ?? null;
      if (profileId && Number(p2?.tierId ?? 0) === Number(best.id)) return;
    }

    if (profileId) {
      await db
        .update(UserProfile)
        .set({ tierId: best.id, updatedAt: new Date() })
        .where(eq(UserProfile.id, profileId));
    }
  }
}

export const POST: APIRoute = async (context) => {
  const { params, request, locals } = context;

  const u = locals.user;
  const allowed = u && (u.role === "ADMIN" || u.role === "STAFF");
  if (!allowed) return context.redirect("/admin/login");

  const publicId = String(params.publicId ?? "").trim();
  if (!publicId) return new Response("Missing publicId", { status: 400 });

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

  if (!order) return new Response("Order not found", { status: 404 });

  const form = await request.formData();

  const statusRaw = String(form.get("status") ?? "").trim().toUpperCase();
  const paymentRaw = String(form.get("paymentStatus") ?? "").trim().toUpperCase();

  const patch: Record<string, any> = {};
  let nextStatus = String(order.status);
  let nextPayment = String(order.paymentStatus);

  if (statusRaw) {
    if (!ALLOWED_STATUS.has(statusRaw)) return new Response("Invalid status", { status: 400 });
    patch.status = statusRaw;
    nextStatus = statusRaw;
  }

  if (paymentRaw) {
    if (!ALLOWED_PAYMENT.has(paymentRaw)) return new Response("Invalid payment status", { status: 400 });
    patch.paymentStatus = paymentRaw;
    nextPayment = paymentRaw;
  }

  // Regla clave:
  // CASH -> XP y pago PAID sólo cuando está DELIVERED
  const method = getPaymentMethod(order);
  if (method === "CASH" && nextStatus === "DELIVERED" && nextPayment !== "PAID") {
    patch.paymentStatus = "PAID";
    nextPayment = "PAID";
  }

  patch.updatedAt = new Date();

  await db.update(Order).set(patch).where(eq(Order.id, order.id));

  // XP rules:
  // - CARD: cuando payment pasa a PAID
  // - CASH: cuando status pasa a DELIVERED
  try {
    if (order.userId && method) {
      const userId = Number(order.userId);

      const shouldAwardCard =
        method === "CARD" && nextPayment === "PAID" && String(order.paymentStatus) !== "PAID";

      const shouldAwardCash =
        method === "CASH" && nextStatus === "DELIVERED" && String(order.status) !== "DELIVERED";

      if (shouldAwardCard || shouldAwardCash) {
        await awardXpOnce({
          orderId: order.id,
          userId,
          subtotalCents: Number(order.subtotalCents ?? 0),
          paymentMethod: method,
        });
      }
    }
  } catch (e) {
    // No rompemos el flujo admin si falla el loyalty (lo revisamos luego si hace falta)
    console.error("[loyalty] award failed", e);
  }

  return context.redirect(`/admin/pedidos/${publicId}`);
};