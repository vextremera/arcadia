import { e as createComponent, r as renderTemplate, n as defineScriptVars, k as renderComponent, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_Ccjf6LBM.mjs';
import { d as db, N as NewsletterSubscriber, j as User } from '../../chunks/_astro_db_BPgDZzX3.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Newsletter = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
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
  const activeCount = sortedSubscribers.filter((subscriber) => subscriber.active).length;
  const inactiveCount = sortedSubscribers.length - activeCount;
  const linkedCount = sortedSubscribers.filter((subscriber) => !!subscriber.userId).length;
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") ?? "";
  const sent = Number(url.searchParams.get("sent") ?? 0);
  const failed = Number(url.searchParams.get("failed") ?? 0);
  const error = url.searchParams.get("error") ?? "";
  const smtpReady = Boolean(
    undefined                         
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
  return renderTemplate(_a || (_a = __template(["", " <script>(function(){", '\n  (() => {\n    const presetEl = document.getElementById("newsletter-preset");\n    const subjectEl = document.getElementById("newsletter-subject");\n    const bodyEl = document.getElementById("newsletter-body");\n\n    if (!(presetEl instanceof HTMLSelectElement)) return;\n    if (!(subjectEl instanceof HTMLInputElement)) return;\n    if (!(bodyEl instanceof HTMLTextAreaElement)) return;\n\n    const presetMap = presets || {};\n\n    presetEl.addEventListener("change", () => {\n      const selected = presetMap[presetEl.value];\n      if (!selected) return;\n      subjectEl.value = selected.subject || "";\n      bodyEl.value = selected.body || "";\n    });\n  })();\n})();</script>'])), renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Newsletter · Admin · Arcadia", "heading": "Newsletter", "description": "Listado simple de suscriptores y envío manual de correos a la base activa.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${successMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200"> ${successMessage} </section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-3"> <article class="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Activos</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${activeCount}</div> <p class="mt-2 text-sm text-slate-400">Suscriptores que recibirán correos</p> </article> <article class="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Ligados a cuenta</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${linkedCount}</div> <p class="mt-2 text-sm text-slate-400">Suscriptores con usuario registrado</p> </article> <article class="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Inactivos</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${inactiveCount}</div> <p class="mt-2 text-sm text-slate-400">Bajas o correos desactivados</p> </article> </section> <section class="mt-6 grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]"> <aside class="space-y-6"> <article class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Envío manual</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">Nuevo correo</h2> <p class="mt-2 text-sm leading-6 text-slate-400">
El administrador redacta y envía manualmente el mensaje a todos los suscriptores activos.
</p> ${!smtpReady ? renderTemplate`<div class="mt-5 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100/85">
Falta configurar SMTP para poder enviar. Revisa <code class="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-100">SMTP_HOST</code>, <code class="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-100">SMTP_PORT</code> y <code class="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-100">SMTP_FROM</code>.
</div>` : null} <form method="post" action="/api/admin/newsletter" class="mt-6 grid gap-4"> <input type="hidden" name="intent" value="send"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Preset</span> <select id="newsletter-preset" class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" name="preset"> <option value="GENERAL">General</option> <option value="OFFER">Oferta</option> <option value="COUPON">Cupón</option> <option value="EVENT">Evento</option> </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Asunto</span> <input id="newsletter-subject" class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="text" name="subject"${addAttribute(presets.GENERAL.subject, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Cuerpo</span> <textarea id="newsletter-body" class="min-h-56 w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" name="body" required>${presets.GENERAL.body}</textarea> </label> <button type="submit"${addAttribute([
    "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
    smtpReady ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300" : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
  ], "class:list")}${addAttribute(!smtpReady, "disabled")}>
Enviar a suscriptores activos
</button> </form> </article> </aside> <section class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Base</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">Suscriptores</h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"> ${sortedSubscribers.length} registros
</div> </div> </div> ${sortedSubscribers.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center text-sm text-slate-400">
Aún no hay suscriptores registrados.
</div>` : renderTemplate`<div class="space-y-4 px-6 py-6"> ${sortedSubscribers.map((subscriber) => {
    const linkedUser = subscriber.userId ? userById.get(subscriber.userId) : null;
    return renderTemplate`<article class="rounded-3xl border border-white/10 bg-white/4 p-5"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-base font-semibold text-white">${subscriber.email}</div> <div class="mt-2 flex flex-wrap gap-2"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
      subscriber.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-zinc-500/30 bg-zinc-500/10 text-zinc-300"
    ], "class:list")}> ${subscriber.active ? "Activo" : "Inactivo"} </span> ${linkedUser ? renderTemplate`<span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">
Ligado a cuenta
</span>` : renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
Sin cuenta
</span>`} </div> <div class="mt-3 text-sm text-slate-400">
Alta: ${new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(subscriber.createdAt))} </div> <div class="mt-1 text-sm text-slate-500">
Último cambio: ${new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid" }).format(new Date(subscriber.updatedAt))} </div> ${linkedUser ? renderTemplate`<div class="mt-2 text-sm text-slate-400">
Cuenta: <span class="font-semibold text-white">${linkedUser.name?.trim() || linkedUser.email}</span> </div>` : null} </div> <form method="post" action="/api/admin/newsletter"> <input type="hidden" name="intent" value="toggle-subscriber"> <input type="hidden" name="subscriberId"${addAttribute(subscriber.id, "value")}> <input type="hidden" name="active"${addAttribute(subscriber.active ? "0" : "1", "value")}> <button type="submit"${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      subscriber.active ? "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
    ], "class:list")}> ${subscriber.active ? "Desactivar" : "Reactivar"} </button> </form> </div> </article>`;
  })} </div>`} </section> </section> ` }), defineScriptVars({ presets }));
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/newsletter.astro", void 0);
const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/newsletter.astro";
const $$url = "/admin/newsletter";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Newsletter,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
