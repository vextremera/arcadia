import type { APIRoute } from "astro";
import { db, OpeningHour, eq } from "astro:db";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const CHANNELS = ["DINE_IN", "DELIVERY", "PICKUP"] as const;

type ChannelKey = (typeof CHANNELS)[number];

type OpeningHourSnapshot = {
  dayOfWeek: number;
  channel: ChannelKey;
  open: string;
  close: string;
  isClosed: boolean;
};

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
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

function minsToHHMM(mins: number) {
  const value = Math.max(0, Math.min(24 * 60, Math.trunc(mins)));
  if (value === 24 * 60) return "00:00";
  const h = Math.floor(value / 60);
  const mm = value % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function fieldName(day: number, channel: ChannelKey, kind: "open" | "close" | "closed") {
  return `hours_${day}_${channel}_${kind}`;
}

function toSnapshot(rows: Array<{
  dayOfWeek: number;
  channel: ChannelKey;
  openMins: number;
  closeMins: number;
  isClosed: boolean;
}>): OpeningHourSnapshot[] {
  return rows
    .slice()
    .sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.channel.localeCompare(b.channel);
    })
    .map((row) => ({
      dayOfWeek: row.dayOfWeek,
      channel: row.channel,
      open: minsToHHMM(row.openMins),
      close: minsToHHMM(row.closeMins),
      isClosed: !!row.isClosed,
    }));
}

const REDIRECT_PATH = "/admin/operativa";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();

  const nextRows: Array<{
    dayOfWeek: number;
    channel: ChannelKey;
    openMins: number;
    closeMins: number;
    isClosed: boolean;
  }> = [];

  for (const day of DAYS) {
    for (const channel of CHANNELS) {
      const isClosed = form.get(fieldName(day, channel, "closed")) === "on";
      const openMins = parseTime(form.get(fieldName(day, channel, "open")), "open");
      const closeMins = parseTime(form.get(fieldName(day, channel, "close")), "close");

      if (openMins === null || closeMins === null || openMins >= closeMins) {
        return context.redirect(withQuery(REDIRECT_PATH, { hoursError: "invalid-hours" }));
      }

      nextRows.push({
        dayOfWeek: day,
        channel,
        openMins,
        closeMins,
        isClosed,
      });
    }
  }

  const existingRows = await db
    .select({
      id: OpeningHour.id,
      dayOfWeek: OpeningHour.dayOfWeek,
      channel: OpeningHour.channel,
      openMins: OpeningHour.openMins,
      closeMins: OpeningHour.closeMins,
      isClosed: OpeningHour.isClosed,
    })
    .from(OpeningHour);

  const previousSnapshot = toSnapshot(
    existingRows.map((row) => ({
      dayOfWeek: row.dayOfWeek,
      channel: row.channel as ChannelKey,
      openMins: Number(row.openMins ?? 0),
      closeMins: Number(row.closeMins ?? 0),
      isClosed: !!row.isClosed,
    }))
  );

  for (const row of existingRows) {
    await db.delete(OpeningHour).where(eq(OpeningHour.id, row.id));
  }

  let nextId = existingRows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;

  for (const row of nextRows) {
    await db.insert(OpeningHour).values({
      id: nextId,
      dayOfWeek: row.dayOfWeek,
      channel: row.channel,
      openMins: row.openMins,
      closeMins: row.closeMins,
      isClosed: row.isClosed,
    });
    nextId += 1;
  }

  const { ip, userAgent } = getRequestAuditMeta(context.request);

  try {
    await writeAuditLog({
      actorUserId: user.id,
      action: "OPERATING_HOURS_UPDATED",
      entityType: "opening_hour",
      entityId: "weekly-schedule",
      diff: {
        previous: previousSnapshot,
        next: toSnapshot(nextRows),
      },
      ip,
      userAgent,
    });
  } catch (error) {
    console.error("[audit] opening hours failed", error);
  }

  return context.redirect(withQuery(REDIRECT_PATH, { hoursSaved: "1" }));
};