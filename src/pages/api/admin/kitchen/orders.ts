import type { APIRoute } from "astro";
import { db, Order, OrderItem, inArray } from "astro:db";

type AddressSnapshot = {
  paymentMethod?: "CASH" | "CARD" | string;
  forcedPickup?: boolean;
  forcedReason?: string | null;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    notes?: string;
  } | null;
};

type KitchenStatus =
  | "PENDING"
  | "PAID"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const KITCHEN_STATUSES: KitchenStatus[] = [
  "PENDING",
  "PAID",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
];

export const GET: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

  const ordersRaw = await db
    .select()
    .from(Order)
    .where(inArray(Order.status, [...KITCHEN_STATUSES]))
    .orderBy(Order.createdAt)
    .limit(80);

  const orders = [...ordersRaw].reverse();
  const orderIds = orders.map((order) => order.id);

  const items = orderIds.length
    ? await db
        .select()
        .from(OrderItem)
        .where(inArray(OrderItem.orderId, orderIds))
    : [];

  const itemsByOrderId = new Map<number, typeof items>();
  for (const item of items) {
    const current = itemsByOrderId.get(item.orderId) ?? [];
    current.push(item);
    itemsByOrderId.set(item.orderId, current);
  }

  const payload = orders.map((order) => {
    const meta = (order.addressSnapshot ?? {}) as AddressSnapshot;
    const itemRows = itemsByOrderId.get(order.id) ?? [];

    return {
      id: order.id,
      publicId: order.publicId,
      createdAt: order.createdAt,
      type: order.type,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName ?? "",
      customerPhone: order.customerPhone ?? "",
      totalCents: order.totalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      notes: order.notes ?? null,
      paymentMethod:
        meta.paymentMethod === "CASH" || meta.paymentMethod === "CARD"
          ? meta.paymentMethod
          : null,
      forcedPickup: Boolean(meta.forcedPickup),
      forcedReason: meta.forcedReason ?? null,
      address: meta.address ?? null,
      items: itemRows.map((item) => {
        const modifiers = (item.modifiers ?? {}) as Record<string, unknown>;

        return {
          id: item.id,
          qty: item.qty,
          nameSnapshot: item.nameSnapshot,
          variantSnapshot: item.variantSnapshot ?? null,
          lineTotalCents: item.lineTotalCents,
          modifiers: {
            modifierOptions: Array.isArray(modifiers.modifierOptions)
              ? modifiers.modifierOptions
              : [],
            ingredientsAdded: Array.isArray(modifiers.ingredientsAdded)
              ? modifiers.ingredientsAdded
              : [],
            ingredientsRemoved: Array.isArray(modifiers.ingredientsRemoved)
              ? modifiers.ingredientsRemoved
              : [],
          },
        };
      }),
    };
  });

  return json({
    now: new Date().toISOString(),
    orders: payload,
  });
};