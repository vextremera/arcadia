import { db, AppSetting, OpeningHour, eq, inArray } from "astro:db";

type Window = { start: string; end: string };

export type WeeklyHoursRow = {
  dayKey: number; // 1..7 (Lunes..Domingo)
  dayLabel: string;
  local: string;
  delivery: string;
};

const DAYS: Array<{ key: number; label: string }> = [
  { key: 1, label: "Lunes" },
  { key: 2, label: "Martes" },
  { key: 3, label: "Miércoles" },
  { key: 4, label: "Jueves" },
  { key: 5, label: "Viernes" },
  { key: 6, label: "Sábado" },
  { key: 7, label: "Domingo" },
];

const DEFAULTS = {
  operatingHours: {
    open: { start: "07:30", end: "00:00" },
    delivery: { start: "20:00", end: "22:50" },
  } satisfies { open: Window; delivery: Window },
};

async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const [r] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, key))
    .limit(1);

  return (r?.value ?? fallback) as T;
}

function normalizeDow(v: number) {
  // Acepta 0..6 (Dom=0) o 1..7 (Lun=1). Normaliza a 1..7.
  if (!Number.isFinite(v)) return 1;
  if (v === 0) return 7;
  if (v >= 1 && v <= 7) return v;
  if (v >= 0 && v <= 6) return v + 1;
  return 1;
}

function minsToHHMM(mins: number) {
  // 1440 => 00:00
  const m = Math.max(0, Math.min(24 * 60, Math.trunc(mins)));
  if (m === 24 * 60) return "00:00";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function fmtRange(openMins: number, closeMins: number) {
  return `${minsToHHMM(openMins)} - ${minsToHHMM(closeMins)}`;
}

function fmtWindow(w?: Partial<Window> | null) {
  const start = String(w?.start ?? "").trim();
  const end = String(w?.end ?? "").trim();
  if (!start || !end) return "—";
  return `${start} - ${end}`;
}

/**
 * Horarios semanales para el landing.
 * - Resuelve por día y canal usando OpeningHour cuando exista.
 * - Si falta una celda concreta, cae solo esa franja a AppSetting("operatingHours").
 */
export async function getWeeklyHours(): Promise<WeeklyHoursRow[]> {
  const rows = await db
    .select({
      dayOfWeek: OpeningHour.dayOfWeek,
      channel: OpeningHour.channel,
      openMins: OpeningHour.openMins,
      closeMins: OpeningHour.closeMins,
      isClosed: OpeningHour.isClosed,
    })
    .from(OpeningHour)
    .where(inArray(OpeningHour.channel, ["DINE_IN", "DELIVERY"]))
    .orderBy(OpeningHour.dayOfWeek);

  const operatingHours = await getSetting("operatingHours", DEFAULTS.operatingHours);

  const localFallback = fmtWindow(operatingHours?.open ?? DEFAULTS.operatingHours.open);
  const deliveryFallback = fmtWindow(
    operatingHours?.delivery ?? DEFAULTS.operatingHours.delivery
  );

  const byDayChannel = new Map<
    string,
    { isClosed: boolean; openMins: number; closeMins: number }
  >();

  for (const r of rows) {
    const dayKey = normalizeDow(r.dayOfWeek);
    const key = `${dayKey}:${r.channel}`;

    const prev = byDayChannel.get(key);
    const isClosed = !!r.isClosed;
    const openMins = Number(r.openMins ?? 0);
    const closeMins = Number(r.closeMins ?? 0);

    if (!prev) {
      byDayChannel.set(key, { isClosed, openMins, closeMins });
      continue;
    }

    if (prev.isClosed || isClosed) {
      byDayChannel.set(key, {
        isClosed: true,
        openMins: prev.openMins,
        closeMins: prev.closeMins,
      });
      continue;
    }

    byDayChannel.set(key, {
      isClosed: false,
      openMins: Math.min(prev.openMins, openMins),
      closeMins: Math.max(prev.closeMins, closeMins),
    });
  }

  return DAYS.map((d) => {
    const local = byDayChannel.get(`${d.key}:DINE_IN`);
    const del = byDayChannel.get(`${d.key}:DELIVERY`);

    return {
      dayKey: d.key,
      dayLabel: d.label,
      local: !local
        ? localFallback
        : local.isClosed
          ? "Descanso"
          : fmtRange(local.openMins, local.closeMins),
      delivery: !del
        ? deliveryFallback
        : del.isClosed
          ? "Descanso"
          : fmtRange(del.openMins, del.closeMins),
    };
  });
}