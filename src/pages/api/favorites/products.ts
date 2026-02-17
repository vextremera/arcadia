import type { APIRoute } from "astro";
import { db, Favorite, Product, eq, and, desc } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * Productos favoritos del usuario (para la vista "Favoritos" en /pedir).
 * Requiere sesión de CUSTOMER.
 */
export const GET: APIRoute = async ({ session }) => {
  if (!session) return json({ error: "UNAUTHORIZED" }, 401);

  const user = (await session.get("user")) as
    | { id: number; role: "ADMIN" | "STAFF" | "CUSTOMER" }
    | undefined;

  if (!user || user.role !== "CUSTOMER") {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

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
    .from(Favorite)
    .innerJoin(Product, eq(Favorite.productId, Product.id))
    .where(and(eq(Favorite.userId, user.id), eq(Product.active, true)))
    .orderBy(desc(Favorite.createdAt));

  return json({ products });
};
