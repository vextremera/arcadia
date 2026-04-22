import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { B as maybeRenderHead, T as renderTemplate, a4 as addAttribute, F as Fragment } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import 'clsx';
import { d as db, a as AuditLog, U as User, O as Order, e as Product, j as Coupon, N as NewsletterSubscriber, A as AppSetting } from './_astro_db_Bcz5lWRF.mjs';
import { inArray, eq } from '@astrojs/db/dist/runtime/virtual.js';

const $$RecentAuditActivity = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$RecentAuditActivity;
  const {
    limit = 10,
    title = "Actividad reciente",
    description = "Últimos cambios relevantes en pedidos, pagos, operativa y newsletter."
  } = Astro2.props;
  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Madrid"
    }).format(date);
  }
  function toneForAction(action) {
    if (action.includes("REFUND")) {
      return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-200";
    }
    if (action.includes("PAYMENT")) {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    }
    if (action.includes("NEWSLETTER")) {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    }
    if (action.includes("OPS") || action.includes("HOURS") || action.includes("SPECIAL_DATE") || action.includes("FEES")) {
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    }
    if (action.includes("STATUS") || action.includes("ORDER")) {
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    }
    return "border-white/10 bg-white/[0.04] text-slate-300";
  }
  function actionLabel(action) {
    switch (action) {
      case "ORDER_STATUS_UPDATED":
        return "Estado de pedido";
      case "ORDER_PAYMENT_UPDATED":
        return "Estado de pago";
      case "ORDER_REFUND_CREATED":
        return "Refund";
      case "ORDER_ADMIN_NOTE_UPDATED":
        return "Nota interna";
      case "ORDER_ACTIVITY_NOTE_ADDED":
        return "Anotación";
      case "OPS_FLAGS_UPDATED":
        return "Flags operativos";
      case "OPERATING_HOURS_UPDATED":
        return "Horarios";
      case "SPECIAL_DATE_SAVED":
        return "Excepción operativa";
      case "SPECIAL_DATE_DELETED":
        return "Excepción eliminada";
      case "PAYMENTS_SETTINGS_UPDATED":
        return "Métodos de pago";
      case "FEES_SETTINGS_UPDATED":
        return "Fees";
      case "NEWSLETTER_SENT":
        return "Newsletter enviado";
      case "NEWSLETTER_SUBSCRIBER_ENABLED":
        return "Suscriptor activado";
      case "NEWSLETTER_SUBSCRIBER_DISABLED":
        return "Suscriptor desactivado";
      default:
        return action.replaceAll("_", " ");
    }
  }
  function summaryForRow(row) {
    const diff = row.diff ?? {};
    if (row.action === "ORDER_STATUS_UPDATED") {
      return `${String(diff.previousStatus ?? "—")} → ${String(diff.nextStatus ?? "—")}`;
    }
    if (row.action === "ORDER_PAYMENT_UPDATED") {
      return `${String(diff.previousPaymentStatus ?? "—")} → ${String(diff.nextPaymentStatus ?? "—")}`;
    }
    if (row.action === "ORDER_REFUND_CREATED") {
      const cents = Number(diff.refundAmountCents ?? 0);
      const eur = (cents / 100).toFixed(2);
      return `${String(diff.refundStatus ?? "REFUND")} · ${eur} €`;
    }
    if (row.action === "NEWSLETTER_SENT") {
      return `${String(diff.sent ?? 0)} enviados · ${String(diff.failed ?? 0)} fallidos`;
    }
    if (row.action === "NEWSLETTER_SUBSCRIBER_ENABLED" || row.action === "NEWSLETTER_SUBSCRIBER_DISABLED") {
      return String(diff.email ?? row.entityId);
    }
    if (row.action === "SPECIAL_DATE_SAVED" || row.action === "SPECIAL_DATE_DELETED") {
      return row.entityId;
    }
    if (row.action === "OPS_FLAGS_UPDATED" || row.action === "OPERATING_HOURS_UPDATED" || row.action === "PAYMENTS_SETTINGS_UPDATED" || row.action === "FEES_SETTINGS_UPDATED") {
      return row.entityId;
    }
    if (row.action === "ORDER_ADMIN_NOTE_UPDATED") {
      return "Nota interna actualizada";
    }
    if (row.action === "ORDER_ACTIVITY_NOTE_ADDED") {
      return String(diff.note ?? "Anotación manual");
    }
    return row.entityId;
  }
  const allRows = await db.select({
    id: AuditLog.id,
    actorUserId: AuditLog.actorUserId,
    action: AuditLog.action,
    entityType: AuditLog.entityType,
    entityId: AuditLog.entityId,
    diff: AuditLog.diff,
    createdAt: AuditLog.createdAt
  }).from(AuditLog);
  const rows = [...allRows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, limit);
  const actorIds = rows.map((row) => row.actorUserId).filter((value) => Number.isFinite(value));
  const actors = actorIds.length ? await db.select({
    id: User.id,
    email: User.email,
    name: User.name
  }).from(User).where(inArray(User.id, actorIds)) : [];
  const actorById = new Map(actors.map((actor) => [actor.id, actor]));
  return renderTemplate`${maybeRenderHead()}<section class="overflow-hidden rounded-[30px] border border-white/10 bg-[#0f172a]/80 shadow-[0_28px_80px_rgba(2,6,23,0.36)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Audit
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white"> ${title} </h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400"> ${description} </p> </div> <a href="/admin/audit" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ver audit completo
</a> </div> </div> ${rows.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center text-sm text-slate-400 lg:px-8">
Aún no hay actividad auditada.
</div>` : renderTemplate`<div class="space-y-4 px-6 py-6 lg:px-8 lg:py-8"> ${rows.map((row) => {
    const actor = row.actorUserId ? actorById.get(row.actorUserId) : null;
    return renderTemplate`<article class="rounded-[26px] border border-white/[0.08] bg-white/[0.03] p-5 lg:p-6"> <div class="flex flex-wrap items-start justify-between gap-4"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
      toneForAction(row.action)
    ], "class:list")}> ${actionLabel(row.action)} </span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300"> ${row.entityType} </span> </div> <div class="mt-4 text-sm leading-7 text-slate-200"> ${summaryForRow(row)} </div> <div class="mt-2 text-sm text-slate-500"> ${actor?.name?.trim() || actor?.email || "Sistema / desconocido"} </div> </div> <div class="text-sm text-slate-500"> ${formatDate(row.createdAt)} </div> </div> </article>`;
  })} </div>`} </section>`;
}, "C:/Users/vicre/Dev/arcadia/src/components/admin/RecentAuditActivity.astro", void 0);

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
  }
  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Madrid"
    }).format(date);
  }
  function statusTone(status) {
    switch (status) {
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
  function paymentTone(status) {
    switch (status) {
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
  const orders = await db.select({
    id: Order.id,
    publicId: Order.publicId,
    type: Order.type,
    status: Order.status,
    paymentStatus: Order.paymentStatus,
    totalCents: Order.totalCents,
    customerName: Order.customerName,
    createdAt: Order.createdAt
  }).from(Order);
  const users = await db.select({ id: User.id }).from(User);
  const products = await db.select({ id: Product.id, active: Product.active }).from(Product);
  const coupons = await db.select({ id: Coupon.id, active: Coupon.active }).from(Coupon);
  const newsletterSubscribers = await db.select({ id: NewsletterSubscriber.id, active: NewsletterSubscriber.active }).from(NewsletterSubscriber);
  const auditRows = await db.select({ id: AuditLog.id, createdAt: AuditLog.createdAt }).from(AuditLog);
  const [opsFlagsRow] = await db.select({ value: AppSetting.value }).from(AppSetting).where(eq(AppSetting.key, "opsFlags")).limit(1);
  const opsFlags = opsFlagsRow?.value ?? {};
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestOrders = sortedOrders.slice(0, 8);
  const now = Date.now();
  const todayStart = /* @__PURE__ */ new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStartMs = todayStart.getTime();
  const last24hMs = now - 24 * 60 * 60 * 1e3;
  const ordersToday = sortedOrders.filter(
    (order) => new Date(order.createdAt).getTime() >= todayStartMs
  );
  const revenueTodayCents = ordersToday.filter((order) => order.status !== "CANCELLED").reduce((sum, order) => sum + Number(order.totalCents ?? 0), 0);
  const pendingOrdersCount = sortedOrders.filter(
    (order) => [
      "PENDING",
      "PAID",
      "ACCEPTED",
      "PREPARING",
      "READY",
      "OUT_FOR_DELIVERY"
    ].includes(order.status)
  ).length;
  const activeProductsCount = products.filter((product) => product.active).length;
  const inactiveProductsCount = products.length - activeProductsCount;
  const activeCouponsCount = coupons.filter((coupon) => coupon.active).length;
  const activeSubscribersCount = newsletterSubscribers.filter(
    (row) => row.active
  ).length;
  const auditLast24h = auditRows.filter(
    (row) => new Date(row.createdAt).getTime() >= last24hMs
  ).length;
  const deliveryTodayCount = ordersToday.filter(
    (order) => order.type === "DELIVERY"
  ).length;
  const pickupTodayCount = ordersToday.filter(
    (order) => order.type === "PICKUP"
  ).length;
  const paidTodayCount = ordersToday.filter(
    (order) => order.paymentStatus === "PAID"
  ).length;
  const dashboardCards = [
    {
      label: "Pedidos hoy",
      value: String(ordersToday.length),
      helper: "Pedidos creados desde medianoche",
      tone: "border-sky-400/15 bg-sky-400/8"
    },
    {
      label: "Facturación hoy",
      value: money(revenueTodayCents),
      helper: "Excluye pedidos cancelados",
      tone: "border-emerald-400/15 bg-emerald-400/8"
    },
    {
      label: "En curso",
      value: String(pendingOrdersCount),
      helper: "Pendientes de cierre operativo",
      tone: "border-violet-400/15 bg-violet-400/8"
    },
    {
      label: "Productos activos",
      value: String(activeProductsCount),
      helper: `${inactiveProductsCount} inactivos en catálogo`,
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Suscriptores activos",
      value: String(activeSubscribersCount),
      helper: "Base actual del newsletter",
      tone: "border-cyan-400/15 bg-cyan-400/8"
    },
    {
      label: "Audit 24h",
      value: String(auditLast24h),
      helper: "Cambios recientes del admin",
      tone: "border-amber-400/15 bg-amber-400/8"
    }
  ];
  const opsChips = [
    {
      label: "Pedidos",
      value: opsFlags.pauseOrders ? "Pausados" : "Activos",
      tone: opsFlags.pauseOrders ? "border-rose-400/20 bg-rose-400/10 text-rose-300" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
    },
    {
      label: "Delivery",
      value: opsFlags.forcePickup ? "Solo recogida" : "Normal",
      tone: opsFlags.forcePickup ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-sky-400/20 bg-sky-400/10 text-sky-300"
    },
    {
      label: "Cupones activos",
      value: String(activeCouponsCount),
      tone: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300"
    },
    {
      label: "Usuarios",
      value: String(users.length),
      tone: "border-white/10 bg-white/[0.03] text-slate-300"
    }
  ];
  const quickLinks = [
    {
      href: "/admin/pedidos",
      title: "Pedidos",
      description: "Seguimiento completo y detalle operativo",
      tone: "border-sky-400/20 bg-sky-400/10 text-sky-300"
    },
    {
      href: "/admin/cocina",
      title: "Cocina",
      description: "Board vivo para tickets en curso",
      tone: "border-violet-400/20 bg-violet-400/10 text-violet-300"
    },
    {
      href: "/admin/operativa",
      title: "Operativa",
      description: "Flags, horarios y force pickup",
      tone: "border-amber-400/20 bg-amber-400/10 text-amber-300"
    },
    {
      href: "/admin/catalogo/productos",
      title: "Catálogo",
      description: "Productos, ingredientes y compatibilidades",
      tone: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Dashboard · Admin · Arcadia", "heading": "Dashboard", "description": "Visión rápida de pedidos, operativa, catálogo y actividad reciente.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/pedidos" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ir a pedidos
</a> <a href="/admin/cocina" class="inline-flex items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-300 transition hover:border-violet-400/30 hover:bg-violet-400/15">
Abrir cocina
</a> <a href="/admin/operativa" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ver operativa
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6"> ${dashboardCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.helper}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]"> <div class="space-y-6"> <article class="rounded-[32px] border border-white/10 bg-[#111827]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7"> <div class="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-5"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Snapshot diario
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Ritmo operativo de hoy
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
Lectura rápida del día actual para saber si el flujo está
              concentrado en delivery, pickup o cierre de cobro.
</p> </div> </div> <div class="mt-6 grid gap-4 md:grid-cols-3"> <article class="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
Delivery hoy
</div> <div class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white"> ${deliveryTodayCount} </div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
Pedidos con reparto creados hoy.
</p> </article> <article class="rounded-[26px] border border-indigo-400/20 bg-indigo-400/10 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
Pickup hoy
</div> <div class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white"> ${pickupTodayCount} </div> <p class="mt-2 text-sm leading-6 text-indigo-100/80">
Pedidos de recogida creados hoy.
</p> </article> <article class="rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
Paid hoy
</div> <div class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white"> ${paidTodayCount} </div> <p class="mt-2 text-sm leading-6 text-emerald-100/80">
Payment status PAID entre los pedidos de hoy.
</p> </article> </div> </article> <article class="rounded-[32px] border border-white/10 bg-[#111827]/82 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Pedidos
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Últimos pedidos
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
He dejado esta zona como lista de fichas amplias, con más aire y
                mejor lectura del workflow y el cobro.
</p> </div> <a href="/admin/pedidos" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ver todos
</a> </div> </div> ${latestOrders.length === 0 ? renderTemplate`<div class="px-6 py-14 text-center text-sm text-slate-400 lg:px-8">
Todavía no hay pedidos.
</div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${latestOrders.map((order) => renderTemplate`<article class="rounded-[28px] border border-white/10 bg-[#0b1220]/90 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.22)]"> <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="text-lg font-semibold text-white transition hover:text-sky-300"> ${order.publicId} </a> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    statusTone(order.status)
  ], "class:list")}> ${order.status} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    paymentTone(order.paymentStatus)
  ], "class:list")}> ${order.paymentStatus} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    order.type === "DELIVERY" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-indigo-400/20 bg-indigo-400/10 text-indigo-300"
  ], "class:list")}> ${order.type} </span> </div> <div class="mt-4 grid gap-4 md:grid-cols-2"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Cliente
</div> <div class="mt-3 text-sm font-semibold text-white"> ${order.customerName?.trim() || "Cliente sin nombre"} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Creado
</div> <div class="mt-3 text-sm font-semibold text-white"> ${formatDate(order.createdAt)} </div> </section> </div> </div> <div class="flex flex-col gap-3 lg:min-w-[180px] lg:items-end"> <div class="rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Total
</div> <div class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white"> ${money(order.totalCents)} </div> </div> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Abrir pedido
</a> </div> </div> </article>`)} </div>`} </article> <section class="mt-0"> ${renderComponent($$result2, "RecentAuditActivity", $$RecentAuditActivity, { "limit": 8 })} </section> </div> <aside class="space-y-6"> <article class="rounded-[32px] border border-white/10 bg-[#111827]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">
Operativa
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Estado rápido
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
Resumen de flags y señales que afectan de forma directa a pedidos,
          checkout y servicio real.
</p> <div class="mt-6 flex flex-wrap gap-2"> ${opsChips.map((chip) => renderTemplate`<span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]",
    chip.tone
  ], "class:list")}> ${chip.label}: ${chip.value} </span>`)} </div> <div class="mt-6 grid gap-3"> <a href="/admin/operativa" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ajustar operativa
</a> <a href="/admin/newsletter" class="inline-flex items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Abrir newsletter
</a> <a href="/admin/audit" class="inline-flex items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400/30 hover:bg-amber-400/15">
Ver audit log
</a> </div> </article> <article class="rounded-[32px] border border-white/10 bg-[#111827]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Navegación
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Atajos del admin
</h2> <div class="mt-6 space-y-4"> ${quickLinks.map((item) => renderTemplate`<a${addAttribute(item.href, "href")} class="block rounded-[26px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.05]"> <div class="flex items-center justify-between gap-3"> <div class="text-sm font-semibold text-white"> ${item.title} </div> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
    item.tone
  ], "class:list")}>
Abrir
</span> </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${item.description} </p> </a>`)} </div> </article> </aside> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/index.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/index.astro";
const $$url = "/admin";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
