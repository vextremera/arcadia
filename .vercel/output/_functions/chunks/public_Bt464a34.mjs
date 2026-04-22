import { d as db, l as MenuDish, m as MenuDishAssignment, n as Menu, o as MenuItem, e as Product, A as AppSetting } from './_astro_db_Bcz5lWRF.mjs';
import { eq, inArray } from '@astrojs/db/dist/runtime/virtual.js';

const DEFAULT_MENU_CONFIG = {
  DIARIO: {
    active: true,
    priceCents: 1350
  },
  FESTIVO: {
    active: true,
    priceCents: 1590
  }
};
function centsToPriceText(cents) {
  return `${(Number(cents ?? 0) / 100).toFixed(2).replace(".", ",")}€`;
}
function extractPriceText(title) {
  const match = String(title).match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
  if (!match) return null;
  return `${match[1].replace(".", ",")}€`;
}
function isWithin(row, now) {
  if (row.validFrom && now < row.validFrom) return false;
  if (row.validTo && now > row.validTo) return false;
  return true;
}
function pickBestLegacy(kind, rows, now) {
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
async function getMenuConfig() {
  const [row] = await db.select({
    value: AppSetting.value
  }).from(AppSetting).where(eq(AppSetting.key, "menuConfigV2")).limit(1);
  const value = row?.value;
  return {
    DIARIO: {
      active: value?.DIARIO?.active ?? DEFAULT_MENU_CONFIG.DIARIO.active,
      priceCents: typeof value?.DIARIO?.priceCents === "number" ? value.DIARIO.priceCents : DEFAULT_MENU_CONFIG.DIARIO.priceCents
    },
    FESTIVO: {
      active: value?.FESTIVO?.active ?? DEFAULT_MENU_CONFIG.FESTIVO.active,
      priceCents: typeof value?.FESTIVO?.priceCents === "number" ? value.FESTIVO.priceCents : DEFAULT_MENU_CONFIG.FESTIVO.priceCents
    }
  };
}
function buildV2MenuData(kind, config, rows) {
  const currentConfig = config[kind];
  if (!currentConfig.active) return null;
  const filtered = rows.filter((row) => row.kind === kind);
  if (!filtered.length) return null;
  const grouped = {
    PRIMERO: [],
    SEGUNDO: [],
    POSTRE: []
  };
  for (const row of filtered) {
    grouped[row.course].push({
      name: row.dishName,
      desc: null
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
      POSTRES: grouped.POSTRE
    }
  };
}
async function getPublicMenuState() {
  const config = await getMenuConfig();
  const v2Rows = await db.select({
    assignmentId: MenuDishAssignment.id,
    kind: MenuDishAssignment.kind,
    course: MenuDishAssignment.course,
    assignmentCreatedAt: MenuDishAssignment.createdAt,
    dishName: MenuDish.name
  }).from(MenuDishAssignment).innerJoin(MenuDish, eq(MenuDishAssignment.dishId, MenuDish.id));
  const courseOrder = {
    PRIMERO: 1,
    SEGUNDO: 2,
    POSTRE: 3
  };
  const v2Assignments = [...v2Rows].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind, "es");
    const byCourse = courseOrder[a.course] - courseOrder[b.course];
    if (byCourse !== 0) return byCourse;
    const byCreatedAt = new Date(a.assignmentCreatedAt).getTime() - new Date(b.assignmentCreatedAt).getTime();
    if (byCreatedAt !== 0) return byCreatedAt;
    return a.assignmentId - b.assignmentId;
  });
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
      hasLegacyData: false
    };
  }
  const menusRaw = await db.select({
    id: Menu.id,
    title: Menu.title,
    kind: Menu.kind,
    active: Menu.active,
    validFrom: Menu.validFrom,
    validTo: Menu.validTo
  }).from(Menu).where(eq(Menu.active, true));
  const now = /* @__PURE__ */ new Date();
  const diarioLegacy = pickBestLegacy("DIARIO", menusRaw, now);
  const festivoLegacy = pickBestLegacy("FESTIVO", menusRaw, now);
  const activeMenus = [diarioLegacy, festivoLegacy].filter(Boolean);
  const menuIds = activeMenus.map((row) => row.id);
  const items = menuIds.length ? await db.select({
    id: MenuItem.id,
    menuId: MenuItem.menuId,
    productId: MenuItem.productId,
    course: MenuItem.course,
    sortOrder: MenuItem.sortOrder
  }).from(MenuItem).where(inArray(MenuItem.menuId, menuIds)) : [];
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = productIds.length ? await db.select({
    id: Product.id,
    name: Product.name,
    description: Product.description,
    details: Product.details
  }).from(Product).where(inArray(Product.id, productIds)) : [];
  const productById = new Map(products.map((product) => [product.id, product]));
  function buildLegacyMenuData(menu) {
    if (!menu) return null;
    const grouped = {
      PRIMERO: [],
      SEGUNDO: [],
      POSTRE: []
    };
    const menuItems = items.filter((item) => item.menuId === menu.id).sort((a, b) => {
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
        sort: item.sortOrder ?? 0
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
          desc: entry.desc
        })),
        PRINCIPALES: grouped.SEGUNDO.map((entry) => ({
          name: entry.name,
          desc: entry.desc
        })),
        POSTRES: grouped.POSTRE.map((entry) => ({
          name: entry.name,
          desc: entry.desc
        }))
      }
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
    hasLegacyData
  };
}

export { getPublicMenuState as g };
