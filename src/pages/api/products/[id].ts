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
  ProductAllergen,
  Allergen,
  Category,
  CategoryIngredient,
  eq,
  inArray,
  and,
} from "astro:db";

const NON_CUSTOMIZABLE_CATEGORY_SLUGS = new Set([
  "platos-infantiles",
  "platos-combinados",
  "tapas",
  "croquetas",
  "montaditos",
]);

function isSauceIngredient(value: { slug?: string | null; name?: string | null }) {
  const hay = `${value.slug ?? ""} ${value.name ?? ""}`.toLowerCase();

  return [
    "ketchup",
    "mayonesa",
    "mahonesa",
    "alioli",
    "barbacoa",
    "salsa-amarilla",
    "amarilla",
    "salsa-cheddar",
    "cheddar",
    "salsa-cesar",
    "cesar",
    "salsa-griega",
    "griega",
    "salsa-sioux",
    "sioux",
    "salsa-zen",
    "zen",
    "salsa-bhuda",
    "bhuda",
    "salsa-cajun",
    "cajun",
    "mayo-vegana",
    "mayo-veggie",
  ].some((part) => hay.includes(part));
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function allergenIconPath(slug: string, iconUrl?: string | null) {
  return iconUrl ?? `/images/allergens/${slug}.webp`;
}

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: "INVALID_ID" }, 400);

  const [product] = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      active: Product.active,
      categoryId: Product.categoryId,
      categorySlug: Category.slug,
    })
    .from(Product)
    .innerJoin(Category, eq(Product.categoryId, Category.id))
    .where(eq(Product.id, id))
    .limit(1);

  if (!product || !product.active) return json({ error: "NOT_FOUND" }, 404);

  const ingredientsCustomizationEnabled = !NON_CUSTOMIZABLE_CATEGORY_SLUGS.has(
    product.categorySlug,
  );

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

  const productModifierGroups = await db
    .select({
      groupId: ProductModifierGroup.groupId,
      sortOrder: ProductModifierGroup.sortOrder,
    })
    .from(ProductModifierGroup)
    .where(eq(ProductModifierGroup.productId, id));

  const groupIds = productModifierGroups.map((row) => row.groupId);

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

  const productIngredients = ingredientsCustomizationEnabled
    ? await db
      .select({
        id: ProductIngredient.id,
        ingredientId: ProductIngredient.ingredientId,
        defaultIncluded: ProductIngredient.defaultIncluded,
        removable: ProductIngredient.removable,
        sortOrder: ProductIngredient.sortOrder,
        name: Ingredient.name,
        slug: Ingredient.slug,
        imageUrl: Ingredient.imageUrl,
        addPriceDeltaCents: Ingredient.addPriceDeltaCents,
      })
      .from(ProductIngredient)
      .innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id))
      .where(and(eq(ProductIngredient.productId, id), eq(Ingredient.active, true)))
      .orderBy(ProductIngredient.sortOrder)
    : [];

  const commonIngredients = ingredientsCustomizationEnabled
    ? await db
      .select({
        id: Ingredient.id,
        name: Ingredient.name,
        slug: Ingredient.slug,
        imageUrl: Ingredient.imageUrl,
        addPriceDeltaCents: Ingredient.addPriceDeltaCents,
        isCommon: Ingredient.isCommon,
        active: Ingredient.active,
      })
      .from(CategoryIngredient)
      .innerJoin(Ingredient, eq(CategoryIngredient.ingredientId, Ingredient.id))
      .where(
        and(
          eq(CategoryIngredient.categoryId, product.categoryId),
          eq(Ingredient.active, true),
        ),
      )
      .orderBy(Ingredient.name)
    : [];

  const allergens = await db
    .select({
      slug: Allergen.slug,
      name: Allergen.name,
      iconUrl: Allergen.iconUrl,
      sortOrder: Allergen.sortOrder,
    })
    .from(ProductAllergen)
    .innerJoin(Allergen, eq(ProductAllergen.allergenId, Allergen.id))
    .where(and(eq(ProductAllergen.productId, id), eq(Allergen.active, true)))
    .orderBy(Allergen.sortOrder, Allergen.name);

  return json({
    product,

    variants: variants
      .filter((variant) => variant.active)
      .sort((a, b) => a.sortOrder - b.sortOrder),

    modifierGroups: groups
      .filter((group) => group.active)
      .map((group) => ({
        id: group.id,
        name: group.name,
        minSelect: group.minSelect,
        maxSelect: group.maxSelect,
        required: group.required,
        sortOrder: group.sortOrder,
        options: options
          .filter((option) => option.active && option.groupId === group.id)
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((option) => ({
            id: option.id,
            name: option.name,
            priceDeltaCents: option.priceDeltaCents,
            sortOrder: option.sortOrder,
          })),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),

    productIngredients: productIngredients.map((productIngredient) => ({
      ingredientId: productIngredient.ingredientId,
      name: productIngredient.name,
      slug: productIngredient.slug,
      imageUrl: productIngredient.imageUrl ?? null,
      addPriceDeltaCents: productIngredient.addPriceDeltaCents,
      defaultIncluded: productIngredient.defaultIncluded,
      removable: productIngredient.removable,
      sortOrder: productIngredient.sortOrder,
    })),

    commonIngredients: commonIngredients.filter((ingredient) => !isSauceIngredient(ingredient)),
    allergens: allergens.map((allergen) => ({
      slug: allergen.slug,
      name: allergen.name,
      iconUrl: allergenIconPath(allergen.slug, allergen.iconUrl),
    })),

    ingredientsCustomizationEnabled,
  });
};