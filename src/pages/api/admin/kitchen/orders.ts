import type { APIRoute } from "astro";
import { db, Order, OrderItem, inArray, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const KITCHEN_STATUSES = [
  "PENDING",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
] as const;

export const GET: APIRoute = async (context) => {
  const u = context.locals.user;
  if (!u || (u.role !== "ADMIN" && u.role !== "STAFF")) {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

  // últimos pedidos relevantes (más que suficiente para cocina)
  const ordersRaw = await db
    .select()
    .from(Order)
    .where(inArray(Order.status, [...KITCHEN_STATUSES]))
    .orderBy(Order.createdAt)
    .limit(80);

  const orders = [...ordersRaw].reverse(); // más nuevos primero
  const orderIds = orders.map((o) => o.id);

  const items = orderIds.length
    ? await db
        .select()
        .from(OrderItem)
        .where(inArray(OrderItem.orderId, orderIds))
    : [];

  const itemsByOrderId = new Map<number, any[]>();
  for (const it of items) {
    const arr = itemsByOrderId.get(it.orderId) ?? [];
    arr.push(it);
    itemsByOrderId.set(it.orderId, arr);
  }

  const payload = orders.map((o) => {
    const meta: any = o.addressSnapshot ?? {};
    const paymentMethod = meta?.paymentMethod ?? null;
    const forcedPickup = !!meta?.forcedPickup;
    const forcedReason = meta?.forcedReason ?? null;
    const address = meta?.address ?? null;

    const its = (itemsByOrderId.get(o.id) ?? []).map((it) => {
      const m = (it as any).modifiers ?? {};
      return {
        id: it.id,
        qty: it.qty,
        nameSnapshot: it.nameSnapshot,
        variantSnapshot: it.variantSnapshot ?? null,
        lineTotalCents: it.lineTotalCents,
        modifiers: {
          modifierOptions: m.modifierOptions ?? [],
          ingredientsAdded: m.ingredientsAdded ?? [],
          ingredientsRemoved: m.ingredientsRemoved ?? [],
        },
      };
    });

    return {
      id: o.id,
      publicId: o.publicId,
      createdAt: o.createdAt,
      type: o.type,
      status: o.status,
      paymentStatus: o.paymentStatus,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      totalCents: o.totalCents,
      deliveryFeeCents: o.deliveryFeeCents,
      notes: o.notes ?? null,
      paymentMethod,
      forcedPickup,
      forcedReason,
      address,
      items: its,
    };
  });

  return json({ now: new Date().toISOString(), orders: payload });
};
