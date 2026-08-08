import type { APIRoute } from "astro";
import { db, SpecialDate, eq } from "astro:db";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";

const CHANNELS = ["DINE_IN", "DELIVERY", "PICKUP"] as const;

type ChannelKey = (typeof CHANNELS)[number];

type SpecialDateAuditShape = {
  dateISO: string;
  channel: ChannelKey;
  isClosed: boolean;
  openTime: string | null;
  closeTime: string | null;
  note: string | null;
};

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseDateISO(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function parseChannel(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim() as ChannelKey;
  return CHANNELS.includes(raw) ? raw : null;
}

function toNullableText(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  return raw ? raw : null;
}

function parseTime(value: FormDataEntryValue | null, mode: "open" | "close") {
  const raw = String(value ?? "").trim();
  const match = raw.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  if (mode === "close" && hour === 0 && minute === 0) {
    return 24 * 60;
  }

  return hour * 60 + minute;
}

function minsToHHMM(mins: number | null | undefined) {
  if (!Number.isFinite(Number(mins))) return null;
  const value = Math.max(0, Math.min(24 * 60, Math.trunc(Number(mins))));
  if (value === 24 * 60) return "00:00";
  const h = Math.floor(value / 60);
  const mm = value % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function toAuditShape(row: {
  dateISO: string;
  channel: ChannelKey;
  isClosed: boolean;
  openMins: number | null | undefined;
  closeMins: number | null | undefined;
  note: string | null | undefined;
}): SpecialDateAuditShape {
  return {
    dateISO: row.dateISO,
    channel: row.channel,
    isClosed: !!row.isClosed,
    openTime: minsToHHMM(row.openMins),
    closeTime: minsToHHMM(row.closeMins),
    note: row.note ? String(row.note).trim() || null : null,
  };
}

async function getNextId() {
  const rows = await db.select({ id: SpecialDate.id }).from(SpecialDate);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

/** Máximo de días que puede abarcar un periodo en una sola operación. */
const MAX_RANGE_DAYS = 366;

/** Suma días a una fecha ISO usando UTC (evita saltos por zona horaria). */
function shiftISO(dateISO: string, days: number) {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Lista de fechas ISO entre from y to, ambas incluidas. */
function enumerateDates(fromISO: string, toISO: string) {
  const dates: string[] = [];
  let cursor = fromISO;
  let guard = 0;
  while (cursor <= toISO && guard <= MAX_RANGE_DAYS) {
    dates.push(cursor);
    cursor = shiftISO(cursor, 1);
    guard += 1;
  }
  return dates;
}

/**
 * Canales a los que aplica el formulario. `ALL` no se guarda en base: el
 * esquema indexa (dateISO, channel) de forma única y la resolución horaria
 * busca por canal concreto, así que se expande a una fila por canal.
 */
function parseChannelSelection(value: FormDataEntryValue | null): ChannelKey[] | null {
  const raw = String(value ?? "").trim();
  if (raw === "ALL") return [...CHANNELS];
  const single = parseChannel(value);
  return single ? [single] : null;
}

const REDIRECT_PATH = "/admin/operativa";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();
  const { ip, userAgent } = getRequestAuditMeta(context.request);

  if (intent === "create") {
    // Acepta un día suelto (solo dateFrom) o un periodo (dateFrom..dateTo), y
    // un canal concreto o "ALL". Se mantiene `dateISO` como alias de dateFrom
    // por compatibilidad con formularios antiguos.
    const dateFrom = parseDateISO(form.get("dateFrom") ?? form.get("dateISO"));
    const dateToRaw = parseDateISO(form.get("dateTo"));
    const channels = parseChannelSelection(form.get("channel"));
    const isClosed = form.get("isClosed") === "on";
    const note = toNullableText(form.get("note"));
    const openMins = parseTime(form.get("openTime"), "open");
    const closeMins = parseTime(form.get("closeTime"), "close");

    if (!dateFrom) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-date" }));
    }

    const dateTo = dateToRaw ?? dateFrom;
    if (dateTo < dateFrom) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-range" }));
    }

    const dates = enumerateDates(dateFrom, dateTo);
    if (dates.length > MAX_RANGE_DAYS) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "range-too-long" }));
    }

    if (!channels) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-channel" }));
    }

    if (!isClosed && (openMins === null || closeMins === null || openMins >= closeMins)) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-hours" }));
    }

    // Las combinaciones que ya existen se actualizan en vez de fallar: aplicar
    // un cierre sobre un periodo que ya tenía alguna excepción suelta es el
    // caso normal, no un error.
    const existingRows = await db
      .select({ id: SpecialDate.id, dateISO: SpecialDate.dateISO, channel: SpecialDate.channel })
      .from(SpecialDate);

    const existingByKey = new Map(existingRows.map((row) => [`${row.dateISO}:${row.channel}`, row.id]));

    let nextId = await getNextId();
    const inserts: Array<typeof SpecialDate.$inferInsert> = [];
    let updated = 0;

    const sharedValues = {
      isClosed,
      openMins: isClosed ? undefined : openMins ?? undefined,
      closeMins: isClosed ? undefined : closeMins ?? undefined,
      note: note ?? undefined,
    };

    for (const dateISO of dates) {
      for (const channel of channels) {
        const existingId = existingByKey.get(`${dateISO}:${channel}`);

        if (existingId) {
          await db.update(SpecialDate).set({ dateISO, channel, ...sharedValues }).where(eq(SpecialDate.id, existingId));
          updated += 1;
          continue;
        }

        inserts.push({ id: nextId++, dateISO, channel, ...sharedValues });
      }
    }

    if (inserts.length) {
      await db.insert(SpecialDate).values(inserts);
    }

    try {
      await writeAuditLog({
        actorUserId: user.id,
        action: "SPECIAL_DATE_SAVED",
        entityType: "special_date",
        entityId: dates.length === 1 ? `${dateFrom}:${channels.join("+")}` : `${dateFrom}..${dateTo}:${channels.join("+")}`,
        diff: {
          previous: null,
          next: {
            dateFrom,
            dateTo,
            days: dates.length,
            channels,
            created: inserts.length,
            updated,
            ...toAuditShape({
              dateISO: dateFrom,
              channel: channels[0],
              isClosed,
              openMins: isClosed ? null : openMins,
              closeMins: isClosed ? null : closeMins,
              note,
            }),
          },
        },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] special date create failed", error);
    }

    return context.redirect(withQuery(REDIRECT_PATH, { specialDatesSaved: "1" }));
  }

  const specialDateId = parseId(form.get("specialDateId"));
  if (!specialDateId) {
    return context.redirect(
      withQuery(REDIRECT_PATH, { specialDatesError: "invalid-special-date" })
    );
  }

  const [existingRow] = await db
    .select({
      id: SpecialDate.id,
      dateISO: SpecialDate.dateISO,
      channel: SpecialDate.channel,
      isClosed: SpecialDate.isClosed,
      openMins: SpecialDate.openMins,
      closeMins: SpecialDate.closeMins,
      note: SpecialDate.note,
    })
    .from(SpecialDate)
    .where(eq(SpecialDate.id, specialDateId))
    .limit(1);

  if (!existingRow) {
    return context.redirect(
      withQuery(REDIRECT_PATH, { specialDatesError: "invalid-special-date" })
    );
  }

  const previousAuditShape = toAuditShape({
    dateISO: existingRow.dateISO,
    channel: existingRow.channel as ChannelKey,
    isClosed: !!existingRow.isClosed,
    openMins: typeof existingRow.openMins === "number" ? existingRow.openMins : null,
    closeMins: typeof existingRow.closeMins === "number" ? existingRow.closeMins : null,
    note: existingRow.note ? String(existingRow.note) : null,
  });

  if (intent === "update") {
    const dateISO = parseDateISO(form.get("dateISO"));
    const channel = parseChannel(form.get("channel"));
    const isClosed = form.get("isClosed") === "on";
    const note = toNullableText(form.get("note"));
    const openMins = parseTime(form.get("openTime"), "open");
    const closeMins = parseTime(form.get("closeTime"), "close");

    if (!dateISO) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-date" }));
    }

    if (!channel) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-channel" }));
    }

    if (!isClosed && (openMins === null || closeMins === null || openMins >= closeMins)) {
      return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-hours" }));
    }

    const existingSameDate = await db
      .select({
        id: SpecialDate.id,
        channel: SpecialDate.channel,
      })
      .from(SpecialDate)
      .where(eq(SpecialDate.dateISO, dateISO));

    if (existingSameDate.some((row) => row.channel === channel && row.id !== specialDateId)) {
      return context.redirect(
        withQuery(REDIRECT_PATH, { specialDatesError: "duplicate-special-date" })
      );
    }

    await db
      .update(SpecialDate)
      .set({
        dateISO,
        channel,
        isClosed,
        openMins: isClosed ? undefined : openMins ?? undefined,
        closeMins: isClosed ? undefined : closeMins ?? undefined,
        note: note ?? undefined,
      })
      .where(eq(SpecialDate.id, specialDateId));

    try {
      await writeAuditLog({
        actorUserId: user.id,
        action: "SPECIAL_DATE_SAVED",
        entityType: "special_date",
        entityId: `${dateISO}:${channel}`,
        diff: {
          previous: previousAuditShape,
          next: toAuditShape({
            dateISO,
            channel,
            isClosed,
            openMins: isClosed ? null : openMins,
            closeMins: isClosed ? null : closeMins,
            note,
          }),
        },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] special date update failed", error);
    }

    return context.redirect(withQuery(REDIRECT_PATH, { specialDatesSaved: "1" }));
  }

  if (intent === "delete") {
    await db.delete(SpecialDate).where(eq(SpecialDate.id, specialDateId));

    try {
      await writeAuditLog({
        actorUserId: user.id,
        action: "SPECIAL_DATE_DELETED",
        entityType: "special_date",
        entityId: `${existingRow.dateISO}:${existingRow.channel}`,
        diff: {
          deleted: previousAuditShape,
        },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] special date delete failed", error);
    }

    return context.redirect(withQuery(REDIRECT_PATH, { specialDatesSaved: "1" }));
  }

  return context.redirect(withQuery(REDIRECT_PATH, { specialDatesError: "invalid-intent" }));
};