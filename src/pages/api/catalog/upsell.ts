import type { APIRoute } from "astro";
import { db, Product, UpsellItem, eq, and } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async () => {
  const rows = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      active: Product.active,
      deliveryEnabled: Product.deliveryEnabled,
      pickupEnabled: Product.pickupEnabled,
      sortOrder: UpsellItem.sortOrder,
    })
    .from(UpsellItem)
    .innerJoin(Product, eq(UpsellItem.productId, Product.id))
    .where(and(eq(UpsellItem.active, true), eq(Product.active, true)))
    .orderBy(UpsellItem.sortOrder);

  // mantenemos exactamente el shape que tu UpsellModal ya espera
  const products = rows.map(({ sortOrder, ...p }) => p);

  return json({ products });
};
