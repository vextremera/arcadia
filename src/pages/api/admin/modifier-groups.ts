import type { APIRoute } from "astro";
import {
  db,
  ModifierGroup,
  ModifierOption,
  ProductModifierGroup,
  eq,
} from "astro:db";

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseNonNegativeInt(value: FormDataEntryValue | null, fallback = 0) {
  const raw = safeText(value);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

const REDIRECT_PATH = "/admin/catalogo/modificadores";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));

  if (intent === "create") {
    const name = safeText(form.get("name"));
    const minSelect = parseNonNegativeInt(form.get("minSelect"), 0);
    const maxSelect = parseNonNegativeInt(form.get("maxSelect"), 1);
    const sortOrder = parseNonNegativeInt(form.get("sortOrder"), 0);
    const required = form.get("required") === "on";
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (
      minSelect === null ||
      maxSelect === null ||
      sortOrder === null ||
      maxSelect < 1 ||
      minSelect > maxSelect
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-range" }));
    }

    const existing = await db.select({ id: ModifierGroup.id }).from(ModifierGroup);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(ModifierGroup).values({
      id: nextId,
      name,
      minSelect,
      maxSelect,
      required,
      sortOrder,
      active,
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  const groupId = parseId(form.get("groupId"));
  if (!groupId) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-group" }));
  }

  const [group] = await db
    .select({ id: ModifierGroup.id })
    .from(ModifierGroup)
    .where(eq(ModifierGroup.id, groupId))
    .limit(1);

  if (!group) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "not-found" }));
  }

  if (intent === "update") {
    const name = safeText(form.get("name"));
    const minSelect = parseNonNegativeInt(form.get("minSelect"), 0);
    const maxSelect = parseNonNegativeInt(form.get("maxSelect"), 1);
    const sortOrder = parseNonNegativeInt(form.get("sortOrder"), 0);
    const required = form.get("required") === "on";
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (
      minSelect === null ||
      maxSelect === null ||
      sortOrder === null ||
      maxSelect < 1 ||
      minSelect > maxSelect
    ) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-range" }));
    }

    await db
      .update(ModifierGroup)
      .set({
        name,
        minSelect,
        maxSelect,
        required,
        sortOrder,
        active,
      })
      .where(eq(ModifierGroup.id, groupId));

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  if (intent === "delete") {
    const productLinks = await db
      .select({ id: ProductModifierGroup.id })
      .from(ProductModifierGroup)
      .where(eq(ProductModifierGroup.groupId, groupId));

    if (productLinks.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "in-use-products" }));
    }

    const options = await db
      .select({ id: ModifierOption.id })
      .from(ModifierOption)
      .where(eq(ModifierOption.groupId, groupId));

    if (options.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "in-use-options" }));
    }

    await db.delete(ModifierGroup).where(eq(ModifierGroup.id, groupId));
    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-intent" }));
};