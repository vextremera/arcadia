/**
 * Consultas de analítica de ventas.
 *
 * Todo se apoya en el rollup diario (SalesDaily/ProductSalesDaily) en vez de
 * escanear Order/OrderItem completos. El día de hoy se recalcula en cada
 * lectura (recompute-on-read, ver rollup.ts); los días pasados solo se
 * recalculan la primera vez que se piden (backfill perezoso).
 */
import { db, Order, Product, Category, Coupon, SalesDaily, ProductSalesDaily, and, eq, gte, lt, isNotNull, inArray, desc } from "astro:db";
import { getMadridDateInfo, getMadridDayBoundsUTC, shiftDateISO } from "@/server/time/madrid";
import { rollupSalesForDate } from "@/server/analytics/rollup";

export type RangeKind = "day" | "week" | "month";

export type DateRange = { fromISO: string; toISO: string };

export function getTodayDateISO() {
  return getMadridDateInfo().dateISO;
}

/**
 * Cola global de escrituras de rollup + caché de llamadas en curso por fecha.
 *
 * getSummary/getDailySeries/getTopProducts piden rollup para las mismas
 * fechas en paralelo (Promise.all) en cada carga de página. Sin esto, varias
 * llamadas concurrentes para el mismo día recalculan por separado y chocan
 * al generar el mismo id (max(id)+1, ver rollup.ts) → UNIQUE constraint.
 * Encolar serializa las escrituras; el caché deduplica llamadas concurrentes
 * para la misma fecha sin impedir que la siguiente petición (ya separada)
 * vuelva a recalcular "hoy" con datos frescos.
 */
const inFlightRollups = new Map<string, Promise<void>>();
let rollupQueue: Promise<unknown> = Promise.resolve();

function runRollupOnce(dateISO: string): Promise<void> {
  const existing = inFlightRollups.get(dateISO);
  if (existing) return existing;

  const run = rollupQueue.then(() => rollupSalesForDate(dateISO)).then(() => undefined);
  rollupQueue = run.catch(() => undefined);

  const tracked = run.finally(() => {
    inFlightRollups.delete(dateISO);
  });

  inFlightRollups.set(dateISO, tracked);
  return tracked;
}

/** Asegura que exista rollup para una fecha: siempre para hoy, una vez (backfill) para el resto. */
async function ensureRollup(dateISO: string) {
  const todayISO = getTodayDateISO();

  if (dateISO > todayISO) return; // fecha futura, nada que rellenar

  if (dateISO === todayISO) {
    await runRollupOnce(dateISO);
    return;
  }

  if (inFlightRollups.has(dateISO)) {
    await inFlightRollups.get(dateISO);
    return;
  }

  const [existing] = await db
    .select({ id: SalesDaily.id })
    .from(SalesDaily)
    .where(eq(SalesDaily.dateISO, dateISO))
    .limit(1);

  if (!existing) {
    await runRollupOnce(dateISO);
  }
}

async function ensureRollupRange(range: DateRange) {
  const dates = enumerateDates(range);
  await Promise.all(dates.map((dateISO) => ensureRollup(dateISO)));
}

function enumerateDates({ fromISO, toISO }: DateRange) {
  const dates: string[] = [];
  let cursor = fromISO;
  let guard = 0;
  while (cursor <= toISO && guard < 400) {
    dates.push(cursor);
    cursor = shiftDateISO(cursor, 1);
    guard += 1;
  }
  return dates;
}

function mondayOf(dateISO: string) {
  const { dayKey } = getMadridDateInfo(
    new Date(`${dateISO}T12:00:00Z`),
  );
  return shiftDateISO(dateISO, -(dayKey - 1));
}

function firstOfMonth(dateISO: string) {
  const [year, month] = dateISO.split("-");
  return `${year}-${month}-01`;
}

function lastOfMonth(dateISO: string) {
  const [year, month] = dateISO.split("-").map(Number);
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;
  return shiftDateISO(next, -1);
}

/** Rango [fromISO, toISO] para day/week/month anclado en `anchorISO`, y el rango previo equivalente. */
export function resolveRange(kind: RangeKind, anchorISO: string) {
  let fromISO: string;
  let toISO: string;

  if (kind === "day") {
    fromISO = anchorISO;
    toISO = anchorISO;
  } else if (kind === "week") {
    fromISO = mondayOf(anchorISO);
    toISO = shiftDateISO(fromISO, 6);
  } else {
    fromISO = firstOfMonth(anchorISO);
    toISO = lastOfMonth(anchorISO);
  }

  const spanDays = enumerateDates({ fromISO, toISO }).length;
  const prevToISO = shiftDateISO(fromISO, -1);
  const prevFromISO = shiftDateISO(prevToISO, -(spanDays - 1));

  return {
    current: { fromISO, toISO } satisfies DateRange,
    previous: { fromISO: prevFromISO, toISO: prevToISO } satisfies DateRange,
  };
}

export function shiftAnchor(kind: RangeKind, anchorISO: string, direction: 1 | -1) {
  if (kind === "day") return shiftDateISO(anchorISO, direction);
  if (kind === "week") return shiftDateISO(anchorISO, direction * 7);

  const [year, month] = anchorISO.split("-").map(Number);
  const nextMonth = month + direction;
  const nextYear = year + Math.floor((nextMonth - 1) / 12);
  const normalizedMonth = ((nextMonth - 1 + 12) % 12) + 1;
  const day = Math.min(Number(anchorISO.split("-")[2]), 28);
  return `${nextYear}-${String(normalizedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type SalesDailyRow = typeof SalesDaily.$inferSelect;

function zeroRow(dateISO: string): SalesDailyRow {
  return {
    id: 0,
    dateISO,
    ordersCount: 0,
    revenueCents: 0,
    avgTicketCents: 0,
    deliveryCount: 0,
    pickupCount: 0,
    cashCents: 0,
    cardCents: 0,
    discountCents: 0,
    newCustomers: 0,
    updatedAt: new Date(),
  };
}

async function listSalesDaily(range: DateRange): Promise<SalesDailyRow[]> {
  await ensureRollupRange(range);

  const rows = await db
    .select()
    .from(SalesDaily)
    .where(and(gte(SalesDaily.dateISO, range.fromISO), lt(SalesDaily.dateISO, shiftDateISO(range.toISO, 1))));

  const byDate = new Map(rows.map((row) => [row.dateISO, row]));
  return enumerateDates(range).map((dateISO) => byDate.get(dateISO) ?? zeroRow(dateISO));
}

function sumRows(rows: SalesDailyRow[]) {
  const totals = rows.reduce(
    (acc, row) => {
      acc.ordersCount += row.ordersCount;
      acc.revenueCents += row.revenueCents;
      acc.deliveryCount += row.deliveryCount;
      acc.pickupCount += row.pickupCount;
      acc.cashCents += row.cashCents;
      acc.cardCents += row.cardCents;
      acc.discountCents += row.discountCents;
      acc.newCustomers += row.newCustomers;
      return acc;
    },
    {
      ordersCount: 0,
      revenueCents: 0,
      deliveryCount: 0,
      pickupCount: 0,
      cashCents: 0,
      cardCents: 0,
      discountCents: 0,
      newCustomers: 0,
    },
  );

  const avgTicketCents = totals.ordersCount
    ? Math.round(totals.revenueCents / totals.ordersCount)
    : 0;

  return { ...totals, avgTicketCents };
}

function pctDelta(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export type KpiValue = { value: number; deltaPct: number | null };

export type AnalyticsSummary = {
  range: DateRange;
  ordersCount: KpiValue;
  revenueCents: KpiValue;
  avgTicketCents: KpiValue;
  deliveryCount: KpiValue;
  pickupCount: KpiValue;
  cashCents: KpiValue;
  cardCents: KpiValue;
  discountCents: KpiValue;
  newCustomers: KpiValue;
};

export async function getSummary(kind: RangeKind, anchorISO: string): Promise<AnalyticsSummary> {
  const { current, previous } = resolveRange(kind, anchorISO);

  const [currentRows, previousRows] = await Promise.all([
    listSalesDaily(current),
    listSalesDaily(previous),
  ]);

  const cur = sumRows(currentRows);
  const prev = sumRows(previousRows);

  const kpi = (key: keyof typeof cur): KpiValue => ({
    value: cur[key],
    deltaPct: pctDelta(cur[key], prev[key]),
  });

  return {
    range: current,
    ordersCount: kpi("ordersCount"),
    revenueCents: kpi("revenueCents"),
    avgTicketCents: kpi("avgTicketCents"),
    deliveryCount: kpi("deliveryCount"),
    pickupCount: kpi("pickupCount"),
    cashCents: kpi("cashCents"),
    cardCents: kpi("cardCents"),
    discountCents: kpi("discountCents"),
    newCustomers: kpi("newCustomers"),
  };
}

export type DailySeriesPoint = {
  dateISO: string;
  ordersCount: number;
  revenueCents: number;
  avgTicketCents: number;
  deliveryCount: number;
  pickupCount: number;
};

export async function getDailySeries(range: DateRange): Promise<DailySeriesPoint[]> {
  const rows = await listSalesDaily(range);
  return rows.map((row) => ({
    dateISO: row.dateISO,
    ordersCount: row.ordersCount,
    revenueCents: row.revenueCents,
    avgTicketCents: row.avgTicketCents,
    deliveryCount: row.deliveryCount,
    pickupCount: row.pickupCount,
  }));
}

/** Últimos N días (incluyendo hoy), para sparklines de KPI. */
export async function getSparkline(days = 14): Promise<number[]> {
  const todayISO = getTodayDateISO();
  const fromISO = shiftDateISO(todayISO, -(days - 1));
  const rows = await listSalesDaily({ fromISO, toISO: todayISO });
  return rows.map((row) => row.revenueCents);
}

export type HourlyPoint = { hour: number; revenueCents: number; ordersCount: number };

async function hourlyForDate(dateISO: string): Promise<HourlyPoint[]> {
  const { startUTC, endUTC } = getMadridDayBoundsUTC(dateISO);

  const orders = await db
    .select({ createdAt: Order.createdAt, totalCents: Order.totalCents, status: Order.status })
    .from(Order)
    .where(and(gte(Order.createdAt, startUTC), lt(Order.createdAt, endUTC)));

  const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, revenueCents: 0, ordersCount: 0 }));

  for (const order of orders) {
    if (order.status === "CANCELLED") continue;
    const madridHour = getMadridDateInfo(new Date(order.createdAt)).hour;
    buckets[madridHour].revenueCents += Number(order.totalCents ?? 0);
    buckets[madridHour].ordersCount += 1;
  }

  return buckets;
}

/** Facturación por hora de hoy, con la comparativa del mismo día de la semana anterior. */
export async function getHourlyToday() {
  const todayISO = getTodayDateISO();
  const lastWeekISO = shiftDateISO(todayISO, -7);

  const [today, lastWeek] = await Promise.all([
    hourlyForDate(todayISO),
    hourlyForDate(lastWeekISO),
  ]);

  return { todayISO, lastWeekISO, today, lastWeek };
}

export type TopProduct = {
  productId: number;
  name: string;
  imageUrl: string | null;
  qty: number;
  revenueCents: number;
};

export async function getTopProducts(range: DateRange, limit = 6): Promise<TopProduct[]> {
  await ensureRollupRange(range);

  const rows = await db
    .select({ productId: ProductSalesDaily.productId, qty: ProductSalesDaily.qty, revenueCents: ProductSalesDaily.revenueCents })
    .from(ProductSalesDaily)
    .where(and(gte(ProductSalesDaily.dateISO, range.fromISO), lt(ProductSalesDaily.dateISO, shiftDateISO(range.toISO, 1))));

  const byProduct = new Map<number, { qty: number; revenueCents: number }>();
  for (const row of rows) {
    const current = byProduct.get(row.productId) ?? { qty: 0, revenueCents: 0 };
    current.qty += row.qty;
    current.revenueCents += row.revenueCents;
    byProduct.set(row.productId, current);
  }

  const sorted = [...byProduct.entries()]
    .sort((a, b) => b[1].revenueCents - a[1].revenueCents)
    .slice(0, limit);

  if (!sorted.length) return [];

  const productIds = sorted.map(([id]) => id);
  const products = await db
    .select({ id: Product.id, name: Product.name, imageUrl: Product.imageUrl })
    .from(Product)
    .where(inArray(Product.id, productIds));
  const productById = new Map(products.map((p) => [p.id, p]));

  return sorted.map(([productId, agg]) => ({
    productId,
    name: productById.get(productId)?.name ?? `#${productId}`,
    imageUrl: productById.get(productId)?.imageUrl ?? null,
    qty: agg.qty,
    revenueCents: agg.revenueCents,
  }));
}

/** Últimos pedidos, acotado por límite (para el panel de "últimos pedidos" del dashboard). */
export async function getRecentOrders(limit = 8) {
  return db.select().from(Order).orderBy(desc(Order.createdAt)).limit(limit);
}

export type CategorySales = {
  categoryId: number;
  name: string;
  qty: number;
  revenueCents: number;
};

/** Facturación por familia de producto en el rango, vía rollup diario. */
export async function getCategorySales(range: DateRange): Promise<CategorySales[]> {
  await ensureRollupRange(range);

  const rows = await db
    .select({ productId: ProductSalesDaily.productId, qty: ProductSalesDaily.qty, revenueCents: ProductSalesDaily.revenueCents })
    .from(ProductSalesDaily)
    .where(and(gte(ProductSalesDaily.dateISO, range.fromISO), lt(ProductSalesDaily.dateISO, shiftDateISO(range.toISO, 1))));

  if (!rows.length) return [];

  const productIds = [...new Set(rows.map((row) => row.productId))];
  const products = await db
    .select({ id: Product.id, categoryId: Product.categoryId })
    .from(Product)
    .where(inArray(Product.id, productIds));
  const categoryIdByProduct = new Map(products.map((p) => [p.id, p.categoryId]));

  const byCategory = new Map<number, { qty: number; revenueCents: number }>();
  for (const row of rows) {
    const categoryId = categoryIdByProduct.get(row.productId);
    if (!categoryId) continue;
    const current = byCategory.get(categoryId) ?? { qty: 0, revenueCents: 0 };
    current.qty += row.qty;
    current.revenueCents += row.revenueCents;
    byCategory.set(categoryId, current);
  }

  if (!byCategory.size) return [];

  const categories = await db
    .select({ id: Category.id, name: Category.name })
    .from(Category)
    .where(inArray(Category.id, [...byCategory.keys()]));
  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  return [...byCategory.entries()]
    .map(([categoryId, agg]) => ({ categoryId, name: nameById.get(categoryId) ?? `#${categoryId}`, ...agg }))
    .sort((a, b) => b.revenueCents - a.revenueCents);
}

export type CouponUsage = {
  couponId: number;
  code: string;
  uses: number;
  discountCents: number;
};

/** Cupones aplicados a pedidos dentro del rango (por fecha de creación del pedido). */
export async function getCouponUsage(range: DateRange): Promise<CouponUsage[]> {
  const startUTC = getMadridDayBoundsUTC(range.fromISO).startUTC;
  const endUTC = getMadridDayBoundsUTC(range.toISO).endUTC;

  const orders = await db
    .select({ couponId: Order.couponId, discountCents: Order.discountCents })
    .from(Order)
    .where(and(isNotNull(Order.couponId), gte(Order.createdAt, startUTC), lt(Order.createdAt, endUTC)));

  if (!orders.length) return [];

  const byCoupon = new Map<number, { uses: number; discountCents: number }>();
  for (const order of orders) {
    if (typeof order.couponId !== "number") continue;
    const current = byCoupon.get(order.couponId) ?? { uses: 0, discountCents: 0 };
    current.uses += 1;
    current.discountCents += Number(order.discountCents ?? 0);
    byCoupon.set(order.couponId, current);
  }

  const coupons = await db
    .select({ id: Coupon.id, code: Coupon.code })
    .from(Coupon)
    .where(inArray(Coupon.id, [...byCoupon.keys()]));
  const codeById = new Map(coupons.map((c) => [c.id, c.code]));

  return [...byCoupon.entries()]
    .map(([couponId, agg]) => ({ couponId, code: codeById.get(couponId) ?? `#${couponId}`, ...agg }))
    .sort((a, b) => b.discountCents - a.discountCents);
}
