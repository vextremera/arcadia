import { d as db, C as Category, e as Product } from './_astro_db_Bcz5lWRF.mjs';
import { g as getImageFileFromFormDataEntry, u as uploadProductImage, P as ProductImageUploadError, p as productImageErrorToQuery } from './product-images_xs5z7sb1.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

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
  const form = await context.request.formData();
  const name = String(form.get("name") ?? "").trim();
  const slugInput = String(form.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);
  const categoryId = Number(form.get("categoryId"));
  const priceCents = parseEurToCents(form.get("priceEur"));
  if (!name) {
    return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
      error: "missing-name"
    }));
  }
  if (!slug) {
    return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
      error: "invalid-slug"
    }));
  }
  if (!Number.isFinite(categoryId)) {
    return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
      error: "invalid-category"
    }));
  }
  if (priceCents === null) {
    return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
      error: "invalid-price"
    }));
  }
  const [category] = await db.select({
    id: Category.id
  }).from(Category).where(eq(Category.id, categoryId)).limit(1);
  if (!category) {
    return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
      error: "invalid-category"
    }));
  }
  const [slugMatch] = await db.select({
    id: Product.id
  }).from(Product).where(eq(Product.slug, slug)).limit(1);
  if (slugMatch) {
    return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
      error: "duplicate-slug"
    }));
  }
  let imageUrl = toNullableText(form.get("imageUrl"));
  const imageFile = getImageFileFromFormDataEntry(form.get("imageFile"));
  if (imageFile) {
    try {
      const uploaded = await uploadProductImage({
        file: imageFile,
        productName: name,
        productSlug: slug,
        alt: name
      });
      imageUrl = uploaded.url;
    } catch (error) {
      if (error instanceof ProductImageUploadError) {
        return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
          error: productImageErrorToQuery(error.code)
        }));
      }
      return context.redirect(withQuery("/admin/catalogo/productos/nuevo", {
        error: "image-upload-failed"
      }));
    }
  }
  const existing = await db.select({
    id: Product.id
  }).from(Product);
  const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
  const now = /* @__PURE__ */ new Date();
  await db.insert(Product).values({
    id: nextId,
    categoryId,
    name,
    slug,
    description: toNullableText(form.get("description")),
    details: toNullableText(form.get("details")),
    imageUrl,
    priceCents,
    deliveryEnabled: form.get("deliveryEnabled") === "on",
    pickupEnabled: form.get("pickupEnabled") === "on",
    dineInEnabled: form.get("dineInEnabled") === "on",
    active: form.get("active") === "on",
    createdAt: now,
    updatedAt: now
  });
  return context.redirect(`/admin/catalogo/productos/${nextId}`);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
