import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

type DeliveryFeeSetting = {
  cents: number;
};

function parseEurToCents(v: string) {
  const n = Number(String(v ?? "").replace(",", "."));
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n * 100));
}

export const POST: APIRoute = async (context) => {
  const u = context.locals.user;
  if (!u || (u.role !== "ADMIN" && u.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const deliveryFeeEur = String(form.get("deliveryFeeEur") ?? "0");
  const cents = parseEurToCents(deliveryFeeEur);
  const value: DeliveryFeeSetting = { cents };

  const [existing] = await db
    .select({ key: AppSetting.key })
    .from(AppSetting)
    .where(eq(AppSetting.key, "deliveryFee"))
    .limit(1);

  if (existing) {
    await db
      .update(AppSetting)
      .set({ value, updatedAt: new Date() })
      .where(eq(AppSetting.key, "deliveryFee"));
  } else {
    await db.insert(AppSetting).values({ key: "deliveryFee", value });
  }

  const [legacy] = await db
    .select({ key: AppSetting.key })
    .from(AppSetting)
    .where(eq(AppSetting.key, "fees"))
    .limit(1);

  if (legacy) {
    await db
      .update(AppSetting)
      .set({
        value: { deliveryFeeCents: cents },
        updatedAt: new Date(),
      })
      .where(eq(AppSetting.key, "fees"));
  }

  return context.redirect("/admin/ajustes/fees?saved=1");
};