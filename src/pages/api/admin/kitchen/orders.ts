import type { APIRoute } from "astro";
import { db, Order, OrderItem, inArray } from "astro:db";

type AddressSnapshot = {
  paymentMethod?: "CASH" | "CARD" | string;
  forcedPickup?: boolean;
  forcedReason?: string | null;
  couponCode?: string | null;
  adminInternalNote?: string | null;
  adminEvents?: Array<{
    id?: string;
    kind?: string;
    title?: string;
    detail?: string;
    by?: string | null;
    at?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
  }>;
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

function readLastAdminEvent(snapshot: AddressSnapshot) {
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
    at: typeof top.at === "string" ? top.at : null,
  };
}

/**
 * Momento en que el pedido entró en su estado actual, para medir el tiempo
 * que lleva en la fase (distinto de la antigüedad total del pedido).
 *
 * Se apoya en los eventos STATUS del snapshot. Los eventos nuevos guardan
 * `toStatus`; los antiguos solo tienen el texto "ANTERIOR → SIGUIENTE", así que
 * se cae a leerlo de ahí. Si no hay ninguno, el pedido nunca cambió de estado
 * y la fase arrancó al crearse.
 */
function readCurrentStatusSince(snapshot: AddressSnapshot, status: string, createdAt: Date | string) {
  const list = Array.isArray(snapshot.adminEvents) ? snapshot.adminEvents : [];

  const matching = list
    .filter((event) => {
      if (event?.kind !== "STATUS" || !event.at) return false;
      if (typeof event.toStatus === "string" && event.toStatus) return event.toStatus === status;
      const arrow = String(event.detail ?? "").match(/→\s*([A-Z_]+)/);
      return arrow ? arrow[1] === status : false;
    })
    .map((event) => new Date(String(event.at)).getTime())
    .filter((time) => Number.isFinite(time));

  if (!matching.length) return new Date(createdAt).toISOString();
  return new Date(Math.max(...matching)).toISOString();
}

export const GET: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

  const ordersRaw = await db
    .select()
    .from(Order)
    .where(inArray(Order.status, [...KITCHEN_STATUSES]));

  const orders = [...ordersRaw]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(-120);

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
    const itemRows = [...(itemsByOrderId.get(order.id) ?? [])].sort((a, b) => a.id - b.id);
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
      paymentMethod:
        meta.paymentMethod === "CASH" || meta.paymentMethod === "CARD"
          ? meta.paymentMethod
          : null,
      forcedPickup: Boolean(meta.forcedPickup),
      forcedReason: meta.forcedReason ?? null,
      couponCode: meta.couponCode ?? null,
      adminInternalNote:
        typeof meta.adminInternalNote === "string" ? meta.adminInternalNote : null,
      lastAdminEvent: readLastAdminEvent(meta),
      currentStatusSince: readCurrentStatusSince(meta, order.status, order.createdAt),
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