import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, O as Order } from './_astro_db_Bcz5lWRF.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
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
        return "border-white/10 bg-white/[0.03] text-slate-300";
    }
  }
  function paymentMethodTone(value) {
    switch (value) {
      case "CASH":
        return "border-amber-400/20 bg-amber-400/10 text-amber-300";
      case "CARD":
        return "border-sky-400/20 bg-sky-400/10 text-sky-300";
      default:
        return "border-white/10 bg-white/[0.03] text-slate-300";
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
        return "border-white/10 bg-white/[0.03] text-slate-300";
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
    if (status2 === "READY")
      return type2 === "DELIVERY" ? "OUT_FOR_DELIVERY" : "DELIVERED";
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
    if (paymentMethodFilter && order.paymentMethod !== paymentMethodFilter)
      return false;
    if (paymentStatusFilter && order.paymentStatus !== paymentStatusFilter)
      return false;
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
      (o) => [
        "PENDING",
        "PAID",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY"
      ].includes(o.status)
    ).length,
    paid: decoratedOrders.filter((o) => o.paymentStatus === "PAID").length,
    delivery: decoratedOrders.filter((o) => o.type === "DELIVERY").length,
    discounted: decoratedOrders.filter((o) => Number(o.discountCents ?? 0) > 0).length
  };
  const filteredCounters = {
    visible: orders.length,
    visibleDelivery: orders.filter((o) => o.type === "DELIVERY").length,
    visiblePickup: orders.filter((o) => o.type === "PICKUP").length,
    visibleOpen: orders.filter(
      (o) => [
        "PENDING",
        "PAID",
        "ACCEPTED",
        "PREPARING",
        "READY",
        "OUT_FOR_DELIVERY"
      ].includes(o.status)
    ).length
  };
  const returnTo = `${url.pathname}${url.search}`;
  const summaryCards = [
    {
      label: "Cargados",
      value: counters.total,
      note: "Últimos 200 pedidos",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Abiertos",
      value: counters.open,
      note: "Todavía en workflow operativo",
      tone: "border-amber-400/20 bg-amber-400/10"
    },
    {
      label: "Cobrados",
      value: counters.paid,
      note: "Payment status PAID",
      tone: "border-emerald-400/20 bg-emerald-400/10"
    },
    {
      label: "Delivery",
      value: counters.delivery,
      note: "Pedidos con reparto",
      tone: "border-cyan-400/20 bg-cyan-400/10"
    },
    {
      label: "Descuento",
      value: counters.discounted,
      note: "Pedidos con cupón o descuento",
      tone: "border-violet-400/20 bg-violet-400/10"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Pedidos · Admin · Arcadia", "heading": "Pedidos", "description": "Versión final operativa: filtros reales, flags económicos, acceso a ticket, acción rápida de estado y acceso directo al detalle completo, ahora con una lectura mucho más aireada.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/cocina" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-300 transition hover:border-violet-400/30 hover:bg-violet-400/15">
Abrir cocina
</a> <a href="/admin" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-5"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 rounded-[32px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
Filtros
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Buscar y segmentar pedidos
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
Mantengo los filtros reales del módulo, pero en una composición más
          limpia y más fácil de escanear.
</p> </div> <a href="/admin/pedidos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Limpiar filtros
</a> </div> <form method="get" class="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_170px_170px_170px_190px_auto]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Buscar
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" type="text" name="q"${addAttribute(url.searchParams.get("q") ?? "", "value")} placeholder="ID, cliente, teléfono, email o cupón"> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Estado
</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="status"> <option value="">Todos los estados</option> <option value="PENDING"${addAttribute(status === "PENDING", "selected")}>PENDING</option> <option value="PAID"${addAttribute(status === "PAID", "selected")}>PAID</option> <option value="ACCEPTED"${addAttribute(status === "ACCEPTED", "selected")}>ACCEPTED</option> <option value="PREPARING"${addAttribute(status === "PREPARING", "selected")}>PREPARING</option> <option value="READY"${addAttribute(status === "READY", "selected")}>READY</option> <option value="OUT_FOR_DELIVERY"${addAttribute(status === "OUT_FOR_DELIVERY", "selected")}>OUT_FOR_DELIVERY</option> <option value="DELIVERED"${addAttribute(status === "DELIVERED", "selected")}>DELIVERED</option> <option value="CANCELLED"${addAttribute(status === "CANCELLED", "selected")}>CANCELLED</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Tipo
</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="type"> <option value="">Todos los tipos</option> <option value="DELIVERY"${addAttribute(type === "DELIVERY", "selected")}>DELIVERY</option> <option value="PICKUP"${addAttribute(type === "PICKUP", "selected")}>PICKUP</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Método
</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="paymentMethod"> <option value="">Todos los métodos</option> <option value="CASH"${addAttribute(paymentMethodFilter === "CASH", "selected")}>CASH</option> <option value="CARD"${addAttribute(paymentMethodFilter === "CARD", "selected")}>CARD</option> <option value="UNKNOWN"${addAttribute(paymentMethodFilter === "UNKNOWN", "selected")}>UNKNOWN</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Payment status
</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="paymentStatus"> <option value="">Todos los payment status</option> <option value="UNPAID"${addAttribute(paymentStatusFilter === "UNPAID", "selected")}>UNPAID</option> <option value="AUTH"${addAttribute(paymentStatusFilter === "AUTH", "selected")}>AUTH</option> <option value="PAID"${addAttribute(paymentStatusFilter === "PAID", "selected")}>PAID</option> <option value="FAILED"${addAttribute(paymentStatusFilter === "FAILED", "selected")}>FAILED</option> <option value="REFUNDED"${addAttribute(paymentStatusFilter === "REFUNDED", "selected")}>REFUNDED</option> <option value="PARTIALLY_REFUNDED"${addAttribute(paymentStatusFilter === "PARTIALLY_REFUNDED", "selected")}>PARTIALLY_REFUNDED</option> </select> </label> <div class="flex items-end"> <button type="submit" class="inline-flex min-h-11 w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Aplicar
</button> </div> </form> <div class="mt-6 grid gap-4 md:grid-cols-3"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Visibles
</div> <div class="mt-2 text-2xl font-semibold text-white"> ${filteredCounters.visible} </div> <p class="mt-2 text-sm text-slate-400">Pedidos tras aplicar filtros</p> </article> <article class="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
Delivery / Pickup
</div> <div class="mt-2 text-2xl font-semibold text-white"> ${filteredCounters.visibleDelivery} / ${filteredCounters.visiblePickup} </div> <p class="mt-2 text-sm text-cyan-100/80">
Distribución del resultado actual
</p> </article> <article class="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200">
Abiertos visibles
</div> <div class="mt-2 text-2xl font-semibold text-white"> ${filteredCounters.visibleOpen} </div> <p class="mt-2 text-sm text-amber-100/80">
Todavía en circuito operativo
</p> </article> </div> </section> <section class="mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#111827] shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Resultados
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Pedidos recientes
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
He sustituido la tabla por fichas grandes para ver workflow, pago,
            economía, flags y acciones rápidas sin apretar ocho columnas.
</p> </div> <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300"> ${orders.length} resultado${orders.length === 1 ? "" : "s"} </div> </div> </div> ${orders.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">
No hay pedidos con ese filtro
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Ajusta los filtros o limpia la búsqueda para recuperar resultados.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${orders.map((order) => renderTemplate`<article class="rounded-[30px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.24)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-start xl:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="text-xl font-semibold tracking-[-0.03em] text-white transition hover:text-sky-300"> ${order.publicId} </a> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    order.type === "DELIVERY" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-indigo-400/20 bg-indigo-400/10 text-indigo-300"
  ], "class:list")}> ${order.type} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    statusTone(order.status)
  ], "class:list")}> ${order.status} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    paymentMethodTone(order.paymentMethod)
  ], "class:list")}> ${order.paymentMethod} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    paymentStatusTone(order.paymentStatus)
  ], "class:list")}> ${order.paymentStatus} </span> ${order.couponCode ? renderTemplate`<span class="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300"> ${order.couponCode} </span>` : null} ${order.forcedPickup ? renderTemplate`<span class="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
Forced pickup
</span>` : null} ${order.hasInternalNote ? renderTemplate`<span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
Nota interna
</span>` : null} </div> <div class="mt-4 grid gap-4 lg:grid-cols-2"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Cliente
</div> <div class="mt-3 text-sm font-semibold text-white"> ${order.customerName ?? "Sin nombre"} </div> <div class="mt-2 text-sm text-slate-400"> ${order.customerPhone ?? "Sin teléfono"} </div> ${order.customerEmail ? renderTemplate`<div class="mt-1 break-all text-sm text-slate-500"> ${order.customerEmail} </div>` : null} </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Tiempo
</div> <div class="mt-3 text-sm font-semibold text-white"> ${formatDate(order.createdAt)} </div> ${order.scheduledFor ? renderTemplate`<div class="mt-2 text-sm text-slate-400">
Programado: ${formatDate(order.scheduledFor)} </div>` : renderTemplate`<div class="mt-2 text-sm text-slate-500">
No programado
</div>`} </section> </div> </div> <div class="xl:min-w-[220px]"> <div class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4 text-right"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Total pedido
</div> <div class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white"> ${money(order.totalCents)} </div> <div class="mt-2 text-sm text-slate-400">
Subtotal ${money(order.subtotalCents)} </div> </div> </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-4"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Workflow
</div> <div class="mt-3 flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
    statusTone(order.status)
  ], "class:list")}> ${order.status} </span> </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Pago
</div> <div class="mt-3 flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
    paymentMethodTone(order.paymentMethod)
  ], "class:list")}> ${order.paymentMethod} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
    paymentStatusTone(order.paymentStatus)
  ], "class:list")}> ${order.paymentStatus} </span> </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Economía
</div> <div class="mt-3 space-y-2 text-sm text-slate-400"> ${Number(order.deliveryFeeCents ?? 0) > 0 ? renderTemplate`<div>
Fee${" "} <span class="font-semibold text-white"> ${money(order.deliveryFeeCents)} </span> </div>` : renderTemplate`<div>
Fee <span class="font-semibold text-white">0.00 €</span> </div>`} ${Number(order.discountCents ?? 0) > 0 ? renderTemplate`<div>
Descuento${" "} <span class="font-semibold text-emerald-300">
-${money(order.discountCents)} </span> </div>` : renderTemplate`<div>
Descuento${" "} <span class="font-semibold text-white">0.00 €</span> </div>`} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Acciones rápidas
</div> <div class="mt-3 flex flex-wrap gap-2"> ${order.nextStatus ? renderTemplate`<form method="post"${addAttribute(`/api/admin/orders/${order.publicId}/update`, "action")}> <input type="hidden" name="intent" value="update-status"> <input type="hidden" name="status"${addAttribute(order.nextStatus, "value")}> <input type="hidden" name="redirectTo"${addAttribute(returnTo, "value")}> <button class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15" type="submit"> ${order.nextStatus} </button> </form>` : null} <a${addAttribute(`/admin/pedidos/ticket/${order.publicId}?print=1`, "href")} target="_blank" rel="noreferrer" class="inline-flex items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/15">
Ticket
</a> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ver detalle
</a> </div> </section> </div> </article>`)} </div>`} </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/pedidos/index.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/pedidos/index.astro";
const $$url = "/admin/pedidos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
