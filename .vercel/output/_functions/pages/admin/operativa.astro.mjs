import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_CaEDeM2K.mjs';
import { d as db, o as OpeningHour, S as SpecialDate, A as AppSetting } from '../../chunks/_astro_db_ChTDrd2j.mjs';
import { g as getArcadiaAvailability } from '../../chunks/madrid_Co69_PDc.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Operativa = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Operativa;
  const DAYS = [
    { key: 1, label: "Lunes" },
    { key: 2, label: "Martes" },
    { key: 3, label: "Mi\xE9rcoles" },
    { key: 4, label: "Jueves" },
    { key: 5, label: "Viernes" },
    { key: 6, label: "S\xE1bado" },
    { key: 7, label: "Domingo" }
  ];
  const CHANNELS = [
    {
      key: "DINE_IN",
      label: "Local",
      badgeClass: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
      panelClass: "border-emerald-400/15 bg-emerald-400/6"
    },
    {
      key: "PICKUP",
      label: "Pickup",
      badgeClass: "border-indigo-400/20 bg-indigo-400/10 text-indigo-300",
      panelClass: "border-indigo-400/15 bg-indigo-400/6"
    },
    {
      key: "DELIVERY",
      label: "Delivery",
      badgeClass: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
      panelClass: "border-cyan-400/15 bg-cyan-400/6"
    }
  ];
  const DEFAULTS = {
    operatingHours: {
      open: { start: "07:30", end: "00:00" },
      kitchen: { start: "08:00", end: "23:20" },
      delivery: { start: "20:00", end: "22:50" }
    },
    deliveryFee: { cents: 0 },
    opsFlags: { pauseOrders: false, forcePickup: false }
  };
  async function getSetting(key, fallback) {
    const [row] = await db.select({ value: AppSetting.value }).from(AppSetting).where(eq(AppSetting.key, key)).limit(1);
    return row?.value ?? fallback;
  }
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} \u20AC`;
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
  function fallbackWindowForChannel(channel, operatingHours2) {
    if (channel === "DELIVERY") {
      return {
        start: operatingHours2.delivery?.start ?? DEFAULTS.operatingHours.delivery.start,
        end: operatingHours2.delivery?.end ?? DEFAULTS.operatingHours.delivery.end
      };
    }
    return {
      start: operatingHours2.open?.start ?? DEFAULTS.operatingHours.open.start,
      end: operatingHours2.open?.end ?? DEFAULTS.operatingHours.open.end
    };
  }
  function formatDateISO(dateISO) {
    const match = String(dateISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return dateISO;
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  function channelLabel(channel) {
    return CHANNELS.find((item) => item.key === channel)?.label ?? channel;
  }
  function sourceLabel(source) {
    if (source === "SPECIAL_DATE") return "Excepci\xF3n activa";
    if (source === "SPECIAL_DATE_CLOSED") return "Excepci\xF3n de cierre";
    if (source === "OPENING_HOUR") return "Horario semanal";
    if (source === "OPENING_HOUR_CLOSED") return "Descanso semanal";
    return "Fallback AppSetting";
  }
  const availability = await getArcadiaAvailability(/* @__PURE__ */ new Date());
  const operatingHours = await getSetting(
    "operatingHours",
    DEFAULTS.operatingHours
  );
  const deliveryFee = await getSetting(
    "deliveryFee",
    DEFAULTS.deliveryFee
  );
  const opsFlags = await getSetting("opsFlags", DEFAULTS.opsFlags);
  const openStart = operatingHours.open?.start ?? DEFAULTS.operatingHours.open.start;
  const openEnd = operatingHours.open?.end ?? DEFAULTS.operatingHours.open.end;
  const kitchenStart = operatingHours.kitchen?.start ?? DEFAULTS.operatingHours.kitchen.start;
  const kitchenEnd = operatingHours.kitchen?.end ?? DEFAULTS.operatingHours.kitchen.end;
  const deliveryStart = operatingHours.delivery?.start ?? DEFAULTS.operatingHours.delivery.start;
  const deliveryEnd = operatingHours.delivery?.end ?? DEFAULTS.operatingHours.delivery.end;
  const deliveryFeeEur = (Number(deliveryFee?.cents ?? 0) / 100).toFixed(2);
  const openingHourRows = await db.select({
    id: OpeningHour.id,
    dayOfWeek: OpeningHour.dayOfWeek,
    channel: OpeningHour.channel,
    openMins: OpeningHour.openMins,
    closeMins: OpeningHour.closeMins,
    isClosed: OpeningHour.isClosed
  }).from(OpeningHour).orderBy(OpeningHour.dayOfWeek, OpeningHour.channel);
  const specialDateRowsRaw = await db.select({
    id: SpecialDate.id,
    dateISO: SpecialDate.dateISO,
    channel: SpecialDate.channel,
    isClosed: SpecialDate.isClosed,
    openMins: SpecialDate.openMins,
    closeMins: SpecialDate.closeMins,
    note: SpecialDate.note
  }).from(SpecialDate).orderBy(SpecialDate.dateISO, SpecialDate.channel);
  const openingHourByKey = /* @__PURE__ */ new Map();
  for (const row of openingHourRows) {
    const dayKey = normalizeDow(row.dayOfWeek);
    const key = `${dayKey}:${row.channel}`;
    const next = {
      isClosed: !!row.isClosed,
      openMins: Number(row.openMins ?? 0),
      closeMins: Number(row.closeMins ?? 0)
    };
    const prev = openingHourByKey.get(key);
    if (!prev) {
      openingHourByKey.set(key, next);
      continue;
    }
    if (prev.isClosed || next.isClosed) {
      openingHourByKey.set(key, {
        isClosed: true,
        openMins: prev.openMins,
        closeMins: prev.closeMins
      });
      continue;
    }
    openingHourByKey.set(key, {
      isClosed: false,
      openMins: Math.min(prev.openMins, next.openMins),
      closeMins: Math.max(prev.closeMins, next.closeMins)
    });
  }
  const weeklyRows = DAYS.map((day) => ({
    dayKey: day.key,
    dayLabel: day.label,
    channels: CHANNELS.map((channel) => {
      const fallback = fallbackWindowForChannel(channel.key, operatingHours);
      const row = openingHourByKey.get(`${day.key}:${channel.key}`);
      return {
        key: channel.key,
        label: channel.label,
        badgeClass: channel.badgeClass,
        panelClass: channel.panelClass,
        isClosed: row?.isClosed ?? false,
        open: row ? minsToHHMM(row.openMins) : fallback.start,
        close: row ? minsToHHMM(row.closeMins) : fallback.end
      };
    })
  }));
  const specialDates = specialDateRowsRaw.map((row) => {
    const fallback = fallbackWindowForChannel(row.channel, operatingHours);
    return {
      id: row.id,
      dateISO: row.dateISO,
      channel: row.channel,
      isClosed: !!row.isClosed,
      open: typeof row.openMins === "number" ? minsToHHMM(row.openMins) : fallback.start,
      close: typeof row.closeMins === "number" ? minsToHHMM(row.closeMins) : fallback.end,
      note: String(row.note ?? "")
    };
  });
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") === "1";
  const hoursSaved = url.searchParams.get("hoursSaved") === "1";
  const specialDatesSaved = url.searchParams.get("specialDatesSaved") === "1";
  const hoursError = url.searchParams.get("hoursError") ?? "";
  const specialDatesError = url.searchParams.get("specialDatesError") ?? "";
  const hoursErrorMessage = hoursError === "invalid-hours" ? "Hay una franja semanal inv\xE1lida. Revisa horas de inicio y fin." : hoursError === "invalid-channel" ? "Se recibi\xF3 un canal horario no v\xE1lido." : "";
  const specialDatesErrorMessage = specialDatesError === "invalid-special-date" ? "La excepci\xF3n indicada no es v\xE1lida." : specialDatesError === "invalid-date" ? "La fecha especial no tiene un formato v\xE1lido." : specialDatesError === "invalid-channel" ? "El canal de la fecha especial no es v\xE1lido." : specialDatesError === "invalid-hours" ? "La franja de la fecha especial no es v\xE1lida." : specialDatesError === "duplicate-special-date" ? "Ya existe una excepci\xF3n para esa fecha y ese canal." : specialDatesError === "invalid-intent" ? "Acci\xF3n de fecha especial no v\xE1lida." : "";
  const structuredHoursEnabled = openingHourRows.length > 0;
  const todayDateISO = availability.todayDateISO;
  const todaySpecialDates = specialDates.filter((row) => row.dateISO === todayDateISO);
  const upcomingSpecialDates = specialDates.filter((row) => row.dateISO >= todayDateISO);
  const statusCards = [
    {
      label: "Local",
      value: availability.localOpen ? "Abierto" : "Cerrado",
      tone: availability.localOpen ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: `${availability.windows.open.start} - ${availability.windows.open.end} \xB7 ${sourceLabel(availability.sources.open)}`
    },
    {
      label: "Pickup",
      value: availability.pickupAvailable ? "Disponible" : "No disponible",
      tone: availability.pickupAvailable ? "border-indigo-400/20 bg-indigo-400/10 text-indigo-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200",
      help: `${availability.windows.pickup.start} - ${availability.windows.pickup.end} \xB7 ${sourceLabel(availability.sources.pickup)}`
    },
    {
      label: "Delivery",
      value: opsFlags.forcePickup ? "Forzado a pickup" : availability.deliveryAvailable ? "Disponible" : "No disponible",
      tone: opsFlags.forcePickup ? "border-amber-400/20 bg-amber-400/10 text-amber-200" : availability.deliveryAvailable ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200",
      help: `${availability.windows.delivery.start} - ${availability.windows.delivery.end} \xB7 ${sourceLabel(availability.sources.delivery)}`
    },
    {
      label: "Kitchen",
      value: availability.kitchenOpen ? "Activa" : "Cerrada",
      tone: availability.kitchenOpen ? "border-violet-400/20 bg-violet-400/10 text-violet-200" : "border-amber-400/20 bg-amber-400/10 text-amber-200",
      help: `${availability.windows.kitchen.start} - ${availability.windows.kitchen.end} \xB7 AppSetting`
    },
    {
      label: "Pedidos",
      value: opsFlags.pauseOrders ? "Pausados" : "Activos",
      tone: opsFlags.pauseOrders ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
      help: opsFlags.pauseOrders ? "Checkout bloqueado" : "Checkout operativo"
    },
    {
      label: "Fee delivery",
      value: money(deliveryFee.cents),
      tone: "border-sky-400/20 bg-sky-400/10 text-sky-200",
      help: "Tarifa aplicada al env\xEDo"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Operativa \xB7 Admin \xB7 Arcadia", "heading": "Operativa", "description": "Control central del negocio: base legacy, horario semanal estructurado y excepciones por fecha sin romper checkout ni flags actuales.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/ajustes/pagos" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Ajustes de pago
</a> <a href="/admin/ajustes/fees" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver fees
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Base operativa y flags guardados correctamente.
</section>` : null}${hoursSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-200">
Horario semanal estructurado guardado correctamente.
</section>` : null}${specialDatesSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-violet-400/20 bg-violet-400/10 px-5 py-4 text-sm text-violet-200">
Fechas especiales actualizadas correctamente.
</section>` : null}${hoursErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${hoursErrorMessage} </section>` : null}${specialDatesErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${specialDatesErrorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3"> ${statusCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-3xl border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em]"> ${card.label} </div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${card.value} </div> <p class="mt-2 text-sm text-white/75">${card.help}</p> </article>`)} </section> ${todaySpecialDates.length > 0 ? renderTemplate`<section class="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
Hoy <span class="font-semibold text-amber-200">${formatDateISO(todayDateISO)}</span> hay ${todaySpecialDates.length} excepción${todaySpecialDates.length === 1 ? "" : "es"} activa${todaySpecialDates.length === 1 ? "" : "s"}. Revisa las notas y ventanas antes de tocar flags globales.
</section>` : null}<form class="mt-6 space-y-6" method="post" action="/api/admin/operativa/save"> <section class="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
Base legacy + flags
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Fallback general y control inmediato
</h2> <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
Esta capa sigue gobernando <span class="font-semibold text-slate-200">kitchen</span>, la <span class="font-semibold text-slate-200">fee</span> y los <span class="font-semibold text-slate-200">flags</span>. Además, sirve como fallback si todavía no has guardado horario semanal estructurado en <code>OpeningHour</code>.
</p> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
Hora Madrid: <span class="font-semibold text-white">${availability.now}</span> </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-3"> <article class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-center justify-between gap-3"> <div> <div class="text-sm font-semibold text-white">Local</div> <p class="mt-1 text-sm text-slate-400">
Ventana general usada como fallback para local y pickup.
</p> </div> <div class="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
Fallback
</div> </div> <div class="mt-5 grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Inicio
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="time" name="openStart"${addAttribute(openStart, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Fin
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="time" name="openEnd"${addAttribute(openEnd, "value")} required> </label> </div> </article> <article class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-center justify-between gap-3"> <div> <div class="text-sm font-semibold text-white">Cocina</div> <p class="mt-1 text-sm text-slate-400">
Sigue viviendo en AppSetting porque el schema de horarios no tiene canal de cocina.
</p> </div> <div class="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
AppSetting
</div> </div> <div class="mt-5 grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Inicio
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="time" name="kitchenStart"${addAttribute(kitchenStart, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Fin
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="time" name="kitchenEnd"${addAttribute(kitchenEnd, "value")} required> </label> </div> </article> <article class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-center justify-between gap-3"> <div> <div class="text-sm font-semibold text-white">Delivery</div> <p class="mt-1 text-sm text-slate-400">
Fallback general de reparto si no existe horario semanal o excepción para ese día.
</p> </div> <div class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
Fallback
</div> </div> <div class="mt-5 grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Inicio
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="time" name="deliveryStart"${addAttribute(deliveryStart, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Fin
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="time" name="deliveryEnd"${addAttribute(deliveryEnd, "value")} required> </label> </div> </article> </div> <div class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"> <article class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Costes
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Tarifa de delivery
</h2> <p class="mt-2 max-w-xl text-sm leading-6 text-slate-400">
Fee base que se suma al pedido cuando el envío a domicilio está activo y permitido.
</p> <div class="mt-6 max-w-sm"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Importe en €
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" step="0.01" min="0" name="deliveryFeeEur"${addAttribute(deliveryFeeEur, "value")}> </label> </div> </article> <aside class="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Flags
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Estado operativo inmediato
</h2> <div class="mt-6 space-y-4"> <label class="block rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="pauseOrders"${addAttribute(opsFlags.pauseOrders, "checked")}> <div> <div class="text-sm font-semibold text-white">Pausar pedidos</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Bloquea el checkout y deja la venta temporalmente inactiva.
</p> </div> </div> </label> <label class="block rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="forcePickup"${addAttribute(opsFlags.forcePickup, "checked")}> <div> <div class="text-sm font-semibold text-white">Forzar recogida</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Desactiva delivery aunque haya franja válida y obliga a pickup.
</p> </div> </div> </label> </div> <div class="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">Nota operativa</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Estos flags siguen afectando directamente a checkout aunque exista horario semanal o excepciones por fecha.
</p> </div> </aside> </div> <div class="mt-6 flex flex-wrap gap-3"> <button class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400" type="submit">
Guardar base operativa
</button> </div> </section> </form> <form class="mt-6" method="post" action="/api/admin/operativa/hours"> <section class="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
OpeningHour
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Horario semanal estructurado por canal
</h2> <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
Aquí sí escribes sobre la tabla real <code>OpeningHour</code>. Si guardas esta sección, el sistema deja de depender solo de la ventana genérica y pasa a resolver local, pickup y delivery por día de la semana.
</p> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"> ${structuredHoursEnabled ? "Horario semanal activo" : "Ahora mismo se usa fallback AppSetting"} </div> </div> <div class="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/40"> <table class="min-w-full border-collapse"> <thead> <tr class="border-b border-white/10 text-left"> <th class="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Día</th> ${CHANNELS.map((channel) => renderTemplate`<th class="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"> ${channel.label} </th>`)} </tr> </thead> <tbody> ${weeklyRows.map((day) => renderTemplate`<tr class="border-b border-white/5 align-top"> <td class="px-5 py-5"> <div class="text-sm font-semibold text-white">${day.dayLabel}</div> <div class="mt-1 text-xs text-slate-500">día ${day.dayKey}</div> </td> ${day.channels.map((channel) => renderTemplate`<td class="px-5 py-5"> <div${addAttribute(["rounded-3xl border p-4", channel.panelClass], "class:list")}> <div class="flex flex-wrap items-center justify-between gap-3"> <span${addAttribute(["inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]", channel.badgeClass], "class:list")}> ${channel.label} </span> <label class="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400" type="checkbox"${addAttribute(`hours_${day.dayKey}_${channel.key}_closed`, "name")}${addAttribute(channel.isClosed, "checked")}>
Cerrado
</label> </div> <div class="mt-4 grid gap-3 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
Inicio
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="time"${addAttribute(`hours_${day.dayKey}_${channel.key}_open`, "name")}${addAttribute(channel.open, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
Fin
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="time"${addAttribute(`hours_${day.dayKey}_${channel.key}_close`, "name")}${addAttribute(channel.close, "value")} required> </label> </div> </div> </td>`)} </tr>`)} </tbody> </table> </div> <div class="mt-6 flex flex-wrap gap-3"> <button class="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">
Guardar horario semanal
</button> </div> </section> </form> <section id="special-dates" class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_380px]"> <article class="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300">
SpecialDate
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Excepciones por fecha
</h2> <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
Usa excepciones para festivos, cierres puntuales o cambios de franja sin tocar el horario semanal. Cada fecha especial pisa primero la resolución del canal correspondiente.
</p> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300"> ${upcomingSpecialDates.length} excepción${upcomingSpecialDates.length === 1 ? "" : "es"} desde hoy
</div> </div> ${specialDates.length === 0 ? renderTemplate`<div class="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 px-6 py-12 text-center"> <div class="text-lg font-semibold text-white">No hay fechas especiales</div> <p class="mt-2 text-sm leading-6 text-slate-400">
El calendario especial está vacío. El sistema resolverá solo con horario semanal o fallback.
</p> </div>` : renderTemplate`<div class="mt-6 space-y-4"> ${specialDates.map((row) => renderTemplate`<section class="rounded-3xl border border-white/10 bg-white/4 p-5"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-base font-semibold text-white">${formatDateISO(row.dateISO)}</div> <div class="mt-2 flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    CHANNELS.find((channel) => channel.key === row.channel)?.badgeClass ?? "border-white/10 bg-white/5 text-slate-300"
  ], "class:list")}> ${channelLabel(row.channel)} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    row.isClosed ? "border-rose-400/20 bg-rose-400/10 text-rose-300" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
  ], "class:list")}> ${row.isClosed ? "Cerrado" : `${row.open} - ${row.close}`} </span> </div> </div> </div> <form method="post" action="/api/admin/operativa/special-dates" class="mt-5 grid gap-4 lg:grid-cols-[180px_180px_180px_minmax(0,1fr)_auto]"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="specialDateId"${addAttribute(row.id, "value")}> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fecha</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="date" name="dateISO"${addAttribute(row.dateISO, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Canal</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" name="channel"> ${CHANNELS.map((channel) => renderTemplate`<option${addAttribute(channel.key, "value")}${addAttribute(channel.key === row.channel, "selected")}> ${channel.label} </option>`)} </select> </label> <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Inicio</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="time" name="openTime"${addAttribute(row.open, "value")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fin</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="time" name="closeTime"${addAttribute(row.close, "value")}> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nota</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="text" name="note"${addAttribute(row.note, "value")} placeholder="Festivo local, cierre por evento, horario reducido..."> </label> <div class="flex flex-col items-end justify-between gap-3"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-300" type="checkbox" name="isClosed"${addAttribute(row.isClosed, "checked")}>
Cerrado
</label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-violet-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-200">
Guardar
</button> </div> </form> <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"> <p class="text-sm text-slate-500">
Las excepciones pisan el horario semanal para esa fecha y canal.
</p> <form method="post" action="/api/admin/operativa/special-dates"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="specialDateId"${addAttribute(row.id, "value")}> <button type="submit" class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15">
Borrar excepción
</button> </form> </div> </section>`)} </div>`} </article> <aside class="space-y-6"> <form method="post" action="/api/admin/operativa/special-dates" class="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <input type="hidden" name="intent" value="create"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Alta</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">Nueva excepción</h2> <div class="mt-6 grid gap-4"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fecha</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="date" name="dateISO"${addAttribute(todayDateISO, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Canal</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" name="channel"> ${CHANNELS.map((channel) => renderTemplate`<option${addAttribute(channel.key, "value")}>${channel.label}</option>`)} </select> </label> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Inicio</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="time" name="openTime"${addAttribute(openStart, "value")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Fin</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="time" name="closeTime"${addAttribute(openEnd, "value")}> </label> </div> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-300" type="checkbox" name="isClosed">
Marcar como cerrado
</label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Nota</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="text" name="note" placeholder="Festivo, cierre por evento, horario reducido..."> </label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-violet-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-200">
Crear excepción
</button> </div> </form> <section class="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Modelo</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">Cómo resuelve el sistema</h2> <div class="mt-6 space-y-4"> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">Prioridad real</div> <p class="mt-2 text-sm leading-6 text-slate-400"> <code>SpecialDate</code> pisa primero. Si no hay excepción, se usa <code>OpeningHour</code>. Si aún no hay horario semanal, se cae al fallback legacy de <code>AppSetting</code>.
</p> </div> <div class="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">Límite actual del schema</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
La cocina no tiene canal propio en <code>OpeningHour</code>, así que su ventana sigue viviendo en la configuración base.
</p> </div> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">Impacto real</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Checkout y disponibilidad pública ya pasan por esta resolución. No estás montando pantallas decorativas: estás moviendo la lógica real del negocio a tablas más expresivas.
</p> </div> </div> </section> </aside> </section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/operativa.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/operativa.astro";
const $$url = "/admin/operativa";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Operativa,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
