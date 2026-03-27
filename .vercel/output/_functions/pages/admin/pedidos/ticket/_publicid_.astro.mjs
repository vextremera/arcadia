import { e as createComponent, o as renderHead, g as addAttribute, r as renderTemplate, k as renderComponent, l as Fragment, h as createAstro } from '../../../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { d as db, O as Order, p as OrderItem } from '../../../../chunks/_astro_db_BPgDZzX3.mjs';
/* empty css                                               */
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$publicId = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$publicId;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} \u20AC`;
  }
  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);
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
  const publicId = String(Astro2.params.publicId ?? "").trim();
  if (!publicId) {
    return new Response("Missing publicId", { status: 400 });
  }
  const [order] = await db.select().from(Order).where(eq(Order.publicId, publicId)).limit(1);
  if (!order) {
    return new Response("Pedido no encontrado", { status: 404 });
  }
  const items = await db.select().from(OrderItem).where(eq(OrderItem.orderId, order.id)).orderBy(OrderItem.id);
  const decoratedItems = items.map((it) => {
    const modifiers = it.modifiers ?? {};
    const opts = Array.isArray(modifiers.modifierOptions) ? modifiers.modifierOptions : [];
    const adds = Array.isArray(modifiers.ingredientsAdded) ? modifiers.ingredientsAdded : [];
    const rems = Array.isArray(modifiers.ingredientsRemoved) ? modifiers.ingredientsRemoved : [];
    return {
      ...it,
      opts,
      adds,
      rems
    };
  });
  const meta = order.addressSnapshot ?? {};
  const paymentMethod = String(meta.paymentMethod ?? "").toUpperCase() || null;
  const forcedPickup = Boolean(meta.forcedPickup);
  const forcedReason = String(meta.forcedReason ?? "").trim();
  const couponCode = String(meta.couponCode ?? "").trim();
  const couponAppliedMessage = String(meta.couponAppliedMessage ?? "").trim();
  const adminInternalNote = String(meta.adminInternalNote ?? "").trim();
  const address = meta.address ?? null;
  const autoPrint = new URL(Astro2.request.url).searchParams.get("print") === "1";
  return renderTemplate`<html lang="es" data-astro-cid-wfq4kcue> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Ticket ${order.publicId}</title>${renderHead()}</head> <body data-astro-cid-wfq4kcue> <div class="toolbar" data-astro-cid-wfq4kcue> <div class="toolbarInner" data-astro-cid-wfq4kcue> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="btn" data-astro-cid-wfq4kcue>Volver al pedido</a> <button class="btn btnPrimary" onclick="window.print()" data-astro-cid-wfq4kcue>Imprimir</button> </div> </div> <div class="wrap" data-astro-cid-wfq4kcue> <div class="ticket" data-astro-cid-wfq4kcue> <div class="center" data-astro-cid-wfq4kcue> <div class="title" data-astro-cid-wfq4kcue>ARCADIA</div> <div class="sub" data-astro-cid-wfq4kcue>Ticket operativo</div> <div class="sub" data-astro-cid-wfq4kcue>${order.publicId}</div> </div> <div class="sep" data-astro-cid-wfq4kcue></div> <div class="row sm" data-astro-cid-wfq4kcue> <span class="muted" data-astro-cid-wfq4kcue>Fecha</span> <span class="b" data-astro-cid-wfq4kcue>${formatDate(order.createdAt)}</span> </div> <div class="row sm" data-astro-cid-wfq4kcue> <span class="muted" data-astro-cid-wfq4kcue>Tipo</span> <span class="b" data-astro-cid-wfq4kcue>${order.type}</span> </div> <div class="row sm" data-astro-cid-wfq4kcue> <span class="muted" data-astro-cid-wfq4kcue>Estado</span> <span class="b" data-astro-cid-wfq4kcue>${order.status}</span> </div> <div class="row sm" data-astro-cid-wfq4kcue> <span class="muted" data-astro-cid-wfq4kcue>Pago</span> <span class="b" data-astro-cid-wfq4kcue>${paymentMethod ?? "\u2014"} · ${order.paymentStatus}</span> </div> <div class="sep" data-astro-cid-wfq4kcue></div> <div class="sm b" data-astro-cid-wfq4kcue>CLIENTE</div> <div class="sm" data-astro-cid-wfq4kcue>${order.customerName ?? "Sin nombre"}</div> <div class="sm" data-astro-cid-wfq4kcue>${order.customerPhone ?? "Sin tel\xE9fono"}</div> ${order.customerEmail ? renderTemplate`<div class="sm" data-astro-cid-wfq4kcue>${order.customerEmail}</div>` : null} ${order.type === "DELIVERY" && address ? renderTemplate`${renderComponent($$result, "Fragment", Fragment, { "data-astro-cid-wfq4kcue": true }, { "default": async ($$result2) => renderTemplate` <div class="sep" data-astro-cid-wfq4kcue></div> <div class="sm b" data-astro-cid-wfq4kcue>ENTREGA</div> <div class="sm" data-astro-cid-wfq4kcue>${address.line1 ?? "\u2014"}</div> ${address.line2 ? renderTemplate`<div class="sm" data-astro-cid-wfq4kcue>${address.line2}</div>` : null}${address.postalCode || address.city ? renderTemplate`<div class="sm" data-astro-cid-wfq4kcue>${address.postalCode ?? ""}${address.postalCode && address.city ? " \xB7 " : ""}${address.city ?? ""}</div>` : null}${address.notes ? renderTemplate`<div class="sm" data-astro-cid-wfq4kcue>Notas: ${address.notes}</div>` : null}` })}` : null} ${forcedPickup ? renderTemplate`<div class="noteBox" data-astro-cid-wfq4kcue> <div class="bb xs" data-astro-cid-wfq4kcue>FORCED PICKUP</div> <div class="sm" data-astro-cid-wfq4kcue>${forcedReason || "Cambio operativo aplicado"}</div> </div>` : null} <div class="sep" data-astro-cid-wfq4kcue></div> <div class="sm b" data-astro-cid-wfq4kcue>ITEMS</div> ${decoratedItems.map((item) => renderTemplate`<div style="margin-top:8px;" data-astro-cid-wfq4kcue> <div class="row sm" data-astro-cid-wfq4kcue> <span class="b" data-astro-cid-wfq4kcue>${item.qty} × ${item.nameSnapshot}</span> <span class="b" data-astro-cid-wfq4kcue>${money(item.lineTotalCents)}</span> </div> ${item.variantSnapshot ? renderTemplate`<div class="sm muted indent" data-astro-cid-wfq4kcue>Variante: ${item.variantSnapshot}</div>` : null} ${item.opts.length ? renderTemplate`<div class="sm muted indent" data-astro-cid-wfq4kcue>
Opciones: ${item.opts.map((o) => `${String(o.name ?? "")} (+${money(Number(o.priceDeltaCents ?? 0))})`).join(", ")} </div>` : null} ${item.adds.length ? renderTemplate`<div class="sm muted indent" data-astro-cid-wfq4kcue>
Añadidos: ${item.adds.map((a) => `${String(a.name ?? "")} (+${money(Number(a.priceDeltaCents ?? 0))})`).join(", ")} </div>` : null} ${item.rems.length ? renderTemplate`<div class="sm muted indent" data-astro-cid-wfq4kcue>
Quitados: ${item.rems.map((r) => String(r.name ?? "")).join(", ")} </div>` : null} ${item.notes ? renderTemplate`<div class="sm muted indent" data-astro-cid-wfq4kcue>Notas línea: ${item.notes}</div>` : null} </div>`)} <div class="sep" data-astro-cid-wfq4kcue></div> <div class="row sm" data-astro-cid-wfq4kcue> <span data-astro-cid-wfq4kcue>Subtotal</span> <span data-astro-cid-wfq4kcue>${money(order.subtotalCents)}</span> </div> ${Number(order.deliveryFeeCents ?? 0) > 0 ? renderTemplate`<div class="row sm" data-astro-cid-wfq4kcue> <span data-astro-cid-wfq4kcue>Delivery fee</span> <span data-astro-cid-wfq4kcue>${money(order.deliveryFeeCents)}</span> </div>` : null} ${Number(order.discountCents ?? 0) > 0 ? renderTemplate`<div class="row sm" data-astro-cid-wfq4kcue> <span data-astro-cid-wfq4kcue>Descuento</span> <span data-astro-cid-wfq4kcue>-${money(order.discountCents)}</span> </div>` : null} <div class="row sm" data-astro-cid-wfq4kcue> <span data-astro-cid-wfq4kcue>Impuestos</span> <span data-astro-cid-wfq4kcue>${money(order.taxCents)}</span> </div> <div class="sep" data-astro-cid-wfq4kcue></div> <div class="row bigTotal" data-astro-cid-wfq4kcue> <span data-astro-cid-wfq4kcue>TOTAL</span> <span data-astro-cid-wfq4kcue>${money(order.totalCents)}</span> </div> ${couponCode ? renderTemplate`<div class="noteBox" data-astro-cid-wfq4kcue> <div class="bb xs" data-astro-cid-wfq4kcue>CUPÓN</div> <div class="sm" data-astro-cid-wfq4kcue>${couponCode}</div> ${couponAppliedMessage ? renderTemplate`<div class="sm muted" data-astro-cid-wfq4kcue>${couponAppliedMessage}</div>` : null} </div>` : null} ${order.notes ? renderTemplate`<div class="noteBox" data-astro-cid-wfq4kcue> <div class="bb xs" data-astro-cid-wfq4kcue>COMENTARIO CLIENTE</div> <div class="sm prewrap" data-astro-cid-wfq4kcue>${order.notes}</div> </div>` : null} ${adminInternalNote ? renderTemplate`<div class="noteBox" data-astro-cid-wfq4kcue> <div class="bb xs" data-astro-cid-wfq4kcue>NOTA INTERNA</div> <div class="sm prewrap" data-astro-cid-wfq4kcue>${adminInternalNote}</div> </div>` : null} <div class="sep" data-astro-cid-wfq4kcue></div> <div class="center xs muted" data-astro-cid-wfq4kcue>
Ticket generado desde admin · Arcadia
</div> </div> </div> ${autoPrint ? renderTemplate(_a || (_a = __template(['<script>\n        window.addEventListener("load", () => {\n          window.print();\n        });\n      <\/script>']))) : null} </body> </html>`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/pedidos/ticket/[publicId].astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/pedidos/ticket/[publicId].astro";
const $$url = "/admin/pedidos/ticket/[publicId]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$publicId,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
