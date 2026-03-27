import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../../chunks/SiteLayout_Qpsqvz8u.mjs';
import { d as db, O as Order, p as OrderItem } from '../../chunks/_astro_db_ChTDrd2j.mjs';
/* empty css                                         */
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$publicId = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$publicId;
  const publicId = String(Astro2.params.publicId ?? "").trim();
  if (!publicId) return new Response("Missing publicId", { status: 400 });
  const [order] = await db.select().from(Order).where(eq(Order.publicId, publicId)).limit(1);
  if (!order) return new Response("Pedido no encontrado", { status: 404 });
  const items = await db.select().from(OrderItem).where(eq(OrderItem.orderId, order.id)).orderBy(OrderItem.id);
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
  const meta = order.addressSnapshot ?? {};
  const paymentMethod = meta?.paymentMethod ?? null;
  const forcedPickup = !!meta?.forcedPickup;
  const forcedReason = meta?.forcedReason ?? null;
  const address = meta?.address ?? null;
  const isDelivery = order.type === "DELIVERY";
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": `Pedido ${order.publicId} \xB7 Arcadia`, "data-astro-cid-jozz2t4d": true }, { "default": async ($$result2) => renderTemplate`  ${maybeRenderHead()}<div class="mx-auto w-full max-w-5xl 2xl:max-w-6xl" data-astro-cid-jozz2t4d> <div class="flex flex-col items-stretch justify-between gap-3 no-print sm:flex-row sm:items-center" data-astro-cid-jozz2t4d> <h1 class="text-2xl font-semibold tracking-tight" data-astro-cid-jozz2t4d>Pedido confirmado</h1> <button type="button" class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 sm:w-auto" onclick="window.print()" data-astro-cid-jozz2t4d>
Imprimir
</button> </div> <main class="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 2xl:p-6" data-astro-cid-jozz2t4d> <div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-baseline sm:gap-3" data-astro-cid-jozz2t4d> <div class="text-sm text-zinc-600" data-astro-cid-jozz2t4d>Número de pedido</div> <div class="font-mono text-lg font-black" data-astro-cid-jozz2t4d>${order.publicId}</div> </div> <div class="mt-2 flex flex-col items-start gap-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3" data-astro-cid-jozz2t4d> <div class="text-zinc-600" data-astro-cid-jozz2t4d>${fmtDate(order.createdAt)}</div> <div class="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700" data-astro-cid-jozz2t4d> ${order.type} </div> </div> <div class="mt-2 flex flex-col items-start justify-between gap-1 text-sm sm:flex-row sm:items-center sm:gap-3" data-astro-cid-jozz2t4d> <div class="text-zinc-600" data-astro-cid-jozz2t4d>Pago</div> <div class="font-semibold" data-astro-cid-jozz2t4d>${paymentMethod ?? "\u2014"}</div> </div> ${forcedPickup ? renderTemplate`<div class="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-astro-cid-jozz2t4d> <b data-astro-cid-jozz2t4d>Reparto no disponible:</b> pedido pasado a <b data-astro-cid-jozz2t4d>RECOGIDA</b>.
${forcedReason ? renderTemplate`<div class="mt-1 text-xs" data-astro-cid-jozz2t4d>${forcedReason}</div>` : null} </div>` : null} ${isDelivery && address ? renderTemplate`<div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4" data-astro-cid-jozz2t4d> <div class="text-sm font-semibold" data-astro-cid-jozz2t4d>Dirección</div> <div class="mt-1 text-sm text-zinc-700" data-astro-cid-jozz2t4d> <div data-astro-cid-jozz2t4d>${address.line1}${address.line2 ? `, ${address.line2}` : ""}</div> <div data-astro-cid-jozz2t4d>${address.postalCode} ${address.city}</div> ${address.notes ? renderTemplate`<div class="mt-1 text-xs" data-astro-cid-jozz2t4d>Notas: ${address.notes}</div>` : null} </div> </div>` : null} <div class="mt-5 border-t border-zinc-200 pt-4" data-astro-cid-jozz2t4d> <div class="text-sm font-semibold" data-astro-cid-jozz2t4d>Items</div> <div class="mt-3 space-y-3" data-astro-cid-jozz2t4d> ${items.map((item) => {
    const modifiers = item.modifiers ?? {};
    const options = modifiers.modifierOptions ?? [];
    const added = modifiers.ingredientsAdded ?? [];
    const removed = modifiers.ingredientsRemoved ?? [];
    return renderTemplate`<div class="rounded-xl border border-zinc-200 p-3 sm:p-4" data-astro-cid-jozz2t4d> <div class="flex items-start justify-between gap-3 sm:items-baseline" data-astro-cid-jozz2t4d> <div class="min-w-0" data-astro-cid-jozz2t4d> <div class="truncate font-semibold" data-astro-cid-jozz2t4d> ${item.qty}× ${item.nameSnapshot} ${item.variantSnapshot ? renderTemplate`<span class="ml-1 text-xs font-normal text-zinc-600" data-astro-cid-jozz2t4d>
(${item.variantSnapshot})
</span>` : null} </div> ${options.length || added.length || removed.length ? renderTemplate`<div class="mt-2 space-y-1 text-xs text-zinc-700" data-astro-cid-jozz2t4d> ${options.length ? renderTemplate`<div data-astro-cid-jozz2t4d><b data-astro-cid-jozz2t4d>Extras:</b> ${options.map((x) => x.name).join(", ")}</div>` : null} ${added.length ? renderTemplate`<div data-astro-cid-jozz2t4d><b data-astro-cid-jozz2t4d>Añadir:</b> ${added.map((x) => x.name).join(", ")}</div>` : null} ${removed.length ? renderTemplate`<div data-astro-cid-jozz2t4d><b data-astro-cid-jozz2t4d>Quitar:</b> ${removed.map((x) => x.name).join(", ")}</div>` : null} </div>` : null} </div> <div class="shrink-0 font-black" data-astro-cid-jozz2t4d>${money(item.lineTotalCents)}</div> </div> </div>`;
  })} </div> </div> ${order.notes ? renderTemplate`<div class="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4" data-astro-cid-jozz2t4d> <div class="text-sm font-semibold" data-astro-cid-jozz2t4d>Notas</div> <div class="mt-1 text-sm text-zinc-700" data-astro-cid-jozz2t4d>${order.notes}</div> </div>` : null} <div class="mt-5 border-t border-zinc-200 pt-4" data-astro-cid-jozz2t4d> <div class="flex items-center justify-between gap-3 text-sm" data-astro-cid-jozz2t4d> <span class="text-zinc-600" data-astro-cid-jozz2t4d>Subtotal</span> <span class="font-semibold" data-astro-cid-jozz2t4d>${money(order.subtotalCents)}</span> </div> ${isDelivery ? renderTemplate`<div class="mt-1 flex items-center justify-between gap-3 text-sm" data-astro-cid-jozz2t4d> <span class="text-zinc-600" data-astro-cid-jozz2t4d>Delivery</span> <span class="font-semibold" data-astro-cid-jozz2t4d>${money(Number(order.deliveryFeeCents ?? 0))}</span> </div>` : null} <div class="mt-3 flex items-center justify-between gap-3 text-base" data-astro-cid-jozz2t4d> <span class="font-black" data-astro-cid-jozz2t4d>TOTAL</span> <span class="font-black" data-astro-cid-jozz2t4d>${money(order.totalCents)}</span> </div> </div> </main> </div> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/pedido/[publicId].astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/pedido/[publicId].astro";
const $$url = "/pedido/[publicId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$publicId,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
