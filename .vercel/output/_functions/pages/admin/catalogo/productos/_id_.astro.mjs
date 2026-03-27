import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../../chunks/AdminLayout_Ccjf6LBM.mjs';
import { d as db, C as Category, c as Product, h as ProductVariant, I as Ingredient, e as ProductIngredient, b as CategoryIngredient, g as ProductModifierGroup, M as ModifierGroup, f as ModifierOption, a as Allergen, P as ProductAllergen } from '../../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq, inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../../renderers.mjs';

const $$Astro = createAstro();
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} \u20AC`;
  }
  function formatDate(value) {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Europe/Madrid"
    }).format(date);
  }
  const id = Number(Astro2.params.id);
  if (!Number.isFinite(id)) {
    return new Response("Producto no encontrado", { status: 404 });
  }
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") ?? "";
  const variantSaved = url.searchParams.get("variantSaved") === "1";
  const variantError = url.searchParams.get("variantError") ?? "";
  const ingredientSaved = url.searchParams.get("ingredientSaved") === "1";
  const ingredientError = url.searchParams.get("ingredientError") ?? "";
  const allergenSaved = url.searchParams.get("allergenSaved") === "1";
  const allergenError = url.searchParams.get("allergenError") ?? "";
  const modifierGroupSaved = url.searchParams.get("modifierGroupSaved") === "1";
  const modifierGroupError = url.searchParams.get("modifierGroupError") ?? "";
  const modifierOptionSaved = url.searchParams.get("modifierOptionSaved") === "1";
  const modifierOptionError = url.searchParams.get("modifierOptionError") ?? "";
  const [product] = await db.select({
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
    createdAt: Product.createdAt,
    updatedAt: Product.updatedAt,
    categoryName: Category.name,
    categorySlug: Category.slug
  }).from(Product).innerJoin(Category, eq(Product.categoryId, Category.id)).where(eq(Product.id, id)).limit(1);
  if (!product) {
    return new Response("Producto no encontrado", { status: 404 });
  }
  const categories = await db.select({
    id: Category.id,
    name: Category.name,
    active: Category.active,
    sortOrder: Category.sortOrder
  }).from(Category).orderBy(Category.sortOrder);
  const variants = await db.select({
    id: ProductVariant.id,
    name: ProductVariant.name,
    priceDeltaCents: ProductVariant.priceDeltaCents,
    sortOrder: ProductVariant.sortOrder,
    active: ProductVariant.active
  }).from(ProductVariant).where(eq(ProductVariant.productId, id)).orderBy(ProductVariant.sortOrder, ProductVariant.name);
  const ingredientRows = await db.select({
    id: ProductIngredient.id,
    ingredientId: ProductIngredient.ingredientId,
    defaultIncluded: ProductIngredient.defaultIncluded,
    removable: ProductIngredient.removable,
    sortOrder: ProductIngredient.sortOrder,
    name: Ingredient.name,
    slug: Ingredient.slug,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    active: Ingredient.active,
    isCommon: Ingredient.isCommon
  }).from(ProductIngredient).innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id)).where(eq(ProductIngredient.productId, id)).orderBy(ProductIngredient.sortOrder, Ingredient.name);
  const allIngredients = await db.select({
    id: Ingredient.id,
    name: Ingredient.name,
    slug: Ingredient.slug,
    addPriceDeltaCents: Ingredient.addPriceDeltaCents,
    isCommon: Ingredient.isCommon,
    active: Ingredient.active,
    sortOrder: Ingredient.sortOrder
  }).from(Ingredient).where(eq(Ingredient.active, true)).orderBy(Ingredient.sortOrder, Ingredient.name);
  const categoryIngredientRows = await db.select({
    id: CategoryIngredient.id,
    ingredientId: CategoryIngredient.ingredientId
  }).from(CategoryIngredient).where(eq(CategoryIngredient.categoryId, product.categoryId));
  const categoryCompatibleIngredientIds = new Set(
    categoryIngredientRows.map((row) => row.ingredientId)
  );
  const categoryCompatibilityEnabled = categoryIngredientRows.length > 0;
  const linkedIngredientIds = new Set(ingredientRows.map((row) => row.ingredientId));
  allIngredients.filter((ingredient) => {
    if (linkedIngredientIds.has(ingredient.id)) return false;
    if (!categoryCompatibilityEnabled) return true;
    return categoryCompatibleIngredientIds.has(ingredient.id);
  });
  allIngredients.filter((ingredient) => {
    if (linkedIngredientIds.has(ingredient.id)) return false;
    if (!categoryCompatibilityEnabled) return false;
    return !categoryCompatibleIngredientIds.has(ingredient.id);
  });
  ingredientRows.filter(
    (row) => categoryCompatibilityEnabled && !categoryCompatibleIngredientIds.has(row.ingredientId)
  );
  const productModifierGroupLinks = await db.select({
    id: ProductModifierGroup.id,
    groupId: ProductModifierGroup.groupId,
    sortOrder: ProductModifierGroup.sortOrder
  }).from(ProductModifierGroup).where(eq(ProductModifierGroup.productId, id)).orderBy(ProductModifierGroup.sortOrder, ProductModifierGroup.groupId);
  const linkedGroupIds = productModifierGroupLinks.map((row) => row.groupId);
  const allModifierGroups = await db.select({
    id: ModifierGroup.id,
    name: ModifierGroup.name,
    minSelect: ModifierGroup.minSelect,
    maxSelect: ModifierGroup.maxSelect,
    required: ModifierGroup.required,
    sortOrder: ModifierGroup.sortOrder,
    active: ModifierGroup.active
  }).from(ModifierGroup).orderBy(ModifierGroup.sortOrder, ModifierGroup.name);
  const availableModifierGroups = allModifierGroups.filter(
    (group) => group.active && !linkedGroupIds.includes(group.id)
  );
  const optionRowsForAllGroups = allModifierGroups.length ? await db.select({
    id: ModifierOption.id,
    groupId: ModifierOption.groupId,
    name: ModifierOption.name,
    priceDeltaCents: ModifierOption.priceDeltaCents,
    sortOrder: ModifierOption.sortOrder,
    active: ModifierOption.active
  }).from(ModifierOption).where(
    inArray(
      ModifierOption.groupId,
      allModifierGroups.map((group) => group.id)
    )
  ).orderBy(ModifierOption.sortOrder, ModifierOption.name) : [];
  const optionCountByGroup = /* @__PURE__ */ new Map();
  for (const option of optionRowsForAllGroups) {
    if (!option.active) continue;
    optionCountByGroup.set(
      option.groupId,
      (optionCountByGroup.get(option.groupId) ?? 0) + 1
    );
  }
  const linkedModifierGroups = productModifierGroupLinks.map((link) => {
    const group = allModifierGroups.find((item) => item.id === link.groupId);
    if (!group) return null;
    return {
      linkId: link.id,
      groupId: group.id,
      name: group.name,
      minSelect: group.minSelect,
      maxSelect: group.maxSelect,
      required: group.required,
      active: group.active,
      groupSortOrder: group.sortOrder,
      productSortOrder: link.sortOrder,
      optionCount: optionCountByGroup.get(group.id) ?? 0,
      options: optionRowsForAllGroups.filter((option) => option.groupId === group.id).sort((a, b) => a.sortOrder - b.sortOrder)
    };
  }).filter(Boolean).sort((a, b) => a.productSortOrder - b.productSortOrder);
  const allergenRows = await db.select({
    id: ProductAllergen.id,
    allergenId: ProductAllergen.allergenId,
    name: Allergen.name,
    slug: Allergen.slug,
    iconUrl: Allergen.iconUrl,
    sortOrder: Allergen.sortOrder,
    active: Allergen.active
  }).from(ProductAllergen).innerJoin(Allergen, eq(ProductAllergen.allergenId, Allergen.id)).where(eq(ProductAllergen.productId, id)).orderBy(Allergen.sortOrder, Allergen.name);
  const allAllergens = await db.select({
    id: Allergen.id,
    name: Allergen.name,
    slug: Allergen.slug,
    iconUrl: Allergen.iconUrl,
    sortOrder: Allergen.sortOrder,
    active: Allergen.active
  }).from(Allergen).where(eq(Allergen.active, true)).orderBy(Allergen.sortOrder, Allergen.name);
  const linkedAllergenIds = new Set(allergenRows.map((row) => row.allergenId));
  const availableAllergens = allAllergens.filter(
    (allergen) => !linkedAllergenIds.has(allergen.id)
  );
  const variantCount = variants.filter((variant) => variant.active).length;
  const modifierGroupCount = linkedModifierGroups.filter(
    (group) => group?.active
  ).length;
  ingredientRows.filter(
    (row) => row.defaultIncluded && row.removable
  ).length;
  allergenRows.filter((row) => row.active).length;
  const errorMessage = error === "missing-name" ? "El nombre es obligatorio." : error === "invalid-slug" ? "El slug no es v\xE1lido." : error === "invalid-category" ? "La categor\xEDa seleccionada no es v\xE1lida." : error === "invalid-price" ? "El precio no es v\xE1lido." : error === "duplicate-slug" ? "Ya existe otro producto con ese slug." : error === "image-upload-disabled" ? "La subida de im\xE1genes no est\xE1 configurada todav\xEDa en el entorno." : error === "invalid-image" ? "La imagen no es v\xE1lida. Solo se permiten JPG, PNG o WEBP." : error === "image-too-large" ? "La imagen supera el tama\xF1o m\xE1ximo permitido." : error === "image-upload-failed" ? "No se ha podido subir la imagen del producto." : "";
  const variantErrorMessage = variantError === "missing-name" ? "El nombre de la variante es obligatorio." : variantError === "invalid-price" ? "El precio de la variante no es v\xE1lido." : variantError === "invalid-variant" ? "La variante indicada no es v\xE1lida." : variantError === "not-found" ? "La variante no existe o no pertenece a este producto." : variantError === "invalid-intent" ? "Acci\xF3n de variante no v\xE1lida." : "";
  const ingredientErrorMessage = ingredientError === "invalid-ingredient" ? "El ingrediente seleccionado no es v\xE1lido." : ingredientError === "duplicate-link" ? "Ese ingrediente ya est\xE1 enlazado a este producto." : ingredientError === "invalid-link" ? "La relaci\xF3n de ingrediente no es v\xE1lida." : ingredientError === "not-found" ? "La relaci\xF3n de ingrediente no existe." : ingredientError === "not-compatible" ? "Ese ingrediente no est\xE1 permitido por la matriz de compatibilidad de la categor\xEDa actual." : ingredientError === "invalid-intent" ? "Acci\xF3n de ingrediente no v\xE1lida." : "";
  const allergenErrorMessage = allergenError === "invalid-allergen" ? "El al\xE9rgeno seleccionado no es v\xE1lido." : allergenError === "duplicate-link" ? "Ese al\xE9rgeno ya est\xE1 enlazado a este producto." : allergenError === "invalid-link" ? "La relaci\xF3n de al\xE9rgeno no es v\xE1lida." : allergenError === "not-found" ? "La relaci\xF3n de al\xE9rgeno no existe." : allergenError === "invalid-intent" ? "Acci\xF3n de al\xE9rgeno no v\xE1lida." : "";
  const modifierGroupErrorMessage = modifierGroupError === "invalid-group" ? "El grupo seleccionado no es v\xE1lido." : modifierGroupError === "duplicate-link" ? "Ese grupo ya est\xE1 enlazado a este producto." : modifierGroupError === "invalid-link" ? "La relaci\xF3n de grupo no es v\xE1lida." : modifierGroupError === "not-found" ? "La relaci\xF3n de grupo no existe." : modifierGroupError === "invalid-intent" ? "Acci\xF3n de grupo no v\xE1lida." : "";
  const modifierOptionErrorMessage = modifierOptionError === "missing-name" ? "El nombre de la opci\xF3n es obligatorio." : modifierOptionError === "invalid-price" ? "El precio de la opci\xF3n no es v\xE1lido." : modifierOptionError === "invalid-option" ? "La opci\xF3n indicada no es v\xE1lida." : modifierOptionError === "not-found" ? "La opci\xF3n no existe o no pertenece al grupo." : modifierOptionError === "invalid-intent" ? "Acci\xF3n de opci\xF3n no v\xE1lida." : "";
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": `${product.name} \xB7 Productos \xB7 Admin \xB7 Arcadia`, "heading": product.name, "description": "Edici\xF3n base del producto apoyada en el schema real del proyecto. Ya incluye CRUD de variantes, gesti\xF3n de ingredientes, al\xE9rgenos y modifier groups con sus opciones.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al listado
</a> <a${addAttribute(`/admin/catalogo/compatibilidades?categoryId=${product.categoryId}`, "href")} class="inline-flex items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Compatibilidad categoría
</a> <a${addAttribute(`/api/products/${product.id}`, "href")} target="_blank" rel="noreferrer" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver API pública
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Cambios guardados correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}${variantSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-sky-400/20 bg-sky-400/10 px-5 py-4 text-sm text-sky-200">
Variantes actualizadas correctamente.
</section>` : null}${variantErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${variantErrorMessage} </section>` : null}${ingredientSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm text-cyan-200">
Ingredientes actualizados correctamente.
</section>` : null}${ingredientErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${ingredientErrorMessage} </section>` : null}${allergenSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-200">
Alérgenos actualizados correctamente.
</section>` : null}${allergenErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${allergenErrorMessage} </section>` : null}${modifierGroupSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-violet-400/20 bg-violet-400/10 px-5 py-4 text-sm text-violet-200">
Modifier groups actualizados correctamente.
</section>` : null}${modifierGroupErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${modifierGroupErrorMessage} </section>` : null}${modifierOptionSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-5 py-4 text-sm text-fuchsia-200">
Opciones actualizadas correctamente.
</section>` : null}${modifierOptionErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${modifierOptionErrorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> <article class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Estado
</div> <div class="mt-3"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
    product.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
  ], "class:list")}> ${product.active ? "Activo" : "Inactivo"} </span> </div> <p class="mt-3 text-sm text-slate-400">Estado global del producto</p> </article> <article class="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200">
Variantes
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${variantCount} </div> <p class="mt-2 text-sm text-violet-100/80">Variantes activas</p> </article> <article class="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200">
Grupos
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${modifierGroupCount} </div> <p class="mt-2 text-sm text-sky-100/80">Modifier groups activos</p> </article> <article class="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200">
Alérgenos
</div> ${allergenRows.length > 0 ? renderTemplate`<div class="mt-3 flex flex-wrap gap-2"> ${allergenRows.slice(0, 6).map(
    (allergen) => allergen.iconUrl ? renderTemplate`<img${addAttribute(allergen.iconUrl, "src")}${addAttribute(allergen.name, "alt")}${addAttribute(allergen.name, "title")} class="h-9 w-9 rounded-2xl object-cover ring-1 ring-white/10" loading="lazy">` : renderTemplate`<div${addAttribute(allergen.name, "title")} class="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/15 text-[11px] font-bold uppercase text-amber-100"> ${allergen.name.slice(0, 1)} </div>`
  )} </div>` : renderTemplate`<div class="mt-3 text-sm font-semibold text-white">Sin alérgenos</div>`} <p class="mt-3 text-sm text-amber-100/80"> ${allergenRows.length > 0 ? "Representaci\xF3n visual real con iconos del cat\xE1logo de al\xE9rgenos." : "Este producto todav\xEDa no tiene al\xE9rgenos asociados."} </p> </article> </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"> <div class="space-y-6"> <form method="post"${addAttribute(`/api/admin/products/${product.id}`, "action")} enctype="multipart/form-data" class="rounded-3xl border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <input type="hidden" name="intent" value="save-base"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
Edición base
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Datos principales
</h2> </div> <div class="text-sm text-slate-400">
Actualizado: ${formatDate(product.updatedAt)} </div> </div> <div class="mt-6 grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]"> <div> ${product.imageUrl ? renderTemplate`<img${addAttribute(product.imageUrl, "src")}${addAttribute(product.name, "alt")} class="h-56 w-full rounded-3xl object-cover ring-1 ring-white/10">` : renderTemplate`<div class="flex h-56 w-full items-center justify-center rounded-3xl border border-white/10 bg-slate-950/50 text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">
Sin imagen
</div>`} </div> <div class="grid gap-4"> <div class="grid gap-4 md:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name"${addAttribute(product.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Slug</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="slug"${addAttribute(product.slug, "value")} required> </label> </div> <div class="grid gap-4 md:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Categoría</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="categoryId"> ${categories.map((category) => renderTemplate`<option${addAttribute(category.id, "value")}${addAttribute(category.id === product.categoryId, "selected")}> ${category.name} </option>`)} </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Precio (€)</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" step="0.01" min="0" name="priceEur"${addAttribute((Number(product.priceCents) / 100).toFixed(2), "value")} required> </label> </div> <div class="grid gap-4"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nueva imagen</span> <input class="block w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-sky-400 focus:border-sky-400/40 focus:outline-none" type="file" name="imageFile" accept="image/jpeg,image/png,image/webp"> <span class="mt-2 block text-xs leading-6 text-slate-500">
JPG, PNG o WEBP · máximo 4 MB. Si subes una nueva, sustituye
                  la actual.
</span> </label> <label class="block rounded-3xl border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="removeImage"> <div> <div class="text-sm font-semibold text-white">
Eliminar imagen actual
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Déjalo marcado solo si quieres quitar la imagen sin
                      reemplazarla.
</p> </div> </div> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Description</span> <textarea class="min-h-27.5 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" name="description">${product.description ?? ""}</textarea> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Details</span> <textarea class="min-h-37.5 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" name="details">${product.details ?? ""}</textarea> </label> </div> </div> <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"> <label class="block rounded-3xl border border-white/10 bg-slate-950/50 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(product.active, "checked")}> <div> <div class="text-sm font-semibold text-white">Activo</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible en catálogo
</p> </div> </div> </label> <label class="block rounded-3xl border border-white/10 bg-slate-950/50 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="deliveryEnabled"${addAttribute(product.deliveryEnabled, "checked")}> <div> <div class="text-sm font-semibold text-white">Delivery</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible a domicilio
</p> </div> </div> </label> <label class="block rounded-3xl border border-white/10 bg-slate-950/50 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="pickupEnabled"${addAttribute(product.pickupEnabled, "checked")}> <div> <div class="text-sm font-semibold text-white">Pickup</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible para recogida
</p> </div> </div> </label> <label class="block rounded-3xl border border-white/10 bg-slate-950/50 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="dineInEnabled"${addAttribute(product.dineInEnabled, "checked")}> <div> <div class="text-sm font-semibold text-white">Sala</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible en consumo local
</p> </div> </div> </label> </div> <div class="mt-6 flex flex-wrap gap-3"> <button class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400" type="submit">
Guardar producto
</button> <a href="/admin/catalogo/productos" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al listado
</a> </div> </form> <section id="grupos" class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Modifier groups
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Vincular grupos al producto
</h2> </div> <div class="text-sm text-slate-400">
Vinculados: ${linkedModifierGroups.length} </div> </div> <form method="post"${addAttribute(`/api/admin/products/${product.id}/modifier-groups`, "action")} class="mt-6 rounded-3xl border border-violet-400/20 bg-violet-400/10 p-5"> <input type="hidden" name="intent" value="create"> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_auto]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-violet-100/80">Grupo</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" name="groupId" required> ${availableModifierGroups.length === 0 ? renderTemplate`<option value="">No quedan grupos disponibles</option>` : availableModifierGroups.map((group) => renderTemplate`<option${addAttribute(group.id, "value")}> ${group.name} · min ${group.minSelect} · max${" "} ${group.maxSelect} </option>`)} </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-violet-100/80">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-violet-300/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(linkedModifierGroups.length, "value")}> </label> <div class="flex items-end"> <button class="inline-flex w-full items-center justify-center rounded-2xl bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-300 disabled:cursor-not-allowed disabled:opacity-50" type="submit"${addAttribute(availableModifierGroups.length === 0, "disabled")}>
Añadir grupo
</button> </div> </div> </form> <div class="mt-4 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100/90">
Las opciones de cada grupo son compartidas entre todos los productos
          que usen ese grupo.
</div> <div class="mt-6 space-y-4"> ${linkedModifierGroups.length === 0 ? renderTemplate`<div class="rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
Este producto no tiene modifier groups vinculados.
</div>` : linkedModifierGroups.map((group) => renderTemplate`<article class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <form method="post"${addAttribute(`/api/admin/products/${product.id}/modifier-groups`, "action")} class="grid gap-4"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="productModifierGroupId"${addAttribute(group.linkId, "value")}> <div class="flex flex-wrap items-start justify-between gap-3"> <div> <div class="text-sm font-semibold text-white"> ${group.name} </div> <div class="mt-1 text-xs text-slate-500">
min ${group.minSelect} · max ${group.maxSelect} ·
                          opciones activas${" "} ${group.options.filter((option) => option.active).length} </div> </div> <div class="flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    group.required ? "border-rose-400/20 bg-rose-400/10 text-rose-300" : "border-white/10 bg-white/5 text-slate-300"
  ], "class:list")}> ${group.required ? "Obligatorio" : "Opcional"} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    group.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"
  ], "class:list")}> ${group.active ? "Grupo activo" : "Grupo inactivo"} </span> </div> </div> <div class="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden en producto
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(group.productSortOrder, "value")}> </label> <div class="rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Opciones del grupo
</div> <div class="mt-3 flex flex-wrap gap-2"> ${group.options.length === 0 ? renderTemplate`<span class="text-sm text-slate-500">
Sin opciones
</span>` : group.options.map((option) => renderTemplate`<span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
    option.active ? "border-white/10 bg-slate-950/60 text-slate-300" : "border-white/10 bg-white/5 text-slate-500"
  ], "class:list")}> ${option.name} · ${money(option.priceDeltaCents)} </span>`)} </div> </div> </div> <div class="flex flex-wrap gap-3"> <button class="inline-flex items-center justify-center rounded-2xl bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-300" type="submit">
Guardar grupo
</button> </div> </form> <section class="mt-4 rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-5"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Opciones
</div> <div class="mt-2 text-sm font-semibold text-white">
Crear y editar opciones del grupo
</div> </div> </div> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.groupId}/options`, "action")} class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_160px_auto]"> <input type="hidden" name="intent" value="create"> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/productos/${product.id}#grupos`, "value")}> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="text" name="name" placeholder="Ej. Extra queso" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Δ precio (€)
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01" value="0.00" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(group.options.length, "value")}> </label> <div class="flex items-end"> <button class="inline-flex w-full items-center justify-center rounded-2xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300" type="submit">
Añadir opción
</button> </div> </form> <label class="mt-4 block rounded-3xl border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-fuchsia-400" type="checkbox"${addAttribute(`create-option-${group.groupId}`, "form")} checked> <div> <div class="text-sm font-semibold text-white">
Activa por defecto
</div> <p class="mt-1 text-sm leading-6 text-slate-300">
Marca la opción como disponible al crearla.
</p> </div> </div> </label> <div class="mt-4 space-y-4"> ${group.options.length === 0 ? renderTemplate`<div class="rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
Este grupo todavía no tiene opciones.
</div>` : group.options.map((option) => renderTemplate`<article class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.groupId}/options`, "action")} class="grid gap-4"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="optionId"${addAttribute(option.id, "value")}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/productos/${product.id}#grupos`, "value")}> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_160px]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="text" name="name"${addAttribute(option.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Δ precio (€)
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01"${addAttribute((Number(option.priceDeltaCents) / 100).toFixed(2), "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(option.sortOrder, "value")}> </label> </div> <div class="flex flex-wrap items-center justify-between gap-3"> <label class="block rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-fuchsia-400" type="checkbox" name="active"${addAttribute(option.active, "checked")}> <div> <div class="text-sm font-semibold text-white">
Activa
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible en todos los productos que
                                        usan este grupo
</p> </div> </div> </label> <button class="inline-flex items-center justify-center rounded-2xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300" type="submit">
Guardar opción
</button> </div> </form> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.groupId}/options`, "action")} class="mt-3"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="optionId"${addAttribute(option.id, "value")}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/productos/${product.id}#grupos`, "value")}> <button class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15" type="submit">
Eliminar opción
</button> </form> </article>`)} </div> </section> <form method="post"${addAttribute(`/api/admin/products/${product.id}/modifier-groups`, "action")} class="mt-3"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="productModifierGroupId"${addAttribute(group.linkId, "value")}> <button class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15" type="submit">
Quitar grupo
</button> </form> </article>`)} </div> </section> <section id="variantes" class="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Variantes
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Crear y editar variantes
</h2> </div> <div class="text-sm text-slate-400">
Precio base: ${money(product.priceCents)} </div> </div> <form method="post"${addAttribute(`/api/admin/products/${product.id}/variants`, "action")} class="mt-6 rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5"> <input type="hidden" name="intent" value="create"> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_160px_auto]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-300/40 focus:outline-none" type="text" name="name" placeholder="Ej. Grande" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">Δ precio (€)</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-300/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01" value="0.00" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-sky-100/80">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-300/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(variants.length, "value")}> </label> <div class="flex items-end"> <button class="inline-flex w-full items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400" type="submit">
Añadir variante
</button> </div> </div> <label class="mt-4 block rounded-3xl border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active" checked> <div> <div class="text-sm font-semibold text-white">Activa</div> <p class="mt-1 text-sm leading-6 text-slate-300">
La variante quedará disponible al crearla.
</p> </div> </div> </label> </form> <div class="mt-6 space-y-4"> ${variants.length === 0 ? renderTemplate`<div class="rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
Este producto no tiene variantes.
</div>` : variants.map((variant) => renderTemplate`<article class="rounded-3xl border border-white/10 bg-slate-950/40 p-5"> <form method="post"${addAttribute(`/api/admin/products/${product.id}/variants`, "action")} class="grid gap-4"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="variantId"${addAttribute(variant.id, "value")}> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_160px]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name"${addAttribute(variant.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Δ precio (€)
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01"${addAttribute((Number(variant.priceDeltaCents) / 100).toFixed(2), "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(variant.sortOrder, "value")}> </label> </div> <div class="flex flex-wrap items-center justify-between gap-3"> <label class="block rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(variant.active, "checked")}> <div> <div class="text-sm font-semibold text-white">
Activa
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible para el configurador
</p> </div> </div> </label> <div class="flex flex-wrap gap-3"> <button class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400" type="submit">
Guardar variante
</button> </div> </div> </form> <form method="post"${addAttribute(`/api/admin/products/${product.id}/variants`, "action")} class="mt-3"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="variantId"${addAttribute(variant.id, "value")}> <button class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15" type="submit">
Eliminar variante
</button> </form> </article>`)} </div> </section> ${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` <div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al listado
</a> <a${addAttribute(`/admin/catalogo/compatibilidades?categoryId=${product.categoryId}`, "href")} class="inline-flex items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Compatibilidad categoría
</a> <a${addAttribute(`/api/products/${product.id}`, "href")} target="_blank" rel="noreferrer" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver API pública
</a> </div> ` })} <section id="alergenos" class="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alérgenos
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Vincular alérgenos
</h2> </div> <div class="flex flex-wrap items-center gap-2"> ${allergenRows.length === 0 ? renderTemplate`<div class="text-sm text-slate-400">
Sin alérgenos asociados
</div>` : renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <div class="text-sm text-slate-400">Iconos asociados</div> <div class="flex items-center -space-x-2"> ${allergenRows.slice(0, 5).map(
    (allergen) => allergen.iconUrl ? renderTemplate`<img${addAttribute(allergen.iconUrl, "src")}${addAttribute(allergen.name, "alt")}${addAttribute(allergen.name, "title")} class="h-8 w-8 rounded-full object-cover ring-2 ring-[#0f172a]" loading="lazy">` : renderTemplate`<div${addAttribute(allergen.name, "title")} class="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-[10px] font-bold uppercase text-slate-200 ring-2 ring-[#0f172a]"> ${allergen.name.slice(0, 1)} </div>`
  )} </div> ` })}`} </div> </div> <form method="post"${addAttribute(`/api/admin/products/${product.id}/allergens`, "action")} class="mt-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5"> <input type="hidden" name="intent" value="create"> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-amber-100/80">Alérgeno</span> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-amber-300/40 focus:outline-none" name="allergenId" required> ${availableAllergens.length === 0 ? renderTemplate`<option value="">No quedan alérgenos disponibles</option>` : availableAllergens.map((allergen) => renderTemplate`<option${addAttribute(allergen.id, "value")}> ${allergen.name} ${allergen.slug ? ` \xB7 ${allergen.slug}` : ""} </option>`)} </select> </label> <div class="flex items-end"> <button class="inline-flex w-full items-center justify-center rounded-2xl bg-amber-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50" type="submit"${addAttribute(availableAllergens.length === 0, "disabled")}>
Añadir alérgeno
</button> </div> </div> </form> <div class="mt-6 space-y-4"> ${allergenRows.length === 0 ? renderTemplate`<div class="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
Sin alérgenos asociados.
</div>` : allergenRows.map((allergen) => renderTemplate`<article class="rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="flex flex-wrap items-center justify-between gap-3"> <div class="flex min-w-0 items-center gap-3"> ${allergen.iconUrl ? renderTemplate`<img${addAttribute(allergen.iconUrl, "src")}${addAttribute(allergen.name, "alt")} class="h-10 w-10 rounded-2xl object-cover ring-1 ring-white/10">` : renderTemplate`<div class="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
ALG
</div>`} <div class="min-w-0"> <div class="text-sm font-semibold text-white"> ${allergen.name} </div> <div class="mt-1 text-xs text-slate-500"> ${allergen.slug} </div> </div> </div> <form method="post"${addAttribute(`/api/admin/products/${product.id}/allergens`, "action")}> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="productAllergenId"${addAttribute(allergen.id, "value")}> <button class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15" type="submit">
Quitar
</button> </form> </div> </article>`)} </div> </section> </div></section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/catalogo/productos/[id].astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/catalogo/productos/[id].astro";
const $$url = "/admin/catalogo/productos/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
