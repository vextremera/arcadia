import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead, g as addAttribute } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../../chunks/SiteLayout_C6Gj-7Py.mjs';
import { d as db, O as Order, p as OrderItem } from '../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq, desc, inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Pedidos = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Pedidos;
  const user = Astro2.locals.user;
  if (!user) return Astro2.redirect("/login?next=/cuenta/pedidos");
  function money(cents) {
    return `${(cents / 100).toFixed(2)} \u20AC`;
  }
  function fmtDate(d) {
    const date = new Date(d);
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(date);
  }
  const orders = await db.select({
    id: Order.id,
    publicId: Order.publicId,
    createdAt: Order.createdAt,
    type: Order.type,
    status: Order.status,
    totalCents: Order.totalCents
  }).from(Order).where(eq(Order.userId, user.id)).orderBy(desc(Order.createdAt)).limit(30);
  const orderIds = orders.map((o) => o.id);
  const itemRows = orderIds.length ? await db.select({
    orderId: OrderItem.orderId,
    qty: OrderItem.qty,
    nameSnapshot: OrderItem.nameSnapshot
  }).from(OrderItem).where(inArray(OrderItem.orderId, orderIds)).orderBy(OrderItem.orderId) : [];
  const itemsByOrderId = /* @__PURE__ */ new Map();
  for (const r of itemRows) {
    const arr = itemsByOrderId.get(r.orderId) ?? [];
    arr.push({ qty: r.qty, name: r.nameSnapshot });
    itemsByOrderId.set(r.orderId, arr);
  }
  function statusLabel(s) {
    switch (s) {
      case "PENDING":
        return "Pendiente";
      case "PAID":
        return "Pagado";
      case "ACCEPTED":
        return "Aceptado";
      case "PREPARING":
        return "En cocina";
      case "READY":
        return "Listo";
      case "OUT_FOR_DELIVERY":
        return "En reparto";
      case "DELIVERED":
        return "Entregado";
      case "CANCELLED":
        return "Cancelado";
      default:
        return s;
    }
  }
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Mis pedidos \xB7 Arcadia" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-baseline sm:gap-4"> <h1 class="text-2xl font-semibold tracking-tight">Mis pedidos</h1> <a class="text-sm font-semibold underline" href="/cuenta">Mi cuenta</a> </div> ${orders.length === 0 ? renderTemplate`<div class="mt-6 rounded-2xl border border-zinc-200 p-4 text-sm text-zinc-600 sm:p-5">
Todavía no tienes pedidos. ¡Vamos a por el primero!
<div class="mt-3"> <a class="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto" href="/pedir">
Ir a pedir
</a> </div> </div>` : renderTemplate`<div class="mt-6 space-y-4"> ${orders.map((o) => {
    const its = itemsByOrderId.get(o.id) ?? [];
    const preview = its.slice(0, 3);
    const extraCount = Math.max(0, its.length - preview.length);
    return renderTemplate`<div class="rounded-2xl border border-zinc-200 p-4 sm:p-5"> <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2"> <div class="font-semibold">Pedido ${o.publicId}</div> <span class="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700"> ${o.type} </span> <span class="rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700"> ${statusLabel(String(o.status))} </span> </div> <div class="mt-1 text-sm text-zinc-600"> ${fmtDate(o.createdAt)} </div> <div class="mt-3 space-y-1 text-sm"> ${preview.map((it) => renderTemplate`<div class="truncate"> <span class="font-semibold">${it.qty}×</span> ${it.name} </div>`)} ${extraCount > 0 ? renderTemplate`<div class="text-xs text-zinc-600">+ ${extraCount} más…</div>` : null} </div> </div> <div class="w-full sm:w-auto sm:text-right"> <div class="text-sm text-zinc-600">Total</div> <div class="text-lg font-black">${money(o.totalCents)}</div> <div class="mt-3 flex flex-col gap-2"> <a class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-center text-sm font-semibold sm:w-auto"${addAttribute(`/pedido/${o.publicId}`, "href")}>
Ver pedido
</a> </div> </div> </div> </div>`;
  })} </div>`}` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/cuenta/pedidos.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/cuenta/pedidos.astro";
const $$url = "/cuenta/pedidos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Pedidos,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
