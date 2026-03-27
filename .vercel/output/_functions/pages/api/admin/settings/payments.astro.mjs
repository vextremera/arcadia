import { d as db, A as AppSetting } from '../../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

const POST = async (context) => {
  const u = context.locals.user;
  if (!u || u.role !== "ADMIN" && u.role !== "STAFF") {
    return context.redirect("/admin/login");
  }
  const form = await context.request.formData();
  const value = {
    delivery: {
      cashEnabled: form.get("deliveryCash") === "on",
      cardEnabled: form.get("deliveryCard") === "on"
    },
    pickup: {
      cashEnabled: form.get("pickupCash") === "on",
      cardEnabled: form.get("pickupCard") === "on"
    }
  };
  const [existing] = await db.select({
    key: AppSetting.key
  }).from(AppSetting).where(eq(AppSetting.key, "payments")).limit(1);
  if (existing) {
    await db.update(AppSetting).set({
      value,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(AppSetting.key, "payments"));
  } else {
    await db.insert(AppSetting).values({
      key: "payments",
      value
    });
  }
  return context.redirect("/admin/ajustes/pagos?saved=1");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
