import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

export const POST: APIRoute = async (context) => {
  const u = context.locals.user;
  if (!u || (u.role !== "ADMIN" && u.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();

  const value = {
    delivery: {
      cashEnabled: form.get("deliveryCash") === "on",
      cardEnabled: form.get("deliveryCard") === "on",
    },
    pickup: {
      cashEnabled: form.get("pickupCash") === "on",
      cardEnabled: form.get("pickupCard") === "on",
    },
  };

  const [existing] = await db
    .select({ key: AppSetting.key })
    .from(AppSetting)
    .where(eq(AppSetting.key, "payments"))
    .limit(1);

  if (existing) {
    await db.update(AppSetting).set({ value }).where(eq(AppSetting.key, "payments"));
  } else {
    await db.insert(AppSetting).values({ key: "payments", value });
  }

  return context.redirect("/admin/ajustes/pagos");
};
