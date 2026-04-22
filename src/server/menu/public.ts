import {
  db,
  AppSetting,
  MenuDish,
  MenuDishAssignment,
  Menu as LegacyMenu,
  MenuItem as LegacyMenuItem,
  Product,
  eq,
  inArray,
} from "astro:db";

export type MenuKind = "DIARIO" | "FESTIVO";
type DbCourse = "PRIMERO" | "SEGUNDO" | "POSTRE";
type Course = "ENTRANTES" | "PRINCIPALES" | "POSTRES";

export type PublicMenuData = {
  id: number;
  kind: MenuKind;
  title: string;
  priceText: string | null;
  courses: Record<Course, Array<{ name: string; desc: string | null }>>;
};

type MenuConfig = Record<
  MenuKind,
  {
    active: boolean;
    priceCents: number;
  }
>;

type PublicMenuSource = "V2" | "LEGACY" | "EMPTY";

type PublicMenuState = {
  diarioData: PublicMenuData | null;
  festivoData: PublicMenuData | null;
  source: PublicMenuSource;
  hasAnyV2Data: boolean;
  hasPublishedV2Data: boolean;
  hasLegacyData: boolean;
};

const DEFAULT_MENU_CONFIG: MenuConfig = {
  DIARIO: { active: true, priceCents: 1350 },
  FESTIVO: { active: true, priceCents: 1590 },
};

function centsToPriceText(cents: number) {
  return `${(Number(cents ?? 0) / 100).toFixed(2).replace(".", ",")}€`;
}

function extractPriceText(title: string): string | null {
  const match = String(title).match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
  if (!match) return null;
  return `${match[1].replace(".", ",")}€`;
}

function isWithin(
  row: { validFrom: Date | null; validTo: Date | null },
  now: Date
) {
  if (row.validFrom && now < row.validFrom) return false;
  if (row.validTo && now > row.validTo) return false;
  return true;
}

function pickBestLegacy(
  kind: MenuKind,
  rows: Array<{
    id: number;
    title: string;
    kind: MenuKind;
    active: boolean;
    validFrom: Date | null;
    validTo: Date | null;
  }>,
  now: Date
) {
  const candidates = rows.filter((row) => row.kind === kind);
  const within = candidates.filter((row) => isWithin(row, now));
  const list = within.length ? within : candidates;
  if (!list.length) return null;

  return [...list].sort((a, b) => {
    const aTime = a.validFrom ? a.validFrom.getTime() : 0;
    const bTime = b.validFrom ? b.validFrom.getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return b.id - a.id;
  })[0];
}

async function getMenuConfig(): Promise<MenuConfig> {
  const [row] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, "menuConfigV2"))
    .limit(1);

  const value = row?.value as Partial<MenuConfig> | undefined;

  return {
    DIARIO: {
      active: value?.DIARIO?.active ?? DEFAULT_MENU_CONFIG.DIARIO.active,
      priceCents:
        typeof value?.DIARIO?.priceCents === "number"
          ? value.DIARIO.priceCents
          : DEFAULT_MENU_CONFIG.DIARIO.priceCents,
    },
    FESTIVO: {
      active: value?.FESTIVO?.active ?? DEFAULT_MENU_CONFIG.FESTIVO.active,
      priceCents:
        typeof value?.FESTIVO?.priceCents === "number"
          ? value.FESTIVO.priceCents
          : DEFAULT_MENU_CONFIG.FESTIVO.priceCents,
    },
  };
}

function buildV2MenuData(
  kind: MenuKind,
  config: MenuConfig,
  rows: Array<{
    kind: MenuKind;
    course: DbCourse;
    dishName: string;
    assignmentId: number;
    assignmentCreatedAt: Date;
  }>
): PublicMenuData | null {
  const currentConfig = config[kind];
  if (!currentConfig.active) return null;

  const filtered = rows.filter((row) => row.kind === kind);
  if (!filtered.length) return null;

  const grouped: Record<DbCourse, Array<{ name: string; desc: string | null }>> = {
    PRIMERO: [],
    SEGUNDO: [],
    POSTRE: [],
  };

  for (const row of filtered) {
    grouped[row.course].push({
      name: row.dishName,
      desc: null,
    });
  }

  return {
    id: kind === "DIARIO" ? 1 : 2,
    kind,
    title: kind === "DIARIO" ? "Menú diario" : "Menú festivo",
    priceText: centsToPriceText(currentConfig.priceCents),
    courses: {
      ENTRANTES: grouped.PRIMERO,
      PRINCIPALES: grouped.SEGUNDO,
      POSTRES: grouped.POSTRE,
    },
  };
}

export async function getPublicMenuState(): Promise<PublicMenuState> {
  const config = await getMenuConfig();

  const v2Rows = await db
    .select({
      assignmentId: MenuDishAssignment.id,
      kind: MenuDishAssignment.kind,
      course: MenuDishAssignment.course,
      assignmentCreatedAt: MenuDishAssignment.createdAt,
      dishName: MenuDish.name,
    })
    .from(MenuDishAssignment)
    .innerJoin(MenuDish, eq(MenuDishAssignment.dishId, MenuDish.id));

  const courseOrder: Record<DbCourse, number> = {
    PRIMERO: 1,
    SEGUNDO: 2,
    POSTRE: 3,
  };

  const v2Assignments = [...v2Rows].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind, "es");

    const byCourse =
      courseOrder[a.course as DbCourse] - courseOrder[b.course as DbCourse];
    if (byCourse !== 0) return byCourse;

    const byCreatedAt =
      new Date(a.assignmentCreatedAt).getTime() -
      new Date(b.assignmentCreatedAt).getTime();
    if (byCreatedAt !== 0) return byCreatedAt;

    return a.assignmentId - b.assignmentId;
  }) as Array<{
    assignmentId: number;
    kind: MenuKind;
    course: DbCourse;
    assignmentCreatedAt: Date;
    dishName: string;
  }>;

  let diarioData = buildV2MenuData("DIARIO", config, v2Assignments);
  let festivoData = buildV2MenuData("FESTIVO", config, v2Assignments);

  const hasAnyV2Data = v2Assignments.length > 0;
  const hasPublishedV2Data = Boolean(diarioData || festivoData);

  if (hasPublishedV2Data) {
    return {
      diarioData,
      festivoData,
      source: "V2",
      hasAnyV2Data,
      hasPublishedV2Data,
      hasLegacyData: false,
    };
  }

  type LegacyMenuRow = {
    id: number;
    title: string;
    kind: MenuKind;
    active: boolean;
    validFrom: Date | null;
    validTo: Date | null;
  };

  type LegacyMenuItemRow = {
    id: number;
    menuId: number;
    productId: number;
    course: DbCourse;
    sortOrder: number | null;
  };

  type ProductRow = {
    id: number;
    name: string;
    description: string | null;
    details: string | null;
  };

  const menusRaw = (await db
    .select({
      id: LegacyMenu.id,
      title: LegacyMenu.title,
      kind: LegacyMenu.kind,
      active: LegacyMenu.active,
      validFrom: LegacyMenu.validFrom,
      validTo: LegacyMenu.validTo,
    })
    .from(LegacyMenu)
    .where(eq(LegacyMenu.active, true))) as unknown as LegacyMenuRow[];

  const now = new Date();
  const diarioLegacy = pickBestLegacy("DIARIO", menusRaw, now);
  const festivoLegacy = pickBestLegacy("FESTIVO", menusRaw, now);

  const activeMenus = [diarioLegacy, festivoLegacy].filter(Boolean) as LegacyMenuRow[];
  const menuIds = activeMenus.map((row) => row.id);

  const items = menuIds.length
    ? ((await db
      .select({
        id: LegacyMenuItem.id,
        menuId: LegacyMenuItem.menuId,
        productId: LegacyMenuItem.productId,
        course: LegacyMenuItem.course,
        sortOrder: LegacyMenuItem.sortOrder,
      })
      .from(LegacyMenuItem)
      .where(inArray(LegacyMenuItem.menuId, menuIds))) as unknown as LegacyMenuItemRow[])
    : [];

  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = productIds.length
    ? ((await db
      .select({
        id: Product.id,
        name: Product.name,
        description: Product.description,
        details: Product.details,
      })
      .from(Product)
      .where(inArray(Product.id, productIds))) as unknown as ProductRow[])
    : [];

  const productById = new Map(products.map((product) => [product.id, product]));

  function buildLegacyMenuData(menu: LegacyMenuRow | null): PublicMenuData | null {
    if (!menu) return null;

    const grouped: Record<DbCourse, { name: string; desc: string | null; sort: number }[]> = {
      PRIMERO: [],
      SEGUNDO: [],
      POSTRE: [],
    };

    const menuItems = items
      .filter((item) => item.menuId === menu.id)
      .sort((a, b) => {
        const aSort = a.sortOrder ?? 0;
        const bSort = b.sortOrder ?? 0;
        if (aSort !== bSort) return aSort - bSort;
        return a.id - b.id;
      });

    for (const item of menuItems) {
      const product = productById.get(item.productId);
      if (!product) continue;

      const desc = (product.details ?? product.description ?? "").trim();
      grouped[item.course].push({
        name: product.name,
        desc: desc || null,
        sort: item.sortOrder ?? 0,
      });
    }

    return {
      id: menu.id,
      kind: menu.kind,
      title: menu.title,
      priceText: extractPriceText(menu.title),
      courses: {
        ENTRANTES: grouped.PRIMERO.map((entry) => ({
          name: entry.name,
          desc: entry.desc,
        })),
        PRINCIPALES: grouped.SEGUNDO.map((entry) => ({
          name: entry.name,
          desc: entry.desc,
        })),
        POSTRES: grouped.POSTRE.map((entry) => ({
          name: entry.name,
          desc: entry.desc,
        })),
      },
    };
  }

  diarioData = buildLegacyMenuData(diarioLegacy);
  festivoData = buildLegacyMenuData(festivoLegacy);

  const hasLegacyData = Boolean(diarioData || festivoData);

  return {
    diarioData,
    festivoData,
    source: hasLegacyData ? "LEGACY" : "EMPTY",
    hasAnyV2Data,
    hasPublishedV2Data: false,
    hasLegacyData,
  };
}