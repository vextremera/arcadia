import type { APIRoute } from "astro";
import { and, db, eq, Ingredient, Product, ProductIngredient } from "astro:db";

function parseId(value: string | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIntValue(value: FormDataEntryValue | null, fallback = 0) {
  const raw = String(value ?? "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function redirectToProduct(productId: number, params: Record<string, string> = {}) {
  return `${withQuery(`/admin/catalogo/productos/${productId}`, params)}#ingredientes`;
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const productId = parseId(context.params.id);
  if (!productId) {
    return context.redirect("/admin/catalogo/productos?error=invalid-id");
  }

  const [product] = await db
    .select({ id: Product.id })
    .from(Product)
    .where(eq(Product.id, productId))
    .limit(1);

  if (!product) {
    return context.redirect("/admin/catalogo/productos?error=not-found");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "create") {
    const ingredientId = parseId(String(form.get("ingredientId") ?? ""));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const defaultIncluded = form.get("defaultIncluded") === "on";
    const removable = form.get("removable") === "on";

    if (!ingredientId) {
      return context.redirect(redirectToProduct(productId, { ingredientError: "invalid-ingredient" }));
    }

    const [ingredient] = await db
      .select({
        id: Ingredient.id,
        active: Ingredient.active,
      })
      .from(Ingredient)
      .where(eq(Ingredient.id, ingredientId))
      .limit(1);

    if (!ingredient || !ingredient.active) {
      return context.redirect(redirectToProduct(productId, { ingredientError: "invalid-ingredient" }));
    }

    const [existingLink] = await db
      .select({ id: ProductIngredient.id })
      .from(ProductIngredient)
      .where(
        and(
          eq(ProductIngredient.productId, productId),
          eq(ProductIngredient.ingredientId, ingredientId)
        )
      )
      .limit(1);

    if (existingLink) {
      return context.redirect(redirectToProduct(productId, { ingredientError: "duplicate-link" }));
    }

    const existing = await db.select({ id: ProductIngredient.id }).from(ProductIngredient);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(ProductIngredient).values({
      id: nextId,
      productId,
      ingredientId,
      defaultIncluded,
      removable,
      sortOrder,
    });

    return context.redirect(redirectToProduct(productId, { ingredientSaved: "1" }));
  }

  const productIngredientId = parseId(String(form.get("productIngredientId") ?? ""));
  if (!productIngredientId) {
    return context.redirect(redirectToProduct(productId, { ingredientError: "invalid-link" }));
  }

  const [link] = await db
    .select({
      id: ProductIngredient.id,
      productId: ProductIngredient.productId,
    })
    .from(ProductIngredient)
    .where(
      and(
        eq(ProductIngredient.id, productIngredientId),
        eq(ProductIngredient.productId, productId)
      )
    )
    .limit(1);

  if (!link) {
    return context.redirect(redirectToProduct(productId, { ingredientError: "not-found" }));
  }

  if (intent === "delete") {
    await db.delete(ProductIngredient).where(eq(ProductIngredient.id, productIngredientId));
    return context.redirect(redirectToProduct(productId, { ingredientSaved: "1" }));
  }

  if (intent === "update") {
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const defaultIncluded = form.get("defaultIncluded") === "on";
    const removable = form.get("removable") === "on";

    await db
      .update(ProductIngredient)
      .set({
        defaultIncluded,
        removable,
        sortOrder,
      })
      .where(eq(ProductIngredient.id, productIngredientId));

    return context.redirect(redirectToProduct(productId, { ingredientSaved: "1" }));
  }

  return context.redirect(redirectToProduct(productId, { ingredientError: "invalid-intent" }));
};