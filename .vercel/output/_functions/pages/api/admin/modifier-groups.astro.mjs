import { d as db, M as ModifierGroup, g as ProductModifierGroup, f as ModifierOption } from '../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

function safeText(value) {
  return String(value ?? "").trim();
}
function parseId(value) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function parseNonNegativeInt(value, fallback = 0) {
  const raw = safeText(value);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}
function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
const REDIRECT_PATH = "/admin/catalogo/modificadores";
const POST = async (context) => {
  const user = context.locals.user;
  if (!user || user.role !== "ADMIN" && user.role !== "STAFF") {
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
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "missing-name"
      }));
    }
    if (minSelect === null || maxSelect === null || sortOrder === null || maxSelect < 1 || minSelect > maxSelect) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-range"
      }));
    }
    const existing = await db.select({
      id: ModifierGroup.id
    }).from(ModifierGroup);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    await db.insert(ModifierGroup).values({
      id: nextId,
      name,
      minSelect,
      maxSelect,
      required,
      sortOrder,
      active
    });
    return context.redirect(withQuery(REDIRECT_PATH, {
      saved: "1"
    }));
  }
  const groupId = parseId(form.get("groupId"));
  if (!groupId) {
    return context.redirect(withQuery(REDIRECT_PATH, {
      error: "invalid-group"
    }));
  }
  const [group] = await db.select({
    id: ModifierGroup.id
  }).from(ModifierGroup).where(eq(ModifierGroup.id, groupId)).limit(1);
  if (!group) {
    return context.redirect(withQuery(REDIRECT_PATH, {
      error: "not-found"
    }));
  }
  if (intent === "update") {
    const name = safeText(form.get("name"));
    const minSelect = parseNonNegativeInt(form.get("minSelect"), 0);
    const maxSelect = parseNonNegativeInt(form.get("maxSelect"), 1);
    const sortOrder = parseNonNegativeInt(form.get("sortOrder"), 0);
    const required = form.get("required") === "on";
    const active = form.get("active") === "on";
    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "missing-name"
      }));
    }
    if (minSelect === null || maxSelect === null || sortOrder === null || maxSelect < 1 || minSelect > maxSelect) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-range"
      }));
    }
    await db.update(ModifierGroup).set({
      name,
      minSelect,
      maxSelect,
      required,
      sortOrder,
      active
    }).where(eq(ModifierGroup.id, groupId));
    return context.redirect(withQuery(REDIRECT_PATH, {
      saved: "1"
    }));
  }
  if (intent === "delete") {
    const productLinks = await db.select({
      id: ProductModifierGroup.id
    }).from(ProductModifierGroup).where(eq(ProductModifierGroup.groupId, groupId));
    if (productLinks.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "in-use-products"
      }));
    }
    const options = await db.select({
      id: ModifierOption.id
    }).from(ModifierOption).where(eq(ModifierOption.groupId, groupId));
    if (options.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "in-use-options"
      }));
    }
    await db.delete(ModifierGroup).where(eq(ModifierGroup.id, groupId));
    return context.redirect(withQuery(REDIRECT_PATH, {
      saved: "1"
    }));
  }
  return context.redirect(withQuery(REDIRECT_PATH, {
    error: "invalid-intent"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
