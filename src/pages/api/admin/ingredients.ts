import type { APIRoute } from "astro";
import { db, Ingredient, ProductIngredient, CategoryIngredient, eq } from "astro:db";

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseIntValue(value: FormDataEntryValue | null, fallback = 0) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseEurToCents(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return 0;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
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

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

const REDIRECT_PATH = "/admin/catalogo/ingredientes";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "create") {
    const name = String(form.get("name") ?? "").trim();
    const slugInput = String(form.get("slug") ?? "").trim();
    const slug = slugify(slugInput || name);
    const addPriceDeltaCents = parseEurToCents(form.get("addPriceDeltaEur"));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const isCommon = form.get("isCommon") === "on";
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    if (addPriceDeltaCents === null) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-price" }));
    }

    const [slugMatch] = await db
      .select({ id: Ingredient.id })
      .from(Ingredient)
      .where(eq(Ingredient.slug, slug))
      .limit(1);

    if (slugMatch) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-slug" }));
    }

    const existing = await db.select({ id: Ingredient.id }).from(Ingredient);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(Ingredient).values({
      id: nextId,
      name,
      slug,
      addPriceDeltaCents,
      isCommon,
      active,
      sortOrder,
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  const ingredientId = parseId(form.get("ingredientId"));
  if (!ingredientId) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-ingredient" }));
  }

  const [existingIngredient] = await db
    .select({
      id: Ingredient.id,
      slug: Ingredient.slug,
    })
    .from(Ingredient)
    .where(eq(Ingredient.id, ingredientId))
    .limit(1);

  if (!existingIngredient) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "not-found" }));
  }

  if (intent === "update") {
    const name = String(form.get("name") ?? "").trim();
    const slugInput = String(form.get("slug") ?? "").trim();
    const slug = slugify(slugInput || name);
    const addPriceDeltaCents = parseEurToCents(form.get("addPriceDeltaEur"));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const isCommon = form.get("isCommon") === "on";
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    if (addPriceDeltaCents === null) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-price" }));
    }

    const [slugMatch] = await db
      .select({ id: Ingredient.id })
      .from(Ingredient)
      .where(eq(Ingredient.slug, slug))
      .limit(1);

    if (slugMatch && slugMatch.id !== ingredientId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-slug" }));
    }

    await db
      .update(Ingredient)
      .set({
        name,
        slug,
        addPriceDeltaCents,
        isCommon,
        active,
        sortOrder,
      })
      .where(eq(Ingredient.id, ingredientId));

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  if (intent === "delete") {
    const productLinks = await db
      .select({ id: ProductIngredient.id })
      .from(ProductIngredient)
      .where(eq(ProductIngredient.ingredientId, ingredientId));

    if (productLinks.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "in-use-products" }));
    }

    const categoryLinks = await db
      .select({ id: CategoryIngredient.id })
      .from(CategoryIngredient)
      .where(eq(CategoryIngredient.ingredientId, ingredientId));

    if (categoryLinks.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "in-use-categories" }));
    }

    await db.delete(Ingredient).where(eq(Ingredient.id, ingredientId));
    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-intent" }));
};