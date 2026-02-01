import { db, AppSetting, eq } from "astro:db";

export function getMadridClock(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(now);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");

  const mins = hour * 60 + minute;
  const hhmm = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

  return { hour, minute, mins, hhmm };
}

export function inWindow(mins: number, start: number, end: number) {
  // inclusivo en ambos extremos
  return mins >= start && mins <= end;
}

function hhmmToMins(hhmm: string) {
  const m = String(hhmm ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return h * 60 + mm;
}

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [r] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, key))
    .limit(1);

  return (r?.value ?? fallback) as T;
}

const DEFAULTS = {
  operatingHours: {
    // Horario de apertura del local (por ahora fijo como lo tenías)
    open: { start: "07:30", end: "00:00" },
    kitchen: { start: "08:00", end: "23:20" },
    delivery: { start: "20:00", end: "22:50" },
  },
  deliveryFee: { cents: 0 },
  opsFlags: { pauseOrders: false, forcePickup: false },
};

export async function getArcadiaAvailability(now = new Date()) {
  const { mins, hhmm } = getMadridClock(now);

  const operatingHours = await getSetting("operatingHours", DEFAULTS.operatingHours);
  const deliveryFee = await getSetting("deliveryFee", DEFAULTS.deliveryFee);
  const opsFlags = await getSetting("opsFlags", DEFAULTS.opsFlags);

  // open (por ahora configurable también si quieres; si no, dejamos defaults)
  const openStart = hhmmToMins(operatingHours.open?.start ?? DEFAULTS.operatingHours.open.start);
  const openEndRaw = operatingHours.open?.end ?? DEFAULTS.operatingHours.open.end;
  // "00:00" lo interpretamos como 24:00 para el rango del día
  const openEnd = openEndRaw === "00:00" ? 24 * 60 : hhmmToMins(openEndRaw);

  const kitchenStart = hhmmToMins(operatingHours.kitchen?.start ?? DEFAULTS.operatingHours.kitchen.start);
  const kitchenEndRaw = operatingHours.kitchen?.end ?? DEFAULTS.operatingHours.kitchen.end;
  const kitchenEnd = kitchenEndRaw === "00:00" ? 24 * 60 : hhmmToMins(kitchenEndRaw);

  const deliveryStart = hhmmToMins(operatingHours.delivery?.start ?? DEFAULTS.operatingHours.delivery.start);
  const deliveryEndRaw = operatingHours.delivery?.end ?? DEFAULTS.operatingHours.delivery.end;
  const deliveryEnd = deliveryEndRaw === "00:00" ? 24 * 60 : hhmmToMins(deliveryEndRaw);

  const isOpen = inWindow(mins, openStart, openEnd);
  const kitchenOpen = inWindow(mins, kitchenStart, kitchenEnd);

  // delivery available si estamos en ventana y no está forzado pickup
  const deliveryWindow = inWindow(mins, deliveryStart, deliveryEnd);
  const deliveryAvailable = deliveryWindow && !opsFlags.forcePickup;

  return {
    now: hhmm,

    // flags operativa
    pauseOrders: !!opsFlags.pauseOrders,
    forcePickup: !!opsFlags.forcePickup,

    // disponibilidad
    isOpen,
    kitchenOpen,
    deliveryAvailable,

    // fee fijo para que el checkout lo muestre
    deliveryFeeCents: Number(deliveryFee?.cents ?? 0),

    windows: {
      open: {
        start: operatingHours.open?.start ?? DEFAULTS.operatingHours.open.start,
        end: operatingHours.open?.end ?? DEFAULTS.operatingHours.open.end,
      },
      kitchen: {
        start: operatingHours.kitchen?.start ?? DEFAULTS.operatingHours.kitchen.start,
        end: operatingHours.kitchen?.end ?? DEFAULTS.operatingHours.kitchen.end,
      },
      delivery: {
        start: operatingHours.delivery?.start ?? DEFAULTS.operatingHours.delivery.start,
        end: operatingHours.delivery?.end ?? DEFAULTS.operatingHours.delivery.end,
      },
    },
  };
}
