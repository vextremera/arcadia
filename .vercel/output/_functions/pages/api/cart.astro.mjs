import { d as db, c as Product, h as ProductVariant, f as ModifierOption, I as Ingredient } from '../../chunks/_astro_db_BPgDZzX3.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
async function getCartSession(session) {
  const items = await session?.get("cart");
  return Array.isArray(items) ? items : [];
}
async function hydrateCart(items) {
  if (items.length === 0) {
    return {
      currency: "EUR",
      items: [],
      subtotalCents: 0,
      count: 0
    };
  }
  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))];
  const optionIds = [...new Set(items.flatMap((i) => i.modifierOptionIds ?? []))];
  const products = await db.select({
    id: Product.id,
    name: Product.name,
    imageUrl: Product.imageUrl,
    priceCents: Product.priceCents,
    active: Product.active
  }).from(Product).where(inArray(Product.id, productIds));
  const variants = variantIds.length ? await db.select({
    id: ProductVariant.id,
    name: ProductVariant.name,
    priceDeltaCents: ProductVariant.priceDeltaCents,
    active: ProductVariant.active
  }).from(ProductVariant).where(inArray(ProductVariant.id, variantIds)) : [];
  const options = optionIds.length ? await db.select({
    id: ModifierOption.id,
    name: ModifierOption.name,
    priceDeltaCents: ModifierOption.priceDeltaCents,
    active: ModifierOption.active
  }).from(ModifierOption).where(inArray(ModifierOption.id, optionIds)) : [];
  const ingredientIds = [...new Set(items.flatMap((i) => [...i.addedIngredientIds ?? [], ...i.removedIngredientIds ?? []]))];
  const ingredients = ingredientIds.length ? await db.select({
    id: Ingredient.id,
    name: Ingredient.name,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    active: Ingredient.active
  }).from(Ingredient).where(inArray(Ingredient.id, ingredientIds)) : [];
  const ingredientById = new Map(ingredients.map((x) => [x.id, x]));
  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const optionById = new Map(options.map((o) => [o.id, o]));
  let subtotalCents = 0;
  let count = 0;
  const hydrated = items.filter((i) => i.qty > 0).map((i) => {
    const p = productById.get(i.productId);
    if (!p || !p.active) return null;
    const v = i.variantId ? variantById.get(i.variantId) : null;
    const modifierObjs = (i.modifierOptionIds ?? []).map((id) => optionById.get(id)).filter((o) => !!o && o.active).map((o) => ({
      id: o.id,
      name: o.name,
      priceDeltaCents: o.priceDeltaCents
    }));
    const added = (i.addedIngredientIds ?? []).map((id) => ingredientById.get(id)).filter((ing) => !!ing && ing.active).map((ing) => ({
      id: ing.id,
      name: ing.name,
      priceDeltaCents: ing.addPriceDeltaCents
    }));
    const removed = (i.removedIngredientIds ?? []).map((id) => ingredientById.get(id)).filter((ing) => !!ing && ing.active).map((ing) => ({
      id: ing.id,
      name: ing.name
    }));
    const variantDelta = v && v.active ? v.priceDeltaCents : 0;
    const modifiersDelta = modifierObjs.reduce((acc, m) => acc + (m.priceDeltaCents ?? 0), 0);
    const addedDelta = added.reduce((acc, a) => acc + (a.priceDeltaCents ?? 0), 0);
    const unitPriceCents = p.priceCents + variantDelta + modifiersDelta + addedDelta;
    const lineTotalCents = unitPriceCents * i.qty;
    subtotalCents += lineTotalCents;
    count += i.qty;
    return {
      lineId: i.lineId,
      productId: p.id,
      name: p.name,
      imageUrl: p.imageUrl ?? null,
      variantId: v && v.active ? v.id : void 0,
      variantName: v && v.active ? v.name : null,
      qty: i.qty,
      unitPriceCents,
      lineTotalCents,
      ingredientsAdded: added,
      ingredientsRemoved: removed,
      modifiers: modifierObjs,
      notes: i.notes
    };
  }).filter((x) => x !== null);
  return {
    currency: "EUR",
    items: hydrated,
    subtotalCents,
    count
  };
}
const GET = async ({
  session
}) => {
  const items = await getCartSession(session);
  const cart = await hydrateCart(items);
  return json(cart);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
