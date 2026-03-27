import { d as db, c as Product, h as ProductVariant } from '../../../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq, and } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../../renderers.mjs';

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function parseIntValue(value, fallback = 0) {
  const raw = String(value ?? "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}
function parseEurToCentsAllowNegative(value) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}
function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
function redirectToProduct(productId, params = {}) {
  return `${withQuery(`/admin/catalogo/productos/${productId}`, params)}#variantes`;
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
    id: Product.id
  }).from(Product).where(eq(Product.id, productId)).limit(1);
  if (!product) {
    return context.redirect("/admin/catalogo/productos?error=not-found");
  }
  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();
  if (intent === "create") {
    const name = String(form.get("name") ?? "").trim();
    const priceDeltaCents = parseEurToCentsAllowNegative(form.get("priceDeltaEur"));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";
    if (!name) {
      return context.redirect(redirectToProduct(productId, {
        variantError: "missing-name"
      }));
    }
    if (priceDeltaCents === null) {
      return context.redirect(redirectToProduct(productId, {
        variantError: "invalid-price"
      }));
    }
    const existing = await db.select({
      id: ProductVariant.id
    }).from(ProductVariant);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    await db.insert(ProductVariant).values({
      id: nextId,
      productId,
      name,
      priceDeltaCents,
      sortOrder,
      active
    });
    return context.redirect(redirectToProduct(productId, {
      variantSaved: "1"
    }));
  }
  const variantId = parseId(String(form.get("variantId") ?? ""));
  if (!variantId) {
    return context.redirect(redirectToProduct(productId, {
      variantError: "invalid-variant"
    }));
  }
  const [variant] = await db.select({
    id: ProductVariant.id,
    productId: ProductVariant.productId
  }).from(ProductVariant).where(and(eq(ProductVariant.id, variantId), eq(ProductVariant.productId, productId))).limit(1);
  if (!variant) {
    return context.redirect(redirectToProduct(productId, {
      variantError: "not-found"
    }));
  }
  if (intent === "delete") {
    await db.delete(ProductVariant).where(eq(ProductVariant.id, variantId));
    return context.redirect(redirectToProduct(productId, {
      variantSaved: "1"
    }));
  }
  if (intent === "update") {
    const name = String(form.get("name") ?? "").trim();
    const priceDeltaCents = parseEurToCentsAllowNegative(form.get("priceDeltaEur"));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";
    if (!name) {
      return context.redirect(redirectToProduct(productId, {
        variantError: "missing-name"
      }));
    }
    if (priceDeltaCents === null) {
      return context.redirect(redirectToProduct(productId, {
        variantError: "invalid-price"
      }));
    }
    await db.update(ProductVariant).set({
      name,
      priceDeltaCents,
      sortOrder,
      active
    }).where(eq(ProductVariant.id, variantId));
    return context.redirect(redirectToProduct(productId, {
      variantSaved: "1"
    }));
  }
  return context.redirect(redirectToProduct(productId, {
    variantError: "invalid-intent"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
