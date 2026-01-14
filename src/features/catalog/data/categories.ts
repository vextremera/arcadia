import { db, Category, eq } from "astro:db";

export async function getActiveCategories() {
  return db
    .select({ id: Category.id, name: Category.name, slug: Category.slug })
    .from(Category)
    .where(eq(Category.active, true))
    .orderBy(Category.sortOrder);
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db
    .select({ id: Category.id, name: Category.name, slug: Category.slug })
    .from(Category)
    .where(eq(Category.slug, slug))
    .limit(1);

  return rows[0] ?? null;
}
