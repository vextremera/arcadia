import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { B as maybeRenderHead, a4 as addAttribute, T as renderTemplate, b8 as unescapeHTML, F as Fragment } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { c as createSvgComponent, $ as $$SiteLayout } from './SiteLayout_CblPac9t.mjs';
import 'clsx';
import { d as db, p as OpeningHour, A as AppSetting } from './_astro_db_Bcz5lWRF.mjs';
import { inArray, eq } from '@astrojs/db/dist/runtime/virtual.js';
import { g as getArcadiaAvailability } from './madrid_57G2TjB3.mjs';
import { a as buildOperationalMessage } from './publicMessages_CJF1J5-O.mjs';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { jsx, jsxs } from 'preact/jsx-runtime';

const $$HomeHero = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section class="home-hero relative overflow-hidden rounded-t-[40px]" data-astro-cid-2xc3qsoe> <!-- Fondo --> <div class="absolute inset-0 z-0 bg-cover bg-center"${addAttribute(`background-image: url('/images/general/bg.webp');`, "style")} aria-hidden="true" data-astro-cid-2xc3qsoe> <div class="absolute inset-0 z-10 bg-black/60" data-astro-cid-2xc3qsoe></div> </div> <!-- Transición inferior --> <div class="home-hero__cap pointer-events-none absolute inset-x-0 -bottom-px z-20 h-10 rounded-t-[40px] bg-bg" data-astro-cid-2xc3qsoe></div> <div class="home-hero__inner relative z-10 mx-auto flex w-full max-w-440 items-center justify-center px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-10 lg:py-40" x-data="{ fadeIn: false }" x-init="setTimeout(() => fadeIn = true, 500)" data-astro-cid-2xc3qsoe> <div class="w-full transition-all duration-1000" :class="fadeIn ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-10'" data-astro-cid-2xc3qsoe> <h1 class="mx-auto w-full max-w-88 text-[clamp(1.1rem,4vw,2.25rem)] font-medium leading-tight text-white sigmar-regular min-[380px]:max-w-none sm:text-4xl" data-astro-cid-2xc3qsoe>
BAR RESTAURANTE<br data-astro-cid-2xc3qsoe><span class="home-hero__brand mx-auto mt-1 block max-w-full text-center text-[clamp(3.2rem,16vw,8rem)] font-extrabold leading-[0.9] tracking-[0.02em] text-white sigmar-regular sm:-mt-2 sm:text-8xl sm:tracking-[0.06em] md:text-10xl md:tracking-widest" data-astro-cid-2xc3qsoe>ARCADIA</span> </h1> </div> </div> </section>`;
}, "C:/Users/vicre/Dev/arcadia/src/sections/home/HomeHero.astro", void 0);

const $$HomeAbout = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section id="sobre" class="relative rounded-t-[50px] z-20 home-about" data-astro-cid-moqqdmfq> <div class="mx-auto w-full max-w-6xl px-6 py-12 lg:pt-16 lg:pb-22 home-about__inner" data-astro-cid-moqqdmfq> <div class="text-center" data-astro-cid-moqqdmfq> <h2 class="text-3xl font-black sm:text-4xl sigmar-regular tracking-widest" data-astro-cid-moqqdmfq>
SOBRE NOSOTROS
</h2> <div class="mt-2 text-base italic text-zinc-500 sm:text-lg" data-astro-cid-moqqdmfq>
“La comida casera como en casa”
</div> </div> <div class="mx-auto mt-10 w-full max-w-5xl text-[20px] leading-relaxed text-center text-stone-900 home-about__copy" data-astro-cid-moqqdmfq>
En el Bar Restaurante Arcadia encontrarás comida casera y auténtica, como
      la de antes, elaborada con tiempo, maestría y cariño. Productos de calidad
      y buen servicio. <br data-astro-cid-moqqdmfq> <br data-astro-cid-moqqdmfq> Una cocina nacida de la tradición popular y la vida cotidiana, la que
      se cocinaba en casa y que hoy sigue viva en las cocinas de Arcadia, adaptada
      a los gustos actuales pero sin perder su esencia. Platos familiares y generosos,
      pensados tanto para comer en el local como para disfrutar en casa, gracias a
      nuestro servicio de entrega a domicilio.
</div> </div> </section>`;
}, "C:/Users/vicre/Dev/arcadia/src/sections/home/HomeAbout.astro", void 0);

const $$HomeTiles = createComponent(($$result, $$props, $$slots) => {
  const BOOK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="72px" viewBox="0 -960 960 960" width="72px" fill="#FFFFFF"><path d="M560-564v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-600q-38 0-73 9.5T560-564Zm0 220v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-380q-38 0-73 9t-67 27Zm0-110v-68q33-14 67.5-21t72.5-7q26 0 51 4t49 10v64q-24-9-48.5-13.5T700-490q-38 0-73 9.5T560-454ZM260-320q47 0 91.5 10.5T440-278v-394q-41-24-87-36t-93-12q-36 0-71.5 7T120-692v396q35-12 69.5-18t70.5-6Zm260 42q44-21 88.5-31.5T700-320q36 0 70.5 6t69.5 18v-396q-33-14-68.5-21t-71.5-7q-47 0-93 12t-87 36v394Zm-40 118q-48-38-104-59t-116-21q-42 0-82.5 11T100-198q-21 11-40.5-1T40-234v-482q0-11 5.5-21T62-752q46-24 96-36t102-12q58 0 113.5 15T480-740q51-30 106.5-45T700-800q52 0 102 12t96 36q11 5 16.5 15t5.5 21v482q0 23-19.5 35t-40.5 1q-37-20-77.5-31T700-240q-60 0-116 21t-104 59ZM280-494Z"/></svg>`;
  const MENU_SVG = `<svg xmlns="http://www.w3.org/2000/svg" height="72px" viewBox="0 -960 960 960" width="72px" fill="#FFFFFF"><path d="M240-80q-33 0-56.5-23.5T160-160v-80h-40v-80h40v-120h-40v-80h40v-120h-40v-80h40v-80q0-33 23.5-56.5T240-880h480q33 0 56.5 23.5T800-800v640q0 33-23.5 56.5T720-80H240Zm0-80h480v-640H240v80h40v80h-40v120h40v80h-40v120h40v80h-40v80Zm0 0v-640 640Zm140-120h60v-160q26-7 43-28.5t17-48.5v-163h-40v151h-30v-151h-40v151h-30v-151h-40v163q0 27 17 48.5t43 28.5v160Zm220 0h60v-400q-50 0-85 35t-35 85v120h60v160Z"/></svg>`;
  const cartaBg = "/images/general/menu-bg.webp";
  return renderTemplate`${maybeRenderHead()}<section class="home-tiles w-full" data-astro-cid-p4aw4naa> <div class="grid w-full grid-cols-1 md:grid-cols-2" data-astro-cid-p4aw4naa> <a href="/pedir" class="home-tiles__tile home-tiles__tile--carta relative aspect-6/5 w-full overflow-hidden border-110 border-zinc-900 text-white rounded-t-[3rem] rounded-b-none md:aspect-square md:rounded-tl-[50px] md:rounded-bl-md md:rounded-tr-none md:rounded-br-none hover:border-0 hover:opacity-95 transition-border duration-600"${addAttribute(`background-image: url('${cartaBg}'); background-size: cover; background-position: center; background-repeat: no-repeat;`, "style")} data-astro-cid-p4aw4naa> <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.60),rgba(0,0,0,0.25))]" data-astro-cid-p4aw4naa></div> <div class="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_55%)]" data-astro-cid-p4aw4naa></div> <div class="relative grid h-full w-full place-items-center px-4" data-astro-cid-p4aw4naa> <div class="text-center" data-astro-cid-p4aw4naa> <div class="mx-auto grid h-16 w-16 place-items-center rounded-3xl sm:h-20 sm:w-20" data-astro-cid-p4aw4naa>${unescapeHTML(BOOK_SVG)}</div> <div class="mt-3 text-xl font-normal sigmar-regular tracking-widest sm:mt-4 sm:text-2xl" data-astro-cid-p4aw4naa>
CARTA
</div> </div> </div> </a> <a href="/pedir" class="home-tiles__tile home-tiles__tile--menu relative aspect-6/5 w-full border-110 border-accent rounded-b-[3rem] rounded-t-none md:aspect-square md:rounded-br-[50px] md:rounded-tr-md md:rounded-tl-none md:rounded-bl-none bg-bg text-white hover:border-220 transition-border duration-600" data-astro-cid-p4aw4naa> <div class="relative grid h-full w-full place-items-center" data-astro-cid-p4aw4naa> <div class="home-tiles__panel grid w-full place-items-center bg-zinc-800 aspect-6/5 md:aspect-square" data-astro-cid-p4aw4naa> <div class="text-center px-4" data-astro-cid-p4aw4naa> <div class="mx-auto grid h-16 w-16 place-items-center rounded-3xl sm:h-20 sm:w-20" data-astro-cid-p4aw4naa>${unescapeHTML(MENU_SVG)}</div> <div class="mt-3 text-xl font-normal sigmar-regular tracking-widest text-white sm:mt-4 sm:text-2xl" data-astro-cid-p4aw4naa>
MENÚ
</div> </div> </div> </div> </a> </div> </section>`;
}, "C:/Users/vicre/Dev/arcadia/src/sections/home/HomeTiles.astro", void 0);

const DAYS = [{
  key: 1,
  label: "Lunes"
}, {
  key: 2,
  label: "Martes"
}, {
  key: 3,
  label: "Miércoles"
}, {
  key: 4,
  label: "Jueves"
}, {
  key: 5,
  label: "Viernes"
}, {
  key: 6,
  label: "Sábado"
}, {
  key: 7,
  label: "Domingo"
}];
const DEFAULTS = {
  operatingHours: {
    open: {
      start: "07:30",
      end: "00:00"
    },
    delivery: {
      start: "20:00",
      end: "22:50"
    }
  }
};
async function getSetting(key, fallback) {
  const [r] = await db.select({
    value: AppSetting.value
  }).from(AppSetting).where(eq(AppSetting.key, key)).limit(1);
  return r?.value ?? fallback;
}
function normalizeDow(v) {
  if (!Number.isFinite(v)) return 1;
  if (v === 0) return 7;
  if (v >= 1 && v <= 7) return v;
  if (v >= 0 && v <= 6) return v + 1;
  return 1;
}
function minsToHHMM(mins) {
  const m = Math.max(0, Math.min(24 * 60, Math.trunc(mins)));
  if (m === 24 * 60) return "00:00";
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
function fmtRange(openMins, closeMins) {
  return `${minsToHHMM(openMins)} - ${minsToHHMM(closeMins)}`;
}
function fmtWindow(w) {
  const start = String(w?.start ?? "").trim();
  const end = String(w?.end ?? "").trim();
  if (!start || !end) return "—";
  return `${start} - ${end}`;
}
async function getWeeklyHours() {
  const rows = await db.select({
    dayOfWeek: OpeningHour.dayOfWeek,
    channel: OpeningHour.channel,
    openMins: OpeningHour.openMins,
    closeMins: OpeningHour.closeMins,
    isClosed: OpeningHour.isClosed
  }).from(OpeningHour).where(inArray(OpeningHour.channel, ["DINE_IN", "DELIVERY"])).orderBy(OpeningHour.dayOfWeek);
  const operatingHours = await getSetting("operatingHours", DEFAULTS.operatingHours);
  const localFallback = fmtWindow(operatingHours?.open ?? DEFAULTS.operatingHours.open);
  const deliveryFallback = fmtWindow(operatingHours?.delivery ?? DEFAULTS.operatingHours.delivery);
  const byDayChannel = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const dayKey = normalizeDow(r.dayOfWeek);
    const key = `${dayKey}:${r.channel}`;
    const prev = byDayChannel.get(key);
    const isClosed = !!r.isClosed;
    const openMins = Number(r.openMins ?? 0);
    const closeMins = Number(r.closeMins ?? 0);
    if (!prev) {
      byDayChannel.set(key, {
        isClosed,
        openMins,
        closeMins
      });
      continue;
    }
    if (prev.isClosed || isClosed) {
      byDayChannel.set(key, {
        isClosed: true,
        openMins: prev.openMins,
        closeMins: prev.closeMins
      });
      continue;
    }
    byDayChannel.set(key, {
      isClosed: false,
      openMins: Math.min(prev.openMins, openMins),
      closeMins: Math.max(prev.closeMins, closeMins)
    });
  }
  return DAYS.map((d) => {
    const local = byDayChannel.get(`${d.key}:DINE_IN`);
    const del = byDayChannel.get(`${d.key}:DELIVERY`);
    return {
      dayKey: d.key,
      dayLabel: d.label,
      local: !local ? localFallback : local.isClosed ? "Descanso" : fmtRange(local.openMins, local.closeMins),
      delivery: !del ? deliveryFallback : del.isClosed ? "Descanso" : fmtRange(del.openMins, del.closeMins)
    };
  });
}

const $$HomeHours = createComponent(async ($$result, $$props, $$slots) => {
  const weeklyHours = await getWeeklyHours();
  const availability = await getArcadiaAvailability();
  const localLabel = "LOCAL";
  const deliveryLabel = "A DOMICILIO";
  const liveCards = [
    {
      label: "Local",
      value: availability.localOpen ? "Abierto" : "Cerrado",
      detail: `${availability.windows.open.start} - ${availability.windows.open.end}`,
      tone: availability.localOpen ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-zinc-300 bg-zinc-50 text-zinc-700"
    },
    {
      label: "Recogida",
      value: availability.pickupAvailable ? "Disponible" : "No disponible",
      detail: `${availability.windows.pickup.start} - ${availability.windows.pickup.end}`,
      tone: availability.pickupAvailable ? "border-sky-300 bg-sky-50 text-sky-900" : "border-zinc-300 bg-zinc-50 text-zinc-700"
    },
    {
      label: "Delivery",
      value: availability.forcePickup ? "Solo recogida" : availability.deliveryAvailable ? "Disponible" : "No disponible",
      detail: `${availability.windows.delivery.start} - ${availability.windows.delivery.end}`,
      tone: availability.forcePickup ? "border-amber-300 bg-amber-50 text-amber-900" : availability.deliveryAvailable ? "border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900" : "border-zinc-300 bg-zinc-50 text-zinc-700"
    }
  ];
  const operationalMessage = buildOperationalMessage(availability);
  const operationalTone = availability.pauseOrders ? "border-rose-200 bg-rose-50 text-rose-900" : availability.forcePickup ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-sky-900";
  return renderTemplate`${maybeRenderHead()}<section id="horarios" class="scroll-mt-24"> <div class="mx-auto w-full max-w-340 px-4 py-10 sm:px-6 sm:py-14 lg:py-18"> <div class="rounded-[28px] border border-zinc-300 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:p-10"> <div class="text-center"> <h2 class="text-3xl font-black sm:text-4xl sigmar-regular tracking-widest">
HORARIOS
</h2> <div class="mt-2 text-base italic text-zinc-500 sm:text-lg">
- Organízate sin dudas -
</div> </div> <div class="mt-8 grid gap-3 sm:mt-10 sm:grid-cols-3"> ${liveCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[22px] border px-4 py-4 text-left shadow-[0_8px_20px_rgba(0,0,0,0.04)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em]"> ${card.label} </div> <div class="mt-2 text-lg font-black tracking-wide"> ${card.value} </div> <div class="mt-1 text-sm opacity-80"> ${card.detail} </div> </article>`)} </div> ${operationalMessage ? renderTemplate`<div${addAttribute([
    "mt-5 rounded-[22px] border px-5 py-4 text-sm leading-6",
    operationalTone
  ], "class:list")}> ${operationalMessage} </div>` : null} <div class="mt-8 grid gap-8 sm:mt-12 sm:gap-12 lg:grid-cols-2"> <div class="px-0 sm:px-12"> <div class="text-center text-lg font-normal sigmar-regular tracking-widest"> ${localLabel} </div> <div class="mt-6 grid grid-cols-[1fr_auto] gap-x-4 gap-y-4 text-sm sm:mt-7 sm:gap-x-10 sm:text-lg"> ${weeklyHours.map((row) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <div class="text-zinc-700">${row.dayLabel}</div> <div${addAttribute([
    "text-right font-semibold",
    row.local === "Descanso" || row.local === "—" ? "text-zinc-500" : "text-zinc-900"
  ], "class:list")}> ${row.local} </div> ` })}`)} </div> </div> <div class="px-0 sm:px-12"> <div class="text-center text-lg font-normal sigmar-regular tracking-widest"> ${deliveryLabel} </div> <div class="mt-6 grid grid-cols-[1fr_auto] gap-x-4 gap-y-4 text-sm sm:mt-7 sm:gap-x-10 sm:text-lg"> ${weeklyHours.map((row) => renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": async ($$result2) => renderTemplate` <div class="text-zinc-700">${row.dayLabel}</div> <div${addAttribute([
    "text-right font-semibold",
    row.delivery === "Descanso" || row.delivery === "—" ? "text-zinc-500" : "text-zinc-900"
  ], "class:list")}> ${row.delivery} </div> ` })}`)} </div> </div> </div> <div class="mt-10 flex flex-col items-stretch justify-center gap-3 sm:mt-12 sm:flex-row sm:flex-wrap sm:items-center"> <a href="/#reservas" class="w-full rounded-full border border-zinc-300 bg-white px-7 py-3 text-center text-sm font-semibold hover:bg-zinc-50 sm:w-auto">
Reservar mesa
</a> <a href="/pedir" class="w-full rounded-full bg-accent px-7 py-3 text-center text-sm font-semibold text-white hover:bg-accent-hover sm:w-auto">
Pedir ahora
</a> </div> </div> </div> </section>`;
}, "C:/Users/vicre/Dev/arcadia/src/sections/home/HomeHours.astro", void 0);

function LazyMap({
  query,
  title = "Mapa",
  className = ""
}) {
  const [loaded, setLoaded] = useState(false);
  const src = useMemo(() => {
    const q = encodeURIComponent(query);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, [query]);
  return jsx("div", {
    class: `relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 ${className}`,
    children: !loaded ? jsxs("div", {
      class: "flex h-80 w-full flex-col items-center justify-center gap-3 p-5 text-center sm:h-110 sm:p-6",
      children: [jsx("div", {
        class: "text-sm font-semibold text-zinc-700",
        children: title
      }), jsx("div", {
        class: "text-xs text-zinc-600",
        children: "Cargamos el mapa solo si lo necesitas."
      }), jsx("button", {
        type: "button",
        class: "w-full rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto",
        onClick: () => setLoaded(true),
        children: "Ver mapa"
      })]
    }) : jsx("iframe", {
      title,
      class: "h-80 w-full sm:h-110",
      loading: "lazy",
      referrerPolicy: "no-referrer-when-downgrade",
      src
    })
  });
}

const TripadvisorLogo = createSvgComponent({"meta":{"src":"/_astro/tripadvisor_logo.CnujoWwM.svg","width":512,"height":512,"format":"svg"},"attributes":{"viewBox":"0 0 322 323","width":"512","height":"512"},"children":"<style>.a{fill:#63bb94}.b{fill:#010202}</style><path fill-rule=\"evenodd\" class=\"a\" d=\"m161.1 322.2c-88.9 0-160.8-71.9-160.8-160.8 0-88.9 71.9-160.8 160.8-160.8 88.9 0 160.8 71.9 160.8 160.8 0 88.9-71.9 160.8-160.8 160.8z\" /><path class=\"b\" d=\"m260.8 129.2l19.3-20.9h-43.4c-20.9-14.5-48.2-22.5-75.6-22.5-27.4 0-54.7 8-75.6 22.5h-43.4l19.3 20.9c-11.3 11.3-19.3 25.7-19.3 43.4 0 32.2 27.3 59.5 59.5 59.5 16.1 0 28.9-6.4 40.2-16.1l19.3 20.9 19.3-20.9c11.3 9.6 24.1 16.1 40.2 16.1 32.2 0 59.5-27.3 59.5-59.5 0-16.1-8-32.1-19.3-43.4zm-159.2 85.2c-22.5 0-40.2-17.7-40.2-40.2 0-22.5 17.7-40.2 40.2-40.2 22.5 0 40.2 17.7 40.2 40.2 0 22.5-17.7 40.2-40.2 40.2zm59.5-41.8c0-25.7-19.3-48.2-45-59.5 14.5-4.8 28.9-8 45-8 16.1 0 30.6 3.2 45 9.6-25.7 9.7-45 32.2-45 57.9zm59.5 41.8c-22.5 0-40.2-17.7-40.2-40.2 0-22.5 17.7-40.2 40.2-40.2 22.5 0 40.2 17.7 40.2 40.2 0 22.5-17.7 40.2-40.2 40.2zm0-61.1c-11.3 0-20.9 9.6-20.9 20.9 0 11.3 9.6 20.9 20.9 20.9 11.3 0 20.9-9.6 20.9-20.9 0-11.2-9.6-20.9-20.9-20.9zm-98.1 20.9c0 11.3-9.6 20.9-20.9 20.9-11.3 0-20.9-9.6-20.9-20.9 0-11.3 9.6-20.9 20.9-20.9 11.3 0 20.9 9.7 20.9 20.9z\" />","styles":[".a{fill:#63bb94}.b{fill:#010202}"]});

const GoogleLogo = createSvgComponent({"meta":{"src":"/_astro/google_logo.BnCa4eHs.svg","width":16,"height":16,"format":"svg"},"attributes":{"height":"1em","style":"flex:none;line-height:1","viewBox":"0 0 24 24","width":"1em"},"children":"<title>Google</title><path d=\"M23 12.245c0-.905-.075-1.565-.236-2.25h-10.54v4.083h6.186c-.124 1.014-.797 2.542-2.294 3.569l-.021.136 3.332 2.53.23.022C21.779 18.417 23 15.593 23 12.245z\" fill=\"#4285F4\"></path><path d=\"M12.225 23c3.03 0 5.574-.978 7.433-2.665l-3.542-2.688c-.948.648-2.22 1.1-3.891 1.1a6.745 6.745 0 01-6.386-4.572l-.132.011-3.465 2.628-.045.124C4.043 20.531 7.835 23 12.225 23z\" fill=\"#34A853\"></path><path d=\"M5.84 14.175A6.65 6.65 0 015.463 12c0-.758.138-1.491.361-2.175l-.006-.147-3.508-2.67-.115.054A10.831 10.831 0 001 12c0 1.772.436 3.447 1.197 4.938l3.642-2.763z\" fill=\"#FBBC05\"></path><path d=\"M12.225 5.253c2.108 0 3.529.892 4.34 1.638l3.167-3.031C17.787 2.088 15.255 1 12.225 1 7.834 1 4.043 3.469 2.197 7.062l3.63 2.763a6.77 6.77 0 016.398-4.572z\" fill=\"#EB4335\"></path>","styles":[]});

const $$HomeLocation = createComponent(($$result, $$props, $$slots) => {
  const addressLines = [
    "C/ Maria Aurèlia Campmany i Farnés, nº 2",
    "17310 Lloret de Mar"
  ];
  const phone = "+34 656 56 25 10";
  const email = "info@bararcadia.com";
  const instagram = "@victor_arcadia";
  const ratings = {
    tripadvisor: { label: "Tripadvisor"},
    google: { label: "Google"}
  };
  const mapQuery = "Bar Restaurant Arcadia, Carrer Maria Aurèlia Campmany i Farnés 2, 17310 Lloret de Mar, Girona, España";
  return renderTemplate`${maybeRenderHead()}<section id="ubicacion" class="scroll-mt-24"> <div id="reservas" class="scroll-mt-24"></div> <div class="mx-auto w-full max-w-340 px-4 py-10 sm:px-6 sm:py-12 lg:py-16"> <div class="grid gap-4 sm:gap-6 lg:grid-cols-2"> <div class="rounded-[28px] min-h-144 border border-zinc-300 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:min-h-120 sm:p-8"> <h2 class="text-3xl font-black sigmar-regular tracking-widest sm:text-4xl">
UBICACIÓN
</h2> <div class="mt-4 text-md text-zinc-700"> ${addressLines.map((l) => renderTemplate`<div>${l}</div>`)} </div> <div class="mt-6 flex flex-wrap gap-3"> <div class="flex items-center gap-2 rounded-full border-2 border-emerald-600 px-4 py-2 text-md"> <span class="font-semibold text-emerald-900"> ${renderComponent($$result, "TripadvisorLogo", TripadvisorLogo, { "class": "inline-block size-8 mr-2" })} ${ratings.tripadvisor.label}</span> <span class="text-emerald-900 text-[18px] tracking-widest ml-3">${"★".repeat(5)}</span> </div> </div> <div class="mt-2 flex flex-wrap gap-3"> <div class="flex items-center gap-2 rounded-full border-2 border-yellow-400 px-4 py-2 text-md"> <span class="font-semibold text-black"> ${renderComponent($$result, "GoogleLogo", GoogleLogo, { "class": "inline-block size-8 mr-2" })} ${ratings.google.label}</span> <span class="text-yellow-500 text-[18px] tracking-widest ml-3">${"★".repeat(5)}</span> </div> </div> <div class="mt-10 space-y-3 text-md text-zinc-800 sm:mt-20 sm:space-y-2"> <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"> <span class="text-zinc-600">Teléfono:</span> <span class="font-semibold wrap-break-words">${phone}</span> </div> <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"> <span class="text-zinc-600">Correo:</span> <span class="font-semibold break-all sm:wrap-break-words">${email}</span> </div> <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4"> <span class="text-zinc-600">Instagram:</span> <span class="font-semibold wrap-break-words">${instagram}</span> </div> </div> </div> <div class="rounded-[28px] border border-zinc-300 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] sm:p-6"> ${renderComponent($$result, "LazyMap", LazyMap, { "client:load": true, "query": mapQuery, "title": "Mapa · Arcadia", "client:component-hydration": "load", "client:component-path": "@/islands/home/LazyMap", "client:component-export": "default" })} </div> </div> </div> </section>`;
}, "C:/Users/vicre/Dev/arcadia/src/sections/home/HomeLocation.astro", void 0);

function Stars({
  rating
}) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return jsx("div", {
    class: "flex items-center gap-1",
    children: Array.from({
      length: 5
    }).map((_, i) => jsx("span", {
      class: i < r ? "text-yellow-400" : "text-zinc-300",
      children: "★"
    }, i))
  });
}
async function safeFetchReviews(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data?.reviews) ? data.reviews : [];
    return list;
  } catch {
    return null;
  }
}
function ReviewsCarousel({
  reviews = [],
  fetchUrl,
  intervalMs = 4500
}) {
  const [remote, setRemote] = useState(null);
  useEffect(() => {
    if (!fetchUrl) return;
    let alive = true;
    safeFetchReviews(fetchUrl).then((r2) => {
      if (!alive) return;
      if (r2 && r2.length) setRemote(r2);
    });
    return () => {
      alive = false;
    };
  }, [fetchUrl]);
  const safe = useMemo(() => {
    const base = remote ?? reviews;
    return Array.isArray(base) ? base.filter(Boolean) : [];
  }, [remote, reviews]);
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(false);
  useEffect(() => {
    setIdx(0);
  }, [safe.length]);
  useEffect(() => {
    if (safe.length <= 1) return;
    const t = window.setInterval(() => {
      setFade(true);
      window.setTimeout(() => {
        setIdx((v) => (v + 1) % safe.length);
        setFade(false);
      }, 220);
    }, intervalMs);
    return () => window.clearInterval(t);
  }, [safe.length, intervalMs]);
  if (safe.length === 0) return null;
  const r = safe[idx];
  return jsx("div", {
    class: "grid items-stretch gap-4 sm:gap-6 md:grid-cols-3",
    children: jsxs("article", {
      class: `rounded-2xl border min-h-88 min-w-0 border-zinc-300 bg-white p-4 shadow-sm transition-opacity duration-200 sm:min-h-120 sm:min-w-140 sm:p-6 ${fade ? "opacity-0" : "opacity-100"}`,
      children: [jsxs("div", {
        class: "flex items-center gap-3",
        children: [jsx("div", {
          class: "h-10 w-10 overflow-hidden rounded-full bg-zinc-100 sm:h-11 sm:w-11",
          children: r.avatarUrl ? jsx("img", {
            src: r.avatarUrl,
            alt: r.name,
            class: "h-full w-full object-cover",
            loading: "lazy"
          }) : jsx("div", {
            class: "grid h-full w-full place-items-center text-zinc-500",
            children: "👤"
          })
        }), jsxs("div", {
          class: "min-w-0",
          children: [jsx("div", {
            class: "truncate text-sm font-semibold",
            children: r.name
          }), jsxs("div", {
            class: "text-xs text-zinc-600",
            children: [r.totalReviews ? `${r.totalReviews} valoraciones · ` : "", r.source]
          })]
        })]
      }), jsx("p", {
        class: "mt-4 text-sm leading-relaxed text-zinc-800",
        children: r.text
      }), jsxs("div", {
        class: "mt-4 flex items-center justify-between gap-3",
        children: [jsx(Stars, {
          rating: r.rating
        }), jsxs("span", {
          class: "shrink-0 text-xs font-semibold text-zinc-700",
          children: [r.rating.toFixed(1), "/5"]
        })]
      })]
    })
  });
}

const $$HomeReviews = createComponent(async ($$result, $$props, $$slots) => {
  const hasPlacesConfig = Boolean(
    process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID
  );
  const [cacheRow] = await db.select({ value: AppSetting.value }).from(AppSetting).where(eq(AppSetting.key, "googleReviewsCache")).limit(1);
  const cached = cacheRow?.value ?? null;
  const cachedReviews = Array.isArray(cached?.reviews) ? cached.reviews.filter(Boolean) : [];
  const shouldRenderSection = hasPlacesConfig || cachedReviews.length > 0;
  return renderTemplate`${shouldRenderSection ? renderTemplate`${maybeRenderHead()}<section id="resenas" class="scroll-mt-24"><div class="mx-auto w-full max-w-340 px-4 py-10 sm:px-6 sm:py-12 lg:py-16"><h2 class="text-3xl font-black sigmar-regular tracking-widest sm:text-4xl text-center">
RESEÑAS
</h2><div class="mt-8 sm:mt-10">${renderComponent($$result, "ReviewsCarousel", ReviewsCarousel, { "client:load": true, "fetchUrl": "/api/home/reviews", "reviews": cachedReviews, "client:component-hydration": "load", "client:component-path": "@/islands/home/ReviewsCarousel", "client:component-export": "default" })}</div></div></section>` : null}`;
}, "C:/Users/vicre/Dev/arcadia/src/sections/home/HomeReviews.astro", void 0);

const ARROW = jsx("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  height: "48px",
  viewBox: "0 -960 960 960",
  width: "48px",
  fill: "#FFFFFF",
  children: jsx("path", {
    d: "M120-160v-640l760 320-760 320Zm80-120 474-200-474-200v140l240 60-240 60v140Zm0 0v-400 400Z"
  })
});
function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [msg, setMsg] = useState("");
  async function submit() {
    const value = email.trim();
    if (!value) return;
    setStatus("loading");
    setMsg("");
    const res = await fetch("/api/marketing/subscribe", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: value
      })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setMsg(data?.message || "No se pudo suscribir.");
      return;
    }
    setStatus("ok");
    setMsg("¡Perfecto! Te avisaremos con ofertas y novedades.");
    setEmail("");
  }
  return jsxs("div", {
    children: [jsxs("div", {
      class: "flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5",
      children: [jsx("input", {
        class: "h-14 w-full rounded-2xl border border-white/20 bg-white px-5 text-base text-zinc-900 outline-none placeholder:text-zinc-500 sm:w-240",
        placeholder: "example@correo.com",
        value: email,
        onInput: (e) => setEmail(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") submit();
        }
      }), jsx("button", {
        type: "button",
        class: `grid h-14 w-14 shrink-0 place-items-center self-start rounded-2xl cursor-pointer text-white hover:text-white/90 ${status === "loading" ? "opacity-60 pointer-events-none" : ""}`,
        onClick: submit,
        "aria-label": "Suscribirme",
        title: "Suscribirme",
        children: ARROW
      })]
    }), msg ? jsx("div", {
      class: `mt-4 text-sm ${status === "error" ? "text-red-200" : "text-white/80"}`,
      children: msg
    }) : null]
  });
}

const $$HomeNewsletter = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<section id="newsletter" class="scroll-mt-24"> <div class="mx-auto w-full max-w-340 px-4 py-10 sm:px-6 sm:py-14 lg:py-18"> <div class="rounded-[28px] bg-accent px-5 py-8 text-white shadow-[0_20px_50px_rgba(0,0,0,0.25)] sm:px-12 sm:py-12"> <h2 class="text-3xl font-black leading-none tracking-tight sm:text-4xl md:text-5xl">
¿TE APETECE ARCADIA HOY?
</h2> <p class="mt-4 text-base text-white/80 sm:text-lg md:text-xl">
Regístrate a nuestras ofertas y novedades
</p> <div class="mt-7"> ${renderComponent($$result, "NewsletterForm", NewsletterForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/home/NewsletterForm", "client:component-export": "default" })} </div> </div> </div> </section>`;
}, "C:/Users/vicre/Dev/arcadia/src/sections/home/HomeNewsletter.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Arcadia · Lloret de Mar", "variant": "landing" }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "HomeHero", $$HomeHero, {})} ${renderComponent($$result2, "HomeAbout", $$HomeAbout, {})} ${renderComponent($$result2, "HomeTiles", $$HomeTiles, {})} ${renderComponent($$result2, "HomeHours", $$HomeHours, {})} ${renderComponent($$result2, "HomeLocation", $$HomeLocation, {})} ${renderComponent($$result2, "HomeReviews", $$HomeReviews, {})} ${renderComponent($$result2, "HomeNewsletter", $$HomeNewsletter, {})} ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/index.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
