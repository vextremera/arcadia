import { d as db, c as Product, e as ProductIngredient, I as Ingredient } from '../../../../../chunks/_astro_db_ChTDrd2j.mjs';
import { and, eq, asc, inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
const GET = async ({
  params
}) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({
    error: "INVALID_CATEGORY_ID"
  }, 400);
  const products = await db.select({
    id: Product.id,
    name: Product.name,
    description: Product.description,
    imageUrl: Product.imageUrl,
    priceCents: Product.priceCents,
    deliveryEnabled: Product.deliveryEnabled,
    pickupEnabled: Product.pickupEnabled
  }).from(Product).where(and(eq(Product.categoryId, id), eq(Product.active, true))).orderBy(asc(Product.name));
  if (products.length === 0) return json({
    products: []
  });
  const productIds = products.map((p) => p.id);
  const ingRows = await db.select({
    productId: ProductIngredient.productId,
    name: Ingredient.name,
    sortOrder: ProductIngredient.sortOrder
  }).from(ProductIngredient).innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id)).where(and(inArray(ProductIngredient.productId, productIds), eq(ProductIngredient.defaultIncluded, true), eq(Ingredient.active, true))).orderBy(asc(ProductIngredient.productId), asc(ProductIngredient.sortOrder), asc(Ingredient.name));
  const ingByProduct = /* @__PURE__ */ new Map();
  for (const r of ingRows) {
    const arr = ingByProduct.get(r.productId) ?? [];
    arr.push(r.name);
    ingByProduct.set(r.productId, arr);
  }
  const out = products.map((p) => ({
    ...p,
    ingredients: ingByProduct.get(p.id) ?? []
  }));
  return json({
    products: out
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
