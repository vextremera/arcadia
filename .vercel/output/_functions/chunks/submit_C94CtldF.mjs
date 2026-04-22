import { d as db, A as AppSetting, e as Product, i as ProductVariant, g as ModifierOption, I as Ingredient, O as Order, r as Payment, q as OrderItem, j as Coupon, t as Address, U as User, k as UserProfile } from './_astro_db_Bcz5lWRF.mjs';
import { g as getArcadiaAvailability, v as validateDeliveryAddressByArea } from './madrid_57G2TjB3.mjs';
import { v as validateCheckoutCoupon } from './coupons_Cq1AMv1K.mjs';
import { n as normalizePaymentMethod } from './settings_CbhWKZ6C.mjs';
import { randomUUID } from 'node:crypto';
import { eq, inArray, and } from '@astrojs/db/dist/runtime/virtual.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
function safeStr(v) {
  return String(v ?? "").trim();
}
function safePhone(v) {
  return safeStr(v).replace(/\s+/g, " ");
}
function opt(v) {
  const t = safeStr(v);
  return t ? t : void 0;
}
function makePublicId() {
  return `A-${randomUUID().slice(0, 8).toUpperCase()}`;
}
function buildForcedPickupReason(availability) {
  const start = availability.windows.delivery.start;
  const end = availability.windows.delivery.end;
  const source = availability.sources?.delivery ?? "APP_SETTING";
  const note = availability.sourceNotes?.delivery?.trim() || null;
  if (availability.forcePickup) {
    return note ? `Delivery desactivado temporalmente desde operativa. ${note}` : "Delivery desactivado temporalmente desde operativa.";
  }
  if (source === "SPECIAL_DATE_CLOSED") {
    return note ? `Delivery no disponible hoy por una excepción operativa. ${note}` : "Delivery no disponible hoy por una excepción operativa.";
  }
  if (source === "SPECIAL_DATE") {
    return note ? `Fuera de la franja especial de reparto de hoy (${start}–${end}). ${note}` : `Fuera de la franja especial de reparto de hoy (${start}–${end}).`;
  }
  if (source === "OPENING_HOUR_CLOSED") {
    return "Delivery no disponible hoy según el horario semanal.";
  }
  if (source === "OPENING_HOUR") {
    return `Fuera de la franja semanal de reparto (${start}–${end}).`;
  }
  return `Fuera de horario de reparto (${start}–${end}).`;
}
async function buildCardPaymentInsert(params) {
  const existing = await db.select({
    id: Payment.id
  }).from(Payment);
  const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const raw = {
    source: "checkout-submit",
    mode: "manual-card-tracking",
    channel: params.channel,
    forcedPickup: params.forcedPickup,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    note: "Registro interno de tarjeta pendiente de pasarela real."
  };
  return {
    id: nextId,
    orderId: params.orderId,
    provider: "stripe",
    providerIntentId: `arcadia-manual-${params.publicId}`,
    providerChargeId: null,
    status: "CREATED",
    amountCents: params.amountCents,
    currency: "EUR",
    raw
  };
}
const POST = async ({
  request,
  session
}) => {
  if (!session) return new Response("Session not available", {
    status: 500
  });
  const authUser = await session.get("user");
  const rawAvailability = await getArcadiaAvailability();
  const availability = rawAvailability;
  if (availability.pauseOrders) {
    return json({
      error: "PAUSED",
      message: "Pedidos pausados temporalmente. Inténtalo más tarde."
    }, 400);
  }
  if (!availability.isOpen) {
    return json({
      error: "CLOSED",
      message: `Ahora mismo está cerrado (${availability.now}).`
    }, 400);
  }
  if (!availability.kitchenOpen) {
    return json({
      error: "KITCHEN_CLOSED",
      message: `La cocina está cerrada (${availability.now}). Cocina: ${availability.windows.kitchen.start}–${availability.windows.kitchen.end}.`
    }, 400);
  }
  const body = await request.json().catch(() => null);
  if (!body) return json({
    error: "INVALID_JSON"
  }, 400);
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
    notes: safeStr(body.address?.notes)
  };
  const saveAddress = !!body.saveAddress;
  const saveAddressDefault = !!body.saveAddressDefault;
  const saveAddressLabel = typeof body.saveAddressLabel === "string" ? body.saveAddressLabel.trim() : "";
  const saveProfile = !!body.saveProfile;
  const cart = await session.get("cart") ?? [];
  if (cart.length === 0) return json({
    error: "EMPTY_CART"
  }, 400);
  let type = requestedType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  let forcedPickup = false;
  let forcedReason = null;
  if (type === "DELIVERY" && !availability.deliveryAvailable) {
    type = "PICKUP";
    forcedPickup = true;
    forcedReason = buildForcedPickupReason(availability);
  }
  if (!requestedPaymentMethod) {
    return json({
      error: "INVALID_PAYMENT_METHOD",
      message: "Selecciona un método de pago válido."
    }, 400);
  }
  const pm = requestedPaymentMethod;
  if (!customerName || !customerPhone) {
    return json({
      error: "MISSING_CONTACT",
      message: "Nombre y teléfono son obligatorios."
    }, 400);
  }
  let deliveryAreaMeta = null;
  if (type === "DELIVERY") {
    if (!address.line1 || !address.city || !address.postalCode) {
      return json({
        error: "MISSING_ADDRESS",
        message: "Dirección, ciudad y código postal son obligatorios."
      }, 400);
    }
    await session?.get?.("noop");
    const deliveryAreaCheck = validateDeliveryAddressByArea({
      city: address.city,
      postalCode: address.postalCode
    }, (await db.select({
      value: AppSetting.value
    }).from(AppSetting).where(eq(AppSetting.key, "deliveryAreaRule")).limit(1).then((rows) => rows[0]?.value))?.enabled === true ? {
      enabled: true
    } : {
      enabled: false
    });
    deliveryAreaMeta = {
      enabled: deliveryAreaCheck.enabled,
      status: deliveryAreaCheck.status,
      message: deliveryAreaCheck.message
    };
    if (deliveryAreaCheck.enabled && !deliveryAreaCheck.allowed) {
      return json({
        error: "OUTSIDE_DELIVERY_AREA",
        message: deliveryAreaCheck.message
      }, 400);
    }
  }
  const productIds = [...new Set(cart.map((i) => i.productId))];
  const variantIds = [...new Set(cart.map((i) => i.variantId).filter((x) => Number.isFinite(x)))];
  const optionIds = [...new Set(cart.flatMap((i) => i.modifierOptionIds ?? []))];
  const ingredientIds = [...new Set(cart.flatMap((i) => [...i.addedIngredientIds ?? [], ...i.removedIngredientIds ?? []]))];
  const products = await db.select({
    id: Product.id,
    name: Product.name,
    priceCents: Product.priceCents,
    active: Product.active
  }).from(Product).where(inArray(Product.id, productIds));
  const variants = variantIds.length ? await db.select({
    id: ProductVariant.id,
    productId: ProductVariant.productId,
    name: ProductVariant.name,
    priceDeltaCents: ProductVariant.priceDeltaCents,
    active: ProductVariant.active
  }).from(ProductVariant).where(inArray(ProductVariant.id, variantIds)) : [];
  const options = optionIds.length ? await db.select({
    id: ModifierOption.id,
    name: ModifierOption.name,
    priceDeltaCents: ModifierOption.priceDeltaCents,
    active: ModifierOption.active
  }).from(ModifierOption).where(inArray(ModifierOption.id, optionIds)) : [];
  const ingredients = ingredientIds.length ? await db.select({
    id: Ingredient.id,
    name: Ingredient.name,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    active: Ingredient.active
  }).from(Ingredient).where(inArray(Ingredient.id, ingredientIds)) : [];
  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const optionById = new Map(options.map((o) => [o.id, o]));
  const ingredientById = new Map(ingredients.map((i) => [i.id, i]));
  let subtotalCents = 0;
  const itemsToInsert = [];
  for (const line of cart) {
    const p = productById.get(line.productId);
    if (!p || !p.active) return json({
      error: "PRODUCT_INACTIVE"
    }, 400);
    const v = line.variantId ? variantById.get(line.variantId) : null;
    if (line.variantId && (!v || !v.active)) {
      return json({
        error: "VARIANT_INACTIVE"
      }, 400);
    }
    const chosenOptions = (line.modifierOptionIds ?? []).map((id) => optionById.get(id)).filter((x) => !!x);
    if (chosenOptions.some((o) => !o.active)) {
      return json({
        error: "OPTION_INACTIVE"
      }, 400);
    }
    const added = (line.addedIngredientIds ?? []).map((id) => ingredientById.get(id)).filter((x) => !!x);
    const removed = (line.removedIngredientIds ?? []).map((id) => ingredientById.get(id)).filter((x) => !!x);
    if (added.some((i) => !i.active)) {
      return json({
        error: "INGREDIENT_INACTIVE"
      }, 400);
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
          priceDeltaCents: o.priceDeltaCents ?? 0
        })),
        ingredientsAdded: added.map((a) => ({
          id: a.id,
          name: a.name,
          priceDeltaCents: a.addPriceDeltaCents ?? 0
        })),
        ingredientsRemoved: removed.map((r) => ({
          id: r.id,
          name: r.name
        }))
      },
      lineTotalCents,
      notes: null
    });
  }
  const feeCents = type === "DELIVERY" ? availability.deliveryFeeCents ?? 0 : 0;
  let discountCents = 0;
  let couponId = null;
  let couponUsesCount = null;
  let couponAppliedMessage = null;
  if (couponCode) {
    const couponResult = await validateCheckoutCoupon({
      code: couponCode,
      type,
      subtotalCents,
      deliveryFeeCents: feeCents,
      userId: authUser?.role === "CUSTOMER" ? authUser.id : null
    });
    if (!couponResult.ok) {
      return json({
        error: "COUPON_INVALID",
        message: couponResult.message
      }, 400);
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
      dateISO: availability.todayDateISO ?? null
    }
  });
  const [created] = await db.select({
    id: Order.id
  }).from(Order).where(eq(Order.publicId, publicId)).limit(1);
  if (!created) return json({
    error: "ORDER_CREATE_FAILED"
  }, 500);
  if (pm === "CARD") {
    const payment = await buildCardPaymentInsert({
      orderId: created.id,
      publicId,
      amountCents: totalCents,
      channel: type,
      forcedPickup
    });
    await db.insert(Payment).values({
      id: payment.id,
      orderId: payment.orderId,
      provider: payment.provider,
      providerIntentId: payment.providerIntentId ?? void 0,
      providerChargeId: payment.providerChargeId ?? void 0,
      status: payment.status,
      amountCents: payment.amountCents,
      currency: payment.currency,
      raw: payment.raw
    });
  }
  await db.insert(OrderItem).values(itemsToInsert.map((it) => ({
    ...it,
    orderId: created.id
  })));
  if (couponId && couponUsesCount !== null) {
    await db.update(Coupon).set({
      usesCount: couponUsesCount + 1
    }).where(eq(Coupon.id, couponId));
  }
  let savedAddressId = null;
  if (saveAddress && type === "DELIVERY" && authUser?.role === "CUSTOMER") {
    try {
      const userId = authUser.id;
      const existing = await db.select({
        id: Address.id,
        isDefault: Address.isDefault
      }).from(Address).where(and(eq(Address.userId, userId), eq(Address.line1, address.line1), eq(Address.postalCode, address.postalCode))).limit(1);
      const patch = {
        label: saveAddressLabel ? saveAddressLabel.slice(0, 60) : void 0,
        contactName: address.contactName,
        phone: address.phone,
        line1: address.line1,
        line2: opt(address.line2),
        city: address.city,
        postalCode: address.postalCode,
        notes: opt(address.notes),
        lat: void 0,
        lng: void 0
      };
      let addressId = null;
      if (existing.length) {
        addressId = existing[0].id;
        await db.update(Address).set(patch).where(eq(Address.id, addressId));
      } else {
        const any = await db.select({
          id: Address.id
        }).from(Address).where(eq(Address.userId, userId)).limit(1);
        const isDefault = any.length === 0;
        const inserted = await db.insert(Address).values({
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
          isDefault
        }).returning();
        addressId = inserted[0]?.id ?? null;
      }
      if (saveAddressDefault && addressId) {
        await db.update(Address).set({
          isDefault: false
        }).where(eq(Address.userId, userId));
        await db.update(Address).set({
          isDefault: true
        }).where(and(eq(Address.userId, userId), eq(Address.id, addressId)));
      }
      savedAddressId = addressId;
    } catch {
    }
  }
  if (saveProfile && authUser?.role === "CUSTOMER") {
    try {
      const userId = authUser.id;
      if (customerName && customerName.length <= 120) {
        await db.update(User).set({
          name: customerName
        }).where(eq(User.id, userId));
      }
      const existingProfile = await db.select({
        userId: UserProfile.userId
      }).from(UserProfile).where(eq(UserProfile.userId, userId)).limit(1);
      if (!existingProfile.length) {
        await db.insert(UserProfile).values({
          userId,
          phone: void 0,
          birthday: void 0,
          pointsBalance: 0,
          tierId: void 0
        });
      }
      if (customerPhone && customerPhone.length <= 40) {
        await db.update(UserProfile).set({
          phone: customerPhone
        }).where(eq(UserProfile.userId, userId));
      }
    } catch {
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
    savedAddressId
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
