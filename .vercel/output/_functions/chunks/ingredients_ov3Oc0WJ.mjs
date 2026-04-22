import { d as db, e as Product, I as Ingredient, c as CategoryIngredient, f as ProductIngredient } from './_astro_db_Bcz5lWRF.mjs';
import { eq, and } from '@astrojs/db/dist/runtime/virtual.js';

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function parseIntValue(value, fallback = 0) {
  const raw = String(value ?? "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
function redirectToProduct(productId, params = {}) {
  return `${withQuery(`/admin/catalogo/productos/${productId}`, params)}#ingredientes`;
}
const POST = async (context) => {
  const user = context.locals.user;
  if (!user || user.role !== "ADMIN" && user.role !== "STAFF") {
    return context.redirect("/admin/login");
  }
  const productId = parseId(context.params.id);
  if (!productId) {
    return context.redirect("/admin/catalogo/productos?error=invalid-id");
  }
  const [product] = await db.select({
    id: Product.id,
    categoryId: Product.categoryId
  }).from(Product).where(eq(Product.id, productId)).limit(1);
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
      return context.redirect(redirectToProduct(productId, {
        ingredientError: "invalid-ingredient"
      }));
    }
    const [ingredient] = await db.select({
      id: Ingredient.id,
      active: Ingredient.active
    }).from(Ingredient).where(eq(Ingredient.id, ingredientId)).limit(1);
    if (!ingredient || !ingredient.active) {
      return context.redirect(redirectToProduct(productId, {
        ingredientError: "invalid-ingredient"
      }));
    }
    const categoryLinks = await db.select({
      ingredientId: CategoryIngredient.ingredientId
    }).from(CategoryIngredient).where(eq(CategoryIngredient.categoryId, product.categoryId));
    if (categoryLinks.length > 0) {
      const allowedIds = new Set(categoryLinks.map((row) => row.ingredientId));
      if (!allowedIds.has(ingredientId)) {
        return context.redirect(redirectToProduct(productId, {
          ingredientError: "not-compatible"
        }));
      }
    }
    const [existingLink] = await db.select({
      id: ProductIngredient.id
    }).from(ProductIngredient).where(and(eq(ProductIngredient.productId, productId), eq(ProductIngredient.ingredientId, ingredientId))).limit(1);
    if (existingLink) {
      return context.redirect(redirectToProduct(productId, {
        ingredientError: "duplicate-link"
      }));
    }
    const existing = await db.select({
      id: ProductIngredient.id
    }).from(ProductIngredient);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    await db.insert(ProductIngredient).values({
      id: nextId,
      productId,
      ingredientId,
      defaultIncluded,
      removable,
      sortOrder
    });
    return context.redirect(redirectToProduct(productId, {
      ingredientSaved: "1"
    }));
  }
  const productIngredientId = parseId(String(form.get("productIngredientId") ?? ""));
  if (!productIngredientId) {
    return context.redirect(redirectToProduct(productId, {
      ingredientError: "invalid-link"
    }));
  }
  const [link] = await db.select({
    id: ProductIngredient.id,
    productId: ProductIngredient.productId
  }).from(ProductIngredient).where(and(eq(ProductIngredient.id, productIngredientId), eq(ProductIngredient.productId, productId))).limit(1);
  if (!link) {
    return context.redirect(redirectToProduct(productId, {
      ingredientError: "not-found"
    }));
  }
  if (intent === "delete") {
    await db.delete(ProductIngredient).where(eq(ProductIngredient.id, productIngredientId));
    return context.redirect(redirectToProduct(productId, {
      ingredientSaved: "1"
    }));
  }
  if (intent === "update") {
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const defaultIncluded = form.get("defaultIncluded") === "on";
    const removable = form.get("removable") === "on";
    await db.update(ProductIngredient).set({
      defaultIncluded,
      removable,
      sortOrder
    }).where(eq(ProductIngredient.id, productIngredientId));
    return context.redirect(redirectToProduct(productId, {
      ingredientSaved: "1"
    }));
  }
  return context.redirect(redirectToProduct(productId, {
    ingredientError: "invalid-intent"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
