import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";

type DeliveryFeeSetting = {
  cents: number;
};

type LegacyFeesSetting = {
  deliveryFeeCents?: number;
  [key: string]: unknown;
};

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseEuroToCents(value: FormDataEntryValue | null) {
  const raw = safeText(value).replace(",", ".");
  if (!raw) return null;

  const amount = Number(raw);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return Math.round(amount * 100);
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

async function upsertSetting(key: string, value: unknown, id?: number) {
  if (id) {
    await db
      .update(AppSetting)
      .set({
        value,
        updatedAt: new Date(),
      })
      .where(eq(AppSetting.id, id));

    return id;
  }

  const nextId = await getNextId();
  await db.insert(AppSetting).values({
    id: nextId,
    key,
    value,
    updatedAt: new Date(),
  });

  return nextId;
}

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin) {
    return context.redirect("/admin/login");
  }

  const cents = parseEuroToCents((await context.request.formData()).get("deliveryFeeEur"));
  if (cents === null) {
    return context.redirect(withQuery("/admin/ajustes/fees", { error: "invalid-fee" }));
  }

  const { ip, userAgent } = getRequestAuditMeta(context.request);
  const actorAdminId = admin.id;

  const previousDeliveryFee = await getSettingValue<DeliveryFeeSetting>("deliveryFee", { cents: 0 });
  const previousLegacyFees = await getSettingValue<LegacyFeesSetting>("fees", { deliveryFeeCents: 0 });

  const nextDeliveryFee: DeliveryFeeSetting = { cents };
  const nextLegacyFees: LegacyFeesSetting = {
    ...(previousLegacyFees.value ?? {}),
    deliveryFeeCents: cents,
  };

  await upsertSetting("deliveryFee", nextDeliveryFee, previousDeliveryFee.id);
  await upsertSetting("fees", nextLegacyFees, previousLegacyFees.id);

  try {
    await writeAuditLog({
      actorAdminId,
      action: "FEES_SETTINGS_UPDATED",
      entityType: "app_setting",
      entityId: "deliveryFee",
      diff: {
        previous: {
          deliveryFee: previousDeliveryFee.value,
          fees: previousLegacyFees.value,
        },
        next: {
          deliveryFee: nextDeliveryFee,
          fees: nextLegacyFees,
        },
      },
      ip,
      userAgent,
    });
  } catch (error) {
    console.error("[audit] fees settings failed", error);
  }

  return context.redirect(withQuery("/admin/ajustes/fees", { saved: "1" }));
};