import { d as db, O as Order, p as OrderItem } from '../../../../chunks/_astro_db_BPgDZzX3.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
const KITCHEN_STATUSES = ["PENDING", "PAID", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"];
function readLastAdminEvent(snapshot) {
  const list = Array.isArray(snapshot.adminEvents) ? snapshot.adminEvents : [];
  if (!list.length) return null;
  const sorted = [...list].sort((a, b) => {
    const aTime = a?.at ? new Date(a.at).getTime() : 0;
    const bTime = b?.at ? new Date(b.at).getTime() : 0;
    return bTime - aTime;
  });
  const top = sorted[0];
  if (!top) return null;
  return {
    title: String(top.title ?? "Evento"),
    detail: String(top.detail ?? ""),
    by: typeof top.by === "string" ? top.by : null,
    at: typeof top.at === "string" ? top.at : null
  };
}
const GET = async (context) => {
  const user = context.locals.user;
  if (!user || user.role !== "ADMIN" && user.role !== "STAFF") {
    return json({
      error: "UNAUTHORIZED"
    }, 401);
  }
  const ordersRaw = await db.select().from(Order).where(inArray(Order.status, [...KITCHEN_STATUSES]));
  const orders = [...ordersRaw].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).slice(-120);
  const orderIds = orders.map((order) => order.id);
  const items = orderIds.length ? await db.select().from(OrderItem).where(inArray(OrderItem.orderId, orderIds)) : [];
  const itemsByOrderId = /* @__PURE__ */ new Map();
  for (const item of items) {
    const current = itemsByOrderId.get(item.orderId) ?? [];
    current.push(item);
    itemsByOrderId.set(item.orderId, current);
  }
  const payload = orders.map((order) => {
    const meta = order.addressSnapshot ?? {};
    const itemRows = [...itemsByOrderId.get(order.id) ?? []].sort((a, b) => a.id - b.id);
    const itemCount = itemRows.reduce((sum, item) => sum + Number(item.qty ?? 0), 0);
    return {
      id: order.id,
      publicId: order.publicId,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      type: order.type,
      status: order.status,
      paymentStatus: order.paymentStatus,
      customerName: order.customerName ?? "",
      customerPhone: order.customerPhone ?? "",
      totalCents: order.totalCents,
      subtotalCents: order.subtotalCents,
      discountCents: order.discountCents,
      deliveryFeeCents: order.deliveryFeeCents,
      notes: order.notes ?? null,
      itemCount,
      paymentMethod: meta.paymentMethod === "CASH" || meta.paymentMethod === "CARD" ? meta.paymentMethod : null,
      forcedPickup: Boolean(meta.forcedPickup),
      forcedReason: meta.forcedReason ?? null,
      couponCode: meta.couponCode ?? null,
      adminInternalNote: typeof meta.adminInternalNote === "string" ? meta.adminInternalNote : null,
      lastAdminEvent: readLastAdminEvent(meta),
      address: meta.address ?? null,
      items: itemRows.map((item) => {
        const modifiers = item.modifiers ?? {};
        return {
          id: item.id,
          qty: item.qty,
          nameSnapshot: item.nameSnapshot,
          variantSnapshot: item.variantSnapshot ?? null,
          lineTotalCents: item.lineTotalCents,
          modifiers: {
            modifierOptions: Array.isArray(modifiers.modifierOptions) ? modifiers.modifierOptions : [],
            ingredientsAdded: Array.isArray(modifiers.ingredientsAdded) ? modifiers.ingredientsAdded : [],
            ingredientsRemoved: Array.isArray(modifiers.ingredientsRemoved) ? modifiers.ingredientsRemoved : []
          }
        };
      })
    };
  });
  return json({
    now: (/* @__PURE__ */ new Date()).toISOString(),
    orders: payload
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
