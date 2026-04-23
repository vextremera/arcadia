import type { APIRoute } from "astro";
import {
  db,
  AppSetting,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  ModifierOption,
  Ingredient,
  Address,
  User,
  UserProfile,
  Coupon,
  Payment,
  eq,
  and,
  inArray,
} from "astro:db";
import { getArcadiaAvailability } from "@/server/time/madrid";
import { validateCheckoutCoupon } from "@/server/checkout/coupons";
import { normalizePaymentMethod } from "@/server/payments/settings";
import { randomUUID } from "node:crypto";
import { validateDeliveryAddressByArea } from "@/server/delivery/area";
import { awardOrderPointsOnce } from "@/server/loyalty/engine";

type CartItemSession = {
  lineId: string;
  productId: number;
  variantId?: number;
  qty: number;
  modifierOptionIds?: number[];
  addedIngredientIds?: number[];
  removedIngredientIds?: number[];
};

type SessionUser = {
  id: number;
  email: string;
  name?: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
};

type AvailabilityLike = Awaited<ReturnType<typeof getArcadiaAvailability>> & {
  sources?: {
    delivery?: string;
  };
  sourceNotes?: {
    delivery?: string | null;
  };
  todayDateISO?: string;
};

const DELIVERY_AREA_RULE = { enabled: true };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

function safePhone(v: unknown) {
  return safeStr(v).replace(/\s+/g, " ");
}

function opt(v: unknown): string | undefined {
  const t = safeStr(v);
  return t ? t : undefined;
}

function makePublicId() {
  return `A-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function buildForcedPickupReason(availability: AvailabilityLike) {
  const start = availability.windows.delivery.start;
  const end = availability.windows.delivery.end;
  const source = availability.sources?.delivery ?? "APP_SETTING";
  const note = availability.sourceNotes?.delivery?.trim() || null;

  if (availability.forcePickup) {
    return note
      ? `Delivery desactivado temporalmente desde operativa. ${note}`
      : "Delivery desactivado temporalmente desde operativa.";
  }

  if (source === "SPECIAL_DATE_CLOSED") {
    return note
      ? `Delivery no disponible hoy por una excepción operativa. ${note}`
      : "Delivery no disponible hoy por una excepción operativa.";
  }

  if (source === "SPECIAL_DATE") {
    return note
      ? `Fuera de la franja especial de reparto de hoy (${start}–${end}). ${note}`
      : `Fuera de la franja especial de reparto de hoy (${start}–${end}).`;
  }

  if (source === "OPENING_HOUR_CLOSED") {
    return "Delivery no disponible hoy según el horario semanal.";
  }

  if (source === "OPENING_HOUR") {
    return `Fuera de la franja semanal de reparto (${start}–${end}).`;
  }

  return `Fuera de horario de reparto (${start}–${end}).`;
}

type OrderItemInsert = {
  orderId: number;
  productId: number | null;
  variantId: number | null;
  nameSnapshot: string;
  variantSnapshot: string | null;
  unitPriceCents: number;
  qty: number;
  modifiers: any | null;
  lineTotalCents: number;
  notes: string | null;
};

type PaymentInsert = {
  id: number;
  orderId: number;
  provider: "stripe";
  providerIntentId: string | null;
  providerChargeId: string | null;
  status: "CREATED" | "AUTHORIZED" | "PAID" | "FAILED";
  amountCents: number;
  currency: string;
  raw: Record<string, unknown>;
};

async function buildCardPaymentInsert(params: {
  orderId: number;
  publicId: string;
  amountCents: number;
  channel: "DELIVERY" | "PICKUP";
  forcedPickup: boolean;
}) {
  const existing = await db.select({ id: Payment.id }).from(Payment);
  const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

  const raw = {
    source: "checkout-submit",
    mode: "manual-card-tracking",
    channel: params.channel,
    forcedPickup: params.forcedPickup,
    createdAt: new Date().toISOString(),
    note: "Registro interno de tarjeta pendiente de pasarela real.",
  } satisfies Record<string, unknown>;

  return {
    id: nextId,
    orderId: params.orderId,
    provider: "stripe" as const,
    providerIntentId: `arcadia-manual-${params.publicId}`,
    providerChargeId: null,
    status: "CREATED" as const,
    amountCents: params.amountCents,
    currency: "EUR",
    raw,
  } satisfies PaymentInsert;
}

export const POST: APIRoute = async ({ request, session }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  const authUser = (await session.get("user")) as SessionUser | undefined;

  const rawAvailability = await getArcadiaAvailability();
  const availability = rawAvailability as AvailabilityLike;

  if (availability.pauseOrders) {
    return json(
      { error: "PAUSED", message: "Pedidos pausados temporalmente. Inténtalo más tarde." },
      400
    );
  }

  if (!availability.isOpen) {
    return json(
      { error: "CLOSED", message: `Ahora mismo está cerrado (${availability.now}).` },
      400
    );
  }

  if (!availability.kitchenOpen) {
    return json(
      {
        error: "KITCHEN_CLOSED",
        message: `La cocina está cerrada (${availability.now}). Cocina: ${availability.windows.kitchen.start}–${availability.windows.kitchen.end}.`,
      },
      400
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "INVALID_JSON" }, 400);

  const requestedType = safeStr(body.type).toUpperCase();
  const requestedPaymentMethod = normalizePaymentMethod(body.paymentMethod);
  const orderNotes = safeStr(body.orderNotes);
  const couponCode = safeStr(body.couponCode).toUpperCase();

  const customerName = safeStr(body.customerName);
  const customerPhone = safePhone(body.customerPhone);
  const customerEmail = safeStr(body.customerEmail).toLowerCase();

  const address = {
    contactName: safeStr(body.address?.contactName || customerName),
    phone: safePhone(body.address?.phone || customerPhone),
    line1: safeStr(body.address?.line1),
    line2: safeStr(body.address?.line2),
    city: safeStr(body.address?.city) || "Lloret de Mar",
    postalCode: safeStr(body.address?.postalCode),
    notes: safeStr(body.address?.notes),
  };

  const saveAddress = !!body.saveAddress;
  const saveAddressDefault = !!body.saveAddressDefault;
  const saveAddressLabel =
    typeof body.saveAddressLabel === "string" ? body.saveAddressLabel.trim() : "";
  const saveProfile = !!body.saveProfile;

  const cart = ((await session.get("cart")) as CartItemSession[] | undefined) ?? [];
  if (cart.length === 0) return json({ error: "EMPTY_CART" }, 400);

  let type: "DELIVERY" | "PICKUP" = requestedType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  let forcedPickup = false;
  let forcedReason: string | null = null;

  if (type === "DELIVERY" && !availability.deliveryAvailable) {
    type = "PICKUP";
    forcedPickup = true;
    forcedReason = buildForcedPickupReason(availability);
  }

  if (!requestedPaymentMethod) {
    return json(
      {
        error: "INVALID_PAYMENT_METHOD",
        message: "Selecciona un método de pago válido.",
      },
      400
    );
  }

  const pm = requestedPaymentMethod;

  if (!customerName || !customerPhone) {
    return json(
      { error: "MISSING_CONTACT", message: "Nombre y teléfono son obligatorios." },
      400
    );
  }

  let deliveryAreaMeta:
    | { enabled: boolean; status: string; message: string }
    | null = null;

  if (type === "DELIVERY") {
    if (!address.line1 || !address.city || !address.postalCode) {
      return json(
        {
          error: "MISSING_ADDRESS",
          message: "Dirección, ciudad y código postal son obligatorios.",
        },
        400
      );
    }

    const deliveryAreaRuleValue = await session?.get?.("noop"); // no-op para mantener flow sin romper
    void deliveryAreaRuleValue;

    const deliveryAreaCheck = validateDeliveryAddressByArea(
      {
        city: address.city,
        postalCode: address.postalCode,
      },
      ((await db
        .select({ value: AppSetting.value })
        .from(AppSetting)
        .where(eq(AppSetting.key, "deliveryAreaRule"))
        .limit(1)
        .then((rows) => rows[0]?.value)) as { enabled?: boolean } | undefined)?.enabled === true
        ? { enabled: true }
        : { enabled: false }
    );

    deliveryAreaMeta = {
      enabled: deliveryAreaCheck.enabled,
      status: deliveryAreaCheck.status,
      message: deliveryAreaCheck.message,
    };

    if (deliveryAreaCheck.enabled && !deliveryAreaCheck.allowed) {
      return json(
        {
          error: "OUTSIDE_DELIVERY_AREA",
          message: deliveryAreaCheck.message,
        },
        400
      );
    }
  }

  const productIds = [...new Set(cart.map((i) => i.productId))];
  const variantIds = [
    ...new Set(cart.map((i) => i.variantId).filter((x): x is number => Number.isFinite(x))),
  ];
  const optionIds = [...new Set(cart.flatMap((i) => i.modifierOptionIds ?? []))];
  const ingredientIds = [
    ...new Set(
      cart.flatMap((i) => [...(i.addedIngredientIds ?? []), ...(i.removedIngredientIds ?? [])])
    ),
  ];

  const products = await db
    .select({
      id: Product.id,
      name: Product.name,
      priceCents: Product.priceCents,
      active: Product.active,
    })
    .from(Product)
    .where(inArray(Product.id, productIds));

  const variants = variantIds.length
    ? await db
        .select({
          id: ProductVariant.id,
          productId: ProductVariant.productId,
          name: ProductVariant.name,
          priceDeltaCents: ProductVariant.priceDeltaCents,
          active: ProductVariant.active,
        })
        .from(ProductVariant)
        .where(inArray(ProductVariant.id, variantIds))
    : [];

  const options = optionIds.length
    ? await db
        .select({
          id: ModifierOption.id,
          name: ModifierOption.name,
          priceDeltaCents: ModifierOption.priceDeltaCents,
          active: ModifierOption.active,
        })
        .from(ModifierOption)
        .where(inArray(ModifierOption.id, optionIds))
    : [];

  const ingredients = ingredientIds.length
    ? await db
        .select({
          id: Ingredient.id,
          name: Ingredient.name,
          addPriceDeltaCents: Ingredient.addPriceDeltaCents,
          active: Ingredient.active,
        })
        .from(Ingredient)
        .where(inArray(Ingredient.id, ingredientIds))
    : [];

  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const optionById = new Map(options.map((o) => [o.id, o]));
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));

  let subtotalCents = 0;
  const itemsToInsert: OrderItemInsert[] = [];

  for (const line of cart) {
    const p = productById.get(line.productId);
    if (!p || !p.active) return json({ error: "PRODUCT_INACTIVE" }, 400);

    const v = line.variantId ? variantById.get(line.variantId) : null;
    if (line.variantId && (!v || !v.active)) {
      return json({ error: "VARIANT_INACTIVE" }, 400);
    }

    const chosenOptions = (line.modifierOptionIds ?? [])
      .map((id) => optionById.get(id))
      .filter((x): x is NonNullable<typeof x> => !!x);

    if (chosenOptions.some((o) => !o.active)) {
      return json({ error: "OPTION_INACTIVE" }, 400);
    }

    const added = (line.addedIngredientIds ?? [])
      .map((id) => ingredientById.get(id))
      .filter((x): x is NonNullable<typeof x> => !!x);

    const removed = (line.removedIngredientIds ?? [])
      .map((id) => ingredientById.get(id))
      .filter((x): x is NonNullable<typeof x> => !!x);

    if (added.some((i) => !i.active)) {
      return json({ error: "INGREDIENT_INACTIVE" }, 400);
    }

    const baseUnit = (p.priceCents ?? 0) + (v?.priceDeltaCents ?? 0);
    const optionDelta = chosenOptions.reduce((acc, o) => acc + (o.priceDeltaCents ?? 0), 0);
    const addedDelta = added.reduce((acc, i) => acc + (i.addPriceDeltaCents ?? 0), 0);

    const qty = Math.max(1, Number(line.qty ?? 1));
    const unitCents = baseUnit + optionDelta + addedDelta;
    const lineTotalCents = unitCents * qty;

    subtotalCents += lineTotalCents;

    itemsToInsert.push({
      orderId: 0,
      productId: p.id,
      variantId: v?.id ?? null,
      nameSnapshot: p.name,
      variantSnapshot: v?.name ?? null,
      unitPriceCents: unitCents,
      qty,
      modifiers: {
        modifierOptions: chosenOptions.map((o) => ({
          id: o.id,
          name: o.name,
          priceDeltaCents: o.priceDeltaCents ?? 0,
        })),
        ingredientsAdded: added.map((a) => ({
          id: a.id,
          name: a.name,
          priceDeltaCents: a.addPriceDeltaCents ?? 0,
        })),
        ingredientsRemoved: removed.map((r) => ({ id: r.id, name: r.name })),
      },
      lineTotalCents,
      notes: null,
    });
  }

  const feeCents = type === "DELIVERY" ? (availability.deliveryFeeCents ?? 0) : 0;

  let discountCents = 0;
  let couponId: number | null = null;
  let couponUsesCount: number | null = null;
  let couponAppliedMessage: string | null = null;

  if (couponCode) {
    const couponResult = await validateCheckoutCoupon({
      code: couponCode,
      type,
      subtotalCents,
      deliveryFeeCents: feeCents,
      userId: authUser?.role === "CUSTOMER" ? authUser.id : null,
    });

    if (!couponResult.ok) {
      return json(
        {
          error: "COUPON_INVALID",
          message: couponResult.message,
        },
        400
      );
    }

    couponId = couponResult.couponId;
    discountCents = couponResult.discountCents;
    couponUsesCount = couponResult.usesCount;
    couponAppliedMessage = couponResult.message;
  }

  const taxCents = 0;
  const totalCents = Math.max(0, subtotalCents + feeCents - discountCents + taxCents);

  const publicId = makePublicId();

  await db.insert(Order).values({
    publicId,
    userId: authUser?.role === "CUSTOMER" ? authUser.id : null,
    couponId,
    type,
    status: "PENDING",
    paymentStatus: "UNPAID",
    currency: "EUR",
    subtotalCents,
    deliveryFeeCents: feeCents,
    discountCents,
    taxCents,
    totalCents,
    customerName,
    customerPhone,
    customerEmail: customerEmail || null,
    notes: orderNotes || null,
    addressSnapshot: {
      paymentMethod: pm,
      forcedPickup,
      forcedReason,
      couponCode: couponCode || null,
      couponAppliedMessage,
      deliveryResolutionSource: availability.sources?.delivery ?? null,
      deliveryResolutionNote: availability.sourceNotes?.delivery ?? null,
      deliveryArea: deliveryAreaMeta,
      address: type === "DELIVERY" ? address : null,
      now: availability.now,
      dateISO: availability.todayDateISO ?? null,
    },
  });

  const [created] = await db
    .select({ id: Order.id })
    .from(Order)
    .where(eq(Order.publicId, publicId))
    .limit(1);

  if (!created) return json({ error: "ORDER_CREATE_FAILED" }, 500);

  if (pm === "CARD") {
    const payment = await buildCardPaymentInsert({
      orderId: created.id,
      publicId,
      amountCents: totalCents,
      channel: type,
      forcedPickup,
    });

    await db.insert(Payment).values({
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      providerIntentId: payment.providerIntentId ?? undefined,
      providerChargeId: payment.providerChargeId ?? undefined,
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
      raw: payment.raw,
    });
  }

  await db.insert(OrderItem).values(
    itemsToInsert.map((it) => ({
      ...it,
      orderId: created.id,
    }))
  );

  if (couponId && couponUsesCount !== null) {
    await db
      .update(Coupon)
      .set({
        usesCount: couponUsesCount + 1,
      })
      .where(eq(Coupon.id, couponId));
  }

  let loyaltyAward:
    | {
      awardedPoints: number;
      alreadyAwarded: boolean;
      beforePoints: number;
      afterPoints: number;
      beforeTierId: number | null;
      afterTierId: number | null;
      afterTierName: string | null;
    }
    | null = null;

  let savedAddressId: number | null = null;

  if (saveAddress && type === "DELIVERY" && authUser?.role === "CUSTOMER") {
    try {
      const userId = authUser.id;

      const existing = await db
        .select({ id: Address.id, isDefault: Address.isDefault })
        .from(Address)
        .where(
          and(
            eq(Address.userId, userId),
            eq(Address.line1, address.line1),
            eq(Address.postalCode, address.postalCode)
          )
        )
        .limit(1);

      const patch = {
        label: saveAddressLabel ? saveAddressLabel.slice(0, 60) : undefined,
        contactName: address.contactName,
        phone: address.phone,
        line1: address.line1,
        line2: opt(address.line2),
        city: address.city,
        postalCode: address.postalCode,
        notes: opt(address.notes),
        lat: undefined as number | undefined,
        lng: undefined as number | undefined,
      };

      let addressId: number | null = null;

      if (existing.length) {
        addressId = existing[0].id;
        await db.update(Address).set(patch).where(eq(Address.id, addressId));
      } else {
        const any = await db
          .select({ id: Address.id })
          .from(Address)
          .where(eq(Address.userId, userId))
          .limit(1);

        const isDefault = any.length === 0;

        const inserted = await db
          .insert(Address)
          .values({
            userId,
            label: patch.label,
            contactName: patch.contactName,
            phone: patch.phone,
            line1: patch.line1,
            line2: patch.line2,
            city: patch.city,
            postalCode: patch.postalCode,
            notes: patch.notes,
            lat: patch.lat,
            lng: patch.lng,
            isDefault,
          })
          .returning();

        addressId = inserted[0]?.id ?? null;
      }

      if (saveAddressDefault && addressId) {
        await db.update(Address).set({ isDefault: false }).where(eq(Address.userId, userId));
        await db
          .update(Address)
          .set({ isDefault: true })
          .where(and(eq(Address.userId, userId), eq(Address.id, addressId)));
      }

      savedAddressId = addressId;
    } catch {
      // best-effort
    }
  }

  if (saveProfile && authUser?.role === "CUSTOMER") {
    try {
      const userId = authUser.id;

      if (customerName && customerName.length <= 120) {
        await db.update(User).set({ name: customerName }).where(eq(User.id, userId));
      }

      const existingProfile = await db
        .select({ userId: UserProfile.userId })
        .from(UserProfile)
        .where(eq(UserProfile.userId, userId))
        .limit(1);

      if (!existingProfile.length) {
        await db.insert(UserProfile).values({
          userId,
          phone: undefined,
          birthday: undefined,
          pointsBalance: 0,
          tierId: undefined,
        });
      }

      if (customerPhone && customerPhone.length <= 40) {
        await db
          .update(UserProfile)
          .set({ phone: customerPhone })
          .where(eq(UserProfile.userId, userId));
      }
    } catch {
      // best-effort
    }
  }

  if (authUser?.role === "CUSTOMER") {
    try {
      loyaltyAward = await awardOrderPointsOnce({
        orderId: created.id,
        userId: authUser.id,
        subtotalCents,
        paymentMethod: pm,
        meta: {
          publicId,
          orderType: type,
        },
      });
    } catch (error) {
      console.error("[loyalty] award on checkout failed", error);
    }
  }

  await session.delete("cart");

  return json({
    ok: true,
    publicId,
    type,
    forcedPickup,
    forcedReason,
    couponId,
    couponCode: couponCode || null,
    discountCents,
    savedAddressId,
    loyalty: loyaltyAward,
  });
};