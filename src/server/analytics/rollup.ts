/**
 * Rollup diario de ventas.
 *
 * Reconstruye SalesDaily/ProductSalesDaily para una fecha (Europe/Madrid) a
 * partir de Order/OrderItem. Idempotente: se puede volver a ejecutar sobre la
 * misma fecha (p.ej. tras cancelar un pedido) y corrige/borra filas obsoletas.
 *
 * No hay cron en Vercel, así que esto se invoca "on-read" desde
 * src/server/analytics/queries.ts en vez de por un job programado.
 */
import {
  db,
  Order,
  OrderItem,
  User,
  SalesDaily,
  ProductSalesDaily,
  eq,
  gte,
  lt,
  and,
  inArray,
} from "astro:db";
import { getMadridDayBoundsUTC } from "@/server/time/madrid";

type AddressSnapshot = { paymentMethod?: "CASH" | "CARD" | string };

type SalesDailyAggregate = {
  ordersCount: number;
  revenueCents: number;
  avgTicketCents: number;
  deliveryCount: number;
  pickupCount: number;
  cashCents: number;
  cardCents: number;
  discountCents: number;
  newCustomers: number;
};

async function getNextSalesDailyId() {
  const rows = await db.select({ id: SalesDaily.id }).from(SalesDaily);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

async function getNextProductSalesDailyId() {
  const rows = await db.select({ id: ProductSalesDaily.id }).from(ProductSalesDaily);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

async function upsertSalesDaily(dateISO: string, data: SalesDailyAggregate) {
  const [existing] = await db
    .select({ id: SalesDaily.id })
    .from(SalesDaily)
    .where(eq(SalesDaily.dateISO, dateISO))
    .limit(1);

  if (existing) {
    await db
      .update(SalesDaily)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(SalesDaily.id, existing.id));
    return existing.id;
  }

  const id = await getNextSalesDailyId();
  await db.insert(SalesDaily).values({ id, dateISO, ...data, updatedAt: new Date() });
  return id;
}

async function upsertProductSalesDaily(
  dateISO: string,
  byProduct: Map<number, { qty: number; revenueCents: number }>,
) {
  const existingRows = await db
    .select({ id: ProductSalesDaily.id, productId: ProductSalesDaily.productId })
    .from(ProductSalesDaily)
    .where(eq(ProductSalesDaily.dateISO, dateISO));

  const existingByProduct = new Map(existingRows.map((row) => [row.productId, row.id]));
  let nextId: number | null = null;

  for (const [productId, agg] of byProduct) {
    const existingId = existingByProduct.get(productId);
    if (existingId) {
      await db
        .update(ProductSalesDaily)
        .set({ qty: agg.qty, revenueCents: agg.revenueCents })
        .where(eq(ProductSalesDaily.id, existingId));
      existingByProduct.delete(productId);
      continue;
    }

    nextId ??= await getNextProductSalesDailyId();
    await db.insert(ProductSalesDaily).values({
      id: nextId++,
      dateISO,
      productId,
      qty: agg.qty,
      revenueCents: agg.revenueCents,
    });
  }

  // Filas que ya no corresponden a esta fecha (p.ej. tras cancelar un pedido).
  for (const staleId of existingByProduct.values()) {
    await db.delete(ProductSalesDaily).where(eq(ProductSalesDaily.id, staleId));
  }
}

/**
 * Invalida el rollup de una fecha ya cerrada (borra SalesDaily/ProductSalesDaily
 * de ese día). La próxima lectura de analítica lo recalcula desde Order/OrderItem.
 * Llamar cuando una mutación admin cambia un pedido de un día que ya no es "hoy"
 * (cambio de estado/pago, refund) — "hoy" ya se recalcula siempre en cada lectura.
 */
export async function invalidateSalesDay(dateISO: string) {
  const [existingDay] = await db
    .select({ id: SalesDaily.id })
    .from(SalesDaily)
    .where(eq(SalesDaily.dateISO, dateISO))
    .limit(1);
  if (existingDay) {
    await db.delete(SalesDaily).where(eq(SalesDaily.id, existingDay.id));
  }

  const productRows = await db
    .select({ id: ProductSalesDaily.id })
    .from(ProductSalesDaily)
    .where(eq(ProductSalesDaily.dateISO, dateISO));
  for (const row of productRows) {
    await db.delete(ProductSalesDaily).where(eq(ProductSalesDaily.id, row.id));
  }
}

export async function rollupSalesForDate(dateISO: string) {
  const { startUTC, endUTC } = getMadridDayBoundsUTC(dateISO);

  const orders = await db
    .select({
      id: Order.id,
      type: Order.type,
      status: Order.status,
      totalCents: Order.totalCents,
      discountCents: Order.discountCents,
      addressSnapshot: Order.addressSnapshot,
    })
    .from(Order)
    .where(and(gte(Order.createdAt, startUTC), lt(Order.createdAt, endUTC)));

  const countedOrders = orders.filter((order) => order.status !== "CANCELLED");

  const revenueCents = countedOrders.reduce(
    (sum, order) => sum + Number(order.totalCents ?? 0),
    0,
  );
  const discountCents = countedOrders.reduce(
    (sum, order) => sum + Number(order.discountCents ?? 0),
    0,
  );
  const avgTicketCents = countedOrders.length
    ? Math.round(revenueCents / countedOrders.length)
    : 0;

  const deliveryCount = orders.filter((order) => order.type === "DELIVERY").length;
  const pickupCount = orders.filter((order) => order.type === "PICKUP").length;

  let cashCents = 0;
  let cardCents = 0;
  for (const order of countedOrders) {
    const meta = (order.addressSnapshot ?? {}) as AddressSnapshot;
    if (meta.paymentMethod === "CASH") cashCents += Number(order.totalCents ?? 0);
    else if (meta.paymentMethod === "CARD") cardCents += Number(order.totalCents ?? 0);
  }

  const newCustomerRows = await db
    .select({ id: User.id })
    .from(User)
    .where(and(eq(User.role, "CUSTOMER"), gte(User.createdAt, startUTC), lt(User.createdAt, endUTC)));

  await upsertSalesDaily(dateISO, {
    ordersCount: orders.length,
    revenueCents,
    avgTicketCents,
    deliveryCount,
    pickupCount,
    cashCents,
    cardCents,
    discountCents,
    newCustomers: newCustomerRows.length,
  });

  const orderIds = countedOrders.map((order) => order.id);
  const items = orderIds.length
    ? await db.select().from(OrderItem).where(inArray(OrderItem.orderId, orderIds))
    : [];

  const byProduct = new Map<number, { qty: number; revenueCents: number }>();
  for (const item of items) {
    if (item.productId == null) continue;
    const current = byProduct.get(item.productId) ?? { qty: 0, revenueCents: 0 };
    current.qty += Number(item.qty ?? 0);
    current.revenueCents += Number(item.lineTotalCents ?? 0);
    byProduct.set(item.productId, current);
  }

  await upsertProductSalesDaily(dateISO, byProduct);

  return { dateISO, ordersCount: orders.length, revenueCents };
}
