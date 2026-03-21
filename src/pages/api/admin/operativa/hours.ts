import type { APIRoute } from "astro";
import { db, OpeningHour, eq } from "astro:db";

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const CHANNELS = ["DINE_IN", "DELIVERY", "PICKUP"] as const;
type ChannelKey = (typeof CHANNELS)[number];

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

function fieldName(day: number, channel: ChannelKey, kind: "open" | "close" | "closed") {
  return `hours_${day}_${channel}_${kind}`;
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

  const existing = await db.select({ id: OpeningHour.id }).from(OpeningHour);
  for (const row of existing) {
    await db.delete(OpeningHour).where(eq(OpeningHour.id, row.id));
  }

  let nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

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

  return context.redirect(withQuery(REDIRECT_PATH, { hoursSaved: "1" }));
};