import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

const DEFAULTS = {
  operatingHours: {
    kitchen: { start: "08:00", end: "23:20" },
    delivery: { start: "20:00", end: "22:50" },
  },
  deliveryFee: { cents: 0 },
  opsFlags: { pauseOrders: false, forcePickup: false },
};

export const GET: APIRoute = async () => {
  const keys = ["operatingHours", "deliveryFee", "opsFlags"] as const;

  const rows = await Promise.all(
    keys.map(async (key) => {
      const [r] = await db.select({ value: AppSetting.value }).from(AppSetting).where(eq(AppSetting.key, key)).limit(1);
      return [key, r?.value] as const;
    })
  );

  const obj = Object.fromEntries(rows) as any;

  return json({
    operatingHours: (obj.operatingHours ?? DEFAULTS.operatingHours),
    deliveryFee: (obj.deliveryFee ?? DEFAULTS.deliveryFee),
    opsFlags: (obj.opsFlags ?? DEFAULTS.opsFlags),
  });
};
