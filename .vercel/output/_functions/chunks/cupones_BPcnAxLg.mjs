import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, j as Coupon, L as LoyaltyTier, O as Order } from './_astro_db_Bcz5lWRF.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';

const $$Cupones = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Cupones;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
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
    return "Envío gratis";
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
  const limitedCoupons = couponRows.filter(
    (coupon) => typeof coupon.maxUses === "number"
  ).length;
  const errorMessage = error === "missing-code" ? "El código del cupón es obligatorio." : error === "duplicate-code" ? "Ya existe otro cupón con ese código." : error === "invalid-type" ? "El tipo de cupón no es válido." : error === "invalid-value" ? "El valor del cupón no es válido." : error === "invalid-min-subtotal" ? "El subtotal mínimo no es válido." : error === "invalid-max-uses" ? "El máximo de usos no es válido." : error === "invalid-dates" ? "Las fechas del cupón no son válidas." : error === "invalid-tier" ? "El tier requerido no es válido." : error === "invalid-coupon" ? "El cupón indicado no es válido." : error === "coupon-not-found" ? "El cupón ya no existe." : error === "coupon-in-use" ? "No se puede borrar un cupón que ya ha sido usado o vinculado a pedidos." : error === "invalid-intent" ? "Acción no válida." : "";
  const summaryCards = [
    {
      label: "Total",
      value: totalCoupons,
      note: "Cupones registrados",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Activos",
      value: activeCoupons,
      note: "Disponibles en checkout",
      tone: "border-emerald-400/15 bg-emerald-400/8"
    },
    {
      label: "Usados",
      value: usedCoupons,
      note: "Tienen al menos un uso",
      tone: "border-sky-400/15 bg-sky-400/8"
    },
    {
      label: "Limitados",
      value: limitedCoupons,
      note: "Con máximo de usos",
      tone: "border-violet-400/15 bg-violet-400/8"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Cupones · Admin · Arcadia", "heading": "Cupones", "description": "Gestión real de descuentos conectados al checkout. Desde aquí controlas código, reglas, límites, vigencia y tier requerido sin apretar toda la información en bloques pequeños.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/15 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100">
Cupones actualizados correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/15 bg-rose-400/10 px-5 py-4 text-sm text-rose-100"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-4"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 2xl:grid-cols-[380px_minmax(0,1fr)] 2xl:items-start"> <aside class="space-y-6 2xl:sticky 2xl:top-6"> <section class="rounded-[30px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Nuevo cupón
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
Crea descuentos conectados al checkout con código, tipo, límites,
          vigencia y restricción opcional por tier.
</p> <form method="post" action="/api/admin/coupons" class="mt-7 grid gap-5"> <input type="hidden" name="intent" value="create"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Código
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm font-semibold uppercase tracking-[0.06em] text-white focus:border-sky-400/30 focus:outline-none" type="text" name="code" placeholder="BIENVENIDA10" required> </label> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Tipo
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" name="type"> <option value="PERCENT">PERCENT</option> <option value="FIXED">FIXED</option> <option value="FREE_DELIVERY">FREE_DELIVERY</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Valor
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="text" name="valueInput" placeholder="10 ó 3.50"> </label> </div> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Subtotal mínimo €
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="text" name="minSubtotalEur" placeholder="Opcional"> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Máximo usos
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="number" min="1" step="1" name="maxUses" placeholder="Opcional"> </label> </div> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Starts at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="date" name="startsAt"> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Ends at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="date" name="endsAt"> </label> </div> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Tier requerido
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" name="requiredTierId"> <option value="">Sin restricción</option> ${tiers.map((tier) => renderTemplate`<option${addAttribute(tier.id, "value")}>${tier.name}</option>`)} </select> </label> <label class="inline-flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active" checked>
Activo
</label> <button type="submit" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-400/25 hover:bg-sky-400/15">
Crear cupón
</button> </form> </section> <section class="rounded-[30px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Cómo aplica en checkout
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">PERCENT</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Descuenta un porcentaje del subtotal del pedido.
</p> </article> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">FIXED</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Descuenta una cantidad fija en euros sobre el subtotal.
</p> </article> <article class="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">FREE_DELIVERY</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
Solo aplica en pedidos con delivery y bonifica la tarifa de envío.
</p> </article> </div> </section> </aside> <section class="overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Gestión
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Cupones conectados al checkout
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Cada cupón se edita en un bloque amplio con más contexto: tipo,
              valor, usos, tier, vigencia y protección de borrado sin sensación
              de formulario apretado.
</p> </div> <div class="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300">
El borrado se bloquea si ya hubo uso real
</div> </div> </div> ${couponRows.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#091121] p-8"> <div class="text-lg font-semibold text-white">No hay cupones</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Crea el primero desde el formulario lateral.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${couponRows.map((coupon) => {
    const linkedOrderCount = linkedOrderCountByCoupon.get(coupon.id) ?? 0;
    const canDelete = coupon.usesCount === 0 && linkedOrderCount === 0;
    return renderTemplate`<section class="rounded-[28px] border border-white/10 bg-[#091121]/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <h3 class="text-xl font-semibold tracking-[-0.03em] text-white"> ${coupon.code} </h3> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
      coupon.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${coupon.active ? "Activo" : "Inactivo"} </span> <span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300"> ${typeLabel(coupon.type)} </span> <span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-violet-300"> ${couponValueLabel(coupon.type, coupon.value)} </span> ${coupon.requiredTierId ? renderTemplate`<span class="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-300"> ${tierNameById.get(coupon.requiredTierId) ?? `Tier ${coupon.requiredTierId}`} </span>` : null} </div> </div> <div class="grid gap-3 sm:grid-cols-3 lg:w-[420px]"> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Usos
</div> <div class="mt-2 text-lg font-semibold text-white"> ${coupon.usesCount} ${typeof coupon.maxUses === "number" ? ` / ${coupon.maxUses}` : ""} </div> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Pedidos enlazados
</div> <div class="mt-2 text-lg font-semibold text-white"> ${linkedOrderCount} </div> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Vigencia
</div> <div class="mt-2 text-sm font-semibold text-white"> ${coupon.startsAt || coupon.endsAt ? "Configurada" : "Sin fechas"} </div> </div> </div> </div> <form method="post" action="/api/admin/coupons" class="mt-6 grid gap-5"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="couponId"${addAttribute(coupon.id, "value")}> <div class="grid gap-5 xl:grid-cols-[220px_180px_180px]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Código
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm font-semibold uppercase tracking-[0.06em] text-white focus:border-sky-400/30 focus:outline-none" type="text" name="code"${addAttribute(coupon.code, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Tipo
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" name="type"> <option value="PERCENT"${addAttribute(coupon.type === "PERCENT", "selected")}>
PERCENT
</option> <option value="FIXED"${addAttribute(coupon.type === "FIXED", "selected")}>
FIXED
</option> <option value="FREE_DELIVERY"${addAttribute(coupon.type === "FREE_DELIVERY", "selected")}>
FREE_DELIVERY
</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Valor
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="text" name="valueInput"${addAttribute(
      coupon.type === "FIXED" ? moneyInput(coupon.value) : String(coupon.value),
      "value"
    )}> </label> </div> <div class="grid gap-5 xl:grid-cols-4"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Subtotal mínimo €
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="text" name="minSubtotalEur"${addAttribute(moneyInput(coupon.minSubtotalCents), "value")}> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Máximo usos
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="number" min="1" step="1" name="maxUses"${addAttribute(coupon.maxUses ?? "", "value")}> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Starts at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="date" name="startsAt"${addAttribute(dateInputValue(coupon.startsAt), "value")}> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Ends at
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" type="date" name="endsAt"${addAttribute(dateInputValue(coupon.endsAt), "value")}> </label> </div> <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_220px]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Tier requerido
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" name="requiredTierId"> <option value=""${addAttribute(coupon.requiredTierId === null, "selected")}>
Sin restricción
</option> ${tiers.map((tier) => renderTemplate`<option${addAttribute(tier.id, "value")}${addAttribute(coupon.requiredTierId === tier.id, "selected")}> ${tier.name} </option>`)} </select> </label> <label class="inline-flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(coupon.active, "checked")}>
Activo
</label> </div> <div class="flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <p class="text-sm leading-6 text-slate-500"> ${canDelete ? "Se puede borrar porque no tiene uso real ni pedidos enlazados." : "No se puede borrar porque ya tiene uso real o está enlazado a pedidos."} </p> <div class="flex flex-wrap gap-3"> <button type="submit" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-400/25 hover:bg-sky-400/15">
Guardar cupón
</button> </div> </div> </form> <div class="mt-5 flex justify-end border-t border-white/[0.08] pt-5"> <form method="post" action="/api/admin/coupons"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="couponId"${addAttribute(coupon.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500"
    ], "class:list")}>
Borrar cupón
</button> </form> </div> </section>`;
  })} </div>`} </section> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/cupones.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/cupones.astro";
const $$url = "/admin/cupones";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cupones,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
