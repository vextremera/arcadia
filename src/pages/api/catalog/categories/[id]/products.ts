import type { APIRoute } from "astro";
import {
  db,
  Product,
  ProductIngredient,
  Ingredient,
  eq,
  and,
  inArray,
  asc,
} from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: "INVALID_CATEGORY_ID" }, 400);

  const products = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      deliveryEnabled: Product.deliveryEnabled,
    })
    .from(Product)
    .where(and(eq(Product.categoryId, id), eq(Product.active, true)))
    .orderBy(asc(Product.name));

  if (products.length === 0) return json({ products: [] });

  const productIds = products.map((p) => p.id);

  const ingRows = await db
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

  const ingByProduct = new Map<number, string[]>();
  for (const r of ingRows) {
    const arr = ingByProduct.get(r.productId) ?? [];
    arr.push(r.name);
    ingByProduct.set(r.productId, arr);
  }

  const out = products.map((p) => ({
    ...p,
    ingredients: ingByProduct.get(p.id) ?? [],
  }));

  return json({ products: out });
};
