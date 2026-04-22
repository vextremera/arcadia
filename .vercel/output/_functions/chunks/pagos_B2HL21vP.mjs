import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { g as getPaymentsSettings } from './settings_CbhWKZ6C.mjs';

const $$Pagos = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Pagos;
  const payments = getPaymentsSettings();
  const url = new URL(Astro2.request.url);
  const info = url.searchParams.get("info") ?? "";
  const infoMessage = info === "fixed-methods" ? "Los métodos de pago ya no se configuran por canal. En Arcadia, efectivo y tarjeta están siempre disponibles tanto en delivery como en pickup." : "";
  const cards = [
    {
      label: "Delivery · efectivo",
      value: payments.delivery.cashEnabled ? "Activo" : "Inactivo",
      tone: payments.delivery.cashEnabled ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Pago en mano al repartidor"
    },
    {
      label: "Delivery · tarjeta",
      value: payments.delivery.cardEnabled ? "Activo" : "Inactivo",
      tone: payments.delivery.cardEnabled ? "border-sky-400/20 bg-sky-400/10 text-sky-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Cobro con tarjeta en pedidos a domicilio"
    },
    {
      label: "Pickup · efectivo",
      value: payments.pickup.cashEnabled ? "Activo" : "Inactivo",
      tone: payments.pickup.cashEnabled ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Cobro en local al recoger"
    },
    {
      label: "Pickup · tarjeta",
      value: payments.pickup.cardEnabled ? "Activo" : "Inactivo",
      tone: payments.pickup.cardEnabled ? "border-sky-400/20 bg-sky-400/10 text-sky-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Pago con tarjeta en recogida"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Pagos · Admin · Arcadia", "heading": "Pagos", "description": "Estado actual del módulo de pagos. En Arcadia, efectivo y tarjeta forman parte del flujo normal tanto en delivery como en pickup; lo que realmente cambia es la disponibilidad operativa del canal.", "actions": true }, { "actions": ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/operativa" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ir a operativa
</a> <a href="/admin/ajustes/fees" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver fees
</a> </div> ` })}`, "default": ($$result2) => renderTemplate`  ${infoMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-sky-400/20 bg-sky-400/10 px-5 py-4 text-sm text-sky-100"> ${infoMessage} </section>` : null}<section class="mb-6 rounded-[30px] border border-amber-400/20 bg-amber-400/10 p-6 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/90">
Estado real del módulo
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Métodos fijos por negocio
</h2> <p class="mt-3 max-w-4xl text-sm leading-7 text-amber-100/85">
En Arcadia no se desactivan métodos de pago por canal. Tanto <strong>efectivo</strong> como <strong>tarjeta</strong> forman parte del flujo normal en <strong>delivery</strong> y <strong>pickup</strong>. Lo que sí puede cambiar desde operativa es la
      disponibilidad del canal: pausa global, force pickup, horarios y
      excepciones.
</p> </section> <section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-4"> ${cards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-300">${card.help}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_380px]"> <article class="rounded-[32px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Regla de negocio
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Qué significa realmente esta pantalla
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Este panel ya no sirve para activar o desactivar efectivo o tarjeta por
        canal. La decisión de negocio quedó simplificada: ambos métodos están
        presentes en los dos canales operativos.
</p> <div class="mt-6 grid gap-4 md:grid-cols-2"> <article class="rounded-[26px] border border-white/10 bg-[#091121]/80 p-5"> <div class="text-base font-semibold text-white">Delivery</div> <p class="mt-3 text-sm leading-7 text-slate-400">
Admite <strong class="text-slate-200">efectivo</strong> y <strong class="text-slate-200">tarjeta</strong> siempre que el canal delivery esté disponible por horario, flags y operativa
            real.
</p> </article> <article class="rounded-[26px] border border-white/10 bg-[#091121]/80 p-5"> <div class="text-base font-semibold text-white">Pickup</div> <p class="mt-3 text-sm leading-7 text-slate-400">
Admite <strong class="text-slate-200">efectivo</strong> y <strong class="text-slate-200">tarjeta</strong> siempre que pickup esté operativo y no haya bloqueo global.
</p> </article> </div> <div class="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5"> <div class="text-sm font-semibold text-white">Conclusión</div> <p class="mt-3 text-sm leading-7 text-slate-400">
Esta pantalla ya no es un centro de configuración compleja. Hoy su
          papel correcto es <strong class="text-slate-200">informar</strong> del estado
          del modelo de pagos y dejar claro que la operativa del canal es lo que realmente
          manda.
</p> </div> </article> <aside class="space-y-6"> <section class="rounded-[32px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Qué manda de verdad
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Operativa
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">Pause orders</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Bloquea el checkout completo independientemente del método de
              pago.
</p> </article> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">Force pickup</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Desactiva delivery y fuerza recogida, pero no cambia los métodos
              de pago.
</p> </article> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">
Horarios y special dates
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Determinan si un canal está abierto o cerrado en cada momento.
</p> </article> </div> </section> <section class="rounded-[32px] border border-sky-400/20 bg-sky-400/10 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.28)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">
Trazabilidad interna
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Registro de pago
</h2> <p class="mt-3 text-sm leading-7 text-sky-100/80">
Los pedidos con tarjeta siguen generando un registro interno en <code>Payment</code>. La pasarela externa sigue pendiente, pero el método ya no es una
          configuración variable de esta pantalla.
</p> </section> </aside> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/ajustes/pagos.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/ajustes/pagos.astro";
const $$url = "/admin/ajustes/pagos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Pagos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
