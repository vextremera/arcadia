import type { APIRoute } from "astro";
import { db, eq, Menu as MenuTable, MenuItem as MenuItemTable } from "astro:db";

type MenuKind = "DIARIO" | "FESTIVO";

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseDateValue(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
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

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "create") {
    const title = String(form.get("title") ?? "").trim();
    const rawKind = String(form.get("kind") ?? "").trim();

    if (!title) {
      return context.redirect(withQuery("/admin/menu", { menuError: "missing-title" }));
    }

    if (rawKind !== "DIARIO" && rawKind !== "FESTIVO") {
      return context.redirect(withQuery("/admin/menu", { menuError: "invalid-kind" }));
    }

    const kind: MenuKind = rawKind;
    const existing = await db.select({ id: MenuTable.id }).from(MenuTable);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(MenuTable).values({
      id: nextId,
      title,
      kind,
      active: form.get("active") === "on",
      validFrom: parseDateValue(form.get("validFrom")),
      validTo: parseDateValue(form.get("validTo")),
    });

    return context.redirect(withQuery("/admin/menu", { menuSaved: "1" }));
  }

  const menuId = parseId(form.get("menuId"));
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

  if (intent === "update") {
    const title = String(form.get("title") ?? "").trim();
    if (!title) {
      return context.redirect(withQuery("/admin/menu", { menuError: "missing-title" }));
    }

    await db
      .update(MenuTable)
      .set({
        title,
        active: form.get("active") === "on",
        validFrom: parseDateValue(form.get("validFrom")),
        validTo: parseDateValue(form.get("validTo")),
      })
      .where(eq(MenuTable.id, menuId));

    return context.redirect(withQuery("/admin/menu", { menuSaved: "1" }));
  }

  if (intent === "delete") {
    const linkedItems = await db
      .select({ id: MenuItemTable.id })
      .from(MenuItemTable)
      .where(eq(MenuItemTable.menuId, menuId));

    for (const item of linkedItems) {
      await db.delete(MenuItemTable).where(eq(MenuItemTable.id, item.id));
    }

    await db.delete(MenuTable).where(eq(MenuTable.id, menuId));
    return context.redirect(withQuery("/admin/menu", { menuSaved: "1" }));
  }

  return context.redirect(withQuery("/admin/menu", { menuError: "invalid-intent" }));
};