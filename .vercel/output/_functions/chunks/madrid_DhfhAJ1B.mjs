import { d as db, o as OpeningHour, S as SpecialDate, A as AppSetting } from './_astro_db_BPgDZzX3.mjs';
import { inArray, eq } from '@astrojs/db/dist/runtime/virtual.js';

function getMadridDateInfo(now = /* @__PURE__ */ new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Madrid",
    hour12: false,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).formatToParts(now);
  const weekday = String(parts.find((p) => p.type === "weekday")?.value ?? "Mon");
  const year = String(parts.find((p) => p.type === "year")?.value ?? "1970");
  const month = String(parts.find((p) => p.type === "month")?.value ?? "01");
  const day = String(parts.find((p) => p.type === "day")?.value ?? "01");
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  const weekdayToDayKey = {
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
    Sun: 7
  };
  const mins = hour * 60 + minute;
  const hhmm = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const dateISO = `${year}-${month}-${day}`;
  const dayKey = weekdayToDayKey[weekday] ?? 1;
  return {
    weekday,
    dayKey,
    year,
    month,
    day,
    hour,
    minute,
    mins,
    hhmm,
    dateISO
  };
}
function inWindow(mins, start, end) {
  return mins >= start && mins <= end;
}
function hhmmToMins(hhmm) {
  const m = String(hhmm ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  const h = Math.min(23, Math.max(0, Number(m[1])));
  const mm = Math.min(59, Math.max(0, Number(m[2])));
  return h * 60 + mm;
}
function minsToHHMM(mins) {
  const value = Math.max(0, Math.min(24 * 60, Math.trunc(mins)));
  if (value === 24 * 60) return "00:00";
  const h = Math.floor(value / 60);
  const mm = value % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function normalizeDow(v) {
  if (!Number.isFinite(v)) return 1;
  if (v === 0) return 7;
  if (v >= 1 && v <= 7) return v;
  if (v >= 0 && v <= 6) return v + 1;
  return 1;
}
async function getSetting(key, fallback) {
  const [r] = await db.select({
    value: AppSetting.value
  }).from(AppSetting).where(eq(AppSetting.key, key)).limit(1);
  return r?.value ?? fallback;
}
const DEFAULTS = {
  operatingHours: {
    open: {
      start: "07:30",
      end: "00:00"
    },
    kitchen: {
      start: "08:00",
      end: "23:20"
    },
    delivery: {
      start: "20:00",
      end: "22:50"
    }
  },
  deliveryFee: {
    cents: 0
  },
  opsFlags: {
    pauseOrders: false,
    forcePickup: false
  }
};
function fallbackWindowForChannel(channel, operatingHours) {
  if (channel === "DELIVERY") {
    return {
      start: operatingHours.delivery?.start ?? DEFAULTS.operatingHours.delivery.start,
      end: operatingHours.delivery?.end ?? DEFAULTS.operatingHours.delivery.end
    };
  }
  return {
    start: operatingHours.open?.start ?? DEFAULTS.operatingHours.open.start,
    end: operatingHours.open?.end ?? DEFAULTS.operatingHours.open.end
  };
}
async function getArcadiaAvailability(now = /* @__PURE__ */ new Date()) {
  const {
    mins,
    hhmm,
    dateISO,
    dayKey
  } = getMadridDateInfo(now);
  const operatingHours = await getSetting("operatingHours", DEFAULTS.operatingHours);
  const deliveryFee = await getSetting("deliveryFee", DEFAULTS.deliveryFee);
  const opsFlags = await getSetting("opsFlags", DEFAULTS.opsFlags);
  const openingRows = await db.select({
    dayOfWeek: OpeningHour.dayOfWeek,
    channel: OpeningHour.channel,
    openMins: OpeningHour.openMins,
    closeMins: OpeningHour.closeMins,
    isClosed: OpeningHour.isClosed
  }).from(OpeningHour).where(inArray(OpeningHour.channel, ["DINE_IN", "DELIVERY", "PICKUP"]));
  const specialRows = await db.select({
    channel: SpecialDate.channel,
    isClosed: SpecialDate.isClosed,
    openMins: SpecialDate.openMins,
    closeMins: SpecialDate.closeMins,
    note: SpecialDate.note
  }).from(SpecialDate).where(eq(SpecialDate.dateISO, dateISO));
  const openingByChannel = /* @__PURE__ */ new Map();
  for (const row of openingRows) {
    if (normalizeDow(row.dayOfWeek) !== dayKey) continue;
    const channel = row.channel;
    const next = {
      isClosed: !!row.isClosed,
      openMins: Number(row.openMins ?? 0),
      closeMins: Number(row.closeMins ?? 0)
    };
    const prev = openingByChannel.get(channel);
    if (!prev) {
      openingByChannel.set(channel, next);
      continue;
    }
    if (prev.isClosed || next.isClosed) {
      openingByChannel.set(channel, {
        isClosed: true,
        openMins: prev.openMins,
        closeMins: prev.closeMins
      });
      continue;
    }
    openingByChannel.set(channel, {
      isClosed: false,
      openMins: Math.min(prev.openMins, next.openMins),
      closeMins: Math.max(prev.closeMins, next.closeMins)
    });
  }
  const specialByChannel = /* @__PURE__ */ new Map();
  for (const row of specialRows) {
    specialByChannel.set(row.channel, {
      isClosed: !!row.isClosed,
      openMins: typeof row.openMins === "number" ? row.openMins : null,
      closeMins: typeof row.closeMins === "number" ? row.closeMins : null,
      note: row.note ? String(row.note).trim() || null : null
    });
  }
  function resolveChannel(channel) {
    const fallback = fallbackWindowForChannel(channel, operatingHours);
    const fallbackStart = hhmmToMins(fallback.start);
    const fallbackEnd = fallback.end === "00:00" ? 24 * 60 : hhmmToMins(fallback.end);
    const special = specialByChannel.get(channel);
    if (special) {
      const openMins = special.openMins ?? fallbackStart;
      const closeMins = special.closeMins ?? fallbackEnd;
      if (special.isClosed) {
        return {
          start: minsToHHMM(openMins),
          end: minsToHHMM(closeMins),
          isOpen: false,
          source: "SPECIAL_DATE_CLOSED",
          note: special.note
        };
      }
      return {
        start: minsToHHMM(openMins),
        end: minsToHHMM(closeMins),
        isOpen: inWindow(mins, openMins, closeMins),
        source: "SPECIAL_DATE",
        note: special.note
      };
    }
    const opening = openingByChannel.get(channel);
    if (opening) {
      if (opening.isClosed) {
        return {
          start: minsToHHMM(opening.openMins),
          end: minsToHHMM(opening.closeMins),
          isOpen: false,
          source: "OPENING_HOUR_CLOSED",
          note: null
        };
      }
      return {
        start: minsToHHMM(opening.openMins),
        end: minsToHHMM(opening.closeMins),
        isOpen: inWindow(mins, opening.openMins, opening.closeMins),
        source: "OPENING_HOUR",
        note: null
      };
    }
    return {
      start: fallback.start,
      end: fallback.end,
      isOpen: inWindow(mins, fallbackStart, fallbackEnd),
      source: "APP_SETTING",
      note: null
    };
  }
  const local = resolveChannel("DINE_IN");
  const pickup = resolveChannel("PICKUP");
  const delivery = resolveChannel("DELIVERY");
  const kitchenStart = hhmmToMins(operatingHours.kitchen?.start ?? DEFAULTS.operatingHours.kitchen.start);
  const kitchenEndRaw = operatingHours.kitchen?.end ?? DEFAULTS.operatingHours.kitchen.end;
  const kitchenEnd = kitchenEndRaw === "00:00" ? 24 * 60 : hhmmToMins(kitchenEndRaw);
  const kitchenOpen = inWindow(mins, kitchenStart, kitchenEnd);
  const localOpen = local.isOpen;
  const isOpen = localOpen;
  const pickupAvailable = pickup.isOpen;
  const deliveryAvailable = delivery.isOpen && !opsFlags.forcePickup;
  return {
    now: hhmm,
    todayDateISO: dateISO,
    pauseOrders: !!opsFlags.pauseOrders,
    forcePickup: !!opsFlags.forcePickup,
    isOpen,
    localOpen,
    kitchenOpen,
    pickupAvailable,
    deliveryAvailable,
    deliveryFeeCents: Number(deliveryFee?.cents ?? 0),
    windows: {
      open: {
        start: local.start,
        end: local.end
      },
      pickup: {
        start: pickup.start,
        end: pickup.end
      },
      kitchen: {
        start: operatingHours.kitchen?.start ?? DEFAULTS.operatingHours.kitchen.start,
        end: operatingHours.kitchen?.end ?? DEFAULTS.operatingHours.kitchen.end
      },
      delivery: {
        start: delivery.start,
        end: delivery.end
      }
    },
    sources: {
      open: local.source,
      pickup: pickup.source,
      delivery: delivery.source
    },
    sourceNotes: {
      open: local.note,
      pickup: pickup.note,
      delivery: delivery.note
    },
    specialDateNotes: specialRows.filter((row) => row.note).map((row) => ({
      channel: row.channel,
      note: String(row.note ?? "").trim()
    })).filter((row) => row.note.length > 0)
  };
}

export { getArcadiaAvailability as g };
