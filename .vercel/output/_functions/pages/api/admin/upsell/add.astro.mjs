import { d as db, r as UpsellItem } from '../../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq, desc } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

const POST = async (context) => {
  const u = context.locals.user;
  if (!u || u.role !== "ADMIN" && u.role !== "STAFF") return context.redirect("/admin/login");
  const form = await context.request.formData();
  const productId = Number(form.get("productId"));
  if (!Number.isFinite(productId)) return new Response("Bad productId", {
    status: 400
  });
  const [existing] = await db.select({
    id: UpsellItem.id
  }).from(UpsellItem).where(eq(UpsellItem.productId, productId)).limit(1);
  const [last] = await db.select({
    sortOrder: UpsellItem.sortOrder
  }).from(UpsellItem).orderBy(desc(UpsellItem.sortOrder)).limit(1);
  const nextOrder = (last?.sortOrder ?? 0) + 1;
  if (existing) {
    await db.update(UpsellItem).set({
      active: true,
      sortOrder: nextOrder
    }).where(eq(UpsellItem.id, existing.id));
  } else {
    await db.insert(UpsellItem).values({
      productId,
      sortOrder: nextOrder,
      active: true
    });
  }
  return context.redirect("/admin/upsell");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
