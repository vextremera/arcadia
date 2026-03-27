import { d as db, O as Order, R as Refund, q as Payment, t as LoyaltyLedger, U as UserProfile, L as LoyaltyTier } from '../../../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq, inArray, and } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../../renderers.mjs';

const ALLOWED_STATUS = /* @__PURE__ */ new Set(["PENDING", "PAID", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]);
const ALLOWED_PAYMENT = /* @__PURE__ */ new Set(["UNPAID", "AUTH", "PAID", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"]);
const ALLOWED_REFUND = /* @__PURE__ */ new Set(["CREATED", "SUCCEEDED", "FAILED"]);
function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
function safeRedirectTo(value, fallback) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (!raw.startsWith("/admin/")) return fallback;
  return raw;
}
function redirectWith(path, params) {
  return withQuery(path, params);
}
function safeText(value) {
  return String(value ?? "").trim();
}
function parseId(value) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function parseEuroToCents(value) {
  const raw = safeText(value).replace(",", ".");
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}
function readSnapshot(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return {
    ...value
  };
}
function getPaymentMethod(order) {
  const meta = order?.addressSnapshot ?? {};
  const pm = String(meta.paymentMethod ?? "").toUpperCase();
  if (pm === "CASH" || pm === "CARD") return pm;
  return null;
}
function readAdminEvents(snapshot) {
  const raw = snapshot.adminEvents;
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry) => entry && typeof entry === "object").map((entry) => {
    const obj = entry;
    return {
      id: String(obj.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      kind: obj.kind === "STATUS" || obj.kind === "PAYMENT" || obj.kind === "NOTE" ? obj.kind : "NOTE",
      title: String(obj.title ?? "Evento"),
      detail: String(obj.detail ?? ""),
      by: typeof obj.by === "string" ? obj.by : null,
      at: typeof obj.at === "string" ? obj.at : (/* @__PURE__ */ new Date()).toISOString()
    };
  });
}
function appendAdminEvent(snapshot, event) {
  const list = readAdminEvents(snapshot);
  list.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    ...event
  });
  snapshot.adminEvents = list.slice(-60);
}
function calcPointsFromSubtotal(subtotalCents) {
  const POINTS_PER_EURO = 10;
  return Math.max(0, Math.floor(Number(subtotalCents) * POINTS_PER_EURO / 100));
}
async function getNextLedgerId() {
  const rows = await db.select({
    id: LoyaltyLedger.id
  }).from(LoyaltyLedger);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
async function getOrCreateProfile(userId) {
  const [existing] = await db.select({
    id: UserProfile.id,
    userId: UserProfile.userId,
    pointsBalance: UserProfile.pointsBalance,
    tierId: UserProfile.tierId
  }).from(UserProfile).where(eq(UserProfile.userId, userId)).limit(1);
  if (existing) return existing;
  const allProfiles = await db.select({
    id: UserProfile.id
  }).from(UserProfile);
  const nextId = allProfiles.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  await db.insert(UserProfile).values({
    id: nextId,
    userId,
    phone: void 0,
    birthday: void 0,
    pointsBalance: 0,
    tierId: void 0,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  });
  const [created] = await db.select({
    id: UserProfile.id,
    userId: UserProfile.userId,
    pointsBalance: UserProfile.pointsBalance,
    tierId: UserProfile.tierId
  }).from(UserProfile).where(eq(UserProfile.userId, userId)).limit(1);
  return created;
}
async function recomputeTier(profileId, pointsBalance) {
  const tiers = await db.select({
    id: LoyaltyTier.id,
    minPoints: LoyaltyTier.minPoints,
    active: LoyaltyTier.active
  }).from(LoyaltyTier);
  const activeTiers = tiers.filter((tier) => tier.active).sort((a, b) => Number(b.minPoints) - Number(a.minPoints));
  const best = activeTiers.find((tier) => Number(tier.minPoints) <= pointsBalance) ?? null;
  await db.update(UserProfile).set({
    tierId: best?.id ?? void 0,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(UserProfile.id, profileId));
}
async function insertLedgerEntry(input) {
  const nextLedgerId = await getNextLedgerId();
  await db.insert(LoyaltyLedger).values({
    id: nextLedgerId,
    userId: input.userId,
    orderId: input.orderId ?? void 0,
    pointsDelta: input.pointsDelta,
    reason: input.reason,
    meta: input.meta ?? void 0,
    createdAt: /* @__PURE__ */ new Date()
  });
  return nextLedgerId;
}
async function awardXpOnce(params) {
  const {
    orderId,
    userId,
    subtotalCents,
    paymentMethod
  } = params;
  const [exists] = await db.select({
    id: LoyaltyLedger.id
  }).from(LoyaltyLedger).where(and(eq(LoyaltyLedger.userId, userId), eq(LoyaltyLedger.orderId, orderId), eq(LoyaltyLedger.reason, "ORDER_PAID"))).limit(1);
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
      awardedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  const profile = await getOrCreateProfile(userId);
  if (!profile) return null;
  const current = Number(profile.pointsBalance ?? 0);
  const next = current + points;
  await db.update(UserProfile).set({
    pointsBalance: next,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(UserProfile.id, profile.id));
  await recomputeTier(profile.id, next);
  return {
    awardedPoints: points
  };
}
function mapOrderPaymentToPaymentStatus(status) {
  if (status === "AUTH") return "AUTHORIZED";
  if (status === "PAID" || status === "REFUNDED" || status === "PARTIALLY_REFUNDED") {
    return "PAID";
  }
  if (status === "FAILED") return "FAILED";
  return "CREATED";
}
async function ensureCardPaymentRecord(params) {
  const payments = await db.select({
    id: Payment.id,
    createdAt: Payment.createdAt
  }).from(Payment).where(eq(Payment.orderId, params.orderId)).orderBy(Payment.createdAt);
  const latest = payments.length ? payments[payments.length - 1] : null;
  if (latest) return latest.id;
  const existing = await db.select({
    id: Payment.id
  }).from(Payment);
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
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      note: params.note?.trim() || null
    }
  });
  return nextId;
}
async function syncCardPaymentRecord(params) {
  const paymentId = await ensureCardPaymentRecord({
    orderId: params.orderId,
    publicId: params.publicId,
    totalCents: params.totalCents,
    currency: params.currency,
    status: params.status,
    actor: params.actor,
    source: "admin-sync",
    note: params.note
  });
  const [payment] = await db.select({
    id: Payment.id,
    raw: Payment.raw
  }).from(Payment).where(eq(Payment.id, paymentId)).limit(1);
  if (!payment) return paymentId;
  const paymentStatus = mapOrderPaymentToPaymentStatus(params.status);
  const raw = readSnapshot(payment.raw);
  raw.lastOrderPaymentStatus = params.status;
  raw.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString();
  raw.lastSyncedBy = params.actor;
  raw.lastNote = params.note?.trim() || null;
  await db.update(Payment).set({
    status: paymentStatus,
    raw
  }).where(eq(Payment.id, paymentId));
  return paymentId;
}
async function getOrderPaymentsAndRefunds(orderId) {
  const payments = await db.select({
    id: Payment.id,
    status: Payment.status,
    amountCents: Payment.amountCents,
    raw: Payment.raw,
    createdAt: Payment.createdAt
  }).from(Payment).where(eq(Payment.orderId, orderId)).orderBy(Payment.createdAt);
  const paymentIds = payments.map((payment) => payment.id);
  const refunds = paymentIds.length ? await db.select({
    id: Refund.id,
    paymentId: Refund.paymentId,
    status: Refund.status,
    amountCents: Refund.amountCents,
    raw: Refund.raw,
    createdAt: Refund.createdAt
  }).from(Refund).where(inArray(Refund.paymentId, paymentIds)).orderBy(Refund.createdAt) : [];
  return {
    payments,
    refunds
  };
}
function sumSucceededRefundsForPayment(refunds, paymentId) {
  return refunds.filter((refund) => refund.paymentId === paymentId && refund.status === "SUCCEEDED").reduce((sum, refund) => sum + Number(refund.amountCents ?? 0), 0);
}
function deriveRefundPaymentStatus(params) {
  const totalPaymentCents = params.payments.reduce((sum, payment) => sum + Number(payment.amountCents ?? 0), 0);
  const succeededRefundCents = params.refunds.filter((refund) => refund.status === "SUCCEEDED").reduce((sum, refund) => sum + Number(refund.amountCents ?? 0), 0);
  if (succeededRefundCents <= 0) {
    return null;
  }
  if (totalPaymentCents > 0 && succeededRefundCents >= totalPaymentCents) {
    return "REFUNDED";
  }
  return "PARTIALLY_REFUNDED";
}
async function syncRefundLoyalty(params) {
  const paidEntries = await db.select({
    id: LoyaltyLedger.id,
    pointsDelta: LoyaltyLedger.pointsDelta,
    meta: LoyaltyLedger.meta
  }).from(LoyaltyLedger).where(and(eq(LoyaltyLedger.userId, params.userId), eq(LoyaltyLedger.orderId, params.orderId), eq(LoyaltyLedger.reason, "ORDER_PAID")));
  const paidPoints = paidEntries.reduce((sum, entry) => sum + Math.max(0, Number(entry.pointsDelta ?? 0)), 0);
  if (paidPoints <= 0) return null;
  const refundEntries = await db.select({
    id: LoyaltyLedger.id,
    pointsDelta: LoyaltyLedger.pointsDelta,
    meta: LoyaltyLedger.meta
  }).from(LoyaltyLedger).where(and(eq(LoyaltyLedger.userId, params.userId), eq(LoyaltyLedger.orderId, params.orderId), eq(LoyaltyLedger.reason, "ORDER_REFUND")));
  const alreadyRefundedPoints = refundEntries.reduce((sum, entry) => sum + Math.max(0, -Number(entry.pointsDelta ?? 0)), 0);
  const succeededRefundCents = params.refunds.filter((refund) => refund.status === "SUCCEEDED").reduce((sum, refund) => sum + Number(refund.amountCents ?? 0), 0);
  if (succeededRefundCents <= 0) return null;
  const safeTotalCents = Math.max(1, Number(params.totalCents ?? 0));
  const targetRefundPoints = Math.min(paidPoints, Math.floor(paidPoints * succeededRefundCents / safeTotalCents));
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
      syncedAt: (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  await db.update(UserProfile).set({
    pointsBalance: nextPoints,
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(UserProfile.id, profile.id));
  await recomputeTier(profile.id, nextPoints);
  return {
    refundedCents: succeededRefundCents,
    appliedPoints,
    targetRefundPoints,
    alreadyRefundedPoints
  };
}
const POST = async (context) => {
  const user = context.locals.user;
  const allowed = user && (user.role === "ADMIN" || user.role === "STAFF");
  if (!allowed) {
    return context.redirect("/admin/login");
  }
  const publicId = String(context.params.publicId ?? "").trim();
  if (!publicId) {
    return new Response("Missing publicId", {
      status: 400
    });
  }
  const [order] = await db.select({
    id: Order.id,
    publicId: Order.publicId,
    userId: Order.userId,
    status: Order.status,
    paymentStatus: Order.paymentStatus,
    subtotalCents: Order.subtotalCents,
    totalCents: Order.totalCents,
    currency: Order.currency,
    addressSnapshot: Order.addressSnapshot,
    updatedAt: Order.updatedAt
  }).from(Order).where(eq(Order.publicId, publicId)).limit(1);
  if (!order) {
    return new Response("Order not found", {
      status: 404
    });
  }
  const form = await context.request.formData();
  const redirectTo = safeRedirectTo(form.get("redirectTo"), `/admin/pedidos/${publicId}`);
  const intent = safeText(form.get("intent"));
  const statusRaw = safeText(form.get("status")).toUpperCase();
  const paymentRaw = safeText(form.get("paymentStatus")).toUpperCase();
  const refundStatusRaw = safeText(form.get("refundStatus")).toUpperCase();
  const refundAmountCents = parseEuroToCents(form.get("refundAmountEur"));
  const refundPaymentId = parseId(form.get("paymentId"));
  const note = safeText(form.get("note")).slice(0, 1e3);
  const adminInternalNote = safeText(form.get("adminInternalNote")).slice(0, 4e3);
  const patch = {};
  let nextStatus = String(order.status);
  let nextPayment = String(order.paymentStatus);
  let snapshotChanged = false;
  const snapshot = readSnapshot(order.addressSnapshot);
  const actor = typeof user?.name === "string" && user.name.trim() ? user.name.trim() : typeof user?.email === "string" && user.email.trim() ? user.email.trim() : "staff";
  const method = getPaymentMethod(order);
  if (intent === "save-admin-note") {
    snapshot.adminInternalNote = adminInternalNote || null;
    snapshotChanged = true;
    appendAdminEvent(snapshot, {
      kind: "NOTE",
      title: "Nota interna actualizada",
      detail: adminInternalNote ? "Se ha actualizado la nota interna del staff." : "Se ha vaciado la nota interna del staff.",
      by: actor
    });
  }
  if (intent === "add-activity-note") {
    if (note) {
      appendAdminEvent(snapshot, {
        kind: "NOTE",
        title: "Anotación manual",
        detail: note,
        by: actor
      });
      snapshotChanged = true;
    }
  }
  if (intent === "update-status" || !intent && statusRaw) {
    if (!statusRaw || !ALLOWED_STATUS.has(statusRaw)) {
      return new Response("Invalid status", {
        status: 400
      });
    }
    const previous = String(order.status);
    const requested = statusRaw;
    if (requested !== previous) {
      patch.status = requested;
      nextStatus = requested;
      appendAdminEvent(snapshot, {
        kind: "STATUS",
        title: "Cambio de estado",
        detail: note ? `${previous} → ${requested}. ${note}` : `${previous} → ${requested}`,
        by: actor
      });
      snapshotChanged = true;
    }
  }
  if (intent === "update-payment" || !intent && paymentRaw) {
    if (!paymentRaw || !ALLOWED_PAYMENT.has(paymentRaw)) {
      return new Response("Invalid payment status", {
        status: 400
      });
    }
    if (paymentRaw === "REFUNDED" || paymentRaw === "PARTIALLY_REFUNDED") {
      return context.redirect(redirectWith(redirectTo, {
        error: "refund-required"
      }));
    }
    if (method === "CARD") {
      const currentPaymentState = await getOrderPaymentsAndRefunds(order.id);
      const refundDerivedState = deriveRefundPaymentStatus(currentPaymentState);
      if (refundDerivedState) {
        return context.redirect(redirectWith(redirectTo, {
          error: "refund-state-locked"
        }));
      }
    }
    const previous = String(order.paymentStatus);
    const requested = paymentRaw;
    if (requested !== previous) {
      patch.paymentStatus = requested;
      nextPayment = requested;
      appendAdminEvent(snapshot, {
        kind: "PAYMENT",
        title: "Cambio de pago",
        detail: note ? `${previous} → ${requested}. ${note}` : `${previous} → ${requested}`,
        by: actor
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
      by: actor
    });
    snapshotChanged = true;
  }
  if (intent === "create-refund") {
    if (method !== "CARD") {
      return context.redirect(redirectWith(redirectTo, {
        error: "refund-only-card"
      }));
    }
    if (!refundStatusRaw || !ALLOWED_REFUND.has(refundStatusRaw)) {
      return context.redirect(redirectWith(redirectTo, {
        error: "invalid-refund-status"
      }));
    }
    if (refundAmountCents === null) {
      return context.redirect(redirectWith(redirectTo, {
        error: "invalid-refund-amount"
      }));
    }
    let {
      payments,
      refunds
    } = await getOrderPaymentsAndRefunds(order.id);
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
        note
      });
      ({
        payments,
        refunds
      } = await getOrderPaymentsAndRefunds(order.id));
    }
    const payment = payments.find((entry) => entry.id === targetPaymentId);
    if (!payment) {
      return context.redirect(redirectWith(redirectTo, {
        error: "invalid-payment-record"
      }));
    }
    const refundStatus = refundStatusRaw;
    const succeededRefundedCents = sumSucceededRefundsForPayment(refunds, payment.id);
    const remainingRefundableCents = Math.max(0, Number(payment.amountCents ?? 0) - succeededRefundedCents);
    const maxAllowedCents = refundStatus === "FAILED" ? Number(payment.amountCents ?? 0) : remainingRefundableCents;
    if (refundAmountCents > maxAllowedCents) {
      return context.redirect(redirectWith(redirectTo, {
        error: "refund-exceeds-payment"
      }));
    }
    if (refundStatus === "SUCCEEDED" && String(payment.status) !== "PAID") {
      return context.redirect(redirectWith(redirectTo, {
        error: "refund-payment-not-paid"
      }));
    }
    const refundIds = await db.select({
      id: Refund.id
    }).from(Refund);
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
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    });
    appendAdminEvent(snapshot, {
      kind: "PAYMENT",
      title: "Refund registrado",
      detail: note ? `${refundStatus} · ${(refundAmountCents / 100).toFixed(2)} € · ${note}` : `${refundStatus} · ${(refundAmountCents / 100).toFixed(2)} €`,
      by: actor
    });
    snapshotChanged = true;
    ({
      payments,
      refunds
    } = await getOrderPaymentsAndRefunds(order.id));
    const derivedRefundPaymentStatus = deriveRefundPaymentStatus({
      payments,
      refunds
    });
    if (derivedRefundPaymentStatus && derivedRefundPaymentStatus !== nextPayment) {
      patch.paymentStatus = derivedRefundPaymentStatus;
      nextPayment = derivedRefundPaymentStatus;
    }
  }
  const postActionPaymentsAndRefunds = method === "CARD" ? await getOrderPaymentsAndRefunds(order.id) : null;
  const refundDerivedStatus = postActionPaymentsAndRefunds ? deriveRefundPaymentStatus(postActionPaymentsAndRefunds) : null;
  if (refundDerivedStatus && refundDerivedStatus !== nextPayment) {
    patch.paymentStatus = refundDerivedStatus;
    nextPayment = refundDerivedStatus;
  }
  let loyaltyRefundSync = null;
  try {
    if (order.userId && method) {
      const userId = Number(order.userId);
      const shouldAwardCard = method === "CARD" && nextPayment === "PAID" && String(order.paymentStatus) !== "PAID";
      const shouldAwardCash = method === "CASH" && nextStatus === "DELIVERED" && String(order.status) !== "DELIVERED";
      if (shouldAwardCard || shouldAwardCash) {
        await awardXpOnce({
          orderId: order.id,
          userId,
          subtotalCents: Number(order.subtotalCents ?? 0),
          paymentMethod: method
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
            amountCents: Number(refund.amountCents ?? 0)
          }))
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
      by: actor
    });
    snapshotChanged = true;
  }
  if (!snapshotChanged && Object.keys(patch).length === 0) {
    return context.redirect(redirectTo);
  }
  if (snapshotChanged) {
    patch.addressSnapshot = snapshot;
  }
  patch.updatedAt = /* @__PURE__ */ new Date();
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
        note
      });
    }
  } catch (error) {
    console.error("[payments] sync failed", error);
  }
  const saved = intent === "create-refund" ? "refund" : intent === "update-payment" ? "payment" : intent === "update-status" ? "status" : intent === "save-admin-note" ? "admin-note" : intent === "add-activity-note" ? "activity" : "1";
  return context.redirect(redirectWith(redirectTo, {
    saved
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
