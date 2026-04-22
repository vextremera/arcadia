import { d as db, e as Product, C as Category } from './_astro_db_Bcz5lWRF.mjs';
import { g as getImageFileFromFormDataEntry, u as uploadProductImage, P as ProductImageUploadError, p as productImageErrorToQuery } from './product-images_xs5z7sb1.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

function parseId(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}
function parseEurToCents(value) {
  const raw = String(value ?? "").trim().replace(",", ".");
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}
function toNullableText(value) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}
function slugify(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/gi, "n").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function safeRedirectTo(value, fallback) {
  const s = String(value ?? "").trim();
  if (!s) return fallback;
  return s.startsWith("/admin/") ? s : fallback;
}
function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
const POST = async (context) => {
  const user = context.locals.user;
  if (!user || user.role !== "ADMIN" && user.role !== "STAFF") {
    return context.redirect("/admin/login");
  }
  const id = parseId(context.params.id);
  if (!id) {
    return context.redirect("/admin/catalogo/productos?error=invalid-id");
  }
  const [existing] = await db.select({
    id: Product.id,
    categoryId: Product.categoryId,
    name: Product.name,
    slug: Product.slug,
    description: Product.description,
    details: Product.details,
    imageUrl: Product.imageUrl,
    priceCents: Product.priceCents,
    deliveryEnabled: Product.deliveryEnabled,
    pickupEnabled: Product.pickupEnabled,
    dineInEnabled: Product.dineInEnabled,
    active: Product.active
  }).from(Product).where(eq(Product.id, id)).limit(1);
  if (!existing) {
    return context.redirect("/admin/catalogo/productos?error=not-found");
  }
  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "save-base");
  const detailPath = `/admin/catalogo/productos/${id}`;
  if (intent === "toggle-active") {
    const nextActive = String(form.get("nextActive") ?? "") === "true";
    const redirectTo = safeRedirectTo(form.get("redirectTo"), "/admin/catalogo/productos");
    await db.update(Product).set({
      active: nextActive,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(Product.id, id));
    return context.redirect(withQuery(redirectTo, {
      saved: "1"
    }));
  }
  const name = String(form.get("name") ?? "").trim();
  const slugInput = String(form.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);
  const categoryId = Number(form.get("categoryId"));
  const priceCents = parseEurToCents(form.get("priceEur"));
  if (!name) {
    return context.redirect(withQuery(detailPath, {
      error: "missing-name"
    }));
  }
  if (!slug) {
    return context.redirect(withQuery(detailPath, {
      error: "invalid-slug"
    }));
  }
  if (!Number.isFinite(categoryId)) {
    return context.redirect(withQuery(detailPath, {
      error: "invalid-category"
    }));
  }
  if (priceCents === null) {
    return context.redirect(withQuery(detailPath, {
      error: "invalid-price"
    }));
  }
  const [category] = await db.select({
    id: Category.id
  }).from(Category).where(eq(Category.id, categoryId)).limit(1);
  if (!category) {
    return context.redirect(withQuery(detailPath, {
      error: "invalid-category"
    }));
  }
  const [slugMatch] = await db.select({
    id: Product.id
  }).from(Product).where(eq(Product.slug, slug)).limit(1);
  if (slugMatch && slugMatch.id !== id) {
    return context.redirect(withQuery(detailPath, {
      error: "duplicate-slug"
    }));
  }
  const removeImage = form.get("removeImage") === "on";
  let nextImageUrl = removeImage ? null : existing.imageUrl ?? null;
  const imageFile = getImageFileFromFormDataEntry(form.get("imageFile"));
  if (imageFile) {
    try {
      const uploaded = await uploadProductImage({
        file: imageFile,
        productName: name,
        productSlug: slug,
        alt: name
      });
      nextImageUrl = uploaded.url;
    } catch (error) {
      if (error instanceof ProductImageUploadError) {
        return context.redirect(withQuery(detailPath, {
          error: productImageErrorToQuery(error.code)
        }));
      }
      return context.redirect(withQuery(detailPath, {
        error: "image-upload-failed"
      }));
    }
  }
  await db.update(Product).set({
    categoryId,
    name,
    slug,
    description: toNullableText(form.get("description")),
    details: toNullableText(form.get("details")),
    imageUrl: nextImageUrl,
    priceCents,
    deliveryEnabled: form.get("deliveryEnabled") === "on",
    pickupEnabled: form.get("pickupEnabled") === "on",
    dineInEnabled: form.get("dineInEnabled") === "on",
    active: form.get("active") === "on",
    updatedAt: /* @__PURE__ */ new Date()
  }).where(eq(Product.id, id));
  return context.redirect(withQuery(detailPath, {
    saved: "1"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
