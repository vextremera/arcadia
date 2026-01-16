import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

export const POST: APIRoute = async ({ request, locals, redirect, session }) => {
  if (!session) return new Response("Session not available", { status: 500 });
  if (!locals.user) return new Response("Unauthorized", { status: 401 });
  if (locals.user.role !== "ADMIN") return new Response("Forbidden", { status: 403 });

  const form = await request.formData();

  const value = {
    delivery: {
      cashEnabled: form.get("delivery_cash") != null,
      cardEnabled: form.get("delivery_card") != null,
    },
    pickup: {
      cashEnabled: form.get("pickup_cash") != null,
      cardEnabled: form.get("pickup_card") != null,
    },
  };

  const [row] = await db
    .select({ id: AppSetting.id })
    .from(AppSetting)
    .where(eq(AppSetting.key, "payments"))
    .limit(1);

  if (row) {
    await db.update(AppSetting).set({ value }).where(eq(AppSetting.id, row.id));
  } else {
    await db.insert(AppSetting).values({ key: "payments", value });
  }

  return redirect("/admin/ajustes/pagos", 302);
};
