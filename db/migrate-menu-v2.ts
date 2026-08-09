/**
 * Migración legacy → menú V2.
 *
 * Contexto: el menú público se servía de las tablas legacy (Menu/MenuItem, que
 * referencian productos del catálogo), mientras el admin escribía en las tablas
 * V2 (MenuDish/MenuDishAssignment), que estaban vacías. Es decir: lo que se
 * configuraba en el admin no llegaba a la web, y publicar un solo plato desde el
 * admin habría hecho que la web cambiase de golpe a V2 perdiendo todo el
 * contenido anterior.
 *
 * Este script pasa el contenido real a V2 para poder eliminar la ruta legacy y
 * dejar el admin como fuente única.
 *
 * Es idempotente: se puede ejecutar varias veces. No borra nada de legacy — esas
 * tablas se quedan como red de seguridad hasta que se valide la migración.
 *
 *   npx astro db execute db/migrate-menu-v2.ts            # local
 *   npx astro db execute db/migrate-menu-v2.ts --remote   # producción
 */
import {
  db,
  Menu as LegacyMenu,
  MenuItem as LegacyMenuItem,
  MenuDish,
  MenuDishAssignment,
  Product,
  AppSetting,
  eq,
  inArray,
} from "astro:db";

type Kind = "DIARIO" | "FESTIVO";
type Course = "PRIMERO" | "SEGUNDO" | "POSTRE";

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/** Extrae el precio en céntimos de un título tipo "Menú diario · 13,50€". */
function priceCentsFromTitle(title: string): number | null {
  const match = String(title).match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
  if (!match) return null;
  const normalized = Number(match[1].replace(",", "."));
  return Number.isFinite(normalized) ? Math.round(normalized * 100) : null;
}

const legacyMenus = (await db
  .select()
  .from(LegacyMenu)
  .where(eq(LegacyMenu.active, true))) as unknown as Array<{
  id: number;
  title: string;
  kind: Kind;
  validFrom: Date | null;
}>;

if (!legacyMenus.length) {
  console.log("No hay menús legacy activos. Nada que migrar.");
}

// Si hay varios menús del mismo tipo, gana el más reciente: es el criterio que
// usaba la web al elegir cuál mostrar.
const bestByKind = new Map<Kind, (typeof legacyMenus)[number]>();
for (const menu of legacyMenus) {
  const current = bestByKind.get(menu.kind);
  const menuTime = menu.validFrom ? new Date(menu.validFrom).getTime() : 0;
  const currentTime = current?.validFrom ? new Date(current.validFrom).getTime() : 0;
  if (!current || menuTime > currentTime || (menuTime === currentTime && menu.id > current.id)) {
    bestByKind.set(menu.kind, menu);
  }
}

const menuIds = [...bestByKind.values()].map((menu) => menu.id);

const items = menuIds.length
  ? ((await db
      .select()
      .from(LegacyMenuItem)
      .where(inArray(LegacyMenuItem.menuId, menuIds))) as unknown as Array<{
      id: number;
      menuId: number;
      productId: number;
      course: Course;
      sortOrder: number | null;
    }>)
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
      .where(inArray(Product.id, productIds))) as unknown as Array<{
      id: number;
      name: string;
      description: string | null;
      details: string | null;
    }>)
  : [];

const productById = new Map(products.map((product) => [product.id, product]));

// --- Platos ---------------------------------------------------------------

const existingDishes = (await db.select().from(MenuDish)) as unknown as Array<{
  id: number;
  name: string;
  slug: string;
  description: string | null;
}>;

const dishBySlug = new Map(existingDishes.map((dish) => [dish.slug, dish]));
let nextDishId = existingDishes.reduce((max, dish) => Math.max(max, dish.id), 0) + 1;

let createdDishes = 0;
let updatedDishes = 0;

for (const productId of productIds) {
  const product = productById.get(productId);
  if (!product) continue;

  const slug = slugify(product.name);
  if (!slug) continue;

  const description = (product.details ?? product.description ?? "").trim() || null;
  const existing = dishBySlug.get(slug);

  if (existing) {
    // Sólo se rellena la descripción si falta: no pisar ediciones del admin.
    if (!existing.description && description) {
      await db.update(MenuDish).set({ description, updatedAt: new Date() }).where(eq(MenuDish.id, existing.id));
      existing.description = description;
      updatedDishes += 1;
    }
    continue;
  }

  const id = nextDishId++;
  await db.insert(MenuDish).values({
    id,
    name: product.name,
    slug,
    description,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  dishBySlug.set(slug, { id, name: product.name, slug, description });
  createdDishes += 1;
}

// --- Asignaciones ---------------------------------------------------------

const existingAssignments = (await db
  .select()
  .from(MenuDishAssignment)) as unknown as Array<{ id: number; kind: Kind; dishId: number }>;

// El índice único es (kind, dishId): un mismo plato no puede estar dos veces en
// el mismo menú, aunque sí en diario y festivo a la vez.
const assignmentKeys = new Set(existingAssignments.map((row) => `${row.kind}:${row.dishId}`));
let nextAssignmentId = existingAssignments.reduce((max, row) => Math.max(max, row.id), 0) + 1;

let createdAssignments = 0;

for (const [kind, menu] of bestByKind) {
  const menuItems = items
    .filter((item) => item.menuId === menu.id)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);

  let position = 0;

  for (const item of menuItems) {
    const product = productById.get(item.productId);
    if (!product) continue;

    const dish = dishBySlug.get(slugify(product.name));
    if (!dish) continue;

    const key = `${kind}:${dish.id}`;
    if (assignmentKeys.has(key)) {
      position += 1;
      continue;
    }

    await db.insert(MenuDishAssignment).values({
      id: nextAssignmentId++,
      kind,
      course: item.course,
      dishId: dish.id,
      sortOrder: position,
      createdAt: new Date(),
    });

    assignmentKeys.add(key);
    createdAssignments += 1;
    position += 1;
  }
}

// --- Configuración (precio y activación) ----------------------------------

// El precio vivía dentro del título legacy ("Menú diario · 13,50€") y, si no,
// en constantes del código. Pasa a AppSetting, que es lo que edita el admin.
const [configRow] = await db
  .select({ id: AppSetting.id, value: AppSetting.value })
  .from(AppSetting)
  .where(eq(AppSetting.key, "menuConfigV2"))
  .limit(1);

const existingConfig = (configRow?.value ?? {}) as Record<string, { active?: boolean; priceCents?: number }>;

const nextConfig = {
  DIARIO: {
    active: existingConfig.DIARIO?.active ?? bestByKind.has("DIARIO"),
    priceCents:
      existingConfig.DIARIO?.priceCents ??
      (bestByKind.get("DIARIO") ? priceCentsFromTitle(bestByKind.get("DIARIO")!.title) : null) ??
      0,
  },
  FESTIVO: {
    active: existingConfig.FESTIVO?.active ?? bestByKind.has("FESTIVO"),
    priceCents:
      existingConfig.FESTIVO?.priceCents ??
      (bestByKind.get("FESTIVO") ? priceCentsFromTitle(bestByKind.get("FESTIVO")!.title) : null) ??
      0,
  },
};

if (configRow) {
  await db.update(AppSetting).set({ value: nextConfig, updatedAt: new Date() }).where(eq(AppSetting.id, configRow.id));
} else {
  const rows = await db.select({ id: AppSetting.id }).from(AppSetting);
  const nextId = rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
  await db.insert(AppSetting).values({
    id: nextId,
    key: "menuConfigV2",
    value: nextConfig,
    updatedAt: new Date(),
  });
}

console.log(
  JSON.stringify(
    {
      menusLegacyLeidos: bestByKind.size,
      itemsLegacyLeidos: items.length,
      platosCreados: createdDishes,
      platosActualizados: updatedDishes,
      asignacionesCreadas: createdAssignments,
      config: nextConfig,
    },
    null,
    1,
  ),
);
