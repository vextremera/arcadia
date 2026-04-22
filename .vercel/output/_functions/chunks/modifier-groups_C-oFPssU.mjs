import { d as db, e as Product, M as ModifierGroup, h as ProductModifierGroup } from './_astro_db_Bcz5lWRF.mjs';
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
  return `${withQuery(`/admin/catalogo/productos/${productId}`, params)}#grupos`;
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
    const groupId = parseId(String(form.get("groupId") ?? ""));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    if (!groupId) {
      return context.redirect(redirectToProduct(productId, {
        modifierGroupError: "invalid-group"
      }));
    }
    const [group] = await db.select({
      id: ModifierGroup.id,
      active: ModifierGroup.active
    }).from(ModifierGroup).where(eq(ModifierGroup.id, groupId)).limit(1);
    if (!group || !group.active) {
      return context.redirect(redirectToProduct(productId, {
        modifierGroupError: "invalid-group"
      }));
    }
    const [existingLink] = await db.select({
      id: ProductModifierGroup.id
    }).from(ProductModifierGroup).where(and(eq(ProductModifierGroup.productId, productId), eq(ProductModifierGroup.groupId, groupId))).limit(1);
    if (existingLink) {
      return context.redirect(redirectToProduct(productId, {
        modifierGroupError: "duplicate-link"
      }));
    }
    const existing = await db.select({
      id: ProductModifierGroup.id
    }).from(ProductModifierGroup);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    await db.insert(ProductModifierGroup).values({
      id: nextId,
      productId,
      groupId,
      sortOrder
    });
    return context.redirect(redirectToProduct(productId, {
      modifierGroupSaved: "1"
    }));
  }
  const linkId = parseId(String(form.get("productModifierGroupId") ?? ""));
  if (!linkId) {
    return context.redirect(redirectToProduct(productId, {
      modifierGroupError: "invalid-link"
    }));
  }
  const [link] = await db.select({
    id: ProductModifierGroup.id,
    productId: ProductModifierGroup.productId
  }).from(ProductModifierGroup).where(and(eq(ProductModifierGroup.id, linkId), eq(ProductModifierGroup.productId, productId))).limit(1);
  if (!link) {
    return context.redirect(redirectToProduct(productId, {
      modifierGroupError: "not-found"
    }));
  }
  if (intent === "delete") {
    await db.delete(ProductModifierGroup).where(eq(ProductModifierGroup.id, linkId));
    return context.redirect(redirectToProduct(productId, {
      modifierGroupSaved: "1"
    }));
  }
  if (intent === "update") {
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    await db.update(ProductModifierGroup).set({
      sortOrder
    }).where(eq(ProductModifierGroup.id, linkId));
    return context.redirect(redirectToProduct(productId, {
      modifierGroupSaved: "1"
    }));
  }
  return context.redirect(redirectToProduct(productId, {
    modifierGroupError: "invalid-intent"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
