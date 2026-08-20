import type { APIRoute } from "astro";
import { and, db, eq, Allergen, Product, ProductAllergen } from "astro:db";

function parseId(value: string | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function redirectToProduct(productId: number, params: Record<string, string> = {}) {
  return `${withQuery(`/admin/catalogo/productos/${productId}`, params)}#alergenos`;
}

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin) {
    return context.redirect("/admin/login");
  }

  const productId = parseId(context.params.id);
  if (!productId) {
    return context.redirect("/admin/catalogo/productos?error=invalid-id");
  }

  const [product] = await db
    .select({ id: Product.id })
    .from(Product)
    .where(eq(Product.id, productId))
    .limit(1);

  if (!product) {
    return context.redirect("/admin/catalogo/productos?error=not-found");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent === "create") {
    const allergenId = parseId(String(form.get("allergenId") ?? ""));
    if (!allergenId) {
      return context.redirect(redirectToProduct(productId, { allergenError: "invalid-allergen" }));
    }

    const [allergen] = await db
      .select({
        id: Allergen.id,
        active: Allergen.active,
      })
      .from(Allergen)
      .where(eq(Allergen.id, allergenId))
      .limit(1);

    if (!allergen || !allergen.active) {
      return context.redirect(redirectToProduct(productId, { allergenError: "invalid-allergen" }));
    }

    const [existingLink] = await db
      .select({ id: ProductAllergen.id })
      .from(ProductAllergen)
      .where(
        and(
          eq(ProductAllergen.productId, productId),
          eq(ProductAllergen.allergenId, allergenId)
        )
      )
      .limit(1);

    if (existingLink) {
      return context.redirect(redirectToProduct(productId, { allergenError: "duplicate-link" }));
    }

    const existing = await db.select({ id: ProductAllergen.id }).from(ProductAllergen);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(ProductAllergen).values({
      id: nextId,
      productId,
      allergenId,
      createdAt: new Date(),
    });

    return context.redirect(redirectToProduct(productId, { allergenSaved: "1" }));
  }

  if (intent === "delete") {
    const productAllergenId = parseId(String(form.get("productAllergenId") ?? ""));
    if (!productAllergenId) {
      return context.redirect(redirectToProduct(productId, { allergenError: "invalid-link" }));
    }

    const [link] = await db
      .select({
        id: ProductAllergen.id,
        productId: ProductAllergen.productId,
      })
      .from(ProductAllergen)
      .where(
        and(
          eq(ProductAllergen.id, productAllergenId),
          eq(ProductAllergen.productId, productId)
        )
      )
      .limit(1);

    if (!link) {
      return context.redirect(redirectToProduct(productId, { allergenError: "not-found" }));
    }

    await db.delete(ProductAllergen).where(eq(ProductAllergen.id, productAllergenId));
    return context.redirect(redirectToProduct(productId, { allergenSaved: "1" }));
  }

  return context.redirect(redirectToProduct(productId, { allergenError: "invalid-intent" }));
};