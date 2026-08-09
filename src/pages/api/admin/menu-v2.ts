import type { APIRoute } from "astro";
import { db, AppSetting, MenuDish, MenuDishAssignment, eq } from "astro:db";

type MenuKind = "DIARIO" | "FESTIVO";
type MenuCourse = "PRIMERO" | "SEGUNDO" | "POSTRE";

type MenuConfig = Record<
  MenuKind,
  {
    active: boolean;
    priceCents: number;
    serviceFrom: string | null;
    serviceTo: string | null;
    note: string | null;
  }
>;

const DEFAULT_REDIRECT_PATH = "/admin/menu/diario";

function resolveRedirectBase(value: FormDataEntryValue | null): string {
  const raw = String(value ?? "").trim();
  return raw.startsWith("/admin/menu") ? raw : DEFAULT_REDIRECT_PATH;
}

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
  const redirectBase = resolveRedirectBase(form.get("redirectTo"));

  if (intent === "save-config") {
    const diarioPriceCents = parseEuroToCents(form.get("DIARIO_priceEur"));
    const festivoPriceCents = parseEuroToCents(form.get("FESTIVO_priceEur"));

    if (diarioPriceCents === null || festivoPriceCents === null) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-price" }));
    }

    // Horario y nota se guardan aquí en vez de estar escritos en el
    // componente público, que es donde vivían: el horario del menú no se podía
    // cambiar sin tocar código.
    const readTime = (value: FormDataEntryValue | null) => {
      const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
      if (!match) return null;
      const hour = Number(match[1]);
      if (hour > 23 || Number(match[2]) > 59) return null;
      return `${String(hour).padStart(2, "0")}:${match[2]}`;
    };
    const readNote = (value: FormDataEntryValue | null) => String(value ?? "").trim() || null;

    await saveMenuConfig({
      DIARIO: {
        active: form.get("DIARIO_active") === "on",
        priceCents: diarioPriceCents,
        serviceFrom: readTime(form.get("DIARIO_serviceFrom")),
        serviceTo: readTime(form.get("DIARIO_serviceTo")),
        note: readNote(form.get("DIARIO_note")),
      },
      FESTIVO: {
        active: form.get("FESTIVO_active") === "on",
        priceCents: festivoPriceCents,
        serviceFrom: readTime(form.get("FESTIVO_serviceFrom")),
        serviceTo: readTime(form.get("FESTIVO_serviceTo")),
        note: readNote(form.get("FESTIVO_note")),
      },
    });

    return context.redirect(withQuery(redirectBase, { saved: "config" }));
  }

  if (intent === "create-dish") {
    const name = String(form.get("name") ?? "").trim();

    if (!name) {
      return context.redirect(withQuery(redirectBase, { error: "missing-name" }));
    }

    const slug = await buildUniqueDishSlug(name);
    if (!slug) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-slug" }));
    }

    const nextId = await nextMenuDishId();

    await db.insert(MenuDish).values({
      id: nextId,
      name,
      slug,
      description: String(form.get("description") ?? "").trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return context.redirect(withQuery(redirectBase, { saved: "dish" }));
  }

  if (intent === "update-dish") {
    const dishId = parseId(form.get("dishId"));
    if (!dishId) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-dish" }));
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
      return context.redirect(withQuery(redirectBase, { error: "dish-not-found" }));
    }

    const name = String(form.get("name") ?? "").trim();
    if (!name) {
      return context.redirect(withQuery(redirectBase, { error: "missing-name" }));
    }

    const slug =
      name === dish.name ? dish.slug : await buildUniqueDishSlug(name, dishId);

    if (!slug) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-slug" }));
    }

    await db
      .update(MenuDish)
      .set({
        name,
        slug,
        description: String(form.get("description") ?? "").trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(MenuDish.id, dishId));

    return context.redirect(withQuery(redirectBase, { saved: "dish" }));
  }

  if (intent === "delete-dish") {
    const dishId = parseId(form.get("dishId"));
    if (!dishId) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-dish" }));
    }

    const linked = await db
      .select({ id: MenuDishAssignment.id })
      .from(MenuDishAssignment)
      .where(eq(MenuDishAssignment.dishId, dishId));

    if (linked.length > 0) {
      return context.redirect(withQuery(redirectBase, { error: "dish-in-use" }));
    }

    await db.delete(MenuDish).where(eq(MenuDish.id, dishId));
    return context.redirect(withQuery(redirectBase, { saved: "dish" }));
  }

  if (intent === "assign-dish") {
    const dishId = parseId(form.get("dishId"));
    const kind = String(form.get("kind") ?? "").trim();
    const course = String(form.get("course") ?? "").trim();

    if (!dishId) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-dish" }));
    }

    if (!isKind(kind)) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-kind" }));
    }

    if (!isCourse(course)) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-course" }));
    }

    const [dish] = await db
      .select({ id: MenuDish.id })
      .from(MenuDish)
      .where(eq(MenuDish.id, dishId))
      .limit(1);

    if (!dish) {
      return context.redirect(withQuery(redirectBase, { error: "dish-not-found" }));
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

      return context.redirect(withQuery(redirectBase, { saved: "assignment" }));
    }

    const nextId = await nextAssignmentId();

    // Al final de su plato, para que añadir no reordene lo que ya estaba.
    const siblings = await db
      .select({ sortOrder: MenuDishAssignment.sortOrder, kind: MenuDishAssignment.kind, course: MenuDishAssignment.course })
      .from(MenuDishAssignment);
    const nextSort =
      siblings
        .filter((row) => row.kind === kind && row.course === course)
        .reduce((max, row) => Math.max(max, Number(row.sortOrder ?? 0)), -1) + 1;

    await db.insert(MenuDishAssignment).values({
      id: nextId,
      kind,
      course,
      dishId,
      sortOrder: nextSort,
      createdAt: new Date(),
    });

    return context.redirect(withQuery(redirectBase, { saved: "assignment" }));
  }

  if (intent === "reorder-assignment") {
    const assignmentId = parseId(form.get("assignmentId"));
    const direction = String(form.get("direction") ?? "").trim();

    if (!assignmentId) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-assignment" }));
    }
    if (direction !== "up" && direction !== "down") {
      return context.redirect(withQuery(redirectBase, { error: "invalid-direction" }));
    }

    const rows = (await db
      .select({
        id: MenuDishAssignment.id,
        kind: MenuDishAssignment.kind,
        course: MenuDishAssignment.course,
        sortOrder: MenuDishAssignment.sortOrder,
      })
      .from(MenuDishAssignment)) as Array<{ id: number; kind: string; course: string; sortOrder: number | null }>;

    const current = rows.find((row) => row.id === assignmentId);
    if (!current) {
      return context.redirect(withQuery(redirectBase, { error: "assignment-not-found" }));
    }

    // Se reasigna 0..n-1 sobre el grupo antes de intercambiar: los datos
    // migrados pueden traer posiciones repetidas o con huecos, y sin
    // normalizar primero el intercambio no se notaría.
    const group = rows
      .filter((row) => row.kind === current.kind && row.course === current.course)
      .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0) || a.id - b.id);

    const index = group.findIndex((row) => row.id === assignmentId);
    const target = direction === "up" ? index - 1 : index + 1;

    if (index < 0 || target < 0 || target >= group.length) {
      return context.redirect(withQuery(redirectBase, { saved: "assignment" }));
    }

    const reordered = [...group];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    for (let position = 0; position < reordered.length; position += 1) {
      if (Number(reordered[position].sortOrder ?? 0) === position) continue;
      await db
        .update(MenuDishAssignment)
        .set({ sortOrder: position })
        .where(eq(MenuDishAssignment.id, reordered[position].id));
    }

    return context.redirect(withQuery(redirectBase, { saved: "assignment" }));
  }

  if (intent === "move-assignment") {
    const assignmentId = parseId(form.get("assignmentId"));
    const kind = String(form.get("kind") ?? "").trim();
    const course = String(form.get("course") ?? "").trim();

    if (!assignmentId) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-assignment" }));
    }

    if (!isKind(kind)) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-kind" }));
    }

    if (!isCourse(course)) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-course" }));
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
      return context.redirect(withQuery(redirectBase, { error: "assignment-not-found" }));
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
      return context.redirect(withQuery(redirectBase, { saved: "assignment" }));
    }

    await db
      .update(MenuDishAssignment)
      .set({
        kind,
        course,
      })
      .where(eq(MenuDishAssignment.id, assignmentId));

    return context.redirect(withQuery(redirectBase, { saved: "assignment" }));
  }

  if (intent === "unassign-dish") {
    const assignmentId = parseId(form.get("assignmentId"));
    if (!assignmentId) {
      return context.redirect(withQuery(redirectBase, { error: "invalid-assignment" }));
    }

    await db.delete(MenuDishAssignment).where(eq(MenuDishAssignment.id, assignmentId));
    return context.redirect(withQuery(redirectBase, { saved: "assignment" }));
  }

  return context.redirect(withQuery(redirectBase, { error: "invalid-intent" }));
};