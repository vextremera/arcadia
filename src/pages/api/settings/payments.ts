import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const DEFAULTS = {
  delivery: { cashEnabled: true, cardEnabled: true },
  pickup: { cashEnabled: true, cardEnabled: true },
};

export const GET: APIRoute = async () => {
  const [row] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, "payments"))
    .limit(1);

  return json(row?.value ?? DEFAULTS);
};
