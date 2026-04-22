import { d as db, A as AppSetting } from './_astro_db_Bcz5lWRF.mjs';
import { g as getRequestAuditMeta, w as writeAuditLog } from './log_54D100FY.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
function safeText(value) {
  return String(value ?? "").trim();
}
function parseEuroToCents(value) {
  const raw = safeText(value).replace(",", ".");
  if (!raw) return null;
  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return Math.round(amount * 100);
}
async function getNextId() {
  const rows = await db.select({
    id: AppSetting.id
  }).from(AppSetting);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}
async function getSettingValue(key, fallback) {
  const [row] = await db.select({
    id: AppSetting.id,
    value: AppSetting.value
  }).from(AppSetting).where(eq(AppSetting.key, key)).limit(1);
  return {
    id: row?.id,
    value: row?.value ?? fallback
  };
}
async function upsertSetting(key, value, id) {
  if (id) {
    await db.update(AppSetting).set({
      value,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(AppSetting.id, id));
    return id;
  }
  const nextId = await getNextId();
  await db.insert(AppSetting).values({
    id: nextId,
    key,
    value,
    updatedAt: /* @__PURE__ */ new Date()
  });
  return nextId;
}
const POST = async (context) => {
  const user = context.locals.user;
  const allowed = user && (user.role === "ADMIN" || user.role === "STAFF");
  if (!allowed) {
    return context.redirect("/admin/login");
  }
  const cents = parseEuroToCents((await context.request.formData()).get("deliveryFeeEur"));
  if (cents === null) {
    return context.redirect(withQuery("/admin/ajustes/fees", {
      error: "invalid-fee"
    }));
  }
  const {
    ip,
    userAgent
  } = getRequestAuditMeta(context.request);
  const actorUserId = user.id;
  const previousDeliveryFee = await getSettingValue("deliveryFee", {
    cents: 0
  });
  const previousLegacyFees = await getSettingValue("fees", {
    deliveryFeeCents: 0
  });
  const nextDeliveryFee = {
    cents
  };
  const nextLegacyFees = {
    ...previousLegacyFees.value ?? {},
    deliveryFeeCents: cents
  };
  await upsertSetting("deliveryFee", nextDeliveryFee, previousDeliveryFee.id);
  await upsertSetting("fees", nextLegacyFees, previousLegacyFees.id);
  try {
    await writeAuditLog({
      actorUserId,
      action: "FEES_SETTINGS_UPDATED",
      entityType: "app_setting",
      entityId: "deliveryFee",
      diff: {
        previous: {
          deliveryFee: previousDeliveryFee.value,
          fees: previousLegacyFees.value
        },
        next: {
          deliveryFee: nextDeliveryFee,
          fees: nextLegacyFees
        }
      },
      ip,
      userAgent
    });
  } catch (error) {
    console.error("[audit] fees settings failed", error);
  }
  return context.redirect(withQuery("/admin/ajustes/fees", {
    saved: "1"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
