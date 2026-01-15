import type { APIRoute } from "astro";
import { db, Product, eq, and } from "astro:db";

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
      pickupEnabled: Product.pickupEnabled,
    })
    .from(Product)
    .where(and(eq(Product.categoryId, id), eq(Product.active, true)))
    .orderBy(Product.name);

  return json({ products });
};
