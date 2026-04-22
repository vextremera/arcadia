import { d as db, s as UpsellItem } from './_astro_db_Bcz5lWRF.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

const POST = async (context) => {
  const u = context.locals.user;
  if (!u || u.role !== "ADMIN" && u.role !== "STAFF") return context.redirect("/admin/login");
  const form = await context.request.formData();
  const id = Number(form.get("id"));
  const sortOrder = Number(form.get("sortOrder"));
  const active = form.get("active") === "on";
  if (!Number.isFinite(id)) return new Response("Bad id", {
    status: 400
  });
  await db.update(UpsellItem).set({
    active,
    sortOrder: Number.isFinite(sortOrder) ? Math.floor(sortOrder) : 0
  }).where(eq(UpsellItem.id, id));
  return context.redirect("/admin/upsell");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
