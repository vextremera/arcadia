import { d as db, C as Category, c as Product, e as ProductIngredient, I as Ingredient, a as Allergen, P as ProductAllergen, h as ProductVariant, g as ProductModifierGroup } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq, asc, and, inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
const NUMERIC_ORDER_CATEGORIES = /* @__PURE__ */ new Set(["platos-combinados", "platos-infantiles"]);
function leadingNumber(name) {
  const match = name.trim().match(/^(\d+)\s*(?:[.: -]|-)/);
  return match ? Number(match[1]) : null;
}
function sortProductsForCategory(categorySlug, products) {
  if (!NUMERIC_ORDER_CATEGORIES.has(categorySlug)) {
    return [...products].sort((a, b) => a.name.localeCompare(b.name, "es"));
  }
  return [...products].sort((a, b) => {
    const aNumber = leadingNumber(a.name);
    const bNumber = leadingNumber(b.name);
    if (aNumber != null && bNumber != null) return aNumber - bNumber;
    if (aNumber != null) return -1;
    if (bNumber != null) return 1;
    return a.name.localeCompare(b.name, "es");
  });
}
const GET = async () => {
  const categories = await db.select({
    id: Category.id,
    name: Category.name,
    slug: Category.slug,
    sortOrder: Category.sortOrder
  }).from(Category).where(eq(Category.active, true)).orderBy(asc(Category.sortOrder));
  if (categories.length === 0) return json({
    categories: []
  });
  const categoryIds = categories.map((category) => category.id);
  const products = await db.select({
    id: Product.id,
    categoryId: Product.categoryId,
    name: Product.name,
    description: Product.description,
    imageUrl: Product.imageUrl,
    priceCents: Product.priceCents,
    deliveryEnabled: Product.deliveryEnabled,
    pickupEnabled: Product.pickupEnabled
  }).from(Product).where(and(inArray(Product.categoryId, categoryIds), eq(Product.active, true))).orderBy(asc(Product.categoryId), asc(Product.name));
  if (products.length === 0) {
    return json({
      categories: categories.map((category) => ({
        ...category,
        products: []
      }))
    });
  }
  const productIds = products.map((product) => product.id);
  const ingredientRows = await db.select({
    productId: ProductIngredient.productId,
    name: Ingredient.name,
    sortOrder: ProductIngredient.sortOrder
  }).from(ProductIngredient).innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id)).where(and(inArray(ProductIngredient.productId, productIds), eq(ProductIngredient.defaultIncluded, true), eq(Ingredient.active, true))).orderBy(asc(ProductIngredient.productId), asc(ProductIngredient.sortOrder), asc(Ingredient.name));
  const ingredientsByProduct = /* @__PURE__ */ new Map();
  for (const row of ingredientRows) {
    const list = ingredientsByProduct.get(row.productId) ?? [];
    list.push(row.name);
    ingredientsByProduct.set(row.productId, list);
  }
  const allergenRows = await db.select({
    productId: ProductAllergen.productId,
    slug: Allergen.slug,
    name: Allergen.name,
    iconUrl: Allergen.iconUrl,
    sortOrder: Allergen.sortOrder
  }).from(ProductAllergen).innerJoin(Allergen, eq(ProductAllergen.allergenId, Allergen.id)).where(and(inArray(ProductAllergen.productId, productIds), eq(Allergen.active, true))).orderBy(asc(ProductAllergen.productId), asc(Allergen.sortOrder), asc(Allergen.name));
  const allergensByProduct = /* @__PURE__ */ new Map();
  for (const row of allergenRows) {
    const list = allergensByProduct.get(row.productId) ?? [];
    list.push({
      slug: row.slug,
      name: row.name,
      iconUrl: row.iconUrl ?? null
    });
    allergensByProduct.set(row.productId, list);
  }
  const variantRows = await db.select({
    productId: ProductVariant.productId
  }).from(ProductVariant).where(and(inArray(ProductVariant.productId, productIds), eq(ProductVariant.active, true)));
  const hasVariants = new Set(variantRows.map((row) => row.productId));
  const modifierRows = await db.select({
    productId: ProductModifierGroup.productId
  }).from(ProductModifierGroup).where(inArray(ProductModifierGroup.productId, productIds));
  const hasModifierGroups = new Set(modifierRows.map((row) => row.productId));
  const removableRows = await db.select({
    productId: ProductIngredient.productId
  }).from(ProductIngredient).where(and(inArray(ProductIngredient.productId, productIds), eq(ProductIngredient.defaultIncluded, true), eq(ProductIngredient.removable, true)));
  const hasRemovable = new Set(removableRows.map((row) => row.productId));
  const productsByCategory = /* @__PURE__ */ new Map();
  for (const product of products) {
    const list = productsByCategory.get(product.categoryId) ?? [];
    list.push({
      ...product,
      ingredients: ingredientsByProduct.get(product.id) ?? [],
      allergens: allergensByProduct.get(product.id) ?? [],
      isConfigurable: hasVariants.has(product.id) || hasModifierGroups.has(product.id) || hasRemovable.has(product.id)
    });
    productsByCategory.set(product.categoryId, list);
  }
  return json({
    categories: categories.map((category) => ({
      ...category,
      products: sortProductsForCategory(category.slug, productsByCategory.get(category.id) ?? [])
    }))
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
