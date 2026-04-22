import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, e as Product, s as UpsellItem } from './_astro_db_Bcz5lWRF.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

const $$Upsell = createComponent(async ($$result, $$props, $$slots) => {
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
  }
  const upsellRows = await db.select({
    id: UpsellItem.id,
    active: UpsellItem.active,
    sortOrder: UpsellItem.sortOrder,
    createdAt: UpsellItem.createdAt,
    productId: Product.id,
    name: Product.name,
    priceCents: Product.priceCents,
    image: Product.imageUrl ?? null,
    productActive: Product.active
  }).from(UpsellItem).innerJoin(Product, eq(UpsellItem.productId, Product.id)).orderBy(UpsellItem.sortOrder);
  const products = await db.select({
    id: Product.id,
    name: Product.name,
    active: Product.active,
    priceCents: Product.priceCents
  }).from(Product).orderBy(Product.name);
  const activeCount = upsellRows.filter((item) => item.active).length;
  upsellRows.length - activeCount;
  const maxSort = upsellRows.length ? Math.max(...upsellRows.map((item) => Number(item.sortOrder ?? 0))) : 0;
  const activeProductCount = upsellRows.filter(
    (item) => item.productActive
  ).length;
  upsellRows.length - activeProductCount;
  const summaryCards = [
    {
      label: "Total items",
      value: upsellRows.length,
      note: "Elementos enlazados a productos reales",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Activos",
      value: activeCount,
      note: "Visibles en el flujo público",
      tone: "border-emerald-400/20 bg-emerald-400/10"
    },
    {
      label: "Producto activo",
      value: activeProductCount,
      note: "Respaldados por catálogo activo",
      tone: "border-cyan-400/20 bg-cyan-400/10"
    },
    {
      label: "Próximo orden",
      value: maxSort + 1,
      note: "Siguiente sortOrder sugerido",
      tone: "border-violet-400/20 bg-violet-400/10"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Upsell · Admin · Arcadia", "heading": "Upsell", "description": "Gestión de productos sugeridos para venta adicional. El módulo sigue enlazando productos reales del catálogo, pero ahora la lectura visual deja mucho más claro qué está activo, qué depende del catálogo y qué se edita realmente aquí.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver productos
</a> <a href="/admin" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  <section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-4"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"> <aside class="space-y-6"> <article class="rounded-[32px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Añadir producto a upsell
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
El modelo actual no crea items autónomos. Aquí solo enlazas productos
          ya existentes del catálogo al flujo de upsell.
</p> <form method="post" action="/api/admin/upsell/add" class="mt-7 grid gap-5"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Producto
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="productId" required> ${products.filter((p) => p.active).map((p) => renderTemplate`<option${addAttribute(p.id, "value")}> ${p.name} · ${money(p.priceCents)} · #${p.id} </option>`)} </select> </label> <button class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-400/30 hover:bg-sky-400/15" type="submit">
Añadir a upsell
</button> </form> </article> <article class="rounded-[32px] border border-white/10 bg-[#0b1220]/90 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Importante
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Qué se edita realmente aquí
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">Fuente de datos</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Nombre, precio e imagen salen de <code>Product</code>, no de <code>UpsellItem</code>.
</p> </article> <article class="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">
Campos propios
</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
Aquí solo controlas el <code>sortOrder</code> y el estado <code>active</code> del item de upsell.
</p> </article> <article class="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">
Dependencia del catálogo
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Si el producto enlazado queda inactivo en catálogo, aquí seguirá
              existiendo el item, pero su respaldo real ya no será consistente
              para pública.
</p> </article> </div> </article> </aside> <section class="overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Listado
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Productos en upsell
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Cada item se presenta como una ficha amplia con estado del item,
              estado del producto enlazado, precio real y edición rápida del
              orden.
</p> </div> <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300"> ${upsellRows.length} elemento${upsellRows.length === 1 ? "" : "s"} </div> </div> </div> ${upsellRows.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#091121] p-8"> <div class="text-lg font-semibold text-white">
No hay upsell configurado
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Añade un producto desde el formulario lateral.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${upsellRows.map((item) => renderTemplate`<article class="rounded-[28px] border border-white/10 bg-[#091121]/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <h3 class="truncate text-xl font-semibold tracking-[-0.03em] text-white"> ${item.name} </h3> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    item.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
  ], "class:list")}> ${item.active ? "Item activo" : "Item inactivo"} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    item.productActive ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"
  ], "class:list")}> ${item.productActive ? "Producto activo" : "Producto inactivo"} </span> </div> <div class="mt-3 flex flex-wrap gap-2.5"> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
Producto #${item.productId} </span> <span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
Orden ${item.sortOrder} </span> </div> ${item.image ? renderTemplate`<div class="mt-3 truncate text-sm text-slate-500"> ${item.image} </div>` : null} </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 lg:min-w-[180px] lg:text-right"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Precio real
</div> <div class="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white"> ${money(item.priceCents)} </div> </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-3"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Item de upsell
</div> <div class="mt-3 text-sm font-semibold text-white"> ${item.active ? "Visible para sugerencia" : "Guardado pero fuera del flujo"} </div> <div class="mt-2 text-sm text-slate-400">
Fecha alta:${" "} ${new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid"
  }).format(new Date(item.createdAt))} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Producto enlazado
</div> <div class="mt-3 text-sm font-semibold text-white"> ${item.productActive ? "Catálogo consistente" : "Catálogo inactivo"} </div> <div class="mt-2 text-sm text-slate-400">
Nombre y precio se heredan del producto real.
</div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Orden
</div> <div class="mt-3 text-sm font-semibold text-white">
Posición ${item.sortOrder} </div> <div class="mt-2 text-sm text-slate-400">
Controla la prioridad de aparición del upsell.
</div> </section> </div> <div class="mt-5 grid gap-4 border-t border-white/[0.08] pt-5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end"> <form method="post" action="/api/admin/upsell/update" class="grid gap-4"> <input type="hidden" name="id"${addAttribute(item.id, "value")}> <div class="grid gap-4 sm:grid-cols-[180px_auto]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(item.sortOrder, "value")} required> </label> <label class="block rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(item.active, "checked")}> <div> <div class="text-sm font-semibold text-white">
Activo
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Mantener este producto dentro del flujo de upsell.
</p> </div> </div> </label> </div> <div> <button class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-400/30 hover:bg-sky-400/15" type="submit">
Guardar cambios
</button> </div> </form> <form method="post" action="/api/admin/upsell/delete"> <input type="hidden" name="id"${addAttribute(item.id, "value")}> <button class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15" type="submit">
Quitar de upsell
</button> </form> </div> </article>`)} </div>`} </section> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/upsell.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/upsell.astro";
const $$url = "/admin/upsell";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Upsell,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
