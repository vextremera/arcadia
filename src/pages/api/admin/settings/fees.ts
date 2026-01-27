import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

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
  const value = { deliveryFeeCents: parseEurToCents(deliveryFeeEur) };

  const [existing] = await db
    .select({ key: AppSetting.key })
    .from(AppSetting)
    .where(eq(AppSetting.key, "fees"))
    .limit(1);

  if (existing) {
    await db.update(AppSetting).set({ value }).where(eq(AppSetting.key, "fees"));
  } else {
    await db.insert(AppSetting).values({ key: "fees", value });
  }

  return context.redirect("/admin/ajustes/fees");
};
