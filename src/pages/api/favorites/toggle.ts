import type { APIRoute } from "astro";
import { db, Favorite, eq, and } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, session }) => {
  if (!session) return json({ error: "NO_SESSION" }, 401);

  const user = (await session.get("user")) as
    | { id: number; role: "ADMIN" | "STAFF" | "CUSTOMER" }
    | undefined;

  if (!user || user.role !== "CUSTOMER") {
    return json({ error: "UNAUTHORIZED" }, 401);
  }

  const body = await request.json().catch(() => null);
  const productId = Number(body?.productId);

  if (!Number.isFinite(productId)) {
    return json({ error: "INVALID_PRODUCT_ID" }, 400);
  }

  const [existing] = await db
    .select({ id: Favorite.id })
    .from(Favorite)
    .where(and(eq(Favorite.userId, user.id), eq(Favorite.productId, productId)))
    .limit(1);

  if (existing) {
    await db
      .delete(Favorite)
      .where(and(eq(Favorite.userId, user.id), eq(Favorite.productId, productId)));

    return json({ ok: true, favorited: false });
  }

  await db.insert(Favorite).values({
    userId: user.id,
    productId,
  });

  return json({ ok: true, favorited: true });
};
