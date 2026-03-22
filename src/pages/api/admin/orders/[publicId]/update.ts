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

type StoredAdminEvent = {
  id: string;
  kind: "STATUS" | "PAYMENT" | "NOTE";
  title: string;
  detail: string;
  by?: string | null;
  at: string;
};

const ALLOWED_STATUS = new Set<OrderStatus>([
  "PENDING",
  "PAID",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

const ALLOWED_PAYMENT = new Set<OrderPaymentStatus>([
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

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function readSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }
  return { ...(value as Record<string, unknown>) };
}

function getPaymentMethod(order: unknown): "CASH" | "CARD" | null {
  const meta = ((order as Record<string, unknown> | null)?.addressSnapshot ?? {}) as Record<string, unknown>;
  const pm = String(meta.paymentMethod ?? "").toUpperCase();
  if (pm === "CASH" || pm === "CARD") return pm;
  return null;
}

function readAdminEvents(snapshot: Record<string, unknown>) {
  const raw = snapshot.adminEvents;
  if (!Array.isArray(raw)) return [] as StoredAdminEvent[];

  return raw
    .filter((entry) => entry && typeof entry === "object")
    .map((entry) => {
      const obj = entry as Record<string, unknown>;

      return {
        id: String(obj.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
        kind:
          obj.kind === "STATUS" || obj.kind === "PAYMENT" || obj.kind === "NOTE"
            ? obj.kind
            : "NOTE",
        title: String(obj.title ?? "Evento"),
        detail: String(obj.detail ?? ""),
        by: typeof obj.by === "string" ? obj.by : null,
        at: typeof obj.at === "string" ? obj.at : new Date().toISOString(),
      } satisfies StoredAdminEvent;
    });
}

function appendAdminEvent(
  snapshot: Record<string, unknown>,
  event: Omit<StoredAdminEvent, "id" | "at">
) {
  const list = readAdminEvents(snapshot);

  list.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: new Date().toISOString(),
    ...event,
  });

  snapshot.adminEvents = list.slice(-60);
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
  const intent = safeText(form.get("intent"));

  const statusRaw = safeText(form.get("status")).toUpperCase();
  const paymentRaw = safeText(form.get("paymentStatus")).toUpperCase();
  const note = safeText(form.get("note")).slice(0, 1000);
  const adminInternalNote = safeText(form.get("adminInternalNote")).slice(0, 4000);

  const patch: {
    status?: OrderStatus;
    paymentStatus?: OrderPaymentStatus;
    addressSnapshot?: Record<string, unknown>;
    updatedAt?: Date;
  } = {};

  let nextStatus = String(order.status) as OrderStatus;
  let nextPayment = String(order.paymentStatus) as OrderPaymentStatus;
  let snapshotChanged = false;

  const snapshot = readSnapshot(order.addressSnapshot);
  const actor =
  typeof user?.name === "string" && user.name.trim()
    ? user.name.trim()
    : typeof user?.email === "string" && user.email.trim()
      ? user.email.trim()
      : "staff";

  const method = getPaymentMethod(order);

  if (intent === "save-admin-note") {
    snapshot.adminInternalNote = adminInternalNote || null;
    snapshotChanged = true;

    appendAdminEvent(snapshot, {
      kind: "NOTE",
      title: "Nota interna actualizada",
      detail: adminInternalNote ? "Se ha actualizado la nota interna del staff." : "Se ha vaciado la nota interna del staff.",
      by: actor,
    });
  }

  if (intent === "add-activity-note") {
    if (note) {
      appendAdminEvent(snapshot, {
        kind: "NOTE",
        title: "Anotación manual",
        detail: note,
        by: actor,
      });
      snapshotChanged = true;
    }
  }

  if (intent === "update-status" || (!intent && statusRaw)) {
    if (!statusRaw || !ALLOWED_STATUS.has(statusRaw as OrderStatus)) {
      return new Response("Invalid status", { status: 400 });
    }

    const previous = String(order.status) as OrderStatus;
    const requested = statusRaw as OrderStatus;

    if (requested !== previous) {
      patch.status = requested;
      nextStatus = requested;

      appendAdminEvent(snapshot, {
        kind: "STATUS",
        title: "Cambio de estado",
        detail: note
          ? `${previous} → ${requested}. ${note}`
          : `${previous} → ${requested}`,
        by: actor,
      });
      snapshotChanged = true;
    }
  }

  if (intent === "update-payment" || (!intent && paymentRaw)) {
    if (!paymentRaw || !ALLOWED_PAYMENT.has(paymentRaw as OrderPaymentStatus)) {
      return new Response("Invalid payment status", { status: 400 });
    }

    const previous = String(order.paymentStatus) as OrderPaymentStatus;
    const requested = paymentRaw as OrderPaymentStatus;

    if (requested !== previous) {
      patch.paymentStatus = requested;
      nextPayment = requested;

      appendAdminEvent(snapshot, {
        kind: "PAYMENT",
        title: "Cambio de pago",
        detail: note
          ? `${previous} → ${requested}. ${note}`
          : `${previous} → ${requested}`,
        by: actor,
      });
      snapshotChanged = true;
    }
  }

  if (method === "CASH" && nextStatus === "DELIVERED" && nextPayment !== "PAID") {
    const previous = nextPayment;
    patch.paymentStatus = "PAID";
    nextPayment = "PAID";

    appendAdminEvent(snapshot, {
      kind: "PAYMENT",
      title: "Auto cierre de cobro",
      detail: `${previous} → PAID por entrega en efectivo`,
      by: actor,
    });
    snapshotChanged = true;
  }

  if (!snapshotChanged && Object.keys(patch).length === 0) {
    return context.redirect(redirectTo);
  }

  if (snapshotChanged) {
    patch.addressSnapshot = snapshot;
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