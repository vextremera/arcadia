import { d as db, A as AppSetting } from '../../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

function toCents(v) {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}
function safeTime(value, fallback) {
  const raw = String(value ?? "").trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
}
async function upsertSetting(key, value) {
  const [existing] = await db.select({
    key: AppSetting.key
  }).from(AppSetting).where(eq(AppSetting.key, key)).limit(1);
  if (existing) {
    await db.update(AppSetting).set({
      value,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(AppSetting.key, key));
  } else {
    await db.insert(AppSetting).values({
      key,
      value
    });
  }
}
const POST = async (context) => {
  const u = context.locals.user;
  if (!u || u.role !== "ADMIN" && u.role !== "STAFF") {
    return context.redirect("/admin/login");
  }
  const form = await context.request.formData();
  const operatingHours = {
    open: {
      start: safeTime(form.get("openStart"), "07:30"),
      end: safeTime(form.get("openEnd"), "00:00")
    },
    kitchen: {
      start: safeTime(form.get("kitchenStart"), "08:00"),
      end: safeTime(form.get("kitchenEnd"), "23:20")
    },
    delivery: {
      start: safeTime(form.get("deliveryStart"), "20:00"),
      end: safeTime(form.get("deliveryEnd"), "22:50")
    }
  };
  const deliveryFee = {
    cents: toCents(String(form.get("deliveryFeeEur") ?? "0"))
  };
  const opsFlags = {
    pauseOrders: form.get("pauseOrders") === "on",
    forcePickup: form.get("forcePickup") === "on"
  };
  await upsertSetting("operatingHours", operatingHours);
  await upsertSetting("deliveryFee", deliveryFee);
  await upsertSetting("opsFlags", opsFlags);
  const [legacyFees] = await db.select({
    key: AppSetting.key
  }).from(AppSetting).where(eq(AppSetting.key, "fees")).limit(1);
  if (legacyFees) {
    await db.update(AppSetting).set({
      value: {
        deliveryFeeCents: deliveryFee.cents
      },
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(AppSetting.key, "fees"));
  }
  return context.redirect("/admin/operativa?saved=1");
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
