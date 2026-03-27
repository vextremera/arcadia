import { d as db, c as Product, h as ProductVariant, g as ProductModifierGroup, M as ModifierGroup, f as ModifierOption, I as Ingredient, e as ProductIngredient, a as Allergen, P as ProductAllergen } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq, inArray, and } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
function allergenIconPath(slug, iconUrl) {
  return iconUrl ?? `/images/allergens/${slug}.webp`;
}
const GET = async ({
  params,
  locals
}) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({
    error: "INVALID_ID"
  }, 400);
  const [product] = await db.select({
    id: Product.id,
    name: Product.name,
    description: Product.description,
    imageUrl: Product.imageUrl,
    priceCents: Product.priceCents,
    active: Product.active,
    categoryId: Product.categoryId
  }).from(Product).where(eq(Product.id, id)).limit(1);
  if (!product || !product.active) return json({
    error: "NOT_FOUND"
  }, 404);
  const variants = await db.select({
    id: ProductVariant.id,
    name: ProductVariant.name,
    priceDeltaCents: ProductVariant.priceDeltaCents,
    sortOrder: ProductVariant.sortOrder,
    active: ProductVariant.active
  }).from(ProductVariant).where(eq(ProductVariant.productId, id));
  const productModifierGroups = await db.select({
    groupId: ProductModifierGroup.groupId,
    sortOrder: ProductModifierGroup.sortOrder
  }).from(ProductModifierGroup).where(eq(ProductModifierGroup.productId, id));
  const groupIds = productModifierGroups.map((row) => row.groupId);
  const groups = groupIds.length ? await db.select({
    id: ModifierGroup.id,
    name: ModifierGroup.name,
    minSelect: ModifierGroup.minSelect,
    maxSelect: ModifierGroup.maxSelect,
    required: ModifierGroup.required,
    sortOrder: ModifierGroup.sortOrder,
    active: ModifierGroup.active
  }).from(ModifierGroup).where(inArray(ModifierGroup.id, groupIds)) : [];
  const options = groupIds.length ? await db.select({
    id: ModifierOption.id,
    groupId: ModifierOption.groupId,
    name: ModifierOption.name,
    priceDeltaCents: ModifierOption.priceDeltaCents,
    sortOrder: ModifierOption.sortOrder,
    active: ModifierOption.active
  }).from(ModifierOption).where(inArray(ModifierOption.groupId, groupIds)) : [];
  const productIngredients = await db.select({
    id: ProductIngredient.id,
    ingredientId: ProductIngredient.ingredientId,
    defaultIncluded: ProductIngredient.defaultIncluded,
    removable: ProductIngredient.removable,
    sortOrder: ProductIngredient.sortOrder,
    name: Ingredient.name,
    slug: Ingredient.slug
  }).from(ProductIngredient).innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id)).where(and(eq(ProductIngredient.productId, id), eq(Ingredient.active, true))).orderBy(ProductIngredient.sortOrder);
  const commonIngredients = await db.select({
    id: Ingredient.id,
    name: Ingredient.name,
    slug: Ingredient.slug,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    isCommon: Ingredient.isCommon,
    active: Ingredient.active
  }).from(Ingredient).where(and(eq(Ingredient.active, true), eq(Ingredient.isCommon, true))).orderBy(Ingredient.name);
  const allIngredients = await db.select({
    id: Ingredient.id,
    name: Ingredient.name,
    slug: Ingredient.slug,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    isCommon: Ingredient.isCommon,
    active: Ingredient.active
  }).from(Ingredient).where(eq(Ingredient.active, true)).orderBy(Ingredient.name);
  const allergens = await db.select({
    slug: Allergen.slug,
    name: Allergen.name,
    iconUrl: Allergen.iconUrl,
    sortOrder: Allergen.sortOrder
  }).from(ProductAllergen).innerJoin(Allergen, eq(ProductAllergen.allergenId, Allergen.id)).where(and(eq(ProductAllergen.productId, id), eq(Allergen.active, true))).orderBy(Allergen.sortOrder, Allergen.name);
  const favorited = locals.user ? false : null;
  return json({
    product,
    variants: variants.filter((variant) => variant.active).sort((a, b) => a.sortOrder - b.sortOrder),
    modifierGroups: groups.filter((group) => group.active).map((group) => ({
      id: group.id,
      name: group.name,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      required: group.required,
      sortOrder: group.sortOrder,
      options: options.filter((option) => option.active && option.groupId === group.id).sort((a, b) => a.sortOrder - b.sortOrder).map((option) => ({
        id: option.id,
        name: option.name,
        priceDeltaCents: option.priceDeltaCents,
        sortOrder: option.sortOrder
      }))
    })).sort((a, b) => a.sortOrder - b.sortOrder),
    productIngredients: productIngredients.map((productIngredient) => ({
      ingredientId: productIngredient.ingredientId,
      name: productIngredient.name,
      slug: productIngredient.slug,
      defaultIncluded: productIngredient.defaultIncluded,
      removable: productIngredient.removable,
      sortOrder: productIngredient.sortOrder
    })),
    commonIngredients,
    allIngredients,
    allergens: allergens.map((allergen) => ({
      slug: allergen.slug,
      name: allergen.name,
      iconUrl: allergenIconPath(allergen.slug, allergen.iconUrl)
    })),
    favorited
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
