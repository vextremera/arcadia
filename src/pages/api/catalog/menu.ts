import type { APIRoute } from "astro";
import {
  db,
  Category,
  Product,
  ProductIngredient,
  Ingredient,
  ProductVariant,
  ProductModifierGroup,
  ProductAllergen,
  Allergen,
  and,
  asc,
  eq,
  inArray,
} from "astro:db";
import { getCatalogFlags } from "@/server/catalog/settings";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
};

type ProductRow = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
};

const NUMERIC_ORDER_CATEGORIES = new Set(["platos-combinados", "platos-infantiles"]);

function leadingNumber(name: string): number | null {
  const match = name.trim().match(/^(\d+)\s*(?:[.: -]|-)/);
  return match ? Number(match[1]) : null;
}

function sortProductsForCategory(categorySlug: string, products: ProductRow[]) {
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

/**
 * Devuelve el menú completo (categorías activas + productos activos) en una sola llamada.
 * Pensado para /pedir (UX tipo app) evitando N requests por categoría.
 */
export const GET: APIRoute = async () => {
  const catalogFlags = await getCatalogFlags();

  const categories = (await db
    .select({
      id: Category.id,
      name: Category.name,
      slug: Category.slug,
      sortOrder: Category.sortOrder,
    })
    .from(Category)
    .where(eq(Category.active, true))
    .orderBy(asc(Category.sortOrder))) as CategoryRow[];

  if (categories.length === 0) return json({ categories: [] });

  const categoryIds = categories.map((category) => category.id);

  const products = (await db
    .select({
      id: Product.id,
      categoryId: Product.categoryId,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      deliveryEnabled: Product.deliveryEnabled,
      pickupEnabled: Product.pickupEnabled,
    })
    .from(Product)
    .where(and(inArray(Product.categoryId, categoryIds), eq(Product.active, true)))
    .orderBy(asc(Product.categoryId), asc(Product.name))) as ProductRow[];

  if (products.length === 0) {
    return json({
      categories: categories.map((category) => ({ ...category, products: [] })),
    });
  }

  const productIds = products.map((product) => product.id);

  const ingredientRows = await db
    .select({
      productId: ProductIngredient.productId,
      name: Ingredient.name,
      sortOrder: ProductIngredient.sortOrder,
    })
    .from(ProductIngredient)
    .innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id))
    .where(
      and(
        inArray(ProductIngredient.productId, productIds),
        eq(ProductIngredient.defaultIncluded, true),
        eq(Ingredient.active, true)
      )
    )
    .orderBy(asc(ProductIngredient.productId), asc(ProductIngredient.sortOrder), asc(Ingredient.name));

  const ingredientsByProduct = new Map<number, string[]>();
  for (const row of ingredientRows) {
    const list = ingredientsByProduct.get(row.productId) ?? [];
    list.push(row.name);
    ingredientsByProduct.set(row.productId, list);
  }

  const allergenRows = await db
    .select({
      productId: ProductAllergen.productId,
      slug: Allergen.slug,
      name: Allergen.name,
      iconUrl: Allergen.iconUrl,
      sortOrder: Allergen.sortOrder,
    })
    .from(ProductAllergen)
    .innerJoin(Allergen, eq(ProductAllergen.allergenId, Allergen.id))
    .where(and(inArray(ProductAllergen.productId, productIds), eq(Allergen.active, true)))
    .orderBy(asc(ProductAllergen.productId), asc(Allergen.sortOrder), asc(Allergen.name));

  const allergensByProduct = new Map<
    number,
    Array<{ slug: string; name: string; iconUrl: string | null }>
  >();

  // Con el ajuste desactivado no se envían: filtrarlos en el cliente dejaría
  // los alérgenos igualmente en la respuesta, a la vista de cualquiera.
  if (catalogFlags.showAllergens) {
    for (const row of allergenRows) {
      const list = allergensByProduct.get(row.productId) ?? [];
      list.push({
        slug: row.slug,
        name: row.name,
        iconUrl: row.iconUrl ?? null,
      });
      allergensByProduct.set(row.productId, list);
    }
  }

  const variantRows = await db
    .select({ productId: ProductVariant.productId })
    .from(ProductVariant)
    .where(and(inArray(ProductVariant.productId, productIds), eq(ProductVariant.active, true)));
  const hasVariants = new Set<number>(variantRows.map((row) => row.productId));

  const modifierRows = await db
    .select({ productId: ProductModifierGroup.productId })
    .from(ProductModifierGroup)
    .where(inArray(ProductModifierGroup.productId, productIds));
  const hasModifierGroups = new Set<number>(modifierRows.map((row) => row.productId));

  const removableRows = await db
    .select({ productId: ProductIngredient.productId })
    .from(ProductIngredient)
    .where(
      and(
        inArray(ProductIngredient.productId, productIds),
        eq(ProductIngredient.defaultIncluded, true),
        eq(ProductIngredient.removable, true)
      )
    );
  const hasRemovable = new Set<number>(removableRows.map((row) => row.productId));

  const productsByCategory = new Map<
    number,
    Array<{
      id: number;
      categoryId: number;
      name: string;
      description: string | null;
      imageUrl: string | null;
      priceCents: number;
      deliveryEnabled: boolean;
      pickupEnabled: boolean;
      ingredients: string[];
      allergens: Array<{ slug: string; name: string; iconUrl: string | null }>;
      isConfigurable: boolean;
    }>
  >();

  for (const product of products) {
    const list = productsByCategory.get(product.categoryId) ?? [];
    list.push({
      ...product,
      ingredients: ingredientsByProduct.get(product.id) ?? [],
      allergens: allergensByProduct.get(product.id) ?? [],
      isConfigurable:
        hasVariants.has(product.id) || hasModifierGroups.has(product.id) || hasRemovable.has(product.id),
    });
    productsByCategory.set(product.categoryId, list);
  }

  return json({
    categories: categories.map((category) => ({
      ...category,
      products: sortProductsForCategory(category.slug, productsByCategory.get(category.id) ?? []),
    })),
  });
};