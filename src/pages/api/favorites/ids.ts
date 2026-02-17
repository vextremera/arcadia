import type { APIRoute } from "astro";
import { db, Favorite, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ session }) => {
  if (!session) return json({ ids: [] });

  const user = (await session.get("user")) as
    | { id: number; role: "ADMIN" | "STAFF" | "CUSTOMER" }
    | undefined;

  if (!user || user.role !== "CUSTOMER") return json({ ids: [] });

  const rows = await db
    .select({ productId: Favorite.productId })
    .from(Favorite)
    .where(eq(Favorite.userId, user.id));

  return json({ ids: rows.map((r) => r.productId) });
};
