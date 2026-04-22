import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, C as Category, e as Product, i as ProductVariant, h as ProductModifierGroup, f as ProductIngredient, b as Allergen, P as ProductAllergen } from './_astro_db_Bcz5lWRF.mjs';
import { eq, inArray } from '@astrojs/db/dist/runtime/virtual.js';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
  }
  const url = new URL(Astro2.request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const categoryFilter = url.searchParams.get("category") ?? "";
  const statusFilter = url.searchParams.get("status") ?? "";
  const channelFilter = url.searchParams.get("channel") ?? "";
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") ?? "";
  const categories = await db.select({
    id: Category.id,
    name: Category.name,
    slug: Category.slug,
    sortOrder: Category.sortOrder,
    active: Category.active,
    imageUrl: Category.imageUrl
  }).from(Category).orderBy(Category.sortOrder);
  const rows = await db.select({
    id: Product.id,
    categoryId: Product.categoryId,
    name: Product.name,
    slug: Product.slug,
    description: Product.description,
    details: Product.details,
    imageUrl: Product.imageUrl,
    priceCents: Product.priceCents,
    deliveryEnabled: Product.deliveryEnabled,
    pickupEnabled: Product.pickupEnabled,
    dineInEnabled: Product.dineInEnabled,
    active: Product.active,
    updatedAt: Product.updatedAt,
    categoryName: Category.name,
    categorySlug: Category.slug
  }).from(Product).innerJoin(Category, eq(Product.categoryId, Category.id)).orderBy(Product.id);
  const productsSorted = [...rows].sort((a, b) => {
    if (a.categoryName !== b.categoryName) {
      return a.categoryName.localeCompare(b.categoryName, "es");
    }
    return a.name.localeCompare(b.name, "es");
  });
  const productIds = productsSorted.map((row) => row.id);
  const variantRows = productIds.length ? await db.select({
    productId: ProductVariant.productId,
    id: ProductVariant.id,
    active: ProductVariant.active
  }).from(ProductVariant).where(inArray(ProductVariant.productId, productIds)) : [];
  const modifierGroupRows = productIds.length ? await db.select({
    productId: ProductModifierGroup.productId,
    id: ProductModifierGroup.id
  }).from(ProductModifierGroup).where(inArray(ProductModifierGroup.productId, productIds)) : [];
  const removableIngredientRows = productIds.length ? await db.select({
    productId: ProductIngredient.productId,
    id: ProductIngredient.id,
    defaultIncluded: ProductIngredient.defaultIncluded,
    removable: ProductIngredient.removable
  }).from(ProductIngredient).where(inArray(ProductIngredient.productId, productIds)) : [];
  const allergenRows = productIds.length ? await db.select({
    productId: ProductAllergen.productId,
    allergenId: Allergen.id,
    allergenName: Allergen.name,
    allergenSlug: Allergen.slug,
    allergenIconUrl: Allergen.iconUrl,
    allergenSortOrder: Allergen.sortOrder
  }).from(ProductAllergen).innerJoin(Allergen, eq(ProductAllergen.allergenId, Allergen.id)).where(inArray(ProductAllergen.productId, productIds)).orderBy(ProductAllergen.productId, Allergen.sortOrder, Allergen.name) : [];
  const activeVariantCountByProduct = /* @__PURE__ */ new Map();
  for (const row of variantRows) {
    if (!row.active) continue;
    activeVariantCountByProduct.set(
      row.productId,
      (activeVariantCountByProduct.get(row.productId) ?? 0) + 1
    );
  }
  const modifierGroupCountByProduct = /* @__PURE__ */ new Map();
  for (const row of modifierGroupRows) {
    modifierGroupCountByProduct.set(
      row.productId,
      (modifierGroupCountByProduct.get(row.productId) ?? 0) + 1
    );
  }
  const removableCountByProduct = /* @__PURE__ */ new Map();
  for (const row of removableIngredientRows) {
    if (!row.defaultIncluded || !row.removable) continue;
    removableCountByProduct.set(
      row.productId,
      (removableCountByProduct.get(row.productId) ?? 0) + 1
    );
  }
  const allergenPreviewByProduct = /* @__PURE__ */ new Map();
  for (const row of allergenRows) {
    if (!allergenPreviewByProduct.has(row.productId)) {
      allergenPreviewByProduct.set(row.productId, []);
    }
    allergenPreviewByProduct.get(row.productId)?.push({
      id: row.allergenId,
      name: row.allergenName,
      slug: row.allergenSlug,
      iconUrl: row.allergenIconUrl ? String(row.allergenIconUrl).trim() || null : null
    });
  }
  const products = productsSorted.map((row) => {
    const variantCount = activeVariantCountByProduct.get(row.id) ?? 0;
    const modifierGroupCount = modifierGroupCountByProduct.get(row.id) ?? 0;
    const removableCount = removableCountByProduct.get(row.id) ?? 0;
    const allergenPreview = (allergenPreviewByProduct.get(row.id) ?? []).slice(
      0,
      4
    );
    return {
      ...row,
      variantCount,
      modifierGroupCount,
      removableCount,
      allergenPreview,
      isConfigurable: variantCount > 0 || modifierGroupCount > 0 || removableCount > 0
    };
  });
  const filteredProducts = products.filter((product) => {
    if (categoryFilter && String(product.categoryId) !== categoryFilter)
      return false;
    if (statusFilter === "active" && !product.active) return false;
    if (statusFilter === "inactive" && product.active) return false;
    if (statusFilter === "configurable" && !product.isConfigurable) return false;
    if (channelFilter === "delivery" && !product.deliveryEnabled) return false;
    if (channelFilter === "pickup" && !product.pickupEnabled) return false;
    if (channelFilter === "both" && (!product.deliveryEnabled || !product.pickupEnabled))
      return false;
    if (channelFilter === "restricted" && product.deliveryEnabled && product.pickupEnabled)
      return false;
    if (q) {
      const haystack = [
        product.name,
        product.slug,
        product.categoryName,
        product.description ?? "",
        product.details ?? ""
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
  const totalProducts = products.length;
  const activeProducts = products.filter((product) => product.active).length;
  const configurableProducts = products.filter(
    (product) => product.isConfigurable
  ).length;
  const imageProducts = products.filter(
    (product) => Boolean(product.imageUrl)
  ).length;
  const restrictedProducts = products.filter(
    (product) => !(product.deliveryEnabled && product.pickupEnabled && product.dineInEnabled)
  ).length;
  const hasFilters = Boolean(
    q || categoryFilter || statusFilter || channelFilter
  );
  const redirectTo = `${Astro2.url.pathname}${Astro2.url.search}`;
  const statusMessage = error === "invalid-id" ? "ID de producto inválido." : error === "not-found" ? "El producto ya no existe." : "";
  const summaryCards = [
    {
      label: "Total",
      value: totalProducts,
      note: "Todo el catálogo cargado",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Activos",
      value: activeProducts,
      note: "Disponibles para pública",
      tone: "border-emerald-400/15 bg-emerald-400/8"
    },
    {
      label: "Configurables",
      value: configurableProducts,
      note: "Variantes, grupos o removibles",
      tone: "border-violet-400/15 bg-violet-400/8"
    },
    {
      label: "Con imagen",
      value: imageProducts,
      note: "Preview visual disponible",
      tone: "border-cyan-400/15 bg-cyan-400/8"
    },
    {
      label: "Restringidos",
      value: restrictedProducts,
      note: "No están en todos los canales",
      tone: "border-amber-400/15 bg-amber-400/8"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Productos · Admin · Arcadia", "heading": "Productos", "description": "Listado real del catálogo con acceso directo a ingredientes, grupos y alérgenos. Esta vista ahora respira más y deja de apretar toda la información dentro de una tabla densa.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos/nuevo" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-100 transition hover:border-sky-400/25 hover:bg-sky-400/15">
Nuevo producto
</a> <a href="/admin/catalogo/ingredientes" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ingredientes
</a> <a href="/admin/catalogo/modificadores" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Modificadores
</a> <a href="/admin/catalogo/alergenos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Alérgenos
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/15 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-100">
Producto actualizado correctamente.
</section>` : null}${statusMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/15 bg-rose-400/10 px-5 py-4 text-sm text-rose-100"> ${statusMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-5"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Filtros
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Buscar y segmentar catálogo
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
La búsqueda y la segmentación pasan a un bloque más abierto, con
            menos densidad horizontal y mejor lectura de estado.
</p> </div> <div class="flex items-center gap-3"> ${hasFilters ? renderTemplate`<span class="inline-flex items-center rounded-full border border-sky-400/15 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-200">
filtros activos
</span>` : null} <a href="/admin/catalogo/productos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Limpiar
</a> </div> </div> </div> <form class="grid gap-4 px-6 py-6 lg:px-8 lg:py-8 2xl:grid-cols-[minmax(0,1.4fr)_260px_220px_220px_auto]" method="get"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Buscar
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#091121] px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/30 focus:outline-none" name="q" placeholder="Nombre, slug, categoría o texto"${addAttribute(q, "value")}> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Categoría
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#091121] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" name="category"> <option value="">Todas</option> ${categories.map((category) => renderTemplate`<option${addAttribute(String(category.id), "value")}${addAttribute(String(category.id) === categoryFilter, "selected")}> ${category.name} </option>`)} </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Estado
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#091121] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" name="status"> <option value=""${addAttribute(statusFilter === "", "selected")}>Todos</option> <option value="active"${addAttribute(statusFilter === "active", "selected")}>Activos</option> <option value="inactive"${addAttribute(statusFilter === "inactive", "selected")}>Inactivos</option> <option value="configurable"${addAttribute(statusFilter === "configurable", "selected")}>Configurables</option> </select> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Canal
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#091121] px-4 py-3 text-sm text-white focus:border-sky-400/30 focus:outline-none" name="channel"> <option value=""${addAttribute(channelFilter === "", "selected")}>Todos</option> <option value="delivery"${addAttribute(channelFilter === "delivery", "selected")}>Delivery</option> <option value="pickup"${addAttribute(channelFilter === "pickup", "selected")}>Pickup</option> <option value="both"${addAttribute(channelFilter === "both", "selected")}>Ambos</option> <option value="restricted"${addAttribute(channelFilter === "restricted", "selected")}>Canal restringido</option> </select> </label> <div class="flex items-end"> <button class="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10 px-5 py-3 text-sm font-semibold text-sky-100 transition hover:border-sky-400/25 hover:bg-sky-400/15" type="submit">
Filtrar
</button> </div> </form> </section> <section class="mt-6 overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Resultado
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]"> ${filteredProducts.length} producto${filteredProducts.length === 1 ? "" : "s"} </h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Cada producto se muestra como un bloque amplio con imagen, canales,
            configuración, alérgenos y acciones. Menos sensación de hoja de
            cálculo, más lectura real de catálogo.
</p> </div> <div class="inline-flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300">
Catálogo limpio + accesos globales
</div> </div> </div> ${filteredProducts.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#091121] p-8"> <div class="text-lg font-semibold text-white">
No hay productos con esos filtros
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Ajusta la búsqueda o revisa la categoría y los filtros de canal.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6 lg:px-8 lg:py-8"> ${filteredProducts.map((product) => renderTemplate`<article class="rounded-[28px] border border-white/10 bg-[#091121]/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 xl:flex-row xl:items-start xl:justify-between"> <div class="min-w-0 flex-1"> <div class="flex items-start gap-4"> ${product.imageUrl ? renderTemplate`<img${addAttribute(product.imageUrl, "src")}${addAttribute(product.name, "alt")} class="h-18 w-18 rounded-[22px] object-cover ring-1 ring-white/10">` : renderTemplate`<div class="flex h-18 w-18 items-center justify-center rounded-[22px] border border-white/10 bg-white/[0.03] text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Sin imagen
</div>`} <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <h3 class="text-xl font-semibold tracking-[-0.03em] text-white"> ${product.name} </h3> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
    product.active ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-200" : "border-rose-400/15 bg-rose-400/10 text-rose-200"
  ], "class:list")}> ${product.active ? "Activo" : "Inactivo"} </span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300"> ${product.categoryName} </span> </div> <div class="mt-2 text-sm text-slate-500"> ${product.slug} </div> ${product.description ? renderTemplate`<p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400"> ${product.description} </p>` : null} </div> </div> </div> <div class="xl:min-w-[180px] xl:text-right"> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Precio base
</div> <div class="mt-2 text-3xl font-semibold tracking-[-0.04em] text-white"> ${money(product.priceCents)} </div> </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-4"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Categoría y texto
</div> <div class="mt-3 text-base font-semibold text-white"> ${product.categoryName} </div> <div class="mt-1 text-sm text-slate-500"> ${product.categorySlug} </div> ${product.details ? renderTemplate`<p class="mt-3 text-sm leading-6 text-slate-400"> ${product.details} </p>` : renderTemplate`<p class="mt-3 text-sm leading-6 text-slate-500">
Sin detalles adicionales.
</p>`} </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Canales
</div> <div class="mt-3 flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
    product.deliveryEnabled ? "border-cyan-400/15 bg-cyan-400/10 text-cyan-200" : "border-white/10 bg-white/[0.04] text-slate-500"
  ], "class:list")}>
Delivery
</span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
    product.pickupEnabled ? "border-indigo-400/15 bg-indigo-400/10 text-indigo-200" : "border-white/10 bg-white/[0.04] text-slate-500"
  ], "class:list")}>
Pickup
</span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
    product.dineInEnabled ? "border-violet-400/15 bg-violet-400/10 text-violet-200" : "border-white/10 bg-white/[0.04] text-slate-500"
  ], "class:list")}>
Sala
</span> </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Configuración
</div> <div class="mt-3 flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
    product.isConfigurable ? "border-sky-400/15 bg-sky-400/10 text-sky-200" : "border-white/10 bg-white/[0.04] text-slate-300"
  ], "class:list")}> ${product.isConfigurable ? "Configurable" : "Simple"} </span> ${product.variantCount > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
Variantes ${product.variantCount} </span>` : null} ${product.modifierGroupCount > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
Grupos ${product.modifierGroupCount} </span>` : null} ${product.removableCount > 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-300">
Removibles ${product.removableCount} </span>` : null} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Alérgenos
</div> ${product.allergenPreview.length > 0 ? renderTemplate`<div class="mt-3 flex flex-wrap items-center gap-2"> ${product.allergenPreview.map((allergen) => renderTemplate`<span class="inline-flex items-center gap-2 rounded-full border border-amber-400/15 bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-semibold text-amber-100"> ${allergen.iconUrl ? renderTemplate`<img${addAttribute(allergen.iconUrl, "src")}${addAttribute(allergen.name, "alt")} class="h-5 w-5 rounded-full object-cover ring-1 ring-[#091121]" loading="lazy">` : renderTemplate`<span class="flex h-5 w-5 items-center justify-center rounded-full border border-amber-300/20 bg-amber-300/15 text-[10px] font-bold uppercase text-amber-100"> ${allergen.name.slice(0, 1)} </span>`} <span>${allergen.name}</span> </span>`)} </div>` : renderTemplate`<p class="mt-3 text-sm leading-6 text-slate-500">
Sin preview de alérgenos.
</p>`} </section> </div> <div class="mt-5 flex flex-col gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:items-center sm:justify-between"> <div class="text-sm text-slate-500">ID ${product.id}</div> <div class="flex flex-wrap gap-3"> <form method="post"${addAttribute(`/api/admin/products/${product.id}`, "action")}> <input type="hidden" name="intent" value="toggle-active"> <input type="hidden" name="nextActive"${addAttribute(product.active ? "false" : "true", "value")}> <input type="hidden" name="redirectTo"${addAttribute(redirectTo, "value")}> <button${addAttribute([
    "inline-flex min-h-10 items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-semibold transition",
    product.active ? "border-rose-400/15 bg-rose-400/10 text-rose-200 hover:border-rose-400/25 hover:bg-rose-400/15" : "border-emerald-400/15 bg-emerald-400/10 text-emerald-200 hover:border-emerald-400/25 hover:bg-emerald-400/15"
  ], "class:list")} type="submit"> ${product.active ? "Desactivar" : "Activar"} </button> </form> <a${addAttribute(`/admin/catalogo/productos/${product.id}`, "href")} class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Editar producto
</a> </div> </div> </article>`)} </div>`} </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/productos/index.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/productos/index.astro";
const $$url = "/admin/catalogo/productos";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
