import type { APIRoute } from "astro";
import { db, Favorite, eq, and } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function parseJSON(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return json({ error: "UNAUTHORIZED" }, 401);

  const body = await parseJSON(request);
  if (!body) return json({ error: "INVALID_JSON" }, 400);

  const productId = Number(body.productId);
  if (!Number.isFinite(productId)) return json({ error: "INVALID_PRODUCT_ID" }, 400);

  const existing = await db
    .select({ id: Favorite.id })
    .from(Favorite)
    .where(and(eq(Favorite.userId, user.id), eq(Favorite.productId, productId)))
    .limit(1);

  if (existing.length) {
    await db.delete(Favorite).where(and(eq(Favorite.userId, user.id), eq(Favorite.productId, productId)));
    return json({ favorited: false });
  }

  await db.insert(Favorite).values({ userId: user.id, productId });
  return json({ favorited: true });
};
