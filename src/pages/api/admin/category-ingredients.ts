import type { APIRoute } from "astro";
import {
  db,
  Category,
  Ingredient,
  CategoryIngredient,
  eq,
  and,
} from "astro:db";

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function safeRedirectTo(value: FormDataEntryValue | null, fallback: string) {
  const raw = safeText(value);
  if (!raw) return fallback;
  if (!raw.startsWith("/admin/")) return fallback;
  return raw;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

const REDIRECT_PATH = "/admin/catalogo/compatibilidades";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  const redirectTo = safeRedirectTo(form.get("redirectTo"), REDIRECT_PATH);

  if (intent === "create") {
    const categoryId = parseId(form.get("categoryId"));
    const ingredientId = parseId(form.get("ingredientId"));

    if (!categoryId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-category" }));
    }

    if (!ingredientId) {
      return context.redirect(withQuery(redirectTo, { error: "invalid-ingredient" }));
    }

    const [category] = await db
      .select({ id: Category.id })
      .from(Category)
      .where(eq(Category.id, categoryId))
      .limit(1);

    if (!category) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-category" }));
    }

    const [ingredient] = await db
      .select({ id: Ingredient.id })
      .from(Ingredient)
      .where(eq(Ingredient.id, ingredientId))
      .limit(1);

    if (!ingredient) {
      return context.redirect(withQuery(redirectTo, { error: "invalid-ingredient" }));
    }

    const [duplicate] = await db
      .select({ id: CategoryIngredient.id })
      .from(CategoryIngredient)
      .where(
        and(
          eq(CategoryIngredient.categoryId, categoryId),
          eq(CategoryIngredient.ingredientId, ingredientId)
        )
      )
      .limit(1);

    if (duplicate) {
      return context.redirect(withQuery(redirectTo, { error: "duplicate-link" }));
    }

    const existing = await db.select({ id: CategoryIngredient.id }).from(CategoryIngredient);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(CategoryIngredient).values({
      id: nextId,
      categoryId,
      ingredientId,
    });

    return context.redirect(withQuery(redirectTo, { saved: "1" }));
  }

  const categoryIngredientId = parseId(form.get("categoryIngredientId"));
  if (!categoryIngredientId) {
    return context.redirect(withQuery(redirectTo, { error: "invalid-link" }));
  }

  const [link] = await db
    .select({ id: CategoryIngredient.id })
    .from(CategoryIngredient)
    .where(eq(CategoryIngredient.id, categoryIngredientId))
    .limit(1);

  if (!link) {
    return context.redirect(withQuery(redirectTo, { error: "not-found" }));
  }

  if (intent === "delete") {
    await db.delete(CategoryIngredient).where(eq(CategoryIngredient.id, categoryIngredientId));
    return context.redirect(withQuery(redirectTo, { saved: "1" }));
  }

  return context.redirect(withQuery(redirectTo, { error: "invalid-intent" }));
};