import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

type OperatingHoursSetting = {
  open: { start: string; end: string };
  kitchen: { start: string; end: string };
  delivery: { start: string; end: string };
};

type DeliveryFeeSetting = {
  cents: number;
};

type OpsFlagsSetting = {
  pauseOrders: boolean;
  forcePickup: boolean;
};

function toCents(v: string) {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

function safeTime(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  return /^\d{2}:\d{2}$/.test(raw) ? raw : fallback;
}

async function upsertSetting<T>(key: string, value: T) {
  const [existing] = await db
    .select({ key: AppSetting.key })
    .from(AppSetting)
    .where(eq(AppSetting.key, key))
    .limit(1);

  if (existing) {
    await db
      .update(AppSetting)
      .set({ value, updatedAt: new Date() })
      .where(eq(AppSetting.key, key));
  } else {
    await db.insert(AppSetting).values({ key, value });
  }
}

export const POST: APIRoute = async (context) => {
  const u = context.locals.user;
  if (!u || (u.role !== "ADMIN" && u.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();

  const operatingHours: OperatingHoursSetting = {
    open: {
      start: safeTime(form.get("openStart"), "07:30"),
      end: safeTime(form.get("openEnd"), "00:00"),
    },
    kitchen: {
      start: safeTime(form.get("kitchenStart"), "08:00"),
      end: safeTime(form.get("kitchenEnd"), "23:20"),
    },
    delivery: {
      start: safeTime(form.get("deliveryStart"), "20:00"),
      end: safeTime(form.get("deliveryEnd"), "22:50"),
    },
  };

  const deliveryFee: DeliveryFeeSetting = {
    cents: toCents(String(form.get("deliveryFeeEur") ?? "0")),
  };

  const opsFlags: OpsFlagsSetting = {
    pauseOrders: form.get("pauseOrders") === "on",
    forcePickup: form.get("forcePickup") === "on",
  };

  await upsertSetting("operatingHours", operatingHours);
  await upsertSetting("deliveryFee", deliveryFee);
  await upsertSetting("opsFlags", opsFlags);

  const [legacyFees] = await db
    .select({ key: AppSetting.key })
    .from(AppSetting)
    .where(eq(AppSetting.key, "fees"))
    .limit(1);

  if (legacyFees) {
    await db
      .update(AppSetting)
      .set({
        value: { deliveryFeeCents: deliveryFee.cents },
        updatedAt: new Date(),
      })
      .where(eq(AppSetting.key, "fees"));
  }

  return context.redirect("/admin/operativa?saved=1");
};