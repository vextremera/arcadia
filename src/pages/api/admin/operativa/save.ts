import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

function toCents(eur: string) {
  const n = Number(String(eur ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

async function upsert(key: string, value: any) {
  const [r] = await db.select({ id: AppSetting.id }).from(AppSetting).where(eq(AppSetting.key, key)).limit(1);

  if (r?.id) {
    await db.update(AppSetting).set({ value }).where(eq(AppSetting.id, r.id));
  } else {
    await db.insert(AppSetting).values({ key, value });
  }
}

export const POST: APIRoute = async (context) => {
  const u = context.locals.user;
  if (!u || (u.role !== "ADMIN" && u.role !== "STAFF")) return context.redirect("/admin/login");

  const form = await context.request.formData();

  const operatingHours = {
    kitchen: { start: String(form.get("kitchenStart") ?? "08:00"), end: String(form.get("kitchenEnd") ?? "23:20") },
    delivery: { start: String(form.get("deliveryStart") ?? "20:00"), end: String(form.get("deliveryEnd") ?? "22:50") },
  };

  const deliveryFee = { cents: toCents(String(form.get("deliveryFeeEur") ?? "0")) };

  const opsFlags = {
    pauseOrders: form.get("pauseOrders") === "on",
    forcePickup: form.get("forcePickup") === "on",
  };

  await upsert("operatingHours", operatingHours);
  await upsert("deliveryFee", deliveryFee);
  await upsert("opsFlags", opsFlags);

  return context.redirect("/admin/operativa");
};
