import { d as db, A as AppSetting } from '../../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

function parseEurToCents(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}
const POST = async (context) => {
  const u = context.locals.user;
  if (!u || u.role !== "ADMIN" && u.role !== "STAFF") {
    return context.redirect("/admin/login");
  }
  const form = await context.request.formData();
  const deliveryFeeEur = String(form.get("deliveryFeeEur") ?? "0");
  const cents = parseEurToCents(deliveryFeeEur);
  const value = {
    cents
  };
  const [existing] = await db.select({
    key: AppSetting.key
  }).from(AppSetting).where(eq(AppSetting.key, "deliveryFee")).limit(1);
  if (existing) {
    await db.update(AppSetting).set({
      value,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(AppSetting.key, "deliveryFee"));
  } else {
    await db.insert(AppSetting).values({
      key: "deliveryFee",
      value
    });
  }
  const [legacy] = await db.select({
    key: AppSetting.key
  }).from(AppSetting).where(eq(AppSetting.key, "fees")).limit(1);
  if (legacy) {
    await db.update(AppSetting).set({
      value: {
        deliveryFeeCents: cents
      },
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(AppSetting.key, "fees"));
  }
  return context.redirect("/admin/ajustes/fees?saved=1");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
