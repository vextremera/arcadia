import type { APIRoute } from "astro";
import { db, Coupon, LoyaltyTier, Order, eq } from "astro:db";
import { normalizeCouponCode, type CouponKind } from "@/server/checkout/coupons";

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parsePercent(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > 100) return null;
  return Math.round(n);
}

function parseEuroToCents(value: FormDataEntryValue | null, optional = false) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return optional ? null : null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function parseOptionalPositiveInt(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

function parseOptionalTierId(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseDateStart(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return new Date(`${raw}T00:00:00`);
}

function parseDateEnd(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return new Date(`${raw}T23:59:59.999`);
}

function isCouponKind(value: string): value is CouponKind {
  return value === "PERCENT" || value === "FIXED" || value === "FREE_DELIVERY";
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function resolveCouponValue(
  type: CouponKind,
  valueInput: FormDataEntryValue | null
) {
  if (type === "PERCENT") {
    return parsePercent(valueInput);
  }

  if (type === "FIXED") {
    return parseEuroToCents(valueInput, false);
  }

  return 0;
}

const REDIRECT_PATH = "/admin/cupones";

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "create") {
    const code = normalizeCouponCode(String(form.get("code") ?? ""));
    const type = String(form.get("type") ?? "").trim();
    const value = isCouponKind(type) ? resolveCouponValue(type, form.get("valueInput")) : null;
    const minSubtotalCents = parseEuroToCents(form.get("minSubtotalEur"), true);
    const maxUses = parseOptionalPositiveInt(form.get("maxUses"));
    const requiredTierId = parseOptionalTierId(form.get("requiredTierId"));
    const startsAt = parseDateStart(form.get("startsAt"));
    const endsAt = parseDateEnd(form.get("endsAt"));
    const active = form.get("active") === "on";

    if (!code) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-code" }));
    }

    if (!isCouponKind(type)) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-type" }));
    }

    if (value === null) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-value" }));
    }

    if (
      String(form.get("minSubtotalEur") ?? "").trim() &&
      minSubtotalCents === null
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-min-subtotal" }));
    }

    if (
      String(form.get("maxUses") ?? "").trim() &&
      maxUses === null
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-max-uses" }));
    }

    if (
      (String(form.get("startsAt") ?? "").trim() && !startsAt) ||
      (String(form.get("endsAt") ?? "").trim() && !endsAt)
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-dates" }));
    }

    if (startsAt && endsAt && startsAt > endsAt) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-dates" }));
    }

    if (requiredTierId !== null) {
      const [tier] = await db
        .select({ id: LoyaltyTier.id })
        .from(LoyaltyTier)
        .where(eq(LoyaltyTier.id, requiredTierId))
        .limit(1);

      if (!tier) {
        return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-tier" }));
      }
    }

    const [existingCode] = await db
      .select({ id: Coupon.id })
      .from(Coupon)
      .where(eq(Coupon.code, code))
      .limit(1);

    if (existingCode) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-code" }));
    }

    const existing = await db.select({ id: Coupon.id }).from(Coupon);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(Coupon).values({
      id: nextId,
      code,
      type,
      value,
      minSubtotalCents,
      maxUses,
      usesCount: 0,
      active,
      startsAt,
      endsAt,
      requiredTierId,
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  const couponId = parseId(form.get("couponId"));
  if (!couponId) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-coupon" }));
  }

  const [coupon] = await db
    .select({
      id: Coupon.id,
      usesCount: Coupon.usesCount,
    })
    .from(Coupon)
    .where(eq(Coupon.id, couponId))
    .limit(1);

  if (!coupon) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "coupon-not-found" }));
  }

  if (intent === "update") {
    const code = normalizeCouponCode(String(form.get("code") ?? ""));
    const type = String(form.get("type") ?? "").trim();
    const value = isCouponKind(type) ? resolveCouponValue(type, form.get("valueInput")) : null;
    const minSubtotalCents = parseEuroToCents(form.get("minSubtotalEur"), true);
    const maxUses = parseOptionalPositiveInt(form.get("maxUses"));
    const requiredTierId = parseOptionalTierId(form.get("requiredTierId"));
    const startsAt = parseDateStart(form.get("startsAt"));
    const endsAt = parseDateEnd(form.get("endsAt"));
    const active = form.get("active") === "on";

    if (!code) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-code" }));
    }

    if (!isCouponKind(type)) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-type" }));
    }

    if (value === null) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-value" }));
    }

    if (
      String(form.get("minSubtotalEur") ?? "").trim() &&
      minSubtotalCents === null
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-min-subtotal" }));
    }

    if (
      String(form.get("maxUses") ?? "").trim() &&
      maxUses === null
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-max-uses" }));
    }

    if (
      (String(form.get("startsAt") ?? "").trim() && !startsAt) ||
      (String(form.get("endsAt") ?? "").trim() && !endsAt)
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-dates" }));
    }

    if (startsAt && endsAt && startsAt > endsAt) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-dates" }));
    }

    if (requiredTierId !== null) {
      const [tier] = await db
        .select({ id: LoyaltyTier.id })
        .from(LoyaltyTier)
        .where(eq(LoyaltyTier.id, requiredTierId))
        .limit(1);

      if (!tier) {
        return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-tier" }));
      }
    }

    const [existingCode] = await db
      .select({ id: Coupon.id })
      .from(Coupon)
      .where(eq(Coupon.code, code))
      .limit(1);

    if (existingCode && existingCode.id !== couponId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-code" }));
    }

    await db
      .update(Coupon)
      .set({
        code,
        type,
        value,
        minSubtotalCents,
        maxUses,
        active,
        startsAt,
        endsAt,
        requiredTierId,
      })
      .where(eq(Coupon.id, couponId));

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  if (intent === "delete") {
    const linkedOrders = await db
      .select({ id: Order.id })
      .from(Order)
      .where(eq(Order.couponId, couponId));

    if (coupon.usesCount > 0 || linkedOrders.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "coupon-in-use" }));
    }

    await db.delete(Coupon).where(eq(Coupon.id, couponId));
    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-intent" }));
};