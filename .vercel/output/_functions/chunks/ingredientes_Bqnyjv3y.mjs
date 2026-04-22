import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, I as Ingredient, f as ProductIngredient, C as Category, c as CategoryIngredient, e as Product } from './_astro_db_Bcz5lWRF.mjs';
import { inArray, eq } from '@astrojs/db/dist/runtime/virtual.js';

const $$Ingredientes = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Ingredientes;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
  }
  const url = new URL(Astro2.request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const statusFilter = url.searchParams.get("status") ?? "";
  const scopeFilter = url.searchParams.get("scope") ?? "";
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") ?? "";
  const ingredients = await db.select({
    id: Ingredient.id,
    name: Ingredient.name,
    slug: Ingredient.slug,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    isCommon: Ingredient.isCommon,
    active: Ingredient.active,
    sortOrder: Ingredient.sortOrder
  }).from(Ingredient).orderBy(Ingredient.sortOrder, Ingredient.name);
  const ingredientIds = ingredients.map((ingredient) => ingredient.id);
  const productLinks = ingredientIds.length ? await db.select({
    id: ProductIngredient.id,
    ingredientId: ProductIngredient.ingredientId,
    productId: ProductIngredient.productId,
    defaultIncluded: ProductIngredient.defaultIncluded,
    removable: ProductIngredient.removable
  }).from(ProductIngredient).where(inArray(ProductIngredient.ingredientId, ingredientIds)) : [];
  const categoryLinks = ingredientIds.length ? await db.select({
    id: CategoryIngredient.id,
    ingredientId: CategoryIngredient.ingredientId,
    categoryId: CategoryIngredient.categoryId,
    categoryName: Category.name,
    categorySlug: Category.slug
  }).from(CategoryIngredient).innerJoin(Category, eq(CategoryIngredient.categoryId, Category.id)).where(inArray(CategoryIngredient.ingredientId, ingredientIds)).orderBy(Category.name) : [];
  const productIds = [...new Set(productLinks.map((link) => link.productId))];
  const productRows = productIds.length ? await db.select({
    id: Product.id,
    name: Product.name,
    active: Product.active,
    categoryName: Category.name
  }).from(Product).innerJoin(Category, eq(Product.categoryId, Category.id)).where(inArray(Product.id, productIds)).orderBy(Product.name) : [];
  const productById = new Map(
    productRows.map((product) => [product.id, product])
  );
  const productCountByIngredient = /* @__PURE__ */ new Map();
  const defaultCountByIngredient = /* @__PURE__ */ new Map();
  const removableCountByIngredient = /* @__PURE__ */ new Map();
  const productPreviewByIngredient = /* @__PURE__ */ new Map();
  for (const link of productLinks) {
    productCountByIngredient.set(
      link.ingredientId,
      (productCountByIngredient.get(link.ingredientId) ?? 0) + 1
    );
    if (link.defaultIncluded) {
      defaultCountByIngredient.set(
        link.ingredientId,
        (defaultCountByIngredient.get(link.ingredientId) ?? 0) + 1
      );
    }
    if (link.defaultIncluded && link.removable) {
      removableCountByIngredient.set(
        link.ingredientId,
        (removableCountByIngredient.get(link.ingredientId) ?? 0) + 1
      );
    }
    const product = productById.get(link.productId);
    if (!product) continue;
    if (!productPreviewByIngredient.has(link.ingredientId)) {
      productPreviewByIngredient.set(link.ingredientId, []);
    }
    const preview = productPreviewByIngredient.get(link.ingredientId) ?? [];
    if (preview.some((item) => item.id === product.id)) continue;
    preview.push({
      id: product.id,
      name: product.name,
      categoryName: product.categoryName,
      active: product.active
    });
    productPreviewByIngredient.set(link.ingredientId, preview);
  }
  const categoryCountByIngredient = /* @__PURE__ */ new Map();
  const categoryPreviewByIngredient = /* @__PURE__ */ new Map();
  for (const link of categoryLinks) {
    categoryCountByIngredient.set(
      link.ingredientId,
      (categoryCountByIngredient.get(link.ingredientId) ?? 0) + 1
    );
    if (!categoryPreviewByIngredient.has(link.ingredientId)) {
      categoryPreviewByIngredient.set(link.ingredientId, []);
    }
    const preview = categoryPreviewByIngredient.get(link.ingredientId) ?? [];
    if (preview.some((item) => item.id === link.categoryId)) continue;
    preview.push({
      id: link.categoryId,
      name: link.categoryName,
      slug: link.categorySlug
    });
    categoryPreviewByIngredient.set(link.ingredientId, preview);
  }
  const items = ingredients.map((ingredient) => {
    const linkedProducts = productCountByIngredient.get(ingredient.id) ?? 0;
    const linkedCategories = categoryCountByIngredient.get(ingredient.id) ?? 0;
    const defaultIncludedIn = defaultCountByIngredient.get(ingredient.id) ?? 0;
    const removableIn = removableCountByIngredient.get(ingredient.id) ?? 0;
    const productPreview = (productPreviewByIngredient.get(ingredient.id) ?? []).slice(0, 4);
    const categoryPreview = (categoryPreviewByIngredient.get(ingredient.id) ?? []).slice(0, 4);
    const hasPriceDelta = Number(ingredient.addPriceDeltaCents ?? 0) > 0;
    const isOrphan = linkedProducts === 0 && linkedCategories === 0;
    return {
      ...ingredient,
      linkedProducts,
      linkedCategories,
      defaultIncludedIn,
      removableIn,
      productPreview,
      categoryPreview,
      hasPriceDelta,
      isOrphan,
      canDelete: isOrphan
    };
  });
  const filteredIngredients = items.filter((ingredient) => {
    if (statusFilter === "active" && !ingredient.active) return false;
    if (statusFilter === "inactive" && ingredient.active) return false;
    if (scopeFilter === "common" && !ingredient.isCommon) return false;
    if (scopeFilter === "priced" && !ingredient.hasPriceDelta) return false;
    if (scopeFilter === "linked" && ingredient.linkedProducts === 0 && ingredient.linkedCategories === 0)
      return false;
    if (scopeFilter === "orphan" && !ingredient.isOrphan) return false;
    if (!q) return true;
    const haystack = [
      ingredient.name,
      ingredient.slug,
      ...ingredient.categoryPreview.map((category) => category.name),
      ...ingredient.productPreview.map((product) => product.name)
    ].join(" ").toLowerCase();
    return haystack.includes(q);
  });
  const totalIngredients = items.length;
  const activeIngredients = items.filter(
    (ingredient) => ingredient.active
  ).length;
  const commonIngredients = items.filter(
    (ingredient) => ingredient.isCommon
  ).length;
  const linkedIngredients = items.filter(
    (ingredient) => ingredient.linkedProducts > 0 || ingredient.linkedCategories > 0
  ).length;
  const pricedIngredients = items.filter(
    (ingredient) => ingredient.hasPriceDelta
  ).length;
  const orphanIngredients = items.filter(
    (ingredient) => ingredient.isOrphan
  ).length;
  const errorMessage = error === "missing-name" ? "El nombre es obligatorio." : error === "invalid-slug" ? "El slug no es válido." : error === "duplicate-slug" ? "Ya existe otro ingrediente con ese slug." : error === "invalid-price" ? "El precio extra debe ser un importe válido mayor o igual que cero." : error === "invalid-sort-order" ? "El orden debe ser un número válido mayor o igual que cero." : error === "invalid-ingredient" ? "El ingrediente indicado no es válido." : error === "not-found" ? "El ingrediente ya no existe." : error === "in-use-products" ? "No se puede borrar porque sigue enlazado a productos." : error === "in-use-categories" ? "No se puede borrar porque sigue enlazado a compatibilidades de categoría." : error === "invalid-intent" ? "Acción no válida." : "";
  const summaryCards = [
    {
      label: "Total",
      value: totalIngredients,
      note: "Ingredientes globales",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Activos",
      value: activeIngredients,
      note: "Disponibles en admin y catálogo",
      tone: "border-emerald-400/15 bg-emerald-400/8"
    },
    {
      label: "Comunes",
      value: commonIngredients,
      note: "Extras globales del configurador",
      tone: "border-cyan-400/15 bg-cyan-400/8"
    },
    {
      label: "Con precio",
      value: pricedIngredients,
      note: "Suman importe al añadir",
      tone: "border-violet-400/15 bg-violet-400/8"
    },
    {
      label: "En uso",
      value: linkedIngredients,
      note: "Productos o compatibilidades",
      tone: "border-amber-400/15 bg-amber-400/8"
    },
    {
      label: "Huérfanos",
      value: orphanIngredients,
      note: "Borrables sin impacto",
      tone: "border-rose-400/15 bg-rose-400/8"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Ingredientes · Admin · Arcadia", "heading": "Ingredientes globales", "description": "Catálogo real de ingredientes para configurables, extras y compatibilidades. Esta vista ahora prioriza lectura por bloques amplios para que se vea mejor qué es global, qué tiene precio y qué sigue realmente en uso.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver productos
</a> <a href="/admin/catalogo/compatibilidades" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Compatibilidades
</a> <a href="/admin/catalogo/alergenos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:border-amber-400/30 hover:bg-amber-400/15">
Alérgenos
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Ingredientes actualizados correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-6"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"> <aside class="space-y-6"> <section class="rounded-[32px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Nuevo ingrediente
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
Define un ingrediente global con nombre, slug, precio extra, orden y
          visibilidad operativa.
</p> <form method="post" action="/api/admin/ingredients" class="mt-7 grid gap-5"> <input type="hidden" name="intent" value="create"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="text" name="name" placeholder="Cebolla caramelizada" required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Slug
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="text" name="slug" placeholder="Se genera automáticamente si lo dejas vacío"> </label> <div class="grid gap-4 md:grid-cols-2"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Precio extra
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="number" name="addPriceDeltaEur" min="0" step="0.01" value="0.00" required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(ingredients.length, "value")} required> </label> </div> <label class="block rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400" type="checkbox" name="isCommon" checked> <div> <div class="text-sm font-semibold text-white">
Ingrediente común
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Aparece como extra global añadible en el configurador de
                  producto cuando el flujo lo permite.
</p> </div> </div> </label> <label class="block rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400" type="checkbox" name="active" checked> <div> <div class="text-sm font-semibold text-white">Activo</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible para productos, compatibilidades y configurador.
</p> </div> </div> </label> <button type="submit" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Crear ingrediente
</button> </form> </section> <section class="rounded-[32px] border border-white/10 bg-[#0b1220]/90 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Uso operativo real
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">Extras globales</div> <p class="mt-2 text-sm leading-6 text-slate-400">
El flag <code class="rounded-lg border border-white/10 bg-[#07101f] px-2 py-1 text-xs text-slate-200">isCommon</code> alimenta la lista de ingredientes añadibles en el configurador público.
</p> </article> <article class="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">
Compatibilidad por categoría
</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
Las compatibilidades limitan qué ingredientes se pueden asignar
              por defecto a productos de cada categoría desde admin.
</p> </article> <article class="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">
Borrado protegido
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Un ingrediente no se puede borrar mientras siga enlazado a
              productos o matrices de compatibilidad.
</p> </article> </div> </section> </aside> <section class="overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Gestión
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Catálogo global de ingredientes
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Filtros más limpios y una ficha amplia por ingrediente para leer
              precio, alcance, uso real y compatibilidades sin sensación de
              lista técnica comprimida.
</p> </div> <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300"> ${filteredIngredients.length} de ${totalIngredients} visibles
</div> </div> <form method="get" class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Buscar
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="search" name="q"${addAttribute(url.searchParams.get("q") ?? "", "value")} placeholder="Nombre, slug, categoría o producto"> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Estado
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" name="status"> <option value="">Todos</option> <option value="active"${addAttribute(statusFilter === "active", "selected")}>Activos</option> <option value="inactive"${addAttribute(statusFilter === "inactive", "selected")}>Inactivos</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Alcance
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" name="scope"> <option value="">Todos</option> <option value="common"${addAttribute(scopeFilter === "common", "selected")}>Comunes</option> <option value="priced"${addAttribute(scopeFilter === "priced", "selected")}>Con precio</option> <option value="linked"${addAttribute(scopeFilter === "linked", "selected")}>En uso</option> <option value="orphan"${addAttribute(scopeFilter === "orphan", "selected")}>Huérfanos</option> </select> </label> <div class="flex items-end gap-3"> <button type="submit" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Filtrar
</button> <a href="/admin/catalogo/ingredientes" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Limpiar
</a> </div> </form> </div> ${filteredIngredients.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#091121] p-8"> <div class="text-lg font-semibold text-white">
No hay ingredientes para ese filtro
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Ajusta la búsqueda o crea un ingrediente nuevo desde el
                formulario lateral.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${filteredIngredients.map((ingredient) => renderTemplate`<section class="rounded-[28px] border border-white/10 bg-[#091121]/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <h3 class="text-xl font-semibold tracking-[-0.03em] text-white"> ${ingredient.name} </h3> <code class="rounded-xl border border-white/10 bg-[#07101f] px-3 py-1.5 text-xs text-slate-300"> ${ingredient.slug} </code> ${ingredient.hasPriceDelta ? renderTemplate`<span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
+${money(ingredient.addPriceDeltaCents)} </span>` : renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
Sin coste extra
</span>`} </div> <div class="mt-3 flex flex-wrap gap-2.5"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
    ingredient.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
  ], "class:list")}> ${ingredient.active ? "Activo" : "Inactivo"} </span> ${ingredient.isCommon ? renderTemplate`<span class="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
Común
</span>` : null} <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300"> ${ingredient.linkedProducts} producto
${ingredient.linkedProducts === 1 ? "" : "s"} </span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300"> ${ingredient.linkedCategories} categor
${ingredient.linkedCategories === 1 ? "ía" : "ías"} </span> ${ingredient.defaultIncludedIn > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300"> ${ingredient.defaultIncludedIn} por defecto
</span>` : null} ${ingredient.removableIn > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-sky-300"> ${ingredient.removableIn} removible
${ingredient.removableIn === 1 ? "" : "s"} </span>` : null} </div> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-right"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Orden global
</div> <div class="mt-2 text-lg font-semibold text-white">
#${ingredient.sortOrder} </div> </div> </div> <div class="mt-6 grid gap-4 lg:grid-cols-2"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Productos enlazados
</div> ${ingredient.productPreview.length > 0 ? renderTemplate`<div class="mt-3 flex flex-wrap gap-2"> ${ingredient.productPreview.map((product) => renderTemplate`<a${addAttribute(`/admin/catalogo/productos/${product.id}#ingredientes`, "href")}${addAttribute([
    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
    product.active ? "border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/15 hover:bg-white/[0.06]" : "border-rose-400/20 bg-rose-400/10 text-rose-200 hover:border-rose-400/30 hover:bg-rose-400/15"
  ], "class:list")}> ${product.name} <span class="ml-1 text-slate-400">
· ${product.categoryName} </span> </a>`)} </div>` : renderTemplate`<p class="mt-3 text-sm leading-6 text-slate-400">
No está enlazado directamente a ningún producto.
</p>`} </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-center justify-between gap-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Compatibilidades
</div> <a href="/admin/catalogo/compatibilidades" class="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300 transition hover:text-cyan-200">
Abrir matriz
</a> </div> ${ingredient.categoryPreview.length > 0 ? renderTemplate`<div class="mt-3 flex flex-wrap gap-2"> ${ingredient.categoryPreview.map((category) => renderTemplate`<a${addAttribute(`/admin/catalogo/compatibilidades?categoryId=${category.id}`, "href")} class="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/15"> ${category.name} </a>`)} </div>` : renderTemplate`<p class="mt-3 text-sm leading-6 text-slate-400">
Sin restricciones de categoría registradas.
</p>`} </section> </div> <form method="post" action="/api/admin/ingredients" class="mt-6 grid gap-5"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="ingredientId"${addAttribute(ingredient.id, "value")}> <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px_180px_140px]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="text" name="name"${addAttribute(ingredient.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Slug
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="text" name="slug"${addAttribute(ingredient.slug, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Precio extra
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="number" name="addPriceDeltaEur" min="0" step="0.01"${addAttribute((ingredient.addPriceDeltaCents / 100).toFixed(2), "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(ingredient.sortOrder, "value")} required> </label> </div> <div class="flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <div class="flex flex-wrap gap-6"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400" type="checkbox" name="isCommon"${addAttribute(ingredient.isCommon, "checked")}>
Ingrediente común
</label> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-cyan-400" type="checkbox" name="active"${addAttribute(ingredient.active, "checked")}>
Activo
</label> </div> <button type="submit" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-100 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Guardar ingrediente
</button> </div> </form> <div class="mt-5 flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <div class="text-sm leading-6 text-slate-500"> ${ingredient.canDelete ? "Se puede borrar porque no tiene productos ni compatibilidades asociados." : "No se puede borrar mientras siga enlazado a productos o matrices de compatibilidad."} </div> <form method="post" action="/api/admin/ingredients"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="ingredientId"${addAttribute(ingredient.id, "value")}> <button type="submit"${addAttribute(!ingredient.canDelete, "disabled")}${addAttribute([
    "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
    ingredient.canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500"
  ], "class:list")}>
Borrar ingrediente
</button> </form> </div> </section>`)} </div>`} </section> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/ingredientes.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/ingredientes.astro";
const $$url = "/admin/catalogo/ingredientes";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Ingredientes,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
