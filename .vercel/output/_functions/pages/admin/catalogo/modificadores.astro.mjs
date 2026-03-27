import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../../chunks/AdminLayout_CaEDeM2K.mjs';
import { d as db, M as ModifierGroup, f as ModifierOption, g as ProductModifierGroup } from '../../../chunks/_astro_db_ChTDrd2j.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

const $$Astro = createAstro();
const $$Modificadores = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Modificadores;
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") ?? "";
  const modifierOptionSaved = url.searchParams.get("modifierOptionSaved") === "1";
  const modifierOptionError = url.searchParams.get("modifierOptionError") ?? "";
  const groups = await db.select({
    id: ModifierGroup.id,
    name: ModifierGroup.name,
    minSelect: ModifierGroup.minSelect,
    maxSelect: ModifierGroup.maxSelect,
    required: ModifierGroup.required,
    sortOrder: ModifierGroup.sortOrder,
    active: ModifierGroup.active
  }).from(ModifierGroup).orderBy(ModifierGroup.sortOrder, ModifierGroup.name);
  const groupIds = groups.map((group) => group.id);
  const options = groupIds.length ? await db.select({
    id: ModifierOption.id,
    groupId: ModifierOption.groupId,
    name: ModifierOption.name,
    priceDeltaCents: ModifierOption.priceDeltaCents,
    sortOrder: ModifierOption.sortOrder,
    active: ModifierOption.active
  }).from(ModifierOption).where(inArray(ModifierOption.groupId, groupIds)).orderBy(ModifierOption.sortOrder, ModifierOption.name) : [];
  const productLinks = groupIds.length ? await db.select({
    groupId: ProductModifierGroup.groupId,
    id: ProductModifierGroup.id
  }).from(ProductModifierGroup).where(inArray(ProductModifierGroup.groupId, groupIds)) : [];
  const optionCountByGroup = /* @__PURE__ */ new Map();
  const activeOptionCountByGroup = /* @__PURE__ */ new Map();
  for (const option of options) {
    optionCountByGroup.set(
      option.groupId,
      (optionCountByGroup.get(option.groupId) ?? 0) + 1
    );
    if (option.active) {
      activeOptionCountByGroup.set(
        option.groupId,
        (activeOptionCountByGroup.get(option.groupId) ?? 0) + 1
      );
    }
  }
  const productCountByGroup = /* @__PURE__ */ new Map();
  for (const link of productLinks) {
    productCountByGroup.set(
      link.groupId,
      (productCountByGroup.get(link.groupId) ?? 0) + 1
    );
  }
  const totalGroups = groups.length;
  const activeGroups = groups.filter((group) => group.active).length;
  const requiredGroups = groups.filter((group) => group.required).length;
  const totalOptions = options.length;
  const errorMessage = error === "missing-name" ? "El nombre del grupo es obligatorio." : error === "invalid-range" ? "La combinaci\xF3n min / max no es v\xE1lida." : error === "invalid-sort-order" ? "El orden no es v\xE1lido." : error === "invalid-group" ? "El grupo indicado no es v\xE1lido." : error === "not-found" ? "El grupo ya no existe." : error === "in-use-products" ? "No se puede borrar porque sigue enlazado a productos." : error === "in-use-options" ? "No se puede borrar porque todav\xEDa tiene opciones." : error === "invalid-intent" ? "Acci\xF3n no v\xE1lida." : "";
  const optionErrorMessage = modifierOptionError === "missing-name" ? "El nombre de la opci\xF3n es obligatorio." : modifierOptionError === "invalid-price" ? "El precio de la opci\xF3n no es v\xE1lido." : modifierOptionError === "invalid-option" ? "La opci\xF3n indicada no es v\xE1lida." : modifierOptionError === "not-found" ? "La opci\xF3n ya no existe." : modifierOptionError === "invalid-intent" ? "Acci\xF3n de opci\xF3n no v\xE1lida." : "";
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Modificadores \xB7 Admin \xB7 Arcadia", "heading": "Modifier groups globales", "description": "Repositorio global de grupos y opciones compartidas. Aqu\xED se define la base reusable del configurador de productos.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Ver productos
</a> <a href="/admin/catalogo/ingredientes" class="inline-flex items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Ver ingredientes
</a> <a href="/admin/catalogo/alergenos" class="inline-flex items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-300 transition hover:border-amber-400/30 hover:bg-amber-400/15">
Ver alérgenos
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Modifier groups actualizados correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}${modifierOptionSaved ? renderTemplate`<section class="mb-6 rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-5 py-4 text-sm text-fuchsia-200">
Opciones actualizadas correctamente.
</section>` : null}${optionErrorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${optionErrorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> <article class="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Grupos</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${totalGroups}</div> <p class="mt-2 text-sm text-slate-400">Modifier groups registrados</p> </article> <article class="rounded-[28px] border border-emerald-400/15 bg-emerald-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Activos</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${activeGroups}</div> <p class="mt-2 text-sm text-emerald-100/70">Disponibles para asignar</p> </article> <article class="rounded-[28px] border border-violet-400/15 bg-violet-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">Obligatorios</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${requiredGroups}</div> <p class="mt-2 text-sm text-violet-100/70">Requieren selección</p> </article> <article class="rounded-[28px] border border-fuchsia-400/15 bg-fuchsia-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-fuchsia-200/80">Opciones</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${totalOptions}</div> <p class="mt-2 text-sm text-fuchsia-100/70">Catálogo total de opciones</p> </article> </section> <section class="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"> <aside class="space-y-6"> <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Nuevo group
</h2> <form method="post" action="/api/admin/modifier-groups" class="mt-6 grid gap-4"> <input type="hidden" name="intent" value="create"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="text" name="name" placeholder="Salsas" required> </label> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Min select</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="minSelect" min="0" step="1" value="0" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Max select</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="maxSelect" min="1" step="1" value="1" required> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(groups.length, "value")} required> </label> <label class="block rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="required"> <div> <div class="text-sm font-semibold text-white">Grupo obligatorio</div> <p class="mt-1 text-sm leading-6 text-slate-400">El usuario debe elegir al menos una opción.</p> </div> </div> </label> <label class="block rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="active" checked> <div> <div class="text-sm font-semibold text-white">Activo</div> <p class="mt-1 text-sm leading-6 text-slate-400">Disponible para vincular a productos.</p> </div> </div> </label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-300">
Crear group
</button> </form> </section> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Reutilización global
</h2> <div class="mt-6 space-y-4"> <div class="rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="text-sm font-semibold text-white">Un grupo, varios productos</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Las opciones viven en el grupo y se comparten entre todos los productos que lo usen.
</p> </div> <div class="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-4"> <div class="text-sm font-semibold text-violet-200">Borrado protegido</div> <p class="mt-2 text-sm leading-6 text-violet-100/80">
Un group no se puede borrar si sigue enlazado a productos o si todavía tiene opciones activas o inactivas.
</p> </div> </div> </section> </aside> <section class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
Gestión
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Groups y options globales
</h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
Shared config
</div> </div> </div> ${groups.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">No hay groups</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Crea el primero desde el formulario lateral.
</p> </div> </div>` : renderTemplate`<div class="space-y-4 px-6 py-6"> ${groups.map((group) => {
    const groupOptions = options.filter((option) => option.groupId === group.id).sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es"));
    const linkedProducts = productCountByGroup.get(group.id) ?? 0;
    const totalGroupOptions = optionCountByGroup.get(group.id) ?? 0;
    const activeGroupOptions = activeOptionCountByGroup.get(group.id) ?? 0;
    const canDelete = linkedProducts === 0 && totalGroupOptions === 0;
    const anchor = `#grupo-${group.id}`;
    return renderTemplate`<section${addAttribute(`grupo-${group.id}`, "id")} class="rounded-3xl border border-white/10 bg-white/4 p-5"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-base font-semibold text-white">${group.name}</div> <div class="mt-2 flex flex-wrap gap-2"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
      group.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${group.active ? "Activo" : "Inactivo"} </span> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
      group.required ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-white/10 bg-white/5 text-slate-300"
    ], "class:list")}> ${group.required ? "Obligatorio" : "Opcional"} </span> <span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">
min ${group.minSelect} · max ${group.maxSelect} </span> </div> </div> <div class="text-sm text-slate-400"> ${linkedProducts} producto${linkedProducts === 1 ? "" : "s"} · ${activeGroupOptions}/${totalGroupOptions} opciones activas
</div> </div> <form method="post" action="/api/admin/modifier-groups" class="mt-5 grid gap-4"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="groupId"${addAttribute(group.id, "value")}> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px_160px_140px]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="text" name="name"${addAttribute(group.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Min select</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="minSelect" min="0" step="1"${addAttribute(group.minSelect, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Max select</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="maxSelect" min="1" step="1"${addAttribute(group.maxSelect, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(group.sortOrder, "value")} required> </label> </div> <div class="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4"> <div class="flex flex-wrap gap-4"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="required"${addAttribute(group.required, "checked")}>
Obligatorio
</label> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="active"${addAttribute(group.active, "checked")}>
Activo
</label> </div> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-violet-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-violet-300">
Guardar group
</button> </div> </form> <section class="mt-5 rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-5"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">Opciones</div> <div class="mt-2 text-sm font-semibold text-white">Catálogo de opciones del group</div> </div> <div class="text-sm text-fuchsia-100/80">${totalGroupOptions} total</div> </div> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.id}/options`, "action")} class="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px_auto]"> <input type="hidden" name="intent" value="create"> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/modificadores${anchor}`, "value")}> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="text" name="name" placeholder="Extra queso" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">Δ precio (€)</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01" value="0.00" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(groupOptions.length, "value")}> </label> <div class="flex items-end"> <button class="inline-flex w-full items-center justify-center rounded-2xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300" type="submit">
Añadir opción
</button> </div> <label class="block rounded-3xl border border-white/10 bg-slate-950/40 p-4 lg:col-span-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-fuchsia-400" type="checkbox" name="active" checked> <div> <div class="text-sm font-semibold text-white">Activa por defecto</div> <p class="mt-1 text-sm leading-6 text-slate-300">La opción quedará disponible para todos los productos que usen este group.</p> </div> </div> </label> </form> <div class="mt-4 space-y-4"> ${groupOptions.length === 0 ? renderTemplate`<div class="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
Este group todavía no tiene opciones.
</div>` : groupOptions.map((option) => renderTemplate`<article class="rounded-3xl border border-white/10 bg-slate-950/40 p-4"> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.id}/options`, "action")} class="grid gap-4"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="optionId"${addAttribute(option.id, "value")}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/modificadores${anchor}`, "value")}> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="text" name="name"${addAttribute(option.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Δ precio (€)</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01"${addAttribute((Number(option.priceDeltaCents) / 100).toFixed(2), "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(option.sortOrder, "value")}> </label> </div> <div class="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-4"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-fuchsia-400" type="checkbox" name="active"${addAttribute(option.active, "checked")}>
Activa
</label> <div class="flex flex-wrap gap-2"> <button class="inline-flex items-center justify-center rounded-2xl bg-fuchsia-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-fuchsia-300" type="submit">
Guardar opción
</button> </div> </div> </form> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.id}/options`, "action")} class="mt-3"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="optionId"${addAttribute(option.id, "value")}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/modificadores${anchor}`, "value")}> <button class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15" type="submit">
Eliminar opción
</button> </form> </article>`)} </div> </section> <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"> <div class="text-sm text-slate-500"> ${linkedProducts} producto${linkedProducts === 1 ? "" : "s"} enlazado${linkedProducts === 1 ? "" : "s"} · ${totalGroupOptions} opción${totalGroupOptions === 1 ? "" : "es"} </div> <form method="post" action="/api/admin/modifier-groups"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="groupId"${addAttribute(group.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
    ], "class:list")}>
Borrar group
</button> </form> </div> </section>`;
  })} </div>`} </section> </section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/catalogo/modificadores.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/catalogo/modificadores.astro";
const $$url = "/admin/catalogo/modificadores";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Modificadores,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
