import type { APIRoute } from "astro";
import { db, Category, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async () => {
  const categories = await db
    .select({
      id: Category.id,
      name: Category.name,
      slug: Category.slug,
      sortOrder: Category.sortOrder,
    })
    .from(Category)
    .where(eq(Category.active, true))
    .orderBy(Category.sortOrder);

  return json({ categories });
};
