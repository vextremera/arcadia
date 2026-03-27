import type { APIRoute } from "astro";
import {
  and,
  db,
  eq,
  inArray,
  LoyaltyLedger,
  LoyaltyTier,
  Order,
  Payment,
  Refund,
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

type RefundStatus = "CREATED" | "SUCCEEDED" | "FAILED";

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

const ALLOWED_REFUND = new Set<RefundStatus>(["CREATED", "SUCCEEDED", "FAILED"]);

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function safeRedirectTo(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (!raw.startsWith("/admin/")) return fallback;
  return raw;
}

function redirectWith(path: string, params: Record<string, string>) {
  return withQuery(path, params);
}

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseEuroToCents(value: FormDataEntryValue | null) {
  const raw = safeText(value).replace(",", ".");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

function readSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }
  return { ...(value as Record<string, unknown>) };
}

function getPaymentMethod(order: unknown): "CASH" | "CARD" | null {
  const meta = ((order as Record<string, unknown> | null)?.addressSnapshot ?? {}) as Record<
    string,
    unknown
  >;
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

async function getNextLedgerId() {
  const rows = await db.select({ id: LoyaltyLedger.id }).from(LoyaltyLedger);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

async function getOrCreateProfile(userId: number) {
  const [existing] = await db
    .select({
      id: UserProfile.id,
      userId: UserProfile.userId,
      pointsBalance: UserProfile.pointsBalance,
      tierId: UserProfile.tierId,
    })
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  if (existing) return existing;

  const allProfiles = await db.select({ id: UserProfile.id }).from(UserProfile);
  const nextId = allProfiles.reduce((max, row) => Math.max(max, row.id), 0) + 1;

  await db.insert(UserProfile).values({
    id: nextId,
    userId,
    phone: undefined,
    birthday: undefined,
    pointsBalance: 0,
    tierId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [created] = await db
    .select({
      id: UserProfile.id,
      userId: UserProfile.userId,
      pointsBalance: UserProfile.pointsBalance,
      tierId: UserProfile.tierId,
    })
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  return created;
}

async function recomputeTier(profileId: number, pointsBalance: number) {
  const tiers = await db
    .select({
      id: LoyaltyTier.id,
      minPoints: LoyaltyTier.minPoints,
      active: LoyaltyTier.active,
    })
    .from(LoyaltyTier);

  const activeTiers = tiers
    .filter((tier) => tier.active)
    .sort((a, b) => Number(b.minPoints) - Number(a.minPoints));

  const best = activeTiers.find((tier) => Number(tier.minPoints) <= pointsBalance) ?? null;

  await db
    .update(UserProfile)
    .set({
      tierId: best?.id ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(UserProfile.id, profileId));
}

async function insertLedgerEntry(input: {
  userId: number;
  orderId?: number | null;
  pointsDelta: number;
  reason: "ORDER_PAID" | "ORDER_REFUND";
  meta?: unknown;
}) {
  const nextLedgerId = await getNextLedgerId();

  await db.insert(LoyaltyLedger).values({
    id: nextLedgerId,
    userId: input.userId,
    orderId: input.orderId ?? undefined,
    pointsDelta: input.pointsDelta,
    reason: input.reason,
    meta: input.meta ?? undefined,
    createdAt: new Date(),
  });

  return nextLedgerId;
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

  if (exists) return null;

  const points = calcPointsFromSubtotal(subtotalCents);
  if (points <= 0) return null;

  await insertLedgerEntry({
    userId,
    orderId,
    pointsDelta: points,
    reason: "ORDER_PAID",
    meta: {
      paymentMethod,
      awardedAt: new Date().toISOString(),
    },
  });

  const profile = await getOrCreateProfile(userId);
  if (!profile) return null;

  const current = Number(profile.pointsBalance ?? 0);
  const next = current + points;

  await db
    .update(UserProfile)
    .set({ pointsBalance: next, updatedAt: new Date() })
    .where(eq(UserProfile.id, profile.id));

  await recomputeTier(profile.id, next);

  return { awardedPoints: points };
}

function mapOrderPaymentToPaymentStatus(status: OrderPaymentStatus) {
  if (status === "AUTH") return "AUTHORIZED" as const;
  if (status === "PAID" || status === "REFUNDED" || status === "PARTIALLY_REFUNDED") {
    return "PAID" as const;
  }
  if (status === "FAILED") return "FAILED" as const;
  return "CREATED" as const;
}

async function ensureCardPaymentRecord(params: {
  orderId: number;
  publicId: string;
  totalCents: number;
  currency: string;
  status: OrderPaymentStatus;
  actor: string;
  source: "checkout-backfill" | "admin-sync" | "refund-backfill";
  note?: string | null;
}) {
  const payments = await db
    .select({
      id: Payment.id,
      createdAt: Payment.createdAt,
    })
    .from(Payment)
    .where(eq(Payment.orderId, params.orderId))
    .orderBy(Payment.createdAt);

  const latest = payments.length ? payments[payments.length - 1] : null;
  if (latest) return latest.id;

  const existing = await db.select({ id: Payment.id }).from(Payment);
  const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

  await db.insert(Payment).values({
    id: nextId,
    orderId: params.orderId,
    provider: "stripe",
    providerIntentId: `arcadia-manual-${params.publicId}`,
    status: mapOrderPaymentToPaymentStatus(params.status),
    amountCents: params.totalCents,
    currency: params.currency || "EUR",
    raw: {
      source: params.source,
      mode: "manual-card-tracking",
      actor: params.actor,
      createdAt: new Date().toISOString(),
      note: params.note?.trim() || null,
    },
  });

  return nextId;
}

async function syncCardPaymentRecord(params: {
  orderId: number;
  publicId: string;
  totalCents: number;
  currency: string;
  status: OrderPaymentStatus;
  actor: string;
  note?: string | null;
}) {
  const paymentId = await ensureCardPaymentRecord({
    orderId: params.orderId,
    publicId: params.publicId,
    totalCents: params.totalCents,
    currency: params.currency,
    status: params.status,
    actor: params.actor,
    source: "admin-sync",
    note: params.note,
  });

  const [payment] = await db
    .select({
      id: Payment.id,
      raw: Payment.raw,
    })
    .from(Payment)
    .where(eq(Payment.id, paymentId))
    .limit(1);

  if (!payment) return paymentId;

  const paymentStatus = mapOrderPaymentToPaymentStatus(params.status);
  const raw = readSnapshot(payment.raw);
  raw.lastOrderPaymentStatus = params.status;
  raw.lastSyncedAt = new Date().toISOString();
  raw.lastSyncedBy = params.actor;
  raw.lastNote = params.note?.trim() || null;

  await db
    .update(Payment)
    .set({
      status: paymentStatus,
      raw,
    })
    .where(eq(Payment.id, paymentId));

  return paymentId;
}

async function getOrderPaymentsAndRefunds(orderId: number) {
  const payments = await db
    .select({
      id: Payment.id,
      status: Payment.status,
      amountCents: Payment.amountCents,
      raw: Payment.raw,
      createdAt: Payment.createdAt,
    })
    .from(Payment)
    .where(eq(Payment.orderId, orderId))
    .orderBy(Payment.createdAt);

  const paymentIds = payments.map((payment) => payment.id);

  const refunds = paymentIds.length
    ? await db
        .select({
          id: Refund.id,
          paymentId: Refund.paymentId,
          status: Refund.status,
          amountCents: Refund.amountCents,
          raw: Refund.raw,
          createdAt: Refund.createdAt,
        })
        .from(Refund)
        .where(inArray(Refund.paymentId, paymentIds))
        .orderBy(Refund.createdAt)
    : [];

  return { payments, refunds };
}

function sumSucceededRefundsForPayment(
  refunds: Array<{ paymentId: number; status: string; amountCents: number }>,
  paymentId: number
) {
  return refunds
    .filter((refund) => refund.paymentId === paymentId && refund.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + Number(refund.amountCents ?? 0), 0);
}

function deriveRefundPaymentStatus(params: {
  payments: Array<{ amountCents: number }>;
  refunds: Array<{ status: string; amountCents: number }>;
}) {
  const totalPaymentCents = params.payments.reduce(
    (sum, payment) => sum + Number(payment.amountCents ?? 0),
    0
  );

  const succeededRefundCents = params.refunds
    .filter((refund) => refund.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + Number(refund.amountCents ?? 0), 0);

  if (succeededRefundCents <= 0) {
    return null;
  }

  if (totalPaymentCents > 0 && succeededRefundCents >= totalPaymentCents) {
    return "REFUNDED" as const;
  }

  return "PARTIALLY_REFUNDED" as const;
}

async function syncRefundLoyalty(params: {
  orderId: number;
  userId: number;
  totalCents: number;
  actor: string;
  refunds: Array<{ status: string; amountCents: number }>;
}) {
  const paidEntries = await db
    .select({
      id: LoyaltyLedger.id,
      pointsDelta: LoyaltyLedger.pointsDelta,
      meta: LoyaltyLedger.meta,
    })
    .from(LoyaltyLedger)
    .where(
      and(
        eq(LoyaltyLedger.userId, params.userId),
        eq(LoyaltyLedger.orderId, params.orderId),
        eq(LoyaltyLedger.reason, "ORDER_PAID")
      )
    );

  const paidPoints = paidEntries.reduce(
    (sum, entry) => sum + Math.max(0, Number(entry.pointsDelta ?? 0)),
    0
  );

  if (paidPoints <= 0) return null;

  const refundEntries = await db
    .select({
      id: LoyaltyLedger.id,
      pointsDelta: LoyaltyLedger.pointsDelta,
      meta: LoyaltyLedger.meta,
    })
    .from(LoyaltyLedger)
    .where(
      and(
        eq(LoyaltyLedger.userId, params.userId),
        eq(LoyaltyLedger.orderId, params.orderId),
        eq(LoyaltyLedger.reason, "ORDER_REFUND")
      )
    );

  const alreadyRefundedPoints = refundEntries.reduce(
    (sum, entry) => sum + Math.max(0, -Number(entry.pointsDelta ?? 0)),
    0
  );

  const succeededRefundCents = params.refunds
    .filter((refund) => refund.status === "SUCCEEDED")
    .reduce((sum, refund) => sum + Number(refund.amountCents ?? 0), 0);

  if (succeededRefundCents <= 0) return null;

  const safeTotalCents = Math.max(1, Number(params.totalCents ?? 0));
  const targetRefundPoints = Math.min(
    paidPoints,
    Math.floor((paidPoints * succeededRefundCents) / safeTotalCents)
  );

  const deltaNeeded = targetRefundPoints - alreadyRefundedPoints;
  if (deltaNeeded <= 0) return null;

  const profile = await getOrCreateProfile(params.userId);
  if (!profile) return null;

  const currentPoints = Math.max(0, Number(profile.pointsBalance ?? 0));
  const appliedPoints = Math.min(deltaNeeded, currentPoints);
  if (appliedPoints <= 0) return null;

  const nextPoints = currentPoints - appliedPoints;

  await insertLedgerEntry({
    userId: params.userId,
    orderId: params.orderId,
    pointsDelta: -appliedPoints,
    reason: "ORDER_REFUND",
    meta: {
      source: "refund-sync",
      actor: params.actor,
      refundedCents: succeededRefundCents,
      orderTotalCents: safeTotalCents,
      paidPoints,
      targetRefundPoints,
      alreadyRefundedPoints,
      appliedPoints,
      syncedAt: new Date().toISOString(),
    },
  });

  await db
    .update(UserProfile)
    .set({
      pointsBalance: nextPoints,
      updatedAt: new Date(),
    })
    .where(eq(UserProfile.id, profile.id));

  await recomputeTier(profile.id, nextPoints);

  return {
    refundedCents: succeededRefundCents,
    appliedPoints,
    targetRefundPoints,
    alreadyRefundedPoints,
  };
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
      totalCents: Order.totalCents,
      currency: Order.currency,
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
  const refundStatusRaw = safeText(form.get("refundStatus")).toUpperCase();
  const refundAmountCents = parseEuroToCents(form.get("refundAmountEur"));
  const refundPaymentId = parseId(form.get("paymentId"));
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
      detail: adminInternalNote
        ? "Se ha actualizado la nota interna del staff."
        : "Se ha vaciado la nota interna del staff.",
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
        detail: note ? `${previous} → ${requested}. ${note}` : `${previous} → ${requested}`,
        by: actor,
      });
      snapshotChanged = true;
    }
  }

  if (intent === "update-payment" || (!intent && paymentRaw)) {
    if (!paymentRaw || !ALLOWED_PAYMENT.has(paymentRaw as OrderPaymentStatus)) {
      return new Response("Invalid payment status", { status: 400 });
    }

    if (paymentRaw === "REFUNDED" || paymentRaw === "PARTIALLY_REFUNDED") {
      return context.redirect(redirectWith(redirectTo, { error: "refund-required" }));
    }

    if (method === "CARD") {
      const currentPaymentState = await getOrderPaymentsAndRefunds(order.id);
      const refundDerivedState = deriveRefundPaymentStatus(currentPaymentState);
      if (refundDerivedState) {
        return context.redirect(redirectWith(redirectTo, { error: "refund-state-locked" }));
      }
    }

    const previous = String(order.paymentStatus) as OrderPaymentStatus;
    const requested = paymentRaw as OrderPaymentStatus;

    if (requested !== previous) {
      patch.paymentStatus = requested;
      nextPayment = requested;

      appendAdminEvent(snapshot, {
        kind: "PAYMENT",
        title: "Cambio de pago",
        detail: note ? `${previous} → ${requested}. ${note}` : `${previous} → ${requested}`,
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

  if (intent === "create-refund") {
    if (method !== "CARD") {
      return context.redirect(redirectWith(redirectTo, { error: "refund-only-card" }));
    }

    if (!refundStatusRaw || !ALLOWED_REFUND.has(refundStatusRaw as RefundStatus)) {
      return context.redirect(redirectWith(redirectTo, { error: "invalid-refund-status" }));
    }

    if (refundAmountCents === null) {
      return context.redirect(redirectWith(redirectTo, { error: "invalid-refund-amount" }));
    }

    let { payments, refunds } = await getOrderPaymentsAndRefunds(order.id);

    let targetPaymentId = refundPaymentId;
    if (!targetPaymentId) {
      targetPaymentId = await ensureCardPaymentRecord({
        orderId: order.id,
        publicId: order.publicId,
        totalCents: Number(order.totalCents ?? 0),
        currency: String(order.currency ?? "EUR"),
        status: nextPayment,
        actor,
        source: "refund-backfill",
        note,
      });
      ({ payments, refunds } = await getOrderPaymentsAndRefunds(order.id));
    }

    const payment = payments.find((entry) => entry.id === targetPaymentId);
    if (!payment) {
      return context.redirect(redirectWith(redirectTo, { error: "invalid-payment-record" }));
    }

    const refundStatus = refundStatusRaw as RefundStatus;
    const succeededRefundedCents = sumSucceededRefundsForPayment(refunds, payment.id);
    const remainingRefundableCents = Math.max(
      0,
      Number(payment.amountCents ?? 0) - succeededRefundedCents
    );
    const maxAllowedCents =
      refundStatus === "FAILED" ? Number(payment.amountCents ?? 0) : remainingRefundableCents;

    if (refundAmountCents > maxAllowedCents) {
      return context.redirect(redirectWith(redirectTo, { error: "refund-exceeds-payment" }));
    }

    if (refundStatus === "SUCCEEDED" && String(payment.status) !== "PAID") {
      return context.redirect(redirectWith(redirectTo, { error: "refund-payment-not-paid" }));
    }

    const refundIds = await db.select({ id: Refund.id }).from(Refund);
    const nextRefundId = refundIds.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(Refund).values({
      id: nextRefundId,
      paymentId: payment.id,
      providerRefundId: `arcadia-manual-refund-${payment.id}-${nextRefundId}`,
      status: refundStatus,
      amountCents: refundAmountCents,
      raw: {
        source: "admin-refund",
        mode: "manual-refund-tracking",
        actor,
        orderPublicId: order.publicId,
        paymentStatusAtCreation: nextPayment,
        paymentRecordStatus: payment.status,
        note: note || null,
        createdAt: new Date().toISOString(),
      },
    });

    appendAdminEvent(snapshot, {
      kind: "PAYMENT",
      title: "Refund registrado",
      detail: note
        ? `${refundStatus} · ${(refundAmountCents / 100).toFixed(2)} € · ${note}`
        : `${refundStatus} · ${(refundAmountCents / 100).toFixed(2)} €`,
      by: actor,
    });
    snapshotChanged = true;

    ({ payments, refunds } = await getOrderPaymentsAndRefunds(order.id));
    const derivedRefundPaymentStatus = deriveRefundPaymentStatus({ payments, refunds });

    if (derivedRefundPaymentStatus && derivedRefundPaymentStatus !== nextPayment) {
      patch.paymentStatus = derivedRefundPaymentStatus;
      nextPayment = derivedRefundPaymentStatus;
    }
  }

  const postActionPaymentsAndRefunds =
    method === "CARD" ? await getOrderPaymentsAndRefunds(order.id) : null;
  const refundDerivedStatus = postActionPaymentsAndRefunds
    ? deriveRefundPaymentStatus(postActionPaymentsAndRefunds)
    : null;

  if (refundDerivedStatus && refundDerivedStatus !== nextPayment) {
    patch.paymentStatus = refundDerivedStatus;
    nextPayment = refundDerivedStatus;
  }

  let loyaltyRefundSync:
    | {
        refundedCents: number;
        appliedPoints: number;
        targetRefundPoints: number;
        alreadyRefundedPoints: number;
      }
    | null = null;

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

      if (method === "CARD" && postActionPaymentsAndRefunds) {
        loyaltyRefundSync = await syncRefundLoyalty({
          orderId: order.id,
          userId,
          totalCents: Number(order.totalCents ?? 0),
          actor,
          refunds: postActionPaymentsAndRefunds.refunds.map((refund) => ({
            status: String(refund.status),
            amountCents: Number(refund.amountCents ?? 0),
          })),
        });
      }
    }
  } catch (error) {
    console.error("[loyalty] sync failed", error);
  }

  if (loyaltyRefundSync) {
    appendAdminEvent(snapshot, {
      kind: "PAYMENT",
      title: "Ajuste loyalty por refund",
      detail: `-${loyaltyRefundSync.appliedPoints} pts por refund acumulado de ${(loyaltyRefundSync.refundedCents / 100).toFixed(2)} €`,
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
    if (method === "CARD") {
      await syncCardPaymentRecord({
        orderId: order.id,
        publicId: order.publicId,
        totalCents: Number(order.totalCents ?? 0),
        currency: String(order.currency ?? "EUR"),
        status: nextPayment,
        actor,
        note,
      });
    }
  } catch (error) {
    console.error("[payments] sync failed", error);
  }

  const saved =
    intent === "create-refund"
      ? "refund"
      : intent === "update-payment"
        ? "payment"
        : intent === "update-status"
          ? "status"
          : intent === "save-admin-note"
            ? "admin-note"
            : intent === "add-activity-note"
              ? "activity"
              : "1";

  return context.redirect(redirectWith(redirectTo, { saved }));
};