import { d as db, r as UpsellItem } from '../../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

const POST = async (context) => {
  const u = context.locals.user;
  if (!u || u.role !== "ADMIN" && u.role !== "STAFF") return context.redirect("/admin/login");
  const form = await context.request.formData();
  const id = Number(form.get("id"));
  if (!Number.isFinite(id)) return new Response("Bad id", {
    status: 400
  });
  await db.delete(UpsellItem).where(eq(UpsellItem.id, id));
  return context.redirect("/admin/upsell");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
