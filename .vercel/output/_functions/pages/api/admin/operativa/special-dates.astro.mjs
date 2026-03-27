import { d as db, S as SpecialDate } from '../../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

const CHANNELS = ["DINE_IN", "DELIVERY", "PICKUP"];
function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
function parseId(value) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}
function parseDateISO(value) {
  const raw = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}
function parseChannel(value) {
  const raw = String(value ?? "").trim();
  return CHANNELS.includes(raw) ? raw : null;
}
function toNullableText(value) {
  const raw = String(value ?? "").trim();
  return raw ? raw : null;
}
function parseTime(value, mode) {
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
const REDIRECT_PATH = "/admin/operativa";
const POST = async (context) => {
  const user = context.locals.user;
  if (!user || user.role !== "ADMIN" && user.role !== "STAFF") {
    return context.redirect("/admin/login");
  }
  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();
  if (intent === "create") {
    const dateISO = parseDateISO(form.get("dateISO"));
    const channel = parseChannel(form.get("channel"));
    const isClosed = form.get("isClosed") === "on";
    const note = toNullableText(form.get("note"));
    const openMins = parseTime(form.get("openTime"), "open");
    const closeMins = parseTime(form.get("closeTime"), "close");
    if (!dateISO) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "invalid-date"
      }));
    }
    if (!channel) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "invalid-channel"
      }));
    }
    if (!isClosed && (openMins === null || closeMins === null || openMins >= closeMins)) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "invalid-hours"
      }));
    }
    const existingSameDate = await db.select({
      id: SpecialDate.id,
      channel: SpecialDate.channel
    }).from(SpecialDate).where(eq(SpecialDate.dateISO, dateISO));
    if (existingSameDate.some((row) => row.channel === channel)) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "duplicate-special-date"
      }));
    }
    const existing = await db.select({
      id: SpecialDate.id
    }).from(SpecialDate);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    await db.insert(SpecialDate).values({
      id: nextId,
      dateISO,
      channel,
      isClosed,
      openMins: isClosed ? void 0 : openMins ?? void 0,
      closeMins: isClosed ? void 0 : closeMins ?? void 0,
      note: note ?? void 0
    });
    return context.redirect(withQuery(REDIRECT_PATH, {
      specialDatesSaved: "1"
    }));
  }
  const specialDateId = parseId(form.get("specialDateId"));
  if (!specialDateId) {
    return context.redirect(withQuery(REDIRECT_PATH, {
      specialDatesError: "invalid-special-date"
    }));
  }
  const [existingRow] = await db.select({
    id: SpecialDate.id
  }).from(SpecialDate).where(eq(SpecialDate.id, specialDateId)).limit(1);
  if (!existingRow) {
    return context.redirect(withQuery(REDIRECT_PATH, {
      specialDatesError: "invalid-special-date"
    }));
  }
  if (intent === "update") {
    const dateISO = parseDateISO(form.get("dateISO"));
    const channel = parseChannel(form.get("channel"));
    const isClosed = form.get("isClosed") === "on";
    const note = toNullableText(form.get("note"));
    const openMins = parseTime(form.get("openTime"), "open");
    const closeMins = parseTime(form.get("closeTime"), "close");
    if (!dateISO) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "invalid-date"
      }));
    }
    if (!channel) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "invalid-channel"
      }));
    }
    if (!isClosed && (openMins === null || closeMins === null || openMins >= closeMins)) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "invalid-hours"
      }));
    }
    const existingSameDate = await db.select({
      id: SpecialDate.id,
      channel: SpecialDate.channel
    }).from(SpecialDate).where(eq(SpecialDate.dateISO, dateISO));
    if (existingSameDate.some((row) => row.channel === channel && row.id !== specialDateId)) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        specialDatesError: "duplicate-special-date"
      }));
    }
    await db.update(SpecialDate).set({
      dateISO,
      channel,
      isClosed,
      openMins: isClosed ? void 0 : openMins ?? void 0,
      closeMins: isClosed ? void 0 : closeMins ?? void 0,
      note: note ?? void 0
    }).where(eq(SpecialDate.id, specialDateId));
    return context.redirect(withQuery(REDIRECT_PATH, {
      specialDatesSaved: "1"
    }));
  }
  if (intent === "delete") {
    await db.delete(SpecialDate).where(eq(SpecialDate.id, specialDateId));
    return context.redirect(withQuery(REDIRECT_PATH, {
      specialDatesSaved: "1"
    }));
  }
  return context.redirect(withQuery(REDIRECT_PATH, {
    specialDatesError: "invalid-intent"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
