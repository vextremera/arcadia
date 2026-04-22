import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, C as Category, I as Ingredient, c as CategoryIngredient, e as Product, f as ProductIngredient } from './_astro_db_Bcz5lWRF.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';

const $$Compatibilidades = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Compatibilidades;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
  }
  const url = new URL(Astro2.request.url);
  const selectedCategoryId = Number(url.searchParams.get("categoryId") ?? "");
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") ?? "";
  const categories = await db.select({
    id: Category.id,
    name: Category.name,
    slug: Category.slug,
    active: Category.active,
    sortOrder: Category.sortOrder
  }).from(Category).orderBy(Category.sortOrder, Category.name);
  const sortedCategories = [...categories].sort((a, b) => {
    if (Number.isFinite(selectedCategoryId)) {
      if (a.id === selectedCategoryId && b.id !== selectedCategoryId)
        return -1;
      if (b.id === selectedCategoryId && a.id !== selectedCategoryId)
        return 1;
    }
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "es");
  });
  const ingredients = await db.select({
    id: Ingredient.id,
    name: Ingredient.name,
    slug: Ingredient.slug,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    isCommon: Ingredient.isCommon,
    active: Ingredient.active,
    sortOrder: Ingredient.sortOrder
  }).from(Ingredient).orderBy(Ingredient.sortOrder, Ingredient.name);
  const categoryIds = sortedCategories.map((category) => category.id);
  const compatibilityLinks = categoryIds.length ? await db.select({
    id: CategoryIngredient.id,
    categoryId: CategoryIngredient.categoryId,
    ingredientId: CategoryIngredient.ingredientId
  }).from(CategoryIngredient).where(inArray(CategoryIngredient.categoryId, categoryIds)) : [];
  const products = categoryIds.length ? await db.select({
    id: Product.id,
    categoryId: Product.categoryId,
    name: Product.name,
    active: Product.active
  }).from(Product).where(inArray(Product.categoryId, categoryIds)) : [];
  const productIds = products.map((product) => product.id);
  const productIngredients = productIds.length ? await db.select({
    id: ProductIngredient.id,
    productId: ProductIngredient.productId,
    ingredientId: ProductIngredient.ingredientId
  }).from(ProductIngredient).where(inArray(ProductIngredient.productId, productIds)) : [];
  const ingredientById = new Map(
    ingredients.map((ingredient) => [ingredient.id, ingredient])
  );
  const productById = new Map(products.map((product) => [product.id, product]));
  const compatibilityIdsByCategory = /* @__PURE__ */ new Map();
  const compatibilityLinksByCategory = /* @__PURE__ */ new Map();
  for (const link of compatibilityLinks) {
    if (!compatibilityIdsByCategory.has(link.categoryId)) {
      compatibilityIdsByCategory.set(link.categoryId, /* @__PURE__ */ new Set());
    }
    compatibilityIdsByCategory.get(link.categoryId)?.add(link.ingredientId);
    if (!compatibilityLinksByCategory.has(link.categoryId)) {
      compatibilityLinksByCategory.set(link.categoryId, []);
    }
    compatibilityLinksByCategory.get(link.categoryId)?.push(link);
  }
  const productCountByCategory = /* @__PURE__ */ new Map();
  for (const product of products) {
    productCountByCategory.set(
      product.categoryId,
      (productCountByCategory.get(product.categoryId) ?? 0) + 1
    );
  }
  const usageByCategoryIngredient = /* @__PURE__ */ new Map();
  for (const row of productIngredients) {
    const product = productById.get(row.productId);
    if (!product) continue;
    const key = `${product.categoryId}:${row.ingredientId}`;
    usageByCategoryIngredient.set(
      key,
      (usageByCategoryIngredient.get(key) ?? 0) + 1
    );
  }
  const driftsByCategory = /* @__PURE__ */ new Map();
  for (const row of productIngredients) {
    const product = productById.get(row.productId);
    const ingredient = ingredientById.get(row.ingredientId);
    if (!product || !ingredient) continue;
    const whitelist = compatibilityIdsByCategory.get(product.categoryId);
    if (!whitelist || whitelist.size === 0) continue;
    if (whitelist.has(row.ingredientId)) continue;
    if (!driftsByCategory.has(product.categoryId)) {
      driftsByCategory.set(product.categoryId, []);
    }
    driftsByCategory.get(product.categoryId)?.push({
      productId: product.id,
      productName: product.name,
      ingredientId: ingredient.id,
      ingredientName: ingredient.name
    });
  }
  const ingredientUsageTotal = /* @__PURE__ */ new Map();
  for (const row of productIngredients) {
    ingredientUsageTotal.set(
      row.ingredientId,
      (ingredientUsageTotal.get(row.ingredientId) ?? 0) + 1
    );
  }
  const totalCategories = sortedCategories.length;
  const categoriesWithMatrix = sortedCategories.filter(
    (category) => (compatibilityIdsByCategory.get(category.id)?.size ?? 0) > 0
  ).length;
  const totalLinks = compatibilityLinks.length;
  const totalDrifts = [...driftsByCategory.values()].reduce(
    (sum, items) => sum + items.length,
    0
  );
  const orphanIngredients = ingredients.filter(
    (ingredient) => (ingredientUsageTotal.get(ingredient.id) ?? 0) === 0 && !compatibilityLinks.some((link) => link.ingredientId === ingredient.id)
  ).length;
  const errorMessage = error === "invalid-category" ? "La categoría indicada no es válida." : error === "invalid-ingredient" ? "El ingrediente indicado no es válido." : error === "invalid-link" ? "La compatibilidad indicada no es válida." : error === "not-found" ? "La compatibilidad ya no existe." : error === "duplicate-link" ? "Esa compatibilidad ya existe." : error === "invalid-intent" ? "Acción no válida." : "";
  const summaryCards = [
    {
      label: "Categorías",
      value: totalCategories,
      note: "Base total del catálogo",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Con matriz",
      value: categoriesWithMatrix,
      note: "Ya usan whitelist real",
      tone: "border-cyan-400/15 bg-cyan-400/8"
    },
    {
      label: "Links",
      value: totalLinks,
      note: "Relaciones categoría ↔ ingrediente",
      tone: "border-violet-400/15 bg-violet-400/8"
    },
    {
      label: "Desvíos",
      value: totalDrifts,
      note: "Uso fuera de matriz",
      tone: "border-rose-400/15 bg-rose-400/8"
    },
    {
      label: "Huérfanos",
      value: orphanIngredients,
      note: "Sin uso ni whitelist",
      tone: "border-amber-400/15 bg-amber-400/8"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Compatibilidades · Admin · Arcadia", "heading": "Compatibilidad categoría ↔ ingrediente", "description": "Matriz real de whitelist por categoría. Esta pantalla ahora deja mucho más claro qué categorías ya están cerradas, cuáles siguen abiertas y dónde existen desvíos relacionales que conviene limpiar.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver productos
</a> <a href="/admin/catalogo/ingredientes" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Ver ingredientes
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Compatibilidades actualizadas correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-5"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400"> ${card.note} </p> </article>`)} </section> <section class="mt-6 rounded-[32px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Cómo funciona la matriz
</h2> <div class="mt-6 grid gap-4 xl:grid-cols-3"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-5"> <div class="text-sm font-semibold text-white">Sin matriz</div> <p class="mt-3 text-sm leading-7 text-slate-400">
Si una categoría no tiene compatibilidades registradas, sus
                    productos pueden enlazar cualquier ingrediente activo.
</p> </article> <article class="rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5"> <div class="text-sm font-semibold text-cyan-200">
Con matriz
</div> <p class="mt-3 text-sm leading-7 text-cyan-100/80">
En cuanto una categoría tiene al menos una compatibilidad,
                    el editor de producto pasa a usar esa whitelist como límite
                    real.
</p> </article> <article class="rounded-[24px] border border-rose-400/20 bg-rose-400/10 p-5"> <div class="text-sm font-semibold text-rose-200">Desvíos</div> <p class="mt-3 text-sm leading-7 text-rose-100/80">
Si un producto mantiene ingredientes fuera de la whitelist
                    actual, aquí aparece como incidencia relacional para
                    corregirlo.
</p> </article> </div> </section> <section class="mt-6 space-y-6"> ${sortedCategories.map((category) => {
    const categoryLinkRows = [
      ...compatibilityLinksByCategory.get(category.id) ?? []
    ].sort((a, b) => {
      const ingredientA = ingredientById.get(a.ingredientId);
      const ingredientB = ingredientById.get(b.ingredientId);
      if (!ingredientA || !ingredientB) return 0;
      if (ingredientA.sortOrder !== ingredientB.sortOrder) {
        return ingredientA.sortOrder - ingredientB.sortOrder;
      }
      return ingredientA.name.localeCompare(
        ingredientB.name,
        "es"
      );
    });
    const compatibleIngredients = [];
    for (const link of categoryLinkRows) {
      const ingredient = ingredientById.get(link.ingredientId);
      if (!ingredient) continue;
      compatibleIngredients.push({
        linkId: link.id,
        id: ingredient.id,
        name: ingredient.name,
        slug: ingredient.slug,
        addPriceDeltaCents: ingredient.addPriceDeltaCents,
        isCommon: ingredient.isCommon,
        active: ingredient.active,
        sortOrder: ingredient.sortOrder,
        usageCount: usageByCategoryIngredient.get(
          `${category.id}:${ingredient.id}`
        ) ?? 0
      });
    }
    const availableIngredients = ingredients.filter((ingredient) => ingredient.active).filter(
      (ingredient) => !categoryLinkRows.some(
        (link) => link.ingredientId === ingredient.id
      )
    ).sort((a, b) => {
      if (a.isCommon !== b.isCommon)
        return a.isCommon ? -1 : 1;
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name, "es");
    });
    const drifts = driftsByCategory.get(category.id) ?? [];
    const productCount = productCountByCategory.get(category.id) ?? 0;
    return renderTemplate`<section${addAttribute(`categoria-${category.id}`, "id")} class="overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Categoría
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white"> ${category.name} </h2> <div class="mt-2 text-sm text-slate-500"> ${category.slug} </div> </div> <div class="flex flex-wrap gap-2"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
      category.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${category.active ? "Activa" : "Inactiva"} </span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300"> ${compatibleIngredients.length} compat
</span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300"> ${productCount} producto
${productCount === 1 ? "" : "s"} </span> ${drifts.length > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-rose-400/20 bg-rose-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-300"> ${drifts.length} desvío
${drifts.length === 1 ? "" : "s"} </span>` : renderTemplate`<span class="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
Sin desvíos
</span>`} </div> </div> </div> <div class="grid gap-6 px-6 py-6 lg:px-8 lg:py-8 xl:grid-cols-[400px_minmax(0,1fr)]"> <aside class="space-y-6"> <section class="rounded-[28px] border border-cyan-400/20 bg-cyan-400/10 p-5"> <div class="text-sm font-semibold text-white">
Añadir compatibilidad
</div> <p class="mt-3 text-sm leading-7 text-cyan-100/80">
La whitelist de${" "} <strong class="text-white"> ${category.name} </strong>${" "}
define qué ingredientes se pueden
                                        asignar a sus productos desde el admin.
</p> <form method="post" action="/api/admin/category-ingredients" class="mt-5 grid gap-4"> <input type="hidden" name="intent" value="create"> <input type="hidden" name="categoryId"${addAttribute(category.id, "value")}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/compatibilidades?categoryId=${category.id}#categoria-${category.id}`, "value")}> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
Ingrediente
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-cyan-300/40 focus:outline-none" name="ingredientId" required> ${availableIngredients.length === 0 ? renderTemplate`<option value="">
No quedan ingredientes
                                                        activos disponibles
</option>` : availableIngredients.map(
      (ingredient) => renderTemplate`<option${addAttribute(
        ingredient.id,
        "value"
      )}> ${ingredient.name}${" "}
·${" "} ${ingredient.addPriceDeltaCents > 0 ? `+${money(ingredient.addPriceDeltaCents)}` : "sin extra"} </option>`
    )} </select> </label> <button type="submit"${addAttribute(
      availableIngredients.length === 0,
      "disabled"
    )} class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/15 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300/30 hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50">
Añadir compatibilidad
</button> </form> </section> ${drifts.length > 0 ? renderTemplate`<section class="rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-5"> <div class="text-sm font-semibold text-white">
Limpieza relacional
</div> <p class="mt-3 text-sm leading-7 text-rose-100/80">
Hay productos de${" "} <strong class="text-white"> ${category.name} </strong>${" "}
usando ingredientes fuera de la
                                            matriz actual.
</p> <div class="mt-5 space-y-3"> ${drifts.map((drift) => renderTemplate`<div class="rounded-[24px] border border-rose-300/15 bg-rose-300/10 p-4"> <div class="text-sm font-semibold text-white"> ${drift.productName} </div> <div class="mt-2 text-sm text-rose-100/80">
Ingrediente fuera de
                                                        matriz:${" "} ${drift.ingredientName} </div> <a${addAttribute(`/admin/catalogo/productos/${drift.productId}#ingredientes`, "href")} class="mt-4 inline-flex min-h-9 items-center justify-center rounded-2xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-xs font-semibold text-rose-100 transition hover:border-rose-300/30 hover:bg-rose-300/15">
Abrir producto
</a> </div>`)} </div> </section>` : renderTemplate`<section class="rounded-[28px] border border-emerald-400/20 bg-emerald-400/10 p-5"> <div class="text-sm font-semibold text-white">
Sin desvíos
</div> <p class="mt-3 text-sm leading-7 text-emerald-100/80">
Los productos actuales de esta
                                            categoría están alineados con la
                                            matriz.
</p> </section>`} </aside> <section class="rounded-[28px] border border-white/10 bg-[#091121]/80 p-5 lg:p-6"> <div class="flex flex-wrap items-end justify-between gap-4 border-b border-white/[0.08] pb-5"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Whitelist actual
</div> <h3 class="mt-2 text-xl font-semibold text-white">
Ingredientes compatibles
</h3> <p class="mt-3 text-sm leading-7 text-slate-400">
Ingredientes permitidos para
                                            productos de${" "} <strong class="text-slate-200"> ${category.name} </strong>
.
</p> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300"> ${compatibleIngredients.length}${" "}
ingrediente
${compatibleIngredients.length === 1 ? "" : "s"} </div> </div> <div class="mt-5 space-y-4"> ${compatibleIngredients.length === 0 ? renderTemplate`<div class="rounded-[26px] border border-white/10 bg-white/[0.03] p-6 text-sm leading-7 text-slate-400">
Esta categoría todavía no tiene
                                            matriz. Mientras siga así, sus
                                            productos podrán usar cualquier
                                            ingrediente activo.
</div>` : compatibleIngredients.map(
      (ingredient) => renderTemplate`<article class="rounded-[26px] border border-white/10 bg-white/[0.03] p-5"> <div class="flex flex-wrap items-start justify-between gap-4"> <div class="min-w-0 flex-1"> <div class="text-base font-semibold text-white"> ${ingredient.name} </div> <div class="mt-2"> <code class="rounded-xl border border-white/10 bg-[#07101f] px-3 py-1.5 text-xs text-slate-300"> ${ingredient.slug} </code> </div> </div> <div class="flex flex-wrap gap-2"> <span${addAttribute([
        "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
        ingredient.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
      ], "class:list")}> ${ingredient.active ? "Activo" : "Inactivo"} </span> ${ingredient.isCommon ? renderTemplate`<span class="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
Common
</span>` : null} <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
Uso${" "} ${ingredient.usageCount} </span> </div> </div> <div class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center border-t border-white/[0.08] pt-4"> <div class="text-sm leading-6 text-slate-400">
Extra global:${" "} <span class="font-semibold text-white"> ${money(
        ingredient.addPriceDeltaCents
      )} </span> </div> <form method="post" action="/api/admin/category-ingredients"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="categoryIngredientId"${addAttribute(
        ingredient.linkId,
        "value"
      )}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/compatibilidades?categoryId=${category.id}#categoria-${category.id}`, "value")}> <button type="submit" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15">
Quitar
                                                                compatibilidad
</button> </form> </div> </article>`
    )} </div> </section> </div> </section>`;
  })} </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/compatibilidades.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/compatibilidades.astro";
const $$url = "/admin/catalogo/compatibilidades";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Compatibilidades,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
