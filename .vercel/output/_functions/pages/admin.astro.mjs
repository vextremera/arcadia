import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../chunks/AdminLayout_CaEDeM2K.mjs';
import { d as db, O as Order, j as User, p as OrderItem } from '../chunks/_astro_db_ChTDrd2j.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} \u20AC`;
  }
  function toDate(value) {
    return value instanceof Date ? value : new Date(value);
  }
  function formatDateTime(value) {
    const date = toDate(value);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Madrid"
    }).format(date);
  }
  function formatDateOnly(value) {
    const date = toDate(value);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeZone: "Europe/Madrid"
    }).format(date);
  }
  function getMadridDateParts(now2 = /* @__PURE__ */ new Date()) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(now2);
    const year = parts.find((part) => part.type === "year")?.value ?? "1970";
    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    return {
      year: Number(year),
      month: Number(month),
      day: Number(day),
      iso: `${year}-${month}-${day}`
    };
  }
  function isSameMadridDay(value, todayIso) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).formatToParts(toDate(value));
    const year = parts.find((part) => part.type === "year")?.value ?? "1970";
    const month = parts.find((part) => part.type === "month")?.value ?? "01";
    const day = parts.find((part) => part.type === "day")?.value ?? "01";
    return `${year}-${month}-${day}` === todayIso;
  }
  function isPaidStatus(status) {
    return status === "PAID" || status === "PARTIALLY_REFUNDED";
  }
  function isLiveOrderStatus(status) {
    return status === "PENDING" || status === "PAID" || status === "ACCEPTED" || status === "PREPARING" || status === "READY" || status === "OUT_FOR_DELIVERY";
  }
  function statusTone(status) {
    if (status === "DELIVERED") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
    if (status === "CANCELLED") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    }
    if (status === "READY" || status === "OUT_FOR_DELIVERY") {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    }
    if (status === "PREPARING" || status === "ACCEPTED") {
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    }
    return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
  function paymentTone(status) {
    if (status === "PAID" || status === "PARTIALLY_REFUNDED") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
    if (status === "REFUNDED" || status === "FAILED") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    }
    if (status === "AUTH") {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    }
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
  function safeCustomerKey(order) {
    if (order.userId) return `user:${order.userId}`;
    if (order.customerEmail) return `email:${order.customerEmail.toLowerCase()}`;
    if (order.customerPhone) return `phone:${order.customerPhone}`;
    if (order.customerName) return `name:${order.customerName.toLowerCase()}`;
    return `guest-order:${order.id}`;
  }
  function clampPercentage(value) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(100, value));
  }
  const user = Astro2.locals.user;
  const orders = await db.select({
    id: Order.id,
    publicId: Order.publicId,
    userId: Order.userId,
    type: Order.type,
    status: Order.status,
    paymentStatus: Order.paymentStatus,
    subtotalCents: Order.subtotalCents,
    deliveryFeeCents: Order.deliveryFeeCents,
    discountCents: Order.discountCents,
    totalCents: Order.totalCents,
    customerName: Order.customerName,
    customerPhone: Order.customerPhone,
    customerEmail: Order.customerEmail,
    createdAt: Order.createdAt
  }).from(Order);
  const sortedOrders = [...orders].sort(
    (a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime()
  );
  const userIds = [...new Set(sortedOrders.map((order) => order.userId).filter((value) => typeof value === "number"))];
  const users = userIds.length ? await db.select({
    id: User.id,
    name: User.name,
    email: User.email,
    role: User.role,
    active: User.active
  }).from(User).where(inArray(User.id, userIds)) : [];
  const userById = new Map(users.map((row) => [row.id, row]));
  const orderIds = sortedOrders.map((order) => order.id);
  const orderItems = orderIds.length ? await db.select({
    orderId: OrderItem.orderId,
    nameSnapshot: OrderItem.nameSnapshot,
    qty: OrderItem.qty,
    lineTotalCents: OrderItem.lineTotalCents
  }).from(OrderItem).where(inArray(OrderItem.orderId, orderIds)) : [];
  const now = /* @__PURE__ */ new Date();
  const madridToday = getMadridDateParts(now);
  const last30Start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1e3);
  const last7Start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1e3);
  const paidOrders = sortedOrders.filter((order) => isPaidStatus(order.paymentStatus));
  const paidOrders30d = paidOrders.filter((order) => toDate(order.createdAt) >= last30Start);
  const paidOrders7d = paidOrders.filter((order) => toDate(order.createdAt) >= last7Start);
  const totalRevenueCents = paidOrders.reduce((sum, order) => sum + order.totalCents, 0);
  const pickupRevenueCents = paidOrders.filter((order) => order.type === "PICKUP").reduce((sum, order) => sum + order.totalCents, 0);
  const deliveryRevenueCents = paidOrders.filter((order) => order.type === "DELIVERY").reduce((sum, order) => sum + order.totalCents, 0);
  const paidTickets = paidOrders.length;
  const averageTicketCents = paidTickets > 0 ? Math.round(totalRevenueCents / paidTickets) : 0;
  const todayOrders = sortedOrders.filter(
    (order) => isSameMadridDay(order.createdAt, madridToday.iso)
  );
  const todayPaidRevenueCents = todayOrders.filter((order) => isPaidStatus(order.paymentStatus)).reduce((sum, order) => sum + order.totalCents, 0);
  const liveOrders = sortedOrders.filter((order) => isLiveOrderStatus(order.status));
  const pendingCount = sortedOrders.filter((order) => order.status === "PENDING").length;
  const preparingCount = sortedOrders.filter(
    (order) => order.status === "ACCEPTED" || order.status === "PREPARING" || order.status === "READY"
  ).length;
  const outForDeliveryCount = sortedOrders.filter(
    (order) => order.status === "OUT_FOR_DELIVERY"
  ).length;
  const deliveredCount = sortedOrders.filter((order) => order.status === "DELIVERED").length;
  const cancelledCount = sortedOrders.filter((order) => order.status === "CANCELLED").length;
  const totalCustomers = users.filter((item) => item.role === "CUSTOMER" && item.active).length;
  const topClientsMap = /* @__PURE__ */ new Map();
  for (const order of sortedOrders) {
    const key = safeCustomerKey(order);
    const linkedUser = typeof order.userId === "number" ? userById.get(order.userId) : null;
    const displayName = linkedUser?.name?.trim() || order.customerName?.trim() || linkedUser?.email?.trim() || order.customerEmail?.trim() || order.customerPhone?.trim() || "Cliente";
    const displayEmail = order.customerEmail?.trim() || linkedUser?.email?.trim() || null;
    const current = topClientsMap.get(key) ?? {
      key,
      userId: order.userId ?? null,
      name: displayName,
      email: displayEmail,
      phone: order.customerPhone?.trim() || null,
      orderCount: 0,
      paidOrderCount: 0,
      totalCents: 0,
      averageCents: 0
    };
    current.orderCount += 1;
    if (isPaidStatus(order.paymentStatus)) {
      current.paidOrderCount += 1;
      current.totalCents += order.totalCents;
    }
    current.averageCents = current.paidOrderCount > 0 ? Math.round(current.totalCents / current.paidOrderCount) : 0;
    topClientsMap.set(key, current);
  }
  const topClients = [...topClientsMap.values()].filter((client) => client.paidOrderCount > 0).sort((a, b) => {
    if (b.totalCents !== a.totalCents) return b.totalCents - a.totalCents;
    return b.paidOrderCount - a.paidOrderCount;
  }).slice(0, 8);
  const paidOrderIds = new Set(paidOrders.map((order) => order.id));
  const topProductMap = /* @__PURE__ */ new Map();
  for (const item of orderItems) {
    if (!paidOrderIds.has(item.orderId)) continue;
    const current = topProductMap.get(item.nameSnapshot) ?? {
      name: item.nameSnapshot,
      qty: 0,
      totalCents: 0,
      orderCount: 0
    };
    current.qty += item.qty;
    current.totalCents += item.lineTotalCents;
    current.orderCount += 1;
    topProductMap.set(item.nameSnapshot, current);
  }
  const topProducts = [...topProductMap.values()].sort((a, b) => {
    if (b.qty !== a.qty) return b.qty - a.qty;
    return b.totalCents - a.totalCents;
  }).slice(0, 8);
  const maxTopProductQty = topProducts.reduce((max, item) => Math.max(max, item.qty), 0);
  const revenue30dCents = paidOrders30d.reduce((sum, order) => sum + order.totalCents, 0);
  const revenue7dCents = paidOrders7d.reduce((sum, order) => sum + order.totalCents, 0);
  const statusCards = [
    {
      label: "Cobrado total",
      value: money(totalRevenueCents),
      helper: `${paidTickets} pedido${paidTickets === 1 ? "" : "s"} cobrados`,
      tone: "border-emerald-400/15 bg-emerald-400/6 text-emerald-100"
    },
    {
      label: "Cobrado pickup",
      value: money(pickupRevenueCents),
      helper: `${paidOrders.filter((order) => order.type === "PICKUP").length} tickets pickup`,
      tone: "border-indigo-400/15 bg-indigo-400/6 text-indigo-100"
    },
    {
      label: "Cobrado delivery",
      value: money(deliveryRevenueCents),
      helper: `${paidOrders.filter((order) => order.type === "DELIVERY").length} tickets delivery`,
      tone: "border-cyan-400/15 bg-cyan-400/6 text-cyan-100"
    },
    {
      label: "Ticket medio",
      value: money(averageTicketCents),
      helper: "Calculado solo sobre pedidos cobrados",
      tone: "border-sky-400/15 bg-sky-400/6 text-sky-100"
    },
    {
      label: "Pedidos hoy",
      value: String(todayOrders.length),
      helper: `${money(todayPaidRevenueCents)} cobrados hoy`,
      tone: "border-amber-400/15 bg-amber-400/6 text-amber-100"
    },
    {
      label: "Clientes registrados",
      value: String(totalCustomers),
      helper: "Usuarios CUSTOMER activos",
      tone: "border-violet-400/15 bg-violet-400/6 text-violet-100"
    }
  ];
  const quickActions = [
    {
      href: "/admin/pedidos",
      title: "Pedidos",
      description: "Ver pipeline completo y entrar al detalle de cada pedido.",
      eyebrow: "Centro operativo"
    },
    {
      href: "/admin/cocina",
      title: "Cocina",
      description: "Gestionar la cola viva y los estados en tiempo real.",
      eyebrow: "Tiempo real"
    },
    {
      href: "/admin/catalogo/productos",
      title: "Productos",
      description: "Editar fichas, precios, configuradores e im\xE1genes.",
      eyebrow: "Cat\xE1logo"
    },
    {
      href: "/admin/cupones",
      title: "Cupones",
      description: "Descuentos reales conectados al checkout.",
      eyebrow: "Promos"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Dashboard \xB7 Admin \xB7 Arcadia", "heading": "Dashboard", "description": "Panel ejecutivo y operativo con m\xE9tricas reales del negocio. No incluye visitas web porque el proyecto actual no tiene tracking persistente de analytics." }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"> ${statusCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70"> ${card.label} </div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${card.value} </div> <p class="mt-2 text-sm leading-6 text-white/70"> ${card.helper} </p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]"> <article class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Rendimiento
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Dinero y ritmo de venta
</h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
Basado en pedidos con paymentStatus cobrado
</div> </div> <div class="mt-6 grid gap-4 md:grid-cols-3"> <div class="rounded-3xl border border-white/10 bg-white/5 p-5"> <div class="text-sm font-semibold text-white">Últimos 7 días</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${money(revenue7dCents)} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${paidOrders7d.length} pedido${paidOrders7d.length === 1 ? "" : "s"} cobrados
</p> </div> <div class="rounded-3xl border border-white/10 bg-white/5 p-5"> <div class="text-sm font-semibold text-white">Últimos 30 días</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${money(revenue30dCents)} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${paidOrders30d.length} pedido${paidOrders30d.length === 1 ? "" : "s"} cobrados
</p> </div> <div class="rounded-3xl border border-white/10 bg-white/5 p-5"> <div class="text-sm font-semibold text-white">Hoy</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${money(todayPaidRevenueCents)} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${todayOrders.length} pedido${todayOrders.length === 1 ? "" : "s"} en el día
</p> </div> </div> <div class="mt-6 grid gap-4 md:grid-cols-2"> <div class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-center justify-between gap-3"> <div> <div class="text-sm font-semibold text-white">Mix de canal</div> <p class="mt-1 text-sm text-slate-400">
Reparto del ingreso cobrado entre pickup y delivery.
</p> </div> </div> <div class="mt-5 space-y-4"> <div> <div class="mb-2 flex items-center justify-between text-sm"> <span class="text-slate-300">Pickup</span> <span class="font-semibold text-white">${money(pickupRevenueCents)}</span> </div> <div class="h-3 rounded-full bg-white/5"> <div class="h-3 rounded-full bg-indigo-400/80"${addAttribute(`width:${clampPercentage(totalRevenueCents > 0 ? pickupRevenueCents / totalRevenueCents * 100 : 0)}%`, "style")}></div> </div> </div> <div> <div class="mb-2 flex items-center justify-between text-sm"> <span class="text-slate-300">Delivery</span> <span class="font-semibold text-white">${money(deliveryRevenueCents)}</span> </div> <div class="h-3 rounded-full bg-white/5"> <div class="h-3 rounded-full bg-cyan-400/80"${addAttribute(`width:${clampPercentage(totalRevenueCents > 0 ? deliveryRevenueCents / totalRevenueCents * 100 : 0)}%`, "style")}></div> </div> </div> </div> </div> <div class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <div class="text-sm font-semibold text-white">Actividad operativa actual</div> <p class="mt-1 text-sm text-slate-400">
Estado de la cola viva ahora mismo.
</p> <div class="mt-5 grid gap-3 sm:grid-cols-2"> <div class="rounded-2xl border border-white/10 bg-white/5 p-4"> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Pendientes</div> <div class="mt-2 text-xl font-semibold text-white">${pendingCount}</div> </div> <div class="rounded-2xl border border-white/10 bg-white/5 p-4"> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">En cocina</div> <div class="mt-2 text-xl font-semibold text-white">${preparingCount}</div> </div> <div class="rounded-2xl border border-white/10 bg-white/5 p-4"> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">En reparto</div> <div class="mt-2 text-xl font-semibold text-white">${outForDeliveryCount}</div> </div> <div class="rounded-2xl border border-white/10 bg-white/5 p-4"> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">Entregados</div> <div class="mt-2 text-xl font-semibold text-white">${deliveredCount}</div> </div> </div> <div class="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4"> <div class="text-xs uppercase tracking-[0.16em] text-rose-200/80">Cancelados</div> <div class="mt-2 text-xl font-semibold text-white">${cancelledCount}</div> </div> </div> </div> </article> <aside class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Sesión actual
</div> <div class="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5"> <div class="text-sm text-slate-400">Usuario</div> <div class="mt-1 text-base font-semibold text-white"> ${user?.name ?? user?.email ?? "Admin"} </div> <div class="mt-4 text-sm text-slate-400">Rol</div> <div class="mt-1 inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300"> ${user?.role ?? "STAFF"} </div> </div> <div class="mt-4 rounded-3xl border border-amber-300/15 bg-amber-300/10 p-5"> <div class="text-sm font-semibold text-amber-200">
Límite real actual
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
El proyecto no tiene todavía una tabla de analytics o eventos de visitas web, así que este dashboard no incluye “usuarios que han visitado la web”.
</p> </div> <div class="mt-4 rounded-3xl border border-white/10 bg-white/5 p-5"> <div class="text-sm font-semibold text-white">Cola viva</div> <div class="mt-2 text-2xl font-semibold tracking-tight text-white"> ${liveOrders.length} </div> <p class="mt-2 text-sm leading-6 text-slate-400">
Pedidos en estados operativos no cerrados.
</p> </div> </aside> </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]"> <article class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Clientes
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Top clientes por gasto cobrado
</h2> </div> <div class="text-sm text-slate-400">
Solo pedidos cobrados
</div> </div> </div> ${topClients.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">Todavía no hay top clientes</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Cuando haya pedidos cobrados, aquí aparecerán los clientes con mayor gasto acumulado.
</p> </div> </div>` : renderTemplate`<div class="overflow-x-auto"> <table class="min-w-full border-collapse"> <thead> <tr class="border-b border-white/10 text-left"> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cliente</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pedidos</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Ticket medio</th> <th class="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total cobrado</th> </tr> </thead> <tbody> ${topClients.map((client) => renderTemplate`<tr class="border-b border-white/5 transition hover:bg-white/3"> <td class="px-6 py-4 align-top"> <div class="text-sm font-semibold text-white">${client.name}</div> <div class="mt-1 text-xs text-slate-500"> ${client.email ?? client.phone ?? "Sin email ni tel\xE9fono"} </div> </td> <td class="px-6 py-4 align-top text-sm text-slate-300"> ${client.paidOrderCount} </td> <td class="px-6 py-4 align-top text-sm text-slate-300"> ${money(client.averageCents)} </td> <td class="px-6 py-4 align-top text-right text-sm font-semibold text-white"> ${money(client.totalCents)} </td> </tr>`)} </tbody> </table> </div>`} </article> <article class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
Producto
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Top productos vendidos
</h2> </div> <div class="text-sm text-slate-400">
Por cantidad servida
</div> </div> </div> <div class="space-y-4 px-6 py-6"> ${topProducts.length === 0 ? renderTemplate`<div class="rounded-[28px] border border-white/10 bg-slate-950/40 p-8 text-center"> <div class="text-lg font-semibold text-white">Sin datos todavía</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Aquí aparecerán los productos con mayor salida cuando haya pedidos cobrados.
</p> </div>` : topProducts.map((product) => renderTemplate`<div class="rounded-3xl border border-white/10 bg-white/4 p-4"> <div class="flex items-center justify-between gap-3"> <div class="min-w-0"> <div class="truncate text-sm font-semibold text-white"> ${product.name} </div> <div class="mt-1 text-xs text-slate-500"> ${product.orderCount} línea${product.orderCount === 1 ? "" : "s"} · ${money(product.totalCents)} </div> </div> <div class="text-sm font-semibold text-white"> ${product.qty} uds
</div> </div> <div class="mt-3 h-2.5 rounded-full bg-white/5"> <div class="h-2.5 rounded-full bg-violet-400/80"${addAttribute(`width:${clampPercentage(maxTopProductQty > 0 ? product.qty / maxTopProductQty * 100 : 0)}%`, "style")}></div> </div> </div>`)} </div> </article> </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"> <article class="rounded-[30px] border border-white/10 bg-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Pedidos
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Últimos pedidos
</h2> </div> <a href="/admin/pedidos" class="text-sm font-semibold text-sky-300 transition hover:text-sky-200">
Ver todos →
</a> </div> </div> ${sortedOrders.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">No hay pedidos todavía</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Cuando entren pedidos, este dashboard empezará a poblarse automáticamente.
</p> </div> </div>` : renderTemplate`<div class="overflow-x-auto"> <table class="min-w-full border-collapse"> <thead> <tr class="border-b border-white/10 text-left"> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pedido</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Cliente</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Estado</th> <th class="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Pago</th> <th class="px-6 py-4 text-right text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Total</th> </tr> </thead> <tbody> ${sortedOrders.slice(0, 10).map((order) => renderTemplate`<tr class="border-b border-white/5 transition hover:bg-white/3"> <td class="px-6 py-4 align-top"> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="text-sm font-semibold text-white transition hover:text-sky-300"> ${order.publicId} </a> <div class="mt-1 text-xs text-slate-500"> ${formatDateTime(order.createdAt)} · ${order.type} </div> </td> <td class="px-6 py-4 align-top"> <div class="text-sm text-slate-200"> ${order.customerName ?? order.customerEmail ?? order.customerPhone ?? "Cliente"} </div> </td> <td class="px-6 py-4 align-top"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    statusTone(order.status)
  ], "class:list")}> ${order.status} </span> </td> <td class="px-6 py-4 align-top"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    paymentTone(order.paymentStatus)
  ], "class:list")}> ${order.paymentStatus} </span> </td> <td class="px-6 py-4 align-top text-right text-sm font-semibold text-white"> ${money(order.totalCents)} </td> </tr>`)} </tbody> </table> </div>`} </article> <aside class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Accesos
</div> <div class="mt-6 grid gap-4"> ${quickActions.map((item) => renderTemplate`<a${addAttribute(item.href, "href")} class="group rounded-3xl border border-white/10 bg-[#0f172a]/70 p-5 transition hover:-translate-y-0.5 hover:border-sky-400/25 hover:bg-[#111c34]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 transition group-hover:text-sky-300/80"> ${item.eyebrow} </div> <div class="mt-3 text-lg font-semibold tracking-tight text-white"> ${item.title} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${item.description} </p> </a>`)} </div> <div class="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5"> <div class="text-sm font-semibold text-white">Fecha de referencia</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Dashboard calculado en tiempo real sobre la base actual. Hoy es ${formatDateOnly(now)}.
</p> </div> </aside> </section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/index.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
