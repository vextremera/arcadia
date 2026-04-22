import {
  db,
  AppSetting,
  OpeningHour,
  LoyaltyTier,
  Menu,
  MenuItem,
  MenuDish,
  MenuDishAssignment,
  Product,
  eq,
} from "astro:db";

type MenuKind = "DIARIO" | "FESTIVO";
type MenuCourse = "PRIMERO" | "SEGUNDO" | "POSTRE";

type LegacyMenuRow = {
  kind: MenuKind;
  course: MenuCourse;
  sortOrder: number;
  productId: number;
  productName: string;
  productSlug: string;
};

const DEFAULT_OPERATING_HOURS = {
  open: { start: "07:30", end: "00:00" },
  kitchen: { start: "08:00", end: "23:20" },
  delivery: { start: "20:00", end: "22:50" },
};

const DEFAULT_PAYMENTS = {
  delivery: { cashEnabled: true, cardEnabled: true },
  pickup: { cashEnabled: true, cardEnabled: true },
};

const DEFAULT_MENU_CONFIG_V2 = {
  DIARIO: { active: true, priceCents: 1350 },
  FESTIVO: { active: true, priceCents: 1590 },
};

function mins(hh: number, mm: number) {
  return hh * 60 + mm;
}

async function getNextId(table: any, idColumn: any) {
  const rows = await db.select({ id: idColumn }).from(table);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

async function upsertSetting(key: string, value: unknown) {
  const [existing] = await db
    .select({ id: AppSetting.id })
    .from(AppSetting)
    .where(eq(AppSetting.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(AppSetting)
      .set({
        value,
        updatedAt: new Date(),
      })
      .where(eq(AppSetting.id, existing.id));

    return;
  }

  const nextId = await getNextId(AppSetting, AppSetting.id);

  await db.insert(AppSetting).values({
    id: nextId,
    key,
    value,
    updatedAt: new Date(),
  });
}

async function seedSettings() {
  await upsertSetting("operatingHours", DEFAULT_OPERATING_HOURS);
  await upsertSetting("deliveryFee", { cents: 0 });
  await upsertSetting("fees", { deliveryFeeCents: 0 });
  await upsertSetting("opsFlags", { pauseOrders: false, forcePickup: false });
  await upsertSetting("payments", DEFAULT_PAYMENTS);
  await upsertSetting("menuConfigV2", DEFAULT_MENU_CONFIG_V2);
}

async function seedOpeningHoursIfEmpty() {
  const existing = await db
    .select({ id: OpeningHour.id })
    .from(OpeningHour)
    .limit(1);

  if (existing.length > 0) return;

  let nextId = await getNextId(OpeningHour, OpeningHour.id);
  const rows: Array<any> = [];

  for (let dayOfWeek = 1; dayOfWeek <= 7; dayOfWeek += 1) {
    rows.push({
      id: nextId++,
      dayOfWeek,
      channel: "DINE_IN",
      openMins: mins(7, 30),
      closeMins: 24 * 60,
      isClosed: false,
    });

    rows.push({
      id: nextId++,
      dayOfWeek,
      channel: "PICKUP",
      openMins: mins(7, 30),
      closeMins: 24 * 60,
      isClosed: false,
    });

    rows.push({
      id: nextId++,
      dayOfWeek,
      channel: "DELIVERY",
      openMins: mins(20, 0),
      closeMins: mins(22, 50),
      isClosed: false,
    });
  }

  await db.insert(OpeningHour).values(rows);
}

async function seedLoyaltyTiersIfEmpty() {
  const existing = await db
    .select({ id: LoyaltyTier.id })
    .from(LoyaltyTier)
    .limit(1);

  if (existing.length > 0) return;

  let nextId = await getNextId(LoyaltyTier, LoyaltyTier.id);

  await db.insert(LoyaltyTier).values([
    {
      id: nextId++,
      name: "Bronce",
      minPoints: 0,
      perks: { badge: "Bronce" },
      active: true,
      sortOrder: 10,
    },
    {
      id: nextId++,
      name: "Plata",
      minPoints: 1000,
      perks: { badge: "Plata" },
      active: true,
      sortOrder: 20,
    },
    {
      id: nextId++,
      name: "Oro",
      minPoints: 3000,
      perks: { badge: "Oro" },
      active: true,
      sortOrder: 30,
    },
  ]);
}

async function seedMenuV2FromLegacyIfEmpty() {
  const [hasV2Dish] = await db
    .select({ id: MenuDish.id })
    .from(MenuDish)
    .limit(1);

  const [hasV2Assignment] = await db
    .select({ id: MenuDishAssignment.id })
    .from(MenuDishAssignment)
    .limit(1);

  if (hasV2Dish || hasV2Assignment) return;

  const legacyRows = (await db
    .select({
      kind: Menu.kind,
      course: MenuItem.course,
      sortOrder: MenuItem.sortOrder,
      productId: Product.id,
      productName: Product.name,
      productSlug: Product.slug,
    })
    .from(MenuItem)
    .innerJoin(Menu, eq(MenuItem.menuId, Menu.id))
    .innerJoin(Product, eq(MenuItem.productId, Product.id))) as LegacyMenuRow[];

  if (legacyRows.length === 0) return;

  const courseOrder: Record<MenuCourse, number> = {
    PRIMERO: 1,
    SEGUNDO: 2,
    POSTRE: 3,
  };

  const sortedLegacyRows = [...legacyRows].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind, "es");

    const byCourse = courseOrder[a.course] - courseOrder[b.course];
    if (byCourse !== 0) return byCourse;

    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;

    return a.productName.localeCompare(b.productName, "es");
  });

  let nextDishId = await getNextId(MenuDish, MenuDish.id);
  let nextAssignmentId = await getNextId(MenuDishAssignment, MenuDishAssignment.id);

  const dishIdByProductId = new Map<number, number>();
  const dishRows: Array<any> = [];

  for (const row of sortedLegacyRows) {
    if (dishIdByProductId.has(row.productId)) continue;

    const dishId = nextDishId++;
    dishIdByProductId.set(row.productId, dishId);

    dishRows.push({
      id: dishId,
      name: row.productName,
      slug: row.productSlug,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  if (dishRows.length > 0) {
    await db.insert(MenuDish).values(dishRows);
  }

  const assignmentSeen = new Set<string>();
  const assignmentRows: Array<any> = [];

  for (const row of sortedLegacyRows) {
    const dishId = dishIdByProductId.get(row.productId);
    if (!dishId) continue;

    const uniqueKey = `${row.kind}:${dishId}`;
    if (assignmentSeen.has(uniqueKey)) continue;
    assignmentSeen.add(uniqueKey);

    assignmentRows.push({
      id: nextAssignmentId++,
      kind: row.kind,
      course: row.course,
      dishId,
      createdAt: new Date(),
    });
  }

  if (assignmentRows.length > 0) {
    await db.insert(MenuDishAssignment).values(assignmentRows);
  }
}

export default async function seedRuntime() {
  await seedSettings();
  await seedOpeningHoursIfEmpty();
  await seedLoyaltyTiersIfEmpty();
  await seedMenuV2FromLegacyIfEmpty();

  console.log(
    "✅ Runtime seed: settings, openingHours, loyalty tiers y menú V2 listos."
  );
}