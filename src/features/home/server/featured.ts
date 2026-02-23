import { db, Product, ProductIngredient, Ingredient, eq, inArray } from "astro:db";

export type HomeFeaturedProduct = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  ingredients: string[];
};

export async function getHomeFeaturedProducts(limit = 6): Promise<HomeFeaturedProduct[]> {
  const products = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
    })
    .from(Product)
    .where(eq(Product.active, true))
    .orderBy(Product.id)
    .limit(limit);

  const ids = products.map((p) => p.id);
  if (ids.length === 0) return [];

  const ingRows = await db
    .select({
      productId: ProductIngredient.productId,
      name: Ingredient.name,
      sortOrder: ProductIngredient.sortOrder,
    })
    .from(ProductIngredient)
    .innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id))
    .where(inArray(ProductIngredient.productId, ids))
    .orderBy(ProductIngredient.sortOrder);

  const map = new Map<number, string[]>();
  for (const r of ingRows) {
    const arr = map.get(r.productId) ?? [];
    arr.push(r.name);
    map.set(r.productId, arr);
  }

  return products.map((p) => ({
    ...p,
    ingredients: map.get(p.id) ?? [],
  }));
}
