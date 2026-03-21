import type { APIRoute } from "astro";
import {
  and,
  db,
  eq,
  Menu as MenuTable,
  MenuItem as MenuItemTable,
  Product,
} from "astro:db";

type MenuCourse = "PRIMERO" | "SEGUNDO" | "POSTRE";

function parsePathId(value: string | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseFormId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseIntValue(value: FormDataEntryValue | null, fallback = 0) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const menuId = parsePathId(context.params.id);
  if (!menuId) {
    return context.redirect(withQuery("/admin/menu", { menuError: "invalid-menu" }));
  }

  const [menu] = await db
    .select({ id: MenuTable.id })
    .from(MenuTable)
    .where(eq(MenuTable.id, menuId))
    .limit(1);

  if (!menu) {
    return context.redirect(withQuery("/admin/menu", { menuError: "not-found" }));
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "create") {
    const productId = parseFormId(form.get("productId"));
    const rawCourse = String(form.get("course") ?? "").trim();

    if (!productId) {
      return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-product" }));
    }

    if (rawCourse !== "PRIMERO" && rawCourse !== "SEGUNDO" && rawCourse !== "POSTRE") {
      return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-course" }));
    }

    const course: MenuCourse = rawCourse;

    const [product] = await db
      .select({ id: Product.id })
      .from(Product)
      .where(eq(Product.id, productId))
      .limit(1);

    if (!product) {
      return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-product" }));
    }

    const existing = await db.select({ id: MenuItemTable.id }).from(MenuItemTable);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(MenuItemTable).values({
      id: nextId,
      menuId,
      productId,
      course,
      printOrder: parseIntValue(form.get("printOrder"), 1),
      sortOrder: parseIntValue(form.get("sortOrder"), 0),
    });

    return context.redirect(withQuery("/admin/menu", { menuItemSaved: "1" }));
  }

  const menuItemId = parseFormId(form.get("menuItemId"));
  if (!menuItemId) {
    return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-item" }));
  }

  const [menuItem] = await db
    .select({ id: MenuItemTable.id })
    .from(MenuItemTable)
    .where(and(eq(MenuItemTable.id, menuItemId), eq(MenuItemTable.menuId, menuId)))
    .limit(1);

  if (!menuItem) {
    return context.redirect(withQuery("/admin/menu", { menuItemError: "not-found" }));
  }

  if (intent === "update") {
    const productId = parseFormId(form.get("productId"));
    const rawCourse = String(form.get("course") ?? "").trim();

    if (!productId) {
      return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-product" }));
    }

    if (rawCourse !== "PRIMERO" && rawCourse !== "SEGUNDO" && rawCourse !== "POSTRE") {
      return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-course" }));
    }

    const course: MenuCourse = rawCourse;

    const [product] = await db
      .select({ id: Product.id })
      .from(Product)
      .where(eq(Product.id, productId))
      .limit(1);

    if (!product) {
      return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-product" }));
    }

    await db
      .update(MenuItemTable)
      .set({
        productId,
        course,
        printOrder: parseIntValue(form.get("printOrder"), 1),
        sortOrder: parseIntValue(form.get("sortOrder"), 0),
      })
      .where(eq(MenuItemTable.id, menuItemId));

    return context.redirect(withQuery("/admin/menu", { menuItemSaved: "1" }));
  }

  if (intent === "delete") {
    await db.delete(MenuItemTable).where(eq(MenuItemTable.id, menuItemId));
    return context.redirect(withQuery("/admin/menu", { menuItemSaved: "1" }));
  }

  return context.redirect(withQuery("/admin/menu", { menuItemError: "invalid-intent" }));
};