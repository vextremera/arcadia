import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_CaEDeM2K.mjs';
import { d as db, A as AppSetting } from '../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$Pagos = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Pagos;
  const DEFAULT_PAYMENTS = {
    delivery: { cashEnabled: true, cardEnabled: true },
    pickup: { cashEnabled: true, cardEnabled: true }
  };
  const [row] = await db.select({ value: AppSetting.value }).from(AppSetting).where(eq(AppSetting.key, "payments")).limit(1);
  const payments = row?.value ?? DEFAULT_PAYMENTS;
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") === "1";
  const cards = [
    {
      label: "Delivery \xB7 efectivo",
      value: payments.delivery.cashEnabled ? "Activo" : "Inactivo",
      tone: payments.delivery.cashEnabled ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Pago en mano al repartidor"
    },
    {
      label: "Delivery \xB7 tarjeta",
      value: payments.delivery.cardEnabled ? "Activo" : "Inactivo",
      tone: payments.delivery.cardEnabled ? "border-sky-400/20 bg-sky-400/10 text-sky-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Cobro con tarjeta en pedidos a domicilio"
    },
    {
      label: "Pickup \xB7 efectivo",
      value: payments.pickup.cashEnabled ? "Activo" : "Inactivo",
      tone: payments.pickup.cashEnabled ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Cobro en local al recoger"
    },
    {
      label: "Pickup \xB7 tarjeta",
      value: payments.pickup.cardEnabled ? "Activo" : "Inactivo",
      tone: payments.pickup.cardEnabled ? "border-sky-400/20 bg-sky-400/10 text-sky-200" : "border-rose-400/20 bg-rose-400/10 text-rose-200",
      help: "Pago con tarjeta en recogida"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Pagos \xB7 Admin \xB7 Arcadia", "heading": "Pagos", "description": "Configuraci\xF3n de m\xE9todos de pago disponibles por canal. Checkout los consume de forma directa y los pedidos con tarjeta generan un registro interno en Payment.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/operativa" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Ir a operativa
</a> <a href="/admin/ajustes/fees" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver fees
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Métodos de pago guardados correctamente.
</section>` : null}<section class="mb-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100/85"> <div class="font-semibold text-amber-200">Estado real del módulo</div> <p class="mt-2 leading-6">
El checkout ya bloquea y permite métodos por canal. Además, los pedidos con <strong>tarjeta</strong> generan un registro interno en <code class="rounded-lg border border-amber-300/20 bg-black/20 px-2 py-1 text-xs text-amber-100">Payment</code> para que el admin deje de trabajar a ciegas. La pasarela externa sigue pendiente.
</p> </section> <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> ${cards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-3xl border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em]"> ${card.label} </div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${card.value} </div> <p class="mt-2 text-sm text-white/75">${card.help}</p> </article>`)} </section> <form class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" method="post" action="/api/admin/settings/payments"> <article class="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex items-start justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300">
Canal
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Delivery
</h2> <p class="mt-2 max-w-xl text-sm leading-6 text-slate-400">
Define qué métodos de pago puede usar el cliente cuando el pedido se envía a domicilio.
</p> </div> <div class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">
Delivery
</div> </div> <div class="mt-6 space-y-4"> <label class="block rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="deliveryCash"${addAttribute(payments.delivery.cashEnabled, "checked")}> <div> <div class="text-sm font-semibold text-white">Efectivo habilitado</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Permite pagar en metálico al recibir el pedido.
</p> </div> </div> </label> <label class="block rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="deliveryCard"${addAttribute(payments.delivery.cardEnabled, "checked")}> <div> <div class="text-sm font-semibold text-white">Tarjeta habilitada</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Permite usar tarjeta para pedidos delivery.
</p> </div> </div> </label> </div> </article> <article class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"> <div class="flex items-start justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-indigo-300">
Canal
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Pickup
</h2> <p class="mt-2 max-w-xl text-sm leading-6 text-slate-400">
Controla los métodos de pago permitidos cuando el cliente recoge en local.
</p> </div> <div class="rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-300">
Pickup
</div> </div> <div class="mt-6 space-y-4"> <label class="block rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="pickupCash"${addAttribute(payments.pickup.cashEnabled, "checked")}> <div> <div class="text-sm font-semibold text-white">Efectivo habilitado</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Permite cobrar en caja cuando el cliente recoge el pedido.
</p> </div> </div> </label> <label class="block rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="pickupCard"${addAttribute(payments.pickup.cardEnabled, "checked")}> <div> <div class="text-sm font-semibold text-white">Tarjeta habilitada</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Permite cobro con tarjeta para pedidos de recogida.
</p> </div> </div> </label> </div> </article> <div class="xl:col-span-2 flex flex-wrap gap-3"> <button class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400" type="submit">
Guardar métodos de pago
</button> <a href="/admin" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al dashboard
</a> </div> </form> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/ajustes/pagos.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/ajustes/pagos.astro";
const $$url = "/admin/ajustes/pagos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Pagos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
