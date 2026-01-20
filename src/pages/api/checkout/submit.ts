import type { APIRoute } from "astro";
import {
  db,
  Order,
  OrderItem,
  Product,
  ProductVariant,
  ModifierOption,
  Ingredient,
  AppSetting,
  eq,
  and,
  inArray,
} from "astro:db";
import { getArcadiaAvailability } from "@/server/time/madrid";
import { randomUUID } from "node:crypto";

type CartItemSession = {
  lineId: string;
  productId: number;
  variantId?: number;
  qty: number;
  modifierOptionIds?: number[];
  addedIngredientIds?: number[];
  removedIngredientIds?: number[];
};

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

function makePublicId() {
  return `A-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export const POST: APIRoute = async ({ request, session }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  const availability = getArcadiaAvailability();
  if (!availability.isOpen) {
    return json({ error: "CLOSED", message: `Ahora mismo está cerrado (${availability.now}).` }, 400);
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

  const DEFAULT_PAYMENTS = {
    delivery: { cashEnabled: true, cardEnabled: true },
    pickup: { cashEnabled: true, cardEnabled: true },
  };

  const [payRow] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, "payments"))
    .limit(1);

  const payments = (payRow?.value ?? DEFAULT_PAYMENTS) as typeof DEFAULT_PAYMENTS;

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "INVALID_JSON" }, 400);

  const requestedType = safeStr(body.type).toUpperCase(); // DELIVERY | PICKUP
  const paymentMethod = safeStr(body.paymentMethod).toUpperCase(); // CASH | CARD
  const orderNotes = safeStr(body.orderNotes);

  const customerName = safeStr(body.customerName);
  const customerPhone = safePhone(body.customerPhone);
  const customerEmail = safeStr(body.customerEmail).toLowerCase();

  const address = {
    contactName: safeStr(body.address?.contactName || customerName),
    phone: safePhone(body.address?.phone || customerPhone),
    line1: safeStr(body.address?.line1),
    line2: safeStr(body.address?.line2),
    city: safeStr(body.address?.city),
    postalCode: safeStr(body.address?.postalCode),
    notes: safeStr(body.address?.notes),
  };

  // carrito desde sesión
  const cart = ((await session.get("cart")) as CartItemSession[] | undefined) ?? [];
  if (cart.length === 0) return json({ error: "EMPTY_CART" }, 400);

  // Forzar recogida si fuera de horario delivery
  let type: "DELIVERY" | "PICKUP" = requestedType === "DELIVERY" ? "DELIVERY" : "PICKUP";
  let forcedPickup = false;
  let forcedReason: string | null = null;

  if (type === "DELIVERY" && !availability.deliveryAvailable) {
    type = "PICKUP";
    forcedPickup = true;
    forcedReason = `Fuera de horario de reparto (${availability.windows.delivery.start}–${availability.windows.delivery.end}).`;
  }

    const pm = paymentMethod === "CARD" ? "CARD" : "CASH";

  const allowedCash = type === "DELIVERY" ? payments.delivery.cashEnabled : payments.pickup.cashEnabled;
  const allowedCard = type === "DELIVERY" ? payments.delivery.cardEnabled : payments.pickup.cardEnabled;

  if (pm === "CASH" && !allowedCash) {
    return json(
      {
        error: "PAYMENT_METHOD_DISABLED",
        message: `El pago en efectivo no está disponible para ${type === "DELIVERY" ? "delivery" : "recogida"}.`,
      },
      400
    );
  }

  if (pm === "CARD" && !allowedCard) {
    return json(
      {
        error: "PAYMENT_METHOD_DISABLED",
        message: `El pago con tarjeta no está disponible para ${type === "DELIVERY" ? "delivery" : "recogida"}.`,
      },
      400
    );
  }

  if (!allowedCash && !allowedCard) {
    return json(
      {
        error: "NO_PAYMENT_METHODS",
        message: `No hay métodos de pago disponibles para ${type === "DELIVERY" ? "delivery" : "recogida"}.`,
      },
      400
    );
  }

  // Cargar productos/variantes/opciones/ingredientes necesarios para calcular totales y snapshots
  const productIds = [...new Set(cart.map((i) => i.productId))];
  const variantIds = [...new Set(cart.map((i) => i.variantId).filter((x): x is number => Number.isFinite(x)))];
  const optionIds = [...new Set(cart.flatMap((i) => i.modifierOptionIds ?? []))];
  const ingredientIds = [
    ...new Set(cart.flatMap((i) => [...(i.addedIngredientIds ?? []), ...(i.removedIngredientIds ?? [])])),
  ];

  const products = await db
    .select({
      id: Product.id,
      name: Product.name,
      priceCents: Product.priceCents,
      active: Product.active,
      deliveryEnabled: Product.deliveryEnabled,
      pickupEnabled: Product.pickupEnabled,
    })
    .from(Product)
    .where(inArray(Product.id, productIds));

  const productById = new Map(products.map((p) => [p.id, p]));

  // Si piden DELIVERY, todos los items deben permitir delivery; si no, forzamos PICKUP
  if (type === "DELIVERY") {
    const blocked = cart.find((i) => !productById.get(i.productId)?.deliveryEnabled);
    if (blocked) {
      type = "PICKUP";
      forcedPickup = true;
      forcedReason = "Tu carrito contiene productos no disponibles para delivery.";
    }
  }

  // Si forzamos PICKUP y hay productos que NO permiten pickup -> error
  if (type === "PICKUP") {
    const blocked = cart.find((i) => !productById.get(i.productId)?.pickupEnabled);
    if (blocked) return json({ error: "PICKUP_NOT_AVAILABLE_FOR_ITEM" }, 400);
  }

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

  const variantById = new Map(variants.map((v) => [v.id, v]));

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

  const optionById = new Map(options.map((o) => [o.id, o]));

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

  const ingredientById = new Map(ingredients.map((x) => [x.id, x]));

  // Validación mínima datos cliente
  if (!customerName || !customerPhone) {
    return json({ error: "MISSING_CONTACT", message: "Nombre y teléfono son obligatorios." }, 400);
  }

  if (type === "DELIVERY") {
    if (!address.line1 || !address.city || !address.postalCode) {
      return json({ error: "MISSING_ADDRESS", message: "Dirección, ciudad y código postal son obligatorios." }, 400);
    }
  }

  // Construir líneas + totales
  let subtotalCents = 0;

  const itemsToInsert: Array<{
    orderId: number;
    productId?: number;
    variantId?: number;
    nameSnapshot: string;
    variantSnapshot?: string | null;
    unitPriceCents: number;
    qty: number;
    modifiers?: any;
    lineTotalCents: number;
    notes?: string | null;
  }> = [];

  for (const line of cart) {
    const p = productById.get(line.productId);
    if (!p || !p.active) return json({ error: "ITEM_NOT_AVAILABLE" }, 400);

    const v = line.variantId ? variantById.get(line.variantId) : null;
    const variantDelta = v && v.active ? v.priceDeltaCents : 0;
    const variantName = v && v.active ? v.name : null;

    const selectedOptions = (line.modifierOptionIds ?? [])
      .map((id) => optionById.get(id))
      .filter((o): o is NonNullable<typeof o> => !!o && o.active);

    const optionsDelta = selectedOptions.reduce((acc, o) => acc + (o.priceDeltaCents ?? 0), 0);

    const added = (line.addedIngredientIds ?? [])
      .map((id) => ingredientById.get(id))
      .filter((ing): ing is NonNullable<typeof ing> => !!ing && ing.active);

    const removed = (line.removedIngredientIds ?? [])
      .map((id) => ingredientById.get(id))
      .filter((ing): ing is NonNullable<typeof ing> => !!ing && ing.active);

    const addedDelta = added.reduce((acc, a) => acc + (a.addPriceDeltaCents ?? 0), 0);

    const unitPriceCents = p.priceCents + variantDelta + optionsDelta + addedDelta;
    const lineTotalCents = unitPriceCents * Math.max(1, line.qty);

    subtotalCents += lineTotalCents;

    itemsToInsert.push({
      orderId: -1, // placeholder
      productId: p.id,
      variantId: v?.id,
      nameSnapshot: p.name,
      variantSnapshot: variantName,
      unitPriceCents,
      qty: Math.max(1, line.qty),
      modifiers: {
        modifierOptions: selectedOptions.map((o) => ({
          id: o.id,
          name: o.name,
          priceDeltaCents: o.priceDeltaCents,
        })),
        ingredientsAdded: added.map((a) => ({
          id: a.id,
          name: a.name,
          priceDeltaCents: a.addPriceDeltaCents,
        })),
        ingredientsRemoved: removed.map((r) => ({ id: r.id, name: r.name })),
      },
      lineTotalCents,
      notes: null,
    });
  }

  // Fees provisionales
  const deliveryFeeCents = 0;
  const discountCents = 0;
  const taxCents = 0;
  const totalCents = subtotalCents + deliveryFeeCents - discountCents + taxCents;

  const publicId = makePublicId();

  // Insert Order
  await db.insert(Order).values({
    publicId,
    userId: null,

    type,
    status: "PENDING",
    paymentStatus: "UNPAID",

    subtotalCents,
    deliveryFeeCents,
    discountCents,
    taxCents,
    totalCents,

    customerName,
    customerPhone,
    customerEmail: customerEmail || null,

    // Guardamos notas y meta de pago aquí (provisional)
    notes: orderNotes || null,

    // addressSnapshot aunque sea pickup: guardamos meta útil
    addressSnapshot: {
      paymentMethod: pm,
      forcedPickup,
      forcedReason,
      address: type === "DELIVERY" ? address : null,
    },
  });

  // Obtener orderId por publicId
  const [created] = await db
    .select({ id: Order.id })
    .from(Order)
    .where(eq(Order.publicId, publicId))
    .limit(1);

  if (!created) return json({ error: "ORDER_CREATE_FAILED" }, 500);

  // Insert OrderItems
  await db.insert(OrderItem).values(
    itemsToInsert.map((it) => ({
      ...it,
      orderId: created.id,
    }))
  );

  // Limpiar carrito
  await session.delete("cart");

  return json({
    ok: true,
    publicId,
    type,
    forcedPickup,
    forcedReason,
  });
};
