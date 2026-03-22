import { db, Coupon, LoyaltyTier, UserProfile, eq } from "astro:db";

export type CheckoutOrderType = "DELIVERY" | "PICKUP";
export type CouponKind = "PERCENT" | "FIXED" | "FREE_DELIVERY";

export type CouponValidationResult =
  | {
      ok: true;
      couponId: number;
      code: string;
      type: CouponKind;
      value: number;
      discountCents: number;
      minSubtotalCents: number | null;
      maxUses: number | null;
      usesCount: number;
      requiredTierId: number | null;
      requiredTierName: string | null;
      message: string;
    }
  | {
      ok: false;
      error:
        | "MISSING_CODE"
        | "NOT_FOUND"
        | "INACTIVE"
        | "NOT_STARTED"
        | "EXPIRED"
        | "MAX_USES_REACHED"
        | "MIN_SUBTOTAL"
        | "REQUIRES_TIER"
        | "INVALID_FOR_TYPE"
        | "NO_EFFECT";
      message: string;
    };

function money(cents: number) {
  return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
}

export function normalizeCouponCode(value: string) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

async function getTierName(requiredTierId: number | null) {
  if (!requiredTierId) return null;

  const [tier] = await db
    .select({ id: LoyaltyTier.id, name: LoyaltyTier.name })
    .from(LoyaltyTier)
    .where(eq(LoyaltyTier.id, requiredTierId))
    .limit(1);

  return tier?.name ?? null;
}

async function getUserTierId(userId: number | null | undefined) {
  if (!userId) return null;

  const [profile] = await db
    .select({
      userId: UserProfile.userId,
      tierId: UserProfile.tierId,
    })
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  return profile?.tierId ?? null;
}

function buildDiscountCents(input: {
  type: CouponKind;
  value: number;
  subtotalCents: number;
  deliveryFeeCents: number;
}) {
  if (input.type === "PERCENT") {
    const percent = Math.max(0, Math.min(100, Number(input.value ?? 0)));
    return Math.min(
      input.subtotalCents,
      Math.round((input.subtotalCents * percent) / 100)
    );
  }

  if (input.type === "FIXED") {
    return Math.min(input.subtotalCents, Math.max(0, Number(input.value ?? 0)));
  }

  return Math.max(0, input.deliveryFeeCents);
}

export async function validateCheckoutCoupon(input: {
  code: string;
  type: CheckoutOrderType;
  subtotalCents: number;
  deliveryFeeCents: number;
  userId?: number | null;
  now?: Date;
}): Promise<CouponValidationResult> {
  const code = normalizeCouponCode(input.code);
  if (!code) {
    return {
      ok: false,
      error: "MISSING_CODE",
      message: "Introduce un cupón.",
    };
  }

  const now = input.now ?? new Date();

  const [coupon] = await db
    .select({
      id: Coupon.id,
      code: Coupon.code,
      type: Coupon.type,
      value: Coupon.value,
      minSubtotalCents: Coupon.minSubtotalCents,
      maxUses: Coupon.maxUses,
      usesCount: Coupon.usesCount,
      active: Coupon.active,
      startsAt: Coupon.startsAt,
      endsAt: Coupon.endsAt,
      requiredTierId: Coupon.requiredTierId,
    })
    .from(Coupon)
    .where(eq(Coupon.code, code))
    .limit(1);

  if (!coupon) {
    return {
      ok: false,
      error: "NOT_FOUND",
      message: "El cupón no existe.",
    };
  }

  if (!coupon.active) {
    return {
      ok: false,
      error: "INACTIVE",
      message: "Este cupón no está activo.",
    };
  }

  if (coupon.startsAt && now < coupon.startsAt) {
    return {
      ok: false,
      error: "NOT_STARTED",
      message: "Este cupón todavía no está disponible.",
    };
  }

  if (coupon.endsAt && now > coupon.endsAt) {
    return {
      ok: false,
      error: "EXPIRED",
      message: "Este cupón ha caducado.",
    };
  }

  if (
    typeof coupon.maxUses === "number" &&
    coupon.usesCount >= coupon.maxUses
  ) {
    return {
      ok: false,
      error: "MAX_USES_REACHED",
      message: "Este cupón ya ha agotado sus usos.",
    };
  }

  if (
    typeof coupon.minSubtotalCents === "number" &&
    input.subtotalCents < coupon.minSubtotalCents
  ) {
    return {
      ok: false,
      error: "MIN_SUBTOTAL",
      message: `Este cupón requiere un subtotal mínimo de ${money(coupon.minSubtotalCents)}.`,
    };
  }

  const requiredTierName = await getTierName(coupon.requiredTierId ?? null);

  if (coupon.requiredTierId) {
    const userTierId = await getUserTierId(input.userId ?? null);

    if (!input.userId || userTierId !== coupon.requiredTierId) {
      return {
        ok: false,
        error: "REQUIRES_TIER",
        message: requiredTierName
          ? `Este cupón requiere el nivel ${requiredTierName}.`
          : "Este cupón requiere un nivel de loyalty concreto.",
      };
    }
  }

  if (coupon.type === "FREE_DELIVERY" && input.type !== "DELIVERY") {
    return {
      ok: false,
      error: "INVALID_FOR_TYPE",
      message: "Este cupón solo aplica a pedidos con delivery.",
    };
  }

  const discountCents = buildDiscountCents({
    type: coupon.type as CouponKind,
    value: coupon.value,
    subtotalCents: input.subtotalCents,
    deliveryFeeCents: input.deliveryFeeCents,
  });

  if (discountCents <= 0) {
    return {
      ok: false,
      error: "NO_EFFECT",
      message:
        coupon.type === "FREE_DELIVERY"
          ? "Este cupón no tiene efecto porque no hay coste de delivery que bonificar."
          : "Este cupón no genera descuento sobre este pedido.",
    };
  }

  const message =
    coupon.type === "PERCENT"
      ? `${coupon.code} aplicado: -${Math.max(
          0,
          Math.min(100, Number(coupon.value ?? 0))
        )}%`
      : coupon.type === "FIXED"
        ? `${coupon.code} aplicado: -${money(discountCents)}`
        : `${coupon.code} aplicado: envío gratis`;

  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    type: coupon.type as CouponKind,
    value: coupon.value,
    discountCents,
    minSubtotalCents:
      typeof coupon.minSubtotalCents === "number"
        ? coupon.minSubtotalCents
        : null,
    maxUses: typeof coupon.maxUses === "number" ? coupon.maxUses : null,
    usesCount: coupon.usesCount,
    requiredTierId: coupon.requiredTierId ?? null,
    requiredTierName,
    message,
  };
}