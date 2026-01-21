import type { APIRoute } from "astro";
import {
  db,
  Product,
  ProductVariant,
  ProductModifierGroup,
  ModifierGroup,
  ModifierOption,
  Ingredient,
  ProductIngredient,
  eq,
  and,
  inArray,
} from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: "INVALID_PRODUCT_ID" }, 400);

  // 1) Product
  const [product] = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      active: Product.active,
      categoryId: Product.categoryId,
      deliveryEnabled: Product.deliveryEnabled,
      pickupEnabled: Product.pickupEnabled,
    })
    .from(Product)
    .where(eq(Product.id, id))
    .limit(1);

  if (!product || !product.active) return json({ error: "NOT_FOUND" }, 404);

  // 2) Variants
  const variants = await db
    .select({
      id: ProductVariant.id,
      name: ProductVariant.name,
      priceDeltaCents: ProductVariant.priceDeltaCents,
      sortOrder: ProductVariant.sortOrder,
      active: ProductVariant.active,
    })
    .from(ProductVariant)
    .where(and(eq(ProductVariant.productId, id), eq(ProductVariant.active, true)))
    .orderBy(ProductVariant.sortOrder);

  // 3) Modifier groups for this product (IMPORTANT: all groups, not just Pan)
  const pmg = await db
    .select({
      groupId: ProductModifierGroup.groupId,
      productSortOrder: ProductModifierGroup.sortOrder,

      id: ModifierGroup.id,
      name: ModifierGroup.name,
      minSelect: ModifierGroup.minSelect,
      maxSelect: ModifierGroup.maxSelect,
      required: ModifierGroup.required,
      sortOrder: ModifierGroup.sortOrder,
      active: ModifierGroup.active,
    })
    .from(ProductModifierGroup)
    .innerJoin(ModifierGroup, eq(ProductModifierGroup.groupId, ModifierGroup.id))
    .where(eq(ProductModifierGroup.productId, id))
    .orderBy(ProductModifierGroup.sortOrder);

  const groupIds = pmg.map((g) => g.groupId);
  const options = groupIds.length
    ? await db
        .select({
          id: ModifierOption.id,
          groupId: ModifierOption.groupId,
          name: ModifierOption.name,
          priceDeltaCents: ModifierOption.priceDeltaCents,
          sortOrder: ModifierOption.sortOrder,
          active: ModifierOption.active,
        })
        .from(ModifierOption)
        .where(and(inArray(ModifierOption.groupId, groupIds), eq(ModifierOption.active, true)))
        .orderBy(ModifierOption.groupId, ModifierOption.sortOrder)
    : [];

  const optionsByGroup = new Map<number, typeof options>();
  for (const o of options) {
    const arr = optionsByGroup.get(o.groupId) ?? [];
    arr.push(o);
    optionsByGroup.set(o.groupId, arr);
  }

  const modifierGroups = pmg
    .filter((g) => g.active)
    .map((g) => ({
      id: g.id,
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      required: g.required,
      sortOrder: g.productSortOrder ?? g.sortOrder ?? 0,
      options: (optionsByGroup.get(g.groupId) ?? []).map((o) => ({
        id: o.id,
        name: o.name,
        priceDeltaCents: o.priceDeltaCents ?? 0,
        sortOrder: o.sortOrder ?? 0,
      })),
    }))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // 4) Ingredients in product (for “Quitar…”)
  const pi = await db
    .select({
      ingredientId: ProductIngredient.ingredientId,
      defaultIncluded: ProductIngredient.defaultIncluded,
      removable: ProductIngredient.removable,
      sortOrder: ProductIngredient.sortOrder,

      name: Ingredient.name,
      slug: Ingredient.slug,
    })
    .from(ProductIngredient)
    .innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id))
    .where(eq(ProductIngredient.productId, id))
    .orderBy(ProductIngredient.sortOrder);

  const productIngredients = pi.map((x) => ({
    ingredientId: x.ingredientId,
    name: x.name,
    slug: x.slug,
    defaultIncluded: x.defaultIncluded,
    removable: x.removable,
    sortOrder: x.sortOrder,
  }));

  // 5) Common/all ingredients for “Añadir…”
  const commonIngredients = await db
    .select({
      id: Ingredient.id,
      name: Ingredient.name,
      slug: Ingredient.slug,
      addPriceDeltaCents: Ingredient.addPriceDeltaCents,
      isCommon: Ingredient.isCommon,
      active: Ingredient.active,
    })
    .from(Ingredient)
    .where(and(eq(Ingredient.active, true), eq(Ingredient.isCommon, true)))
    .orderBy(Ingredient.name);

  const allIngredients = await db
    .select({
      id: Ingredient.id,
      name: Ingredient.name,
      slug: Ingredient.slug,
      addPriceDeltaCents: Ingredient.addPriceDeltaCents,
      isCommon: Ingredient.isCommon,
      active: Ingredient.active,
    })
    .from(Ingredient)
    .where(eq(Ingredient.active, true))
    .orderBy(Ingredient.name);

  return json({
    product,
    variants,
    modifierGroups,
    productIngredients,
    commonIngredients,
    allIngredients,
    favorited: null,
  });
};
