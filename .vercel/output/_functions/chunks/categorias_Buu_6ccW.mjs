import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, C as Category, e as Product, c as CategoryIngredient } from './_astro_db_Bcz5lWRF.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';

const $$Categorias = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Categorias;
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") ?? "";
  const categoryRows = await db.select({
    id: Category.id,
    name: Category.name,
    slug: Category.slug,
    sortOrder: Category.sortOrder,
    active: Category.active
  }).from(Category).orderBy(Category.sortOrder, Category.name);
  const categoryIds = categoryRows.map((category) => category.id);
  const productRows = categoryIds.length ? await db.select({
    categoryId: Product.categoryId,
    active: Product.active
  }).from(Product).where(inArray(Product.categoryId, categoryIds)) : [];
  const compatibilityRows = categoryIds.length ? await db.select({
    categoryId: CategoryIngredient.categoryId
  }).from(CategoryIngredient).where(inArray(CategoryIngredient.categoryId, categoryIds)) : [];
  const productCountByCategory = /* @__PURE__ */ new Map();
  const activeProductCountByCategory = /* @__PURE__ */ new Map();
  const inactiveProductCountByCategory = /* @__PURE__ */ new Map();
  for (const row of productRows) {
    productCountByCategory.set(
      row.categoryId,
      (productCountByCategory.get(row.categoryId) ?? 0) + 1
    );
    if (row.active) {
      activeProductCountByCategory.set(
        row.categoryId,
        (activeProductCountByCategory.get(row.categoryId) ?? 0) + 1
      );
    } else {
      inactiveProductCountByCategory.set(
        row.categoryId,
        (inactiveProductCountByCategory.get(row.categoryId) ?? 0) + 1
      );
    }
  }
  const compatibilityCountByCategory = /* @__PURE__ */ new Map();
  for (const row of compatibilityRows) {
    compatibilityCountByCategory.set(
      row.categoryId,
      (compatibilityCountByCategory.get(row.categoryId) ?? 0) + 1
    );
  }
  const categories = categoryRows.map((row) => ({
    ...row,
    productCount: productCountByCategory.get(row.id) ?? 0,
    activeProductCount: activeProductCountByCategory.get(row.id) ?? 0,
    inactiveProductCount: inactiveProductCountByCategory.get(row.id) ?? 0,
    ingredientCompatibilityCount: compatibilityCountByCategory.get(row.id) ?? 0
  }));
  const totalCategories = categories.length;
  const activeCategories = categories.filter(
    (category) => category.active
  ).length;
  const categoriesWithProducts = categories.filter(
    (category) => category.productCount > 0
  ).length;
  const emptyCategories = categories.filter(
    (category) => category.productCount === 0
  ).length;
  const errorMessage = error === "missing-name" ? "El nombre es obligatorio." : error === "invalid-slug" ? "El slug no es válido." : error === "duplicate-slug" ? "Ya existe otra categoría con ese slug." : error === "invalid-category" ? "La categoría indicada no es válida." : error === "not-found" ? "La categoría ya no existe." : error === "in-use-products" ? "No se puede borrar porque sigue teniendo productos asignados." : error === "in-use-ingredients" ? "No se puede borrar porque sigue teniendo compatibilidades de ingredientes." : error === "invalid-intent" ? "Acción no válida." : "";
  const summaryCards = [
    {
      label: "Total",
      value: totalCategories,
      note: "Categorías registradas",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Activas",
      value: activeCategories,
      note: "Disponibles en catálogo",
      tone: "border-emerald-400/15 bg-emerald-400/8"
    },
    {
      label: "Con productos",
      value: categoriesWithProducts,
      note: "Tienen productos asignados",
      tone: "border-cyan-400/15 bg-cyan-400/8"
    },
    {
      label: "Vacías",
      value: emptyCategories,
      note: "Se pueden revisar o limpiar",
      tone: "border-indigo-400/15 bg-indigo-400/8"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Categorías · Admin · Arcadia", "heading": "Categorías", "description": "CRUD real sobre Category. He dejado esta pantalla más aireada y menos comprimida, manteniendo solo los campos que hoy aportan negocio real: nombre, slug, orden y estado.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-400/25 hover:bg-sky-400/15">
Ver productos
</a> <a href="/admin/menu" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ver menús
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/15 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100">
Categorías actualizadas correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/15 bg-rose-400/10 px-5 py-4 text-sm text-rose-100"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-4"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1.2fr)_380px] 2xl:items-start"> <article class="overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Catálogo base
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Edición de categorías
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Cada categoría se edita en su propio bloque, con más aire para
              leer su estado real, productos asociados y compatibilidades sin
              sensación de formulario comprimido.
</p> </div> <div class="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300">
Sin campo de imagen en la operativa
</div> </div> </div> ${categories.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#091121] p-8"> <div class="text-lg font-semibold text-white">
No hay categorías
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Crea la primera categoría para empezar a estructurar el
                catálogo.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${categories.map((category) => {
    const canDelete = category.productCount === 0 && category.ingredientCompatibilityCount === 0;
    return renderTemplate`<section class="rounded-[28px] border border-white/10 bg-[#091121]/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <h3 class="text-xl font-semibold tracking-[-0.03em] text-white"> ${category.name} </h3> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
      category.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${category.active ? "Activa" : "Inactiva"} </span> </div> <div class="mt-3"> <code class="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300"> ${category.slug} </code> </div> </div> <div class="grid gap-3 sm:grid-cols-3 lg:w-[420px]"> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Productos
</div> <div class="mt-2 text-lg font-semibold text-white"> ${category.productCount} </div> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Activos
</div> <div class="mt-2 text-lg font-semibold text-white"> ${category.activeProductCount} </div> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Compatibilidades
</div> <div class="mt-2 text-lg font-semibold text-white"> ${category.ingredientCompatibilityCount} </div> </div> </div> </div> <form method="post" action="/api/admin/categories" class="mt-6 grid gap-5"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="categoryId"${addAttribute(category.id, "value")}> <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px_140px]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/30 focus:outline-none" type="text" name="name"${addAttribute(category.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Slug
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/30 focus:outline-none" type="text" name="slug"${addAttribute(category.slug, "value")}> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/30 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(category.sortOrder, "value")}> </label> </div> <div class="flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <div class="flex flex-wrap items-center gap-6"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400" type="checkbox" name="active"${addAttribute(category.active, "checked")}>
Activa
</label> <div class="text-sm text-slate-500"> ${category.activeProductCount} productos activos ·${" "} ${category.inactiveProductCount} inactivos
</div> </div> <div class="flex flex-wrap gap-3"> <a${addAttribute(`/admin/catalogo/productos?category=${category.id}`, "href")} class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ver productos
</a> <button type="submit" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Guardar categoría
</button> </div> </div> </form> <div class="mt-5 flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <p class="text-sm leading-6 text-slate-500"> ${canDelete ? "Se puede borrar porque no tiene productos ni compatibilidades de ingredientes." : "No se puede borrar mientras tenga productos asignados o compatibilidades de ingredientes."} </p> <form method="post" action="/api/admin/categories"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="categoryId"${addAttribute(category.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500"
    ], "class:list")}>
Borrar categoría
</button> </form> </div> </section>`;
  })} </div>`} </article> <aside class="space-y-6 2xl:sticky 2xl:top-6"> <section class="rounded-[30px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Nueva categoría
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
Alta rápida y mínima. Solo los campos que hoy importan de verdad para
          ordenar el catálogo.
</p> <form method="post" action="/api/admin/categories" class="mt-7 grid gap-5"> <input type="hidden" name="intent" value="create"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/30 focus:outline-none" type="text" name="name" placeholder="Bocadillos" required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Slug
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/30 focus:outline-none" type="text" name="slug" placeholder="Se genera automáticamente si lo dejas vacío"> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/30 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(categories.length, "value")}> </label> <label class="inline-flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400" type="checkbox" name="active" checked>
Activa
</label> <button type="submit" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Crear categoría
</button> </form> </section> <section class="rounded-[30px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Qué cubre este bloque
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">
Solo negocio real
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Categorías sin imagen. La pantalla se centra en nombre, slug,
              orden y estado porque es lo que hoy aporta operativa al catálogo.
</p> </article> <article class="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-100">
Sin migración
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
No se toca schema ni se borran datos existentes. Solo se deja de
              exponer <code>imageUrl</code> en esta UI.
</p> </article> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">
Borrado protegido
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
La categoría no se puede borrar si sigue teniendo productos o
              compatibilidades en <code>CategoryIngredient</code>.
</p> </article> </div> </section> </aside> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/categorias.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/categorias.astro";
const $$url = "/admin/categorias";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Categorias,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
