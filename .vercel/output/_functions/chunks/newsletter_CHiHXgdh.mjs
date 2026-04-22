import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, b9 as defineScriptVars, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, N as NewsletterSubscriber, U as User } from './_astro_db_Bcz5lWRF.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Newsletter = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Newsletter;
  const subscribers = await db.select({
    id: NewsletterSubscriber.id,
    email: NewsletterSubscriber.email,
    userId: NewsletterSubscriber.userId,
    active: NewsletterSubscriber.active,
    createdAt: NewsletterSubscriber.createdAt,
    updatedAt: NewsletterSubscriber.updatedAt
  }).from(NewsletterSubscriber);
  const userIds = subscribers.map((subscriber) => subscriber.userId).filter((value) => Number.isFinite(value));
  const users = userIds.length ? await db.select({
    id: User.id,
    email: User.email,
    name: User.name
  }).from(User).where(inArray(User.id, userIds)) : [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const sortedSubscribers = [...subscribers].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  const activeCount = sortedSubscribers.filter(
    (subscriber) => subscriber.active
  ).length;
  const inactiveCount = sortedSubscribers.length - activeCount;
  const linkedCount = sortedSubscribers.filter(
    (subscriber) => !!subscriber.userId
  ).length;
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") ?? "";
  const sent = Number(url.searchParams.get("sent") ?? 0);
  const failed = Number(url.searchParams.get("failed") ?? 0);
  const error = url.searchParams.get("error") ?? "";
  const smtpReady = Boolean(
    "Arcadia <arcadia@victorextremera.cat>"
  );
  const successMessage = saved === "subscriber" ? "Suscriptor actualizado correctamente." : saved === "send" ? `Envío completado. Enviados: ${sent}. Fallidos: ${failed}.` : "";
  const errorMessage = error === "missing-subject" ? "El asunto es obligatorio." : error === "missing-body" ? "El cuerpo del correo es obligatorio." : error === "no-subscribers" ? "No hay suscriptores activos a los que enviar." : error === "smtp-not-configured" ? "Falta configurar SMTP_HOST, SMTP_PORT o SMTP_FROM para poder enviar correos." : error === "send-failed" ? "No se ha podido completar el envío del newsletter." : error === "invalid-subscriber" ? "El suscriptor indicado no es válido." : "";
  const presets = {
    GENERAL: {
      subject: "Novedades de Arcadia",
      body: "Hola,\n\nTe escribimos para contarte las últimas novedades de Arcadia.\n\n¡Te esperamos!"
    },
    OFFER: {
      subject: "Nueva oferta en Arcadia",
      body: "Hola,\n\nTenemos una nueva oferta en Arcadia durante tiempo limitado.\n\nPásate por /pedir o ven a vernos."
    },
    COUPON: {
      subject: "Tu cupón de Arcadia",
      body: "Hola,\n\nTe compartimos un cupón especial para tu próximo pedido en Arcadia.\n\nConsulta condiciones en el mensaje o en nuestras redes."
    },
    EVENT: {
      subject: "Nuevo evento en Arcadia",
      body: "Hola,\n\nQueríamos avisarte de un nuevo evento en Arcadia.\n\nReserva o pásate a disfrutarlo con nosotros."
    }
  };
  const summaryCards = [
    {
      label: "Activos",
      value: activeCount,
      note: "Recibirán el envío manual",
      tone: "border-emerald-400/15 bg-emerald-400/8"
    },
    {
      label: "Ligados a cuenta",
      value: linkedCount,
      note: "Tienen usuario registrado",
      tone: "border-sky-400/15 bg-sky-400/8"
    },
    {
      label: "Inactivos",
      value: inactiveCount,
      note: "Bajas o desactivados",
      tone: "border-white/10 bg-white/[0.03]"
    }
  ];
  function formatDateTime(value) {
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Madrid"
    }).format(new Date(value));
  }
  return renderTemplate(_a || (_a = __template(["", " <script>(function(){", '\n  (() => {\n    const presetEl = document.getElementById("newsletter-preset");\n    const subjectEl = document.getElementById("newsletter-subject");\n    const bodyEl = document.getElementById("newsletter-body");\n\n    if (!(presetEl instanceof HTMLSelectElement)) return;\n    if (!(subjectEl instanceof HTMLInputElement)) return;\n    if (!(bodyEl instanceof HTMLTextAreaElement)) return;\n\n    const presetMap = presets || {};\n\n    presetEl.addEventListener("change", () => {\n      const selected = presetMap[presetEl.value];\n      if (!selected) return;\n      subjectEl.value = selected.subject || "";\n      bodyEl.value = selected.body || "";\n    });\n  })();\n})();</script>'])), renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Newsletter · Admin · Arcadia", "heading": "Newsletter", "description": "Base simple de suscriptores y envío manual. He rehecho esta pantalla para que respire más y para que el bloque de envío tenga mucho más peso visual que la simple lista técnica.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${successMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200"> ${successMessage} </section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-3"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[460px_minmax(0,1fr)]"> <aside class="space-y-6"> <article class="rounded-[32px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Envío manual
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Nuevo correo
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
El administrador redacta y lanza el envío manual a toda la base
          activa. Aquí no hay automatización compleja: solo una herramienta
          clara para campañas simples.
</p> ${!smtpReady ? renderTemplate`<div class="mt-6 rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/85">
Falta configurar SMTP para poder enviar. Revisa${" "} <code class="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-100">
SMTP_HOST
</code>
,${" "} <code class="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-100">
SMTP_PORT
</code>${" "}
y${" "} <code class="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-100">
SMTP_FROM
</code>
.
</div>` : renderTemplate`<div class="mt-6 rounded-[24px] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-6 text-emerald-100/85">
SMTP listo. El envío saldrá a los${" "} <strong class="text-emerald-100">${activeCount}</strong>${" "}
suscriptores activos.
</div>`} <form method="post" action="/api/admin/newsletter" class="mt-7 grid gap-5"> <input type="hidden" name="intent" value="send"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Preset
</span> <select id="newsletter-preset" class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" name="preset"> <option value="GENERAL">General</option> <option value="OFFER">Oferta</option> <option value="COUPON">Cupón</option> <option value="EVENT">Evento</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Asunto
</span> <input id="newsletter-subject" class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="text" name="subject"${addAttribute(presets.GENERAL.subject, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Cuerpo
</span> <textarea id="newsletter-body" class="min-h-64 w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" name="body" required>${presets.GENERAL.body}</textarea> </label> <button type="submit"${addAttribute([
    "inline-flex min-h-11 items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
    smtpReady ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:border-cyan-400/30 hover:bg-cyan-400/15" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500"
  ], "class:list")}${addAttribute(!smtpReady, "disabled")}>
Enviar a suscriptores activos
</button> </form> </article> <article class="rounded-[32px] border border-white/10 bg-[#0b1220]/90 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Uso de esta pantalla
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">Manual y simple</div> <p class="mt-2 text-sm leading-6 text-slate-400">
No intenta ser una plataforma de marketing. Sirve para envíos
              manuales básicos desde la base activa.
</p> </article> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">
Presets editables
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Los presets solo rellenan asunto y cuerpo. Antes de enviar, el
              admin puede reescribir ambos campos.
</p> </article> <article class="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">
Dependencia SMTP
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Sin configuración SMTP válida, la pantalla sigue siendo útil como
              editor, pero el envío se bloquea.
</p> </article> </div> </article> </aside> <section class="overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Base
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Suscriptores
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Lista ordenada por estado y actividad reciente. Cada suscriptor
              muestra si está vinculado a una cuenta y cuándo se dio de alta o
              cambió de estado.
</p> </div> <div class="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300"> ${sortedSubscribers.length} registros
</div> </div> </div> ${sortedSubscribers.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#091121] p-8"> <div class="text-lg font-semibold text-white">
Aún no hay suscriptores
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
La base de newsletter está vacía.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${sortedSubscribers.map((subscriber) => {
    const linkedUser = subscriber.userId ? userById.get(subscriber.userId) : null;
    return renderTemplate`<article class="rounded-[28px] border border-white/10 bg-[#091121]/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="break-all text-lg font-semibold text-white"> ${subscriber.email} </div> <div class="mt-3 flex flex-wrap gap-2.5"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
      subscriber.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
    ], "class:list")}> ${subscriber.active ? "Activo" : "Inactivo"} </span> ${linkedUser ? renderTemplate`<span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300">
Ligado a cuenta
</span>` : renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
Sin cuenta
</span>`} </div> </div> <form method="post" action="/api/admin/newsletter"> <input type="hidden" name="intent" value="toggle-subscriber"> <input type="hidden" name="subscriberId"${addAttribute(subscriber.id, "value")}> <input type="hidden" name="active"${addAttribute(subscriber.active ? "0" : "1", "value")}> <button type="submit"${addAttribute([
      "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
      subscriber.active ? "border border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/15 hover:bg-white/[0.06] hover:text-white" : "border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 hover:border-cyan-400/30 hover:bg-cyan-400/15"
    ], "class:list")}> ${subscriber.active ? "Desactivar" : "Reactivar"} </button> </form> </div> <div class="mt-6 grid gap-4 xl:grid-cols-3"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Alta
</div> <div class="mt-3 text-sm font-semibold text-white"> ${formatDateTime(subscriber.createdAt)} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Último cambio
</div> <div class="mt-3 text-sm font-semibold text-white"> ${formatDateTime(subscriber.updatedAt)} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Cuenta vinculada
</div> <div class="mt-3 text-sm font-semibold text-white"> ${linkedUser ? linkedUser.name?.trim() || linkedUser.email : "No"} </div> ${linkedUser ? renderTemplate`<div class="mt-2 break-all text-sm text-slate-500"> ${linkedUser.email} </div>` : null} </section> </div> </article>`;
  })} </div>`} </section> </section> ` }), defineScriptVars({ presets }));
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/newsletter.astro", void 0);
const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/newsletter.astro";
const $$url = "/admin/newsletter";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Newsletter,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
