import { d as db, A as AppSetting } from './_astro_db_Bcz5lWRF.mjs';
import { g as getRequestAuditMeta, w as writeAuditLog } from './log_54D100FY.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

const DEFAULT_OPERATING_HOURS = {
  open: {
    start: "07:30",
    end: "00:00"
  },
  kitchen: {
    start: "08:00",
    end: "23:20"
  },
  delivery: {
    start: "20:00",
    end: "22:50"
  }
};
const DEFAULT_DELIVERY_FEE = {
  cents: 0
};
const DEFAULT_OPS_FLAGS = {
  pauseOrders: false,
  forcePickup: false
};
const DEFAULT_DELIVERY_AREA_RULE = {
  enabled: false
};
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
function parseTime(value, mode) {
  const raw = safeText(value);
  const match = raw.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  if (mode === "close" && hour === 0 && minute === 0) {
    return 24 * 60;
  }
  return hour * 60 + minute;
}
function parseEuroToCents(value) {
  const raw = safeText(value).replace(",", ".");
  if (!raw) return 0;
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
  const form = await context.request.formData();
  const openStart = safeText(form.get("openStart"));
  const openEnd = safeText(form.get("openEnd"));
  const kitchenStart = safeText(form.get("kitchenStart"));
  const kitchenEnd = safeText(form.get("kitchenEnd"));
  const deliveryStart = safeText(form.get("deliveryStart"));
  const deliveryEnd = safeText(form.get("deliveryEnd"));
  const openStartMins = parseTime(form.get("openStart"), "open");
  const openEndMins = parseTime(form.get("openEnd"), "close");
  const kitchenStartMins = parseTime(form.get("kitchenStart"), "open");
  const kitchenEndMins = parseTime(form.get("kitchenEnd"), "close");
  const deliveryStartMins = parseTime(form.get("deliveryStart"), "open");
  const deliveryEndMins = parseTime(form.get("deliveryEnd"), "close");
  const allValidHours = openStartMins !== null && openEndMins !== null && kitchenStartMins !== null && kitchenEndMins !== null && deliveryStartMins !== null && deliveryEndMins !== null && openStartMins < openEndMins && kitchenStartMins < kitchenEndMins && deliveryStartMins < deliveryEndMins;
  if (!allValidHours) {
    return context.redirect(withQuery("/admin/operativa", {
      hoursError: "invalid-hours"
    }));
  }
  const feeCents = parseEuroToCents(form.get("deliveryFeeEur"));
  if (feeCents === null) {
    return context.redirect(withQuery("/admin/operativa", {
      hoursError: "invalid-hours"
    }));
  }
  const nextOperatingHours = {
    open: {
      start: openStart,
      end: openEnd
    },
    kitchen: {
      start: kitchenStart,
      end: kitchenEnd
    },
    delivery: {
      start: deliveryStart,
      end: deliveryEnd
    }
  };
  const nextDeliveryFee = {
    cents: feeCents
  };
  const nextOpsFlags = {
    pauseOrders: form.get("pauseOrders") === "on",
    forcePickup: form.get("forcePickup") === "on"
  };
  const nextDeliveryAreaRule = {
    enabled: form.get("deliveryAreaEnabled") === "on"
  };
  const previousOperatingHours = await getSettingValue("operatingHours", DEFAULT_OPERATING_HOURS);
  const previousDeliveryFee = await getSettingValue("deliveryFee", DEFAULT_DELIVERY_FEE);
  const previousLegacyFees = await getSettingValue("fees", {
    deliveryFeeCents: DEFAULT_DELIVERY_FEE.cents
  });
  const previousOpsFlags = await getSettingValue("opsFlags", DEFAULT_OPS_FLAGS);
  const previousDeliveryAreaRule = await getSettingValue("deliveryAreaRule", DEFAULT_DELIVERY_AREA_RULE);
  const nextLegacyFees = {
    ...previousLegacyFees.value ?? {},
    deliveryFeeCents: feeCents
  };
  await upsertSetting("operatingHours", nextOperatingHours, previousOperatingHours.id);
  await upsertSetting("deliveryFee", nextDeliveryFee, previousDeliveryFee.id);
  await upsertSetting("fees", nextLegacyFees, previousLegacyFees.id);
  await upsertSetting("opsFlags", nextOpsFlags, previousOpsFlags.id);
  await upsertSetting("deliveryAreaRule", nextDeliveryAreaRule, previousDeliveryAreaRule.id);
  const {
    ip,
    userAgent
  } = getRequestAuditMeta(context.request);
  const actorUserId = user.id;
  try {
    await writeAuditLog({
      actorUserId,
      action: "OPERATING_HOURS_UPDATED",
      entityType: "operating_hours",
      entityId: "operatingHours",
      diff: {
        previous: previousOperatingHours.value,
        next: nextOperatingHours
      },
      ip,
      userAgent
    });
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
    await writeAuditLog({
      actorUserId,
      action: "OPS_FLAGS_UPDATED",
      entityType: "ops_flags",
      entityId: "opsFlags",
      diff: {
        previous: previousOpsFlags.value,
        next: nextOpsFlags
      },
      ip,
      userAgent
    });
    await writeAuditLog({
      actorUserId,
      action: "DELIVERY_AREA_RULE_UPDATED",
      entityType: "app_setting",
      entityId: "deliveryAreaRule",
      diff: {
        previous: previousDeliveryAreaRule.value,
        next: nextDeliveryAreaRule
      },
      ip,
      userAgent
    });
  } catch (error) {
    console.error("[audit] operativa save failed", error);
  }
  return context.redirect(withQuery("/admin/operativa", {
    saved: "1"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
