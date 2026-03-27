import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_CaEDeM2K.mjs';
import { d as db, i as Coupon, L as LoyaltyTier, O as Order } from '../../chunks/_astro_db_ChTDrd2j.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Cupones = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Cupones;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} \u20AC`;
  }
  function moneyInput(cents) {
    if (typeof cents !== "number") return "";
    return (cents / 100).toFixed(2);
  }
  function dateInputValue(value) {
    if (!value) return "";
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  function couponValueLabel(type, value) {
    if (type === "PERCENT") return `${value}%`;
    if (type === "FIXED") return money(value);
    return "Env\xEDo gratis";
  }
  function typeLabel(type) {
    if (type === "PERCENT") return "Porcentaje";
    if (type === "FIXED") return "Importe fijo";
    return "Free delivery";
  }
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") ?? "";
  const couponRows = await db.select({
    id: Coupon.id,
    code: Coupon.code,
    type: Coupon.type,
    value: Coupon.value,
    minSubtotalCents: Coupon.minSubtotalCents,
    maxUses: Coupon.maxUses,
    usesCount: Coupon.usesCount,
    active: Coupon.active,
    startsAt: Coupon.startsAt,
    endsAt: Coupon.endsAt,
    requiredTierId: Coupon.requiredTierId
  }).from(Coupon).orderBy(Coupon.code);
  const tiers = await db.select({
    id: LoyaltyTier.id,
    name: LoyaltyTier.name,
    active: LoyaltyTier.active,
    sortOrder: LoyaltyTier.sortOrder
  }).from(LoyaltyTier).orderBy(LoyaltyTier.sortOrder, LoyaltyTier.name);
  const tierNameById = /* @__PURE__ */ new Map();
  for (const tier of tiers) {
    tierNameById.set(tier.id, tier.name);
  }
  const couponIds = couponRows.map((row) => row.id);
  const orderRows = couponIds.length ? await db.select({
    couponId: Order.couponId
  }).from(Order).where(inArray(Order.couponId, couponIds)) : [];
  const linkedOrderCountByCoupon = /* @__PURE__ */ new Map();
  for (const row of orderRows) {
    const couponId = row.couponId;
    if (typeof couponId !== "number") continue;
    linkedOrderCountByCoupon.set(
      couponId,
      (linkedOrderCountByCoupon.get(couponId) ?? 0) + 1
    );
  }
  const totalCoupons = couponRows.length;
  const activeCoupons = couponRows.filter((coupon) => coupon.active).length;
  const usedCoupons = couponRows.filter((coupon) => coupon.usesCount > 0).length;
  const limitedCoupons = couponRows.filter((coupon) => typeof coupon.maxUses === "number").length;
  const errorMessage = error === "missing-code" ? "El c\xF3digo del cup\xF3n es obligatorio." : error === "duplicate-code" ? "Ya existe otro cup\xF3n con ese c\xF3digo." : error === "invalid-type" ? "El tipo de cup\xF3n no es v\xE1lido." : error === "invalid-value" ? "El valor del cup\xF3n no es v\xE1lido." : error === "invalid-min-subtotal" ? "El subtotal m\xEDnimo no es v\xE1lido." : error === "invalid-max-uses" ? "El m\xE1ximo de usos no es v\xE1lido." : error === "invalid-dates" ? "Las fechas del cup\xF3n no son v\xE1lidas." : error === "invalid-tier" ? "El tier requerido no es v\xE1lido." : error === "invalid-coupon" ? "El cup\xF3n indicado no es v\xE1lido." : error === "coupon-not-found" ? "El cup\xF3n ya no existe." : error === "coupon-in-use" ? "No se puede borrar un cup\xF3n que ya ha sido usado o vinculado a pedidos." : error === "invalid-intent" ? "Acci\xF3n no v\xE1lida." : "";
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Cupones \xB7 Admin \xB7 Arcadia", "heading": "Cupones", "description": "Gesti\xF3n real de descuentos conectados al checkout. Desde aqu\xED controlas c\xF3digo, reglas, l\xEDmites, vigencia y tier requerido.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Cupones actualizados correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> <article class="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Total</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${totalCoupons}</div> <p class="mt-2 text-sm text-slate-400">Cupones registrados</p> </article> <article class="rounded-[28px] border border-emerald-400/15 bg-emerald-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Activos</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${activeCoupons}</div> <p class="mt-2 text-sm text-emerald-100/70">Disponibles en checkout</p> </article> <article class="rounded-[28px] border border-sky-400/15 bg-sky-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">Usados</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${usedCoupons}</div> <p class="mt-2 text-sm text-sky-100/70">Tienen al menos un uso</p> </article> <article class="rounded-[28px] border border-violet-400/15 bg-violet-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">Limitados</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${limitedCoupons}</div> <p class="mt-2 text-sm text-violet-100/70">Con máximo de usos</p> </article> </section> <section class="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"> <aside class="space-y-6"> <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Nuevo cupón
</h2> <form method="post" action="/api/admin/coupons" class="mt-6 grid gap-4"> <input type="hidden" name="intent" value="create"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Código
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm font-semibold uppercase tracking-[0.06em] text-white focus:border-sky-400/40 focus:outline-none" type="text" name="code" placeholder="BIENVENIDA10" required> </label> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Tipo
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="type"> <option value="PERCENT">PERCENT</option> <option value="FIXED">FIXED</option> <option value="FREE_DELIVERY">FREE_DELIVERY</option> </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Valor
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="valueInput" placeholder="10 ó 3.50"> </label> </div> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Subtotal mínimo €
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="minSubtotalEur" placeholder="Opcional"> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Máximo usos
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" min="1" step="1" name="maxUses" placeholder="Opcional"> </label> </div> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Starts at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="date" name="startsAt"> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Ends at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="date" name="endsAt"> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Tier requerido
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="requiredTierId"> <option value="">Sin restricción</option> ${tiers.map((tier) => renderTemplate`<option${addAttribute(tier.id, "value")}>${tier.name}</option>`)} </select> </label> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active" checked>
Activo
</label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Crear cupón
</button> </form> </section> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Cómo aplica en checkout
</h2> <div class="mt-6 space-y-4"> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">PERCENT</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Descuenta un porcentaje del subtotal del pedido.
</p> </div> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">FIXED</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Descuenta una cantidad fija en euros sobre el subtotal.
</p> </div> <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">FREE_DELIVERY</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
Solo aplica en pedidos con delivery y bonifica la tarifa de envío.
</p> </div> </div> </section> </aside> <section class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Gestión
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Cupones conectados al checkout
</h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
El borrado se bloquea si ya hubo uso real
</div> </div> </div> ${couponRows.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">No hay cupones</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Crea el primero desde el formulario lateral.
</p> </div> </div>` : renderTemplate`<div class="space-y-4 px-6 py-6"> ${couponRows.map((coupon) => {
    const linkedOrderCount = linkedOrderCountByCoupon.get(coupon.id) ?? 0;
    const canDelete = coupon.usesCount === 0 && linkedOrderCount === 0;
    return renderTemplate`<section class="rounded-3xl border border-white/10 bg-white/4 p-5"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-base font-semibold text-white">${coupon.code}</div> <div class="mt-2 flex flex-wrap gap-2"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
      coupon.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${coupon.active ? "Activo" : "Inactivo"} </span> <span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300"> ${typeLabel(coupon.type)} </span> <span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-300"> ${couponValueLabel(coupon.type, coupon.value)} </span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
Usos ${coupon.usesCount} ${typeof coupon.maxUses === "number" ? ` / ${coupon.maxUses}` : ""} </span> ${coupon.requiredTierId ? renderTemplate`<span class="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-amber-300"> ${tierNameById.get(coupon.requiredTierId) ?? `Tier ${coupon.requiredTierId}`} </span>` : null} </div> </div> <div class="text-sm text-slate-400"> ${linkedOrderCount} pedido${linkedOrderCount === 1 ? "" : "s"} enlazado${linkedOrderCount === 1 ? "" : "s"} </div> </div> <form method="post" action="/api/admin/coupons" class="mt-5 grid gap-4"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="couponId"${addAttribute(coupon.id, "value")}> <div class="grid gap-4 lg:grid-cols-[220px_180px_180px]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Código
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm font-semibold uppercase tracking-[0.06em] text-white focus:border-sky-400/40 focus:outline-none" type="text" name="code"${addAttribute(coupon.code, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Tipo
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="type"> <option value="PERCENT"${addAttribute(coupon.type === "PERCENT", "selected")}>PERCENT</option> <option value="FIXED"${addAttribute(coupon.type === "FIXED", "selected")}>FIXED</option> <option value="FREE_DELIVERY"${addAttribute(coupon.type === "FREE_DELIVERY", "selected")}>FREE_DELIVERY</option> </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Valor
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="valueInput"${addAttribute(coupon.type === "FIXED" ? moneyInput(coupon.value) : String(coupon.value), "value")}> </label> </div> <div class="grid gap-4 lg:grid-cols-4"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Subtotal mínimo €
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="minSubtotalEur"${addAttribute(moneyInput(coupon.minSubtotalCents), "value")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Máximo usos
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" min="1" step="1" name="maxUses"${addAttribute(coupon.maxUses ?? "", "value")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Starts at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="date" name="startsAt"${addAttribute(dateInputValue(coupon.startsAt), "value")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Ends at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="date" name="endsAt"${addAttribute(dateInputValue(coupon.endsAt), "value")}> </label> </div> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Tier requerido
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="requiredTierId"> <option value=""${addAttribute(coupon.requiredTierId === null, "selected")}>Sin restricción</option> ${tiers.map((tier) => renderTemplate`<option${addAttribute(tier.id, "value")}${addAttribute(coupon.requiredTierId === tier.id, "selected")}> ${tier.name} </option>`)} </select> </label> <label class="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-[#0b1120]/60 px-4 py-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(coupon.active, "checked")}>
Activo
</label> </div> <div class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"> <p class="text-sm text-slate-500"> ${canDelete ? "Se puede borrar porque no tiene uso real ni pedidos enlazados." : "No se puede borrar porque ya tiene uso real o est\xE1 enlazado a pedidos."} </p> <div class="flex flex-wrap gap-2"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Guardar cupón
</button> </div> </div> </form> <div class="mt-4 flex justify-end border-t border-white/10 pt-4"> <form method="post" action="/api/admin/coupons"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="couponId"${addAttribute(coupon.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
    ], "class:list")}>
Borrar cupón
</button> </form> </div> </section>`;
  })} </div>`} </section> </section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/cupones.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/cupones.astro";
const $$url = "/admin/cupones";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cupones,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
