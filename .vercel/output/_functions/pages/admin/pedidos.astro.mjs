import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_CaEDeM2K.mjs';
import { d as db, O as Order } from '../../chunks/_astro_db_ChTDrd2j.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} \u20AC`;
  }
  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Madrid"
    }).format(date);
  }
  function statusTone(status2) {
    switch (status2) {
      case "PENDING":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";
      case "PAID":
        return "border-sky-400/20 bg-sky-400/10 text-sky-300";
      case "ACCEPTED":
        return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
      case "PREPARING":
        return "border-violet-400/20 bg-violet-400/10 text-violet-300";
      case "READY":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
      case "OUT_FOR_DELIVERY":
        return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300";
      case "DELIVERED":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
      case "CANCELLED":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";
      default:
        return "border-white/10 bg-white/5 text-slate-300";
    }
  }
  function paymentMethodTone(value) {
    switch (value) {
      case "CASH":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";
      case "CARD":
        return "border-sky-400/20 bg-sky-400/10 text-sky-300";
      default:
        return "border-white/10 bg-white/5 text-slate-300";
    }
  }
  function paymentStatusTone(status2) {
    switch (status2) {
      case "PAID":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
      case "UNPAID":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";
      case "AUTH":
        return "border-sky-400/20 bg-sky-400/10 text-sky-300";
      case "FAILED":
        return "border-rose-400/20 bg-rose-400/10 text-rose-300";
      case "REFUNDED":
      case "PARTIALLY_REFUNDED":
        return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300";
      default:
        return "border-white/10 bg-white/5 text-slate-300";
    }
  }
  function parsePaymentMethod(snapshot) {
    const meta = snapshot ?? {};
    const raw = String(meta.paymentMethod ?? "").toUpperCase();
    return raw === "CASH" || raw === "CARD" ? raw : "UNKNOWN";
  }
  function nextSuggestedStatus(status2, type2) {
    if (status2 === "PENDING" || status2 === "PAID") return "ACCEPTED";
    if (status2 === "ACCEPTED") return "PREPARING";
    if (status2 === "PREPARING") return "READY";
    if (status2 === "READY") return type2 === "DELIVERY" ? "OUT_FOR_DELIVERY" : "DELIVERED";
    if (status2 === "OUT_FOR_DELIVERY") return "DELIVERED";
    return null;
  }
  const url = new URL(Astro2.request.url);
  const status = (url.searchParams.get("status") ?? "").toUpperCase();
  const type = (url.searchParams.get("type") ?? "").toUpperCase();
  const paymentMethodFilter = (url.searchParams.get("paymentMethod") ?? "").toUpperCase();
  const paymentStatusFilter = (url.searchParams.get("paymentStatus") ?? "").toUpperCase();
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const rows = await db.select().from(Order).orderBy(Order.createdAt).limit(200);
  const allOrders = [...rows].reverse();
  const decoratedOrders = allOrders.map((order) => {
    const meta = order.addressSnapshot ?? {};
    const paymentMethod = parsePaymentMethod(order.addressSnapshot);
    const forcedPickup = Boolean(meta.forcedPickup);
    const couponCode = String(meta.couponCode ?? "").trim();
    const adminInternalNote = String(meta.adminInternalNote ?? "").trim();
    return {
      ...order,
      paymentMethod,
      forcedPickup,
      couponCode,
      hasInternalNote: !!adminInternalNote,
      nextStatus: nextSuggestedStatus(order.status, order.type)
    };
  });
  const orders = decoratedOrders.filter((order) => {
    if (status && order.status !== status) return false;
    if (type && order.type !== type) return false;
    if (paymentMethodFilter && order.paymentMethod !== paymentMethodFilter) return false;
    if (paymentStatusFilter && order.paymentStatus !== paymentStatusFilter) return false;
    if (q) {
      const haystack = [
        order.publicId,
        order.customerName ?? "",
        order.customerPhone ?? "",
        order.customerEmail ?? "",
        order.couponCode ?? ""
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const counters = {
    total: decoratedOrders.length,
    open: decoratedOrders.filter(
      (o) => ["PENDING", "PAID", "ACCEPTED", "PREPARING", "READY", "OUT_FOR_DELIVERY"].includes(o.status)
    ).length,
    paid: decoratedOrders.filter((o) => o.paymentStatus === "PAID").length,
    delivery: decoratedOrders.filter((o) => o.type === "DELIVERY").length,
    discounted: decoratedOrders.filter((o) => Number(o.discountCents ?? 0) > 0).length
  };
  const returnTo = `${url.pathname}${url.search}`;
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Pedidos \xB7 Admin \xB7 Arcadia", "heading": "Pedidos", "description": "Versi\xF3n final operativa: filtros reales, flags econ\xF3micos, acceso a ticket, acci\xF3n r\xE1pida de estado y acceso directo al detalle completo.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/cocina" class="inline-flex items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-300 transition hover:border-violet-400/30 hover:bg-violet-400/15">
Abrir cocina
</a> <a href="/admin" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5"> <article class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Cargados
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${counters.total} </div> <p class="mt-2 text-sm text-slate-400">Últimos 200 pedidos</p> </article> <article class="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
Abiertos
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${counters.open} </div> <p class="mt-2 text-sm text-amber-100/80">Todavía en workflow operativo</p> </article> <article class="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
Cobrado
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${counters.paid} </div> <p class="mt-2 text-sm text-emerald-100/80">Payment status PAID</p> </article> <article class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200">
Delivery
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${counters.delivery} </div> <p class="mt-2 text-sm text-cyan-100/80">Pedidos con reparto</p> </article> <article class="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">
Descuento
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${counters.discounted} </div> <p class="mt-2 text-sm text-violet-100/80">Pedidos con cupón o descuento</p> </article> </section> <section class="mt-6 rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-center justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
Filtros
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Buscar y segmentar
</h2> </div> <a href="/admin/pedidos" class="text-sm font-semibold text-slate-400 transition hover:text-white">
Limpiar filtros
</a> </div> <form method="get" class="mt-6 grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_170px_170px_170px_190px_auto]"> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" type="text" name="q"${addAttribute(q, "value")} placeholder="ID, cliente, teléfono, email o cupón"> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="status"> <option value="">Todos los estados</option> <option value="PENDING"${addAttribute(status === "PENDING", "selected")}>PENDING</option> <option value="PAID"${addAttribute(status === "PAID", "selected")}>PAID</option> <option value="ACCEPTED"${addAttribute(status === "ACCEPTED", "selected")}>ACCEPTED</option> <option value="PREPARING"${addAttribute(status === "PREPARING", "selected")}>PREPARING</option> <option value="READY"${addAttribute(status === "READY", "selected")}>READY</option> <option value="OUT_FOR_DELIVERY"${addAttribute(status === "OUT_FOR_DELIVERY", "selected")}>OUT_FOR_DELIVERY</option> <option value="DELIVERED"${addAttribute(status === "DELIVERED", "selected")}>DELIVERED</option> <option value="CANCELLED"${addAttribute(status === "CANCELLED", "selected")}>CANCELLED</option> </select> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="type"> <option value="">Todos los tipos</option> <option value="DELIVERY"${addAttribute(type === "DELIVERY", "selected")}>DELIVERY</option> <option value="PICKUP"${addAttribute(type === "PICKUP", "selected")}>PICKUP</option> </select> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="paymentMethod"> <option value="">Todos los métodos</option> <option value="CASH"${addAttribute(paymentMethodFilter === "CASH", "selected")}>CASH</option> <option value="CARD"${addAttribute(paymentMethodFilter === "CARD", "selected")}>CARD</option> <option value="UNKNOWN"${addAttribute(paymentMethodFilter === "UNKNOWN", "selected")}>UNKNOWN</option> </select> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="paymentStatus"> <option value="">Todos los payment status</option> <option value="UNPAID"${addAttribute(paymentStatusFilter === "UNPAID", "selected")}>UNPAID</option> <option value="AUTH"${addAttribute(paymentStatusFilter === "AUTH", "selected")}>AUTH</option> <option value="PAID"${addAttribute(paymentStatusFilter === "PAID", "selected")}>PAID</option> <option value="FAILED"${addAttribute(paymentStatusFilter === "FAILED", "selected")}>FAILED</option> <option value="REFUNDED"${addAttribute(paymentStatusFilter === "REFUNDED", "selected")}>REFUNDED</option> <option value="PARTIALLY_REFUNDED"${addAttribute(paymentStatusFilter === "PARTIALLY_REFUNDED", "selected")}>PARTIALLY_REFUNDED</option> </select> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Aplicar
</button> </form> </section> <section class="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#111827] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> ${orders.length === 0 ? renderTemplate`<div class="px-6 py-14 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">No hay pedidos con ese filtro</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Ajusta los filtros o limpia la búsqueda para recuperar resultados.
</p> </div> </div>` : renderTemplate`<div class="overflow-x-auto"> <table class="min-w-full border-collapse"> <thead> <tr class="border-b border-white/10 text-left"> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pedido</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cliente</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Workflow</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pago</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Economía</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Flags</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Fecha</th> <th class="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Acciones</th> </tr> </thead> <tbody> ${orders.map((order) => renderTemplate`<tr class="border-b border-white/5 transition hover:bg-white/3"> <td class="px-6 py-4 align-top"> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="text-sm font-semibold text-white transition hover:text-sky-300"> ${order.publicId} </a> <div class="mt-1 flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    order.type === "DELIVERY" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-indigo-400/20 bg-indigo-400/10 text-indigo-300"
  ], "class:list")}> ${order.type} </span> ${order.couponCode ? renderTemplate`<span class="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300"> ${order.couponCode} </span>` : null} </div> </td> <td class="px-6 py-4 align-top"> <div class="text-sm font-semibold text-white">${order.customerName ?? "Sin nombre"}</div> <div class="mt-1 text-xs text-slate-500">${order.customerPhone ?? "Sin tel\xE9fono"}</div> ${order.customerEmail ? renderTemplate`<div class="mt-1 text-xs text-slate-500">${order.customerEmail}</div>` : null} </td> <td class="px-6 py-4 align-top"> <div class="flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    statusTone(order.status)
  ], "class:list")}> ${order.status} </span> </div> </td> <td class="px-6 py-4 align-top"> <div class="flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    paymentMethodTone(order.paymentMethod)
  ], "class:list")}> ${order.paymentMethod} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    paymentStatusTone(order.paymentStatus)
  ], "class:list")}> ${order.paymentStatus} </span> </div> </td> <td class="px-6 py-4 align-top"> <div class="text-sm font-semibold text-white">${money(order.totalCents)}</div> <div class="mt-1 text-xs text-slate-500">
Subtotal ${money(order.subtotalCents)} </div> <div class="mt-1 flex flex-wrap gap-2"> ${Number(order.deliveryFeeCents ?? 0) > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
Fee ${money(order.deliveryFeeCents)} </span>` : null} ${Number(order.discountCents ?? 0) > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
-${money(order.discountCents)} </span>` : null} </div> </td> <td class="px-6 py-4 align-top"> <div class="flex flex-wrap gap-2"> ${order.forcedPickup ? renderTemplate`<span class="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
Forced pickup
</span>` : null} ${order.hasInternalNote ? renderTemplate`<span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
Nota interna
</span>` : null} </div> </td> <td class="px-6 py-4 align-top"> <div class="text-sm text-slate-300">${formatDate(order.createdAt)}</div> ${order.scheduledFor ? renderTemplate`<div class="mt-1 text-xs text-slate-500">
Programado: ${formatDate(order.scheduledFor)} </div>` : null} </td> <td class="px-6 py-4 align-top"> <div class="flex flex-wrap justify-end gap-2"> ${order.nextStatus ? renderTemplate`<form method="post"${addAttribute(`/api/admin/orders/${order.publicId}/update`, "action")}> <input type="hidden" name="intent" value="update-status"> <input type="hidden" name="status"${addAttribute(order.nextStatus, "value")}> <input type="hidden" name="redirectTo"${addAttribute(returnTo, "value")}> <button class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15" type="submit"> ${order.nextStatus} </button> </form>` : null} <a${addAttribute(`/admin/pedidos/ticket/${order.publicId}?print=1`, "href")} target="_blank" rel="noreferrer" class="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/15">
Ticket
</a> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Ver detalle
</a> </div> </td> </tr>`)} </tbody> </table> </div>`} </section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/pedidos/index.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/pedidos/index.astro";
const $$url = "/admin/pedidos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
