import type { APIRoute } from "astro";
import { db, Category, Product, CategoryIngredient, eq } from "astro:db";

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseSortOrder(value: FormDataEntryValue | null, fallback = 0) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

const REDIRECT_PATH = "/admin/categorias";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "create") {
    const name = String(form.get("name") ?? "").trim();
    const slugInput = String(form.get("slug") ?? "").trim();
    const slug = slugify(slugInput || name);
    const sortOrder = parseSortOrder(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    const [slugMatch] = await db
      .select({ id: Category.id })
      .from(Category)
      .where(eq(Category.slug, slug))
      .limit(1);

    if (slugMatch) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-slug" }));
    }

    const existing = await db.select({ id: Category.id }).from(Category);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(Category).values({
      id: nextId,
      name,
      slug,
      sortOrder,
      active,
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  const categoryId = parseId(form.get("categoryId"));
  if (!categoryId) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-category" }));
  }

  const [existingCategory] = await db
    .select({
      id: Category.id,
      slug: Category.slug,
    })
    .from(Category)
    .where(eq(Category.id, categoryId))
    .limit(1);

  if (!existingCategory) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "not-found" }));
  }

  if (intent === "update") {
    const name = String(form.get("name") ?? "").trim();
    const slugInput = String(form.get("slug") ?? "").trim();
    const slug = slugify(slugInput || name);
    const sortOrder = parseSortOrder(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    const [slugMatch] = await db
      .select({ id: Category.id })
      .from(Category)
      .where(eq(Category.slug, slug))
      .limit(1);

    if (slugMatch && slugMatch.id !== categoryId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-slug" }));
    }

    await db
      .update(Category)
      .set({
        name,
        slug,
        sortOrder,
        active,
      })
      .where(eq(Category.id, categoryId));

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  if (intent === "delete") {
    const productLinks = await db
      .select({ id: Product.id })
      .from(Product)
      .where(eq(Product.categoryId, categoryId));

    if (productLinks.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "in-use-products" }));
    }

    const ingredientLinks = await db
      .select({ id: CategoryIngredient.id })
      .from(CategoryIngredient)
      .where(eq(CategoryIngredient.categoryId, categoryId));

    if (ingredientLinks.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "in-use-ingredients" }));
    }

    await db.delete(Category).where(eq(Category.id, categoryId));
    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-intent" }));
};