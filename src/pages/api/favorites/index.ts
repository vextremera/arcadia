import type { APIRoute } from "astro";
import { db, Favorite, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "UNAUTHORIZED" }, 401);

  const rows = await db
    .select({ productId: Favorite.productId })
    .from(Favorite)
    .where(eq(Favorite.userId, user.id));

  return json({ productIds: rows.map((r) => r.productId) });
};
