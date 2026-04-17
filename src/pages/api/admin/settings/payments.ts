import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

async function getNextId() {
  const rows = await db.select({ id: AppSetting.id }).from(AppSetting);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

async function getSettingValue<T>(key: string, fallback: T): Promise<{ id?: number; value: T }> {
  const [row] = await db
    .select({
      id: AppSetting.id,
      value: AppSetting.value,
    })
    .from(AppSetting)
    .where(eq(AppSetting.key, key))
    .limit(1);

  return {
    id: row?.id,
    value: (row?.value ?? fallback) as T,
  };
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  const allowed = user && (user.role === "ADMIN" || user.role === "STAFF");
  if (!allowed) {
    return context.redirect("/admin/login");
  }

  const { ip, userAgent } = getRequestAuditMeta(context.request);
  const actorUserId = user.id;

  const form = await context.request.formData();

  const nextValue = {
    delivery: {
      cashEnabled: form.get("deliveryCash") === "on",
      cardEnabled: form.get("deliveryCard") === "on",
    },
    pickup: {
      cashEnabled: form.get("pickupCash") === "on",
      cardEnabled: form.get("pickupCard") === "on",
    },
  };

  const previous = await getSettingValue("payments", {
    delivery: { cashEnabled: true, cardEnabled: true },
    pickup: { cashEnabled: true, cardEnabled: true },
  });

  if (previous.id) {
    await db
      .update(AppSetting)
      .set({
        value: nextValue,
        updatedAt: new Date(),
      })
      .where(eq(AppSetting.id, previous.id));
  } else {
    const nextId = await getNextId();
    await db.insert(AppSetting).values({
      id: nextId,
      key: "payments",
      value: nextValue,
      updatedAt: new Date(),
    });
  }

  try {
    await writeAuditLog({
      actorUserId,
      action: "PAYMENTS_SETTINGS_UPDATED",
      entityType: "app_setting",
      entityId: "payments",
      diff: {
        previous: previous.value,
        next: nextValue,
      },
      ip,
      userAgent,
    });
  } catch (error) {
    console.error("[audit] payments settings failed", error);
  }

  return context.redirect(withQuery("/admin/ajustes/pagos", { saved: "1" }));
};