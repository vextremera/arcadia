import type { APIRoute } from "astro";
import {
  db,
  Product,
  ProductVariant,
  ModifierGroup,
  ModifierOption,
  ProductModifierGroup,
  ProductIngredient,
  Ingredient,
  eq,
  inArray,
  and,
} from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ params, locals }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: "INVALID_ID" }, 400);

  // 1) Producto
  const [product] = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      active: Product.active,
      categoryId: Product.categoryId,
    })
    .from(Product)
    .where(eq(Product.id, id))
    .limit(1);

  if (!product || !product.active) return json({ error: "NOT_FOUND" }, 404);

  // 2) Variantes
  const variants = await db
    .select({
      id: ProductVariant.id,
      name: ProductVariant.name,
      priceDeltaCents: ProductVariant.priceDeltaCents,
      sortOrder: ProductVariant.sortOrder,
      active: ProductVariant.active,
    })
    .from(ProductVariant)
    .where(eq(ProductVariant.productId, id));

  // 3) Grupos de modificadores asignados al producto
  const pmg = await db
    .select({
      groupId: ProductModifierGroup.groupId,
      sortOrder: ProductModifierGroup.sortOrder,
    })
    .from(ProductModifierGroup)
    .where(eq(ProductModifierGroup.productId, id));

  const groupIds = pmg.map((x) => x.groupId);

  const groups = groupIds.length
    ? await db
        .select({
          id: ModifierGroup.id,
          name: ModifierGroup.name,
          minSelect: ModifierGroup.minSelect,
          maxSelect: ModifierGroup.maxSelect,
          required: ModifierGroup.required,
          sortOrder: ModifierGroup.sortOrder,
          active: ModifierGroup.active,
        })
        .from(ModifierGroup)
        .where(inArray(ModifierGroup.id, groupIds))
    : [];

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
        .where(inArray(ModifierOption.groupId, groupIds))
    : [];

  // 4) Ingredientes del producto (para "Quitar...")
  const prodIngredients = await db
    .select({
      id: ProductIngredient.id,
      ingredientId: ProductIngredient.ingredientId,
      defaultIncluded: ProductIngredient.defaultIncluded,
      removable: ProductIngredient.removable,
      sortOrder: ProductIngredient.sortOrder,
      name: Ingredient.name,
      slug: Ingredient.slug,
    })
    .from(ProductIngredient)
    .innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id))
    .where(and(eq(ProductIngredient.productId, id), eq(Ingredient.active, true)))
    .orderBy(ProductIngredient.sortOrder);

  // 5) Ingredientes comunes y todos activos
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

  // (Opcional futuro) favoritos
  const favorited = locals.user ? false : null;

  return json({
    product,

    variants: variants.filter((v) => v.active).sort((a, b) => a.sortOrder - b.sortOrder),

    modifierGroups: groups
      .filter((g) => g.active)
      .map((g) => ({
        id: g.id,
        name: g.name,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        required: g.required,
        sortOrder: g.sortOrder,
        options: options
          .filter((o) => o.active && o.groupId === g.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((o) => ({
            id: o.id,
            name: o.name,
            priceDeltaCents: o.priceDeltaCents,
            sortOrder: o.sortOrder,
          })),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),

    // Ingredientes del producto para "Quitar..."
    productIngredients: prodIngredients.map((pi) => ({
      ingredientId: pi.ingredientId,
      name: pi.name,
      slug: pi.slug,
      defaultIncluded: pi.defaultIncluded,
      removable: pi.removable,
      sortOrder: pi.sortOrder,
    })),

    // Para "Añadir comunes"
    commonIngredients,

    // Para "Añadir todos"
    allIngredients,

    favorited,
  });
};
