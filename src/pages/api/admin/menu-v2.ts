import type { APIRoute } from "astro";
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

type MenuKind = "DIARIO" | "FESTIVO";
type MenuCourse = "PRIMERO" | "SEGUNDO" | "POSTRE";

type MenuConfig = Record<
  MenuKind,
  {
    active: boolean;
    priceCents: number;
  }
>;

const DEFAULT_MENU_CONFIG: MenuConfig = {
  DIARIO: { active: true, priceCents: 1350 },
  FESTIVO: { active: true, priceCents: 1590 },
};

const REDIRECT_PATH = "/admin/menu";

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseEuroToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

function isKind(value: string): value is MenuKind {
  return value === "DIARIO" || value === "FESTIVO";
}

function isCourse(value: string): value is MenuCourse {
  return value === "PRIMERO" || value === "SEGUNDO" || value === "POSTRE";
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function extractPriceFromTitle(title: string, fallbackCents: number) {
  const match = String(title).match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
  if (!match) return fallbackCents;
  const n = Number(match[1].replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return fallbackCents;
  return Math.round(n * 100);
}

function isWithin(
  row: { validFrom: Date | null; validTo: Date | null },
  now: Date,
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
  now: Date,
) {
  const candidates = rows.filter((row) => row.kind === kind && row.active);
  const within = candidates.filter((row) => isWithin(row, now));
  const list = within.length ? within : candidates;
  if (!list.length) return null;

  return [...list].sort((a, b) => {
    const aTime = a.validFrom ? new Date(a.validFrom).getTime() : 0;
    const bTime = b.validFrom ? new Date(b.validFrom).getTime() : 0;
    if (aTime !== bTime) return bTime - aTime;
    return b.id - a.id;
  })[0];
}

async function getMenuConfig(): Promise<MenuConfig> {
  const [row] = await db
    .select({ id: AppSetting.id, value: AppSetting.value })
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

async function saveMenuConfig(nextConfig: MenuConfig) {
  const [row] = await db
    .select({ id: AppSetting.id })
    .from(AppSetting)
    .where(eq(AppSetting.key, "menuConfigV2"))
    .limit(1);

  if (row) {
    await db
      .update(AppSetting)
      .set({
        value: nextConfig,
        updatedAt: new Date(),
      })
      .where(eq(AppSetting.id, row.id));
    return;
  }

  const existing = await db.select({ id: AppSetting.id }).from(AppSetting);
  const nextId = existing.reduce((max, item) => Math.max(max, item.id), 0) + 1;

  await db.insert(AppSetting).values({
    id: nextId,
    key: "menuConfigV2",
    value: nextConfig,
    updatedAt: new Date(),
  });
}

async function buildUniqueDishSlug(name: string, excludeDishId?: number) {
  const base = slugify(name);
  if (!base) return null;

  const rows = await db
    .select({ id: MenuDish.id, slug: MenuDish.slug })
    .from(MenuDish);

  const used = new Set(
    rows.filter((row) => row.id !== excludeDishId).map((row) => row.slug),
  );

  if (!used.has(base)) return base;

  let i = 2;
  while (used.has(`${base}-${i}`)) i += 1;
  return `${base}-${i}`;
}

async function nextMenuDishId() {
  const rows = await db.select({ id: MenuDish.id }).from(MenuDish);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

async function nextAssignmentId() {
  const rows = await db
    .select({ id: MenuDishAssignment.id })
    .from(MenuDishAssignment);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "save-config") {
    const diarioPriceCents = parseEuroToCents(form.get("DIARIO_priceEur"));
    const festivoPriceCents = parseEuroToCents(form.get("FESTIVO_priceEur"));

    if (diarioPriceCents === null || festivoPriceCents === null) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-price" }));
    }

    await saveMenuConfig({
      DIARIO: {
        active: form.get("DIARIO_active") === "on",
        priceCents: diarioPriceCents,
      },
      FESTIVO: {
        active: form.get("FESTIVO_active") === "on",
        priceCents: festivoPriceCents,
      },
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "config" }));
  }

  if (intent === "create-dish") {
    const name = String(form.get("name") ?? "").trim();

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    const slug = await buildUniqueDishSlug(name);
    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    const nextId = await nextMenuDishId();

    await db.insert(MenuDish).values({
      id: nextId,
      name,
      slug,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "dish" }));
  }

  if (intent === "update-dish") {
    const dishId = parseId(form.get("dishId"));
    if (!dishId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-dish" }));
    }

    const [dish] = await db
      .select({
        id: MenuDish.id,
        name: MenuDish.name,
        slug: MenuDish.slug,
      })
      .from(MenuDish)
      .where(eq(MenuDish.id, dishId))
      .limit(1);

    if (!dish) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "dish-not-found" }));
    }

    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    const slug =
      name === dish.name ? dish.slug : await buildUniqueDishSlug(name, dishId);

    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    await db
      .update(MenuDish)
      .set({
        name,
        slug,
        updatedAt: new Date(),
      })
      .where(eq(MenuDish.id, dishId));

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "dish" }));
  }

  if (intent === "delete-dish") {
    const dishId = parseId(form.get("dishId"));
    if (!dishId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-dish" }));
    }

    const linked = await db
      .select({ id: MenuDishAssignment.id })
      .from(MenuDishAssignment)
      .where(eq(MenuDishAssignment.dishId, dishId));

    if (linked.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "dish-in-use" }));
    }

    await db.delete(MenuDish).where(eq(MenuDish.id, dishId));
    return context.redirect(withQuery(REDIRECT_PATH, { saved: "dish" }));
  }

  if (intent === "assign-dish") {
    const dishId = parseId(form.get("dishId"));
    const kind = String(form.get("kind") ?? "").trim();
    const course = String(form.get("course") ?? "").trim();

    if (!dishId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-dish" }));
    }

    if (!isKind(kind)) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-kind" }));
    }

    if (!isCourse(course)) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-course" }));
    }

    const [dish] = await db
      .select({ id: MenuDish.id })
      .from(MenuDish)
      .where(eq(MenuDish.id, dishId))
      .limit(1);

    if (!dish) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "dish-not-found" }));
    }

    const existingAssignments = await db
      .select({
        id: MenuDishAssignment.id,
        kind: MenuDishAssignment.kind,
        course: MenuDishAssignment.course,
        dishId: MenuDishAssignment.dishId,
      })
      .from(MenuDishAssignment)
      .where(eq(MenuDishAssignment.dishId, dishId));

    const existingForKind = existingAssignments.find((row) => row.kind === kind);

    if (existingForKind) {
      if (existingForKind.course !== course) {
        await db
          .update(MenuDishAssignment)
          .set({ course })
          .where(eq(MenuDishAssignment.id, existingForKind.id));
      }

      return context.redirect(withQuery(REDIRECT_PATH, { saved: "assignment" }));
    }

    const nextId = await nextAssignmentId();

    await db.insert(MenuDishAssignment).values({
      id: nextId,
      kind,
      course,
      dishId,
      createdAt: new Date(),
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "assignment" }));
  }

  if (intent === "move-assignment") {
    const assignmentId = parseId(form.get("assignmentId"));
    const kind = String(form.get("kind") ?? "").trim();
    const course = String(form.get("course") ?? "").trim();

    if (!assignmentId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-assignment" }));
    }

    if (!isKind(kind)) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-kind" }));
    }

    if (!isCourse(course)) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-course" }));
    }

    const [assignment] = await db
      .select({
        id: MenuDishAssignment.id,
        kind: MenuDishAssignment.kind,
        dishId: MenuDishAssignment.dishId,
      })
      .from(MenuDishAssignment)
      .where(eq(MenuDishAssignment.id, assignmentId))
      .limit(1);

    if (!assignment) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "assignment-not-found" }));
    }

    const duplicates = await db
      .select({
        id: MenuDishAssignment.id,
        kind: MenuDishAssignment.kind,
        dishId: MenuDishAssignment.dishId,
      })
      .from(MenuDishAssignment)
      .where(eq(MenuDishAssignment.dishId, assignment.dishId));

    const duplicateInTargetKind = duplicates.find(
      (row) => row.kind === kind && row.id !== assignmentId,
    );

    if (duplicateInTargetKind) {
      await db.delete(MenuDishAssignment).where(eq(MenuDishAssignment.id, assignmentId));
      return context.redirect(withQuery(REDIRECT_PATH, { saved: "assignment" }));
    }

    await db
      .update(MenuDishAssignment)
      .set({
        kind,
        course,
      })
      .where(eq(MenuDishAssignment.id, assignmentId));

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "assignment" }));
  }

  if (intent === "unassign-dish") {
    const assignmentId = parseId(form.get("assignmentId"));
    if (!assignmentId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-assignment" }));
    }

    await db.delete(MenuDishAssignment).where(eq(MenuDishAssignment.id, assignmentId));
    return context.redirect(withQuery(REDIRECT_PATH, { saved: "assignment" }));
  }

  if (intent === "import-legacy") {
    const currentDishes = await db.select({ id: MenuDish.id }).from(MenuDish);
    const currentAssignments = await db
      .select({ id: MenuDishAssignment.id })
      .from(MenuDishAssignment);

    if (currentDishes.length > 0 || currentAssignments.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "already-v2-data" }));
    }

    const legacyMenus = await db
      .select({
        id: LegacyMenu.id,
        title: LegacyMenu.title,
        kind: LegacyMenu.kind,
        active: LegacyMenu.active,
        validFrom: LegacyMenu.validFrom,
        validTo: LegacyMenu.validTo,
      })
      .from(LegacyMenu);

    const menus = legacyMenus as Array<{
      id: number;
      title: string;
      kind: MenuKind;
      active: boolean;
      validFrom: Date | null;
      validTo: Date | null;
    }>;

    const now = new Date();
    const diario = pickBestLegacy("DIARIO", menus, now);
    const festivo = pickBestLegacy("FESTIVO", menus, now);

    const selectedMenus = [diario, festivo].filter(Boolean) as Array<{
      id: number;
      title: string;
      kind: MenuKind;
      active: boolean;
      validFrom: Date | null;
      validTo: Date | null;
    }>;

    if (selectedMenus.length === 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "import-failed" }));
    }

    const selectedMenuIds = selectedMenus.map((menu) => menu.id);

    const legacyItems = await db
      .select({
        id: LegacyMenuItem.id,
        menuId: LegacyMenuItem.menuId,
        productId: LegacyMenuItem.productId,
        course: LegacyMenuItem.course,
        sortOrder: LegacyMenuItem.sortOrder,
      })
      .from(LegacyMenuItem)
      .where(inArray(LegacyMenuItem.menuId, selectedMenuIds));

    const productIds = [...new Set(legacyItems.map((item) => item.productId))];

    const products = productIds.length
      ? await db
        .select({
          id: Product.id,
          name: Product.name,
        })
        .from(Product)
        .where(inArray(Product.id, productIds))
      : [];

    const productById = new Map(products.map((product) => [product.id, product]));
    const menuById = new Map(selectedMenus.map((menu) => [menu.id, menu]));

    const nextConfig: MenuConfig = {
      DIARIO: diario
        ? {
          active: diario.active,
          priceCents: extractPriceFromTitle(
            diario.title,
            DEFAULT_MENU_CONFIG.DIARIO.priceCents,
          ),
        }
        : DEFAULT_MENU_CONFIG.DIARIO,
      FESTIVO: festivo
        ? {
          active: festivo.active,
          priceCents: extractPriceFromTitle(
            festivo.title,
            DEFAULT_MENU_CONFIG.FESTIVO.priceCents,
          ),
        }
        : DEFAULT_MENU_CONFIG.FESTIVO,
    };

    let nextDishId = 1;
    let nextAssignmentId = 1;

    const dishesToInsert: Array<{
      id: number;
      name: string;
      slug: string;
      createdAt: Date;
      updatedAt: Date;
    }> = [];

    const assignmentsToInsert: Array<{
      id: number;
      kind: MenuKind;
      course: MenuCourse;
      dishId: number;
      createdAt: Date;
    }> = [];

    const productIdToDishId = new Map<number, number>();
    const usedSlugs = new Set<string>();
    const assignedDishByKind = new Set<string>();

    function uniqueSlug(name: string) {
      const base = slugify(name) || "menu-dish";
      if (!usedSlugs.has(base)) {
        usedSlugs.add(base);
        return base;
      }

      let i = 2;
      while (usedSlugs.has(`${base}-${i}`)) i += 1;
      const slug = `${base}-${i}`;
      usedSlugs.add(slug);
      return slug;
    }

    const sortedItems = [...legacyItems].sort((a, b) => {
      if (a.menuId !== b.menuId) return a.menuId - b.menuId;
      if (a.course !== b.course) return a.course.localeCompare(b.course, "es");
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    });

    for (const item of sortedItems) {
      const menu = menuById.get(item.menuId);
      const product = productById.get(item.productId);

      if (!menu || !product) continue;
      if (!isCourse(item.course)) continue;

      let dishId = productIdToDishId.get(product.id) ?? null;
      if (!dishId) {
        dishId = nextDishId++;
        productIdToDishId.set(product.id, dishId);

        dishesToInsert.push({
          id: dishId,
          name: product.name,
          slug: uniqueSlug(product.name),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      const kindDishKey = `${menu.kind}:${dishId}`;
      if (assignedDishByKind.has(kindDishKey)) {
        continue;
      }

      assignedDishByKind.add(kindDishKey);

      assignmentsToInsert.push({
        id: nextAssignmentId++,
        kind: menu.kind,
        course: item.course,
        dishId,
        createdAt: new Date(),
      });
    }

    if (!dishesToInsert.length || !assignmentsToInsert.length) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "import-failed" }));
    }

    await saveMenuConfig(nextConfig);
    await db.insert(MenuDish).values(dishesToInsert);
    await db.insert(MenuDishAssignment).values(assignmentsToInsert);

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "import" }));
  }

  return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-intent" }));
};