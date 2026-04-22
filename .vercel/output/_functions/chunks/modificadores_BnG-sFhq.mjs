import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, M as ModifierGroup, g as ModifierOption, h as ProductModifierGroup } from './_astro_db_Bcz5lWRF.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';

const $$Modificadores = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
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
  const groupsWithProducts = groups.filter(
    (group) => (productCountByGroup.get(group.id) ?? 0) > 0
  ).length;
  const errorMessage = error === "missing-name" ? "El nombre del grupo es obligatorio." : error === "invalid-range" ? "La combinación min / max no es válida." : error === "invalid-sort-order" ? "El orden no es válido." : error === "invalid-group" ? "El grupo indicado no es válido." : error === "not-found" ? "El grupo ya no existe." : error === "in-use-products" ? "No se puede borrar porque sigue enlazado a productos." : error === "in-use-options" ? "No se puede borrar porque todavía tiene opciones." : error === "invalid-intent" ? "Acción no válida." : "";
  const optionErrorMessage = modifierOptionError === "missing-name" ? "El nombre de la opción es obligatorio." : modifierOptionError === "invalid-price" ? "El precio de la opción no es válido." : modifierOptionError === "invalid-option" ? "La opción indicada no es válida." : modifierOptionError === "not-found" ? "La opción ya no existe." : modifierOptionError === "invalid-intent" ? "Acción de opción no válida." : "";
  const summaryCards = [
    {
      label: "Groups",
      value: totalGroups,
      note: "Grupos globales registrados",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Activos",
      value: activeGroups,
      note: "Disponibles para vincular",
      tone: "border-emerald-400/20 bg-emerald-400/10"
    },
    {
      label: "Obligatorios",
      value: requiredGroups,
      note: "Requieren elección",
      tone: "border-amber-400/20 bg-amber-400/10"
    },
    {
      label: "Opciones",
      value: totalOptions,
      note: "Catálogo de opciones total",
      tone: "border-fuchsia-400/20 bg-fuchsia-400/10"
    },
    {
      label: "En uso",
      value: groupsWithProducts,
      note: "Groups enlazados a productos",
      tone: "border-cyan-400/20 bg-cyan-400/10"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Modificadores · Admin · Arcadia", "heading": "Modifier groups globales", "description": "Repositorio global de grupos y opciones compartidas del configurador. Esta vista ahora separa mejor la definición del group, su catálogo de opciones y su uso real en productos.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-2.5 text-sm font-semibold text-sky-200 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver productos
</a> <a href="/admin/catalogo/ingredientes" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition hover:border-cyan-400/30 hover:bg-cyan-400/15">
Ver ingredientes
</a> <a href="/admin/catalogo/alergenos" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition hover:border-amber-400/30 hover:bg-amber-400/15">
Ver alérgenos
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${saved ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200">
Modifier groups actualizados correctamente.
</section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}${modifierOptionSaved ? renderTemplate`<section class="mb-6 rounded-[26px] border border-fuchsia-400/20 bg-fuchsia-400/10 px-5 py-4 text-sm text-fuchsia-200">
Opciones actualizadas correctamente.
</section>` : null}${optionErrorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${optionErrorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 2xl:grid-cols-5"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"> <aside class="space-y-6"> <section class="rounded-[32px] border border-white/10 bg-[#0f172a]/82 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Nuevo group
</h2> <p class="mt-3 text-sm leading-7 text-slate-400">
Define aquí la estructura reusable del group: nombre, rango de
          selección, orden y obligatoriedad.
</p> <form method="post" action="/api/admin/modifier-groups" class="mt-7 grid gap-5"> <input type="hidden" name="intent" value="create"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="text" name="name" placeholder="Salsas" required> </label> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Min select
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="minSelect" min="0" step="1" value="0" required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Max select
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="maxSelect" min="1" step="1" value="1" required> </label> </div> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(groups.length, "value")} required> </label> <label class="block rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="required"> <div> <div class="text-sm font-semibold text-white">
Grupo obligatorio
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
El usuario debe elegir al menos una opción.
</p> </div> </div> </label> <label class="block rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="active" checked> <div> <div class="text-sm font-semibold text-white">Activo</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible para vincular a productos.
</p> </div> </div> </label> <button type="submit" class="inline-flex min-h-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-3 text-sm font-semibold text-violet-100 transition hover:border-violet-400/30 hover:bg-violet-400/15">
Crear group
</button> </form> </section> <section class="rounded-[32px] border border-white/10 bg-[#0b1220]/90 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.34)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Reutilización global
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">
Un group, varios productos
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Las opciones viven dentro del group y se comparten entre todos los
              productos que lo usan.
</p> </article> <article class="rounded-[24px] border border-violet-400/20 bg-violet-400/10 p-4"> <div class="text-sm font-semibold text-violet-200">
Rango de selección
</div> <p class="mt-2 text-sm leading-6 text-violet-100/80"> <code>minSelect</code> y <code>maxSelect</code> gobiernan el comportamiento
              del configurador sin tocar las opciones individuales.
</p> </article> <article class="rounded-[24px] border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">
Borrado protegido
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Un group no se puede borrar si sigue enlazado a productos o si
              todavía conserva opciones.
</p> </article> </div> </section> </aside> <section class="overflow-hidden rounded-[32px] border border-white/10 bg-[#0f172a]/82 shadow-[0_24px_80px_rgba(2,6,23,0.34)]"> <div class="border-b border-white/[0.08] px-6 py-6 lg:px-8"> <div class="flex flex-wrap items-center justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Gestión
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white lg:text-[2rem]">
Groups y options globales
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Cada group se edita como bloque independiente, con sus opciones
              debajo, para que el contexto completo sea visible sin ir saltando
              por una tabla densa.
</p> </div> <div class="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300">
Shared config
</div> </div> </div> ${groups.length === 0 ? renderTemplate`<div class="px-6 py-16 text-center lg:px-8"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-[#091121] p-8"> <div class="text-lg font-semibold text-white">No hay groups</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Crea el primero desde el formulario lateral.
</p> </div> </div>` : renderTemplate`<div class="space-y-6 px-6 py-6 lg:px-8 lg:py-8"> ${groups.map((group) => {
    const groupOptions = options.filter((option) => option.groupId === group.id).sort(
      (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es")
    );
    const linkedProducts = productCountByGroup.get(group.id) ?? 0;
    const totalGroupOptions = optionCountByGroup.get(group.id) ?? 0;
    const activeGroupOptions = activeOptionCountByGroup.get(group.id) ?? 0;
    const canDelete = linkedProducts === 0 && totalGroupOptions === 0;
    const anchor = `#grupo-${group.id}`;
    return renderTemplate`<section${addAttribute(`grupo-${group.id}`, "id")} class="rounded-[30px] border border-white/10 bg-[#091121]/80 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.22)] lg:p-6"> <div class="flex flex-col gap-5 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <h3 class="text-xl font-semibold tracking-[-0.03em] text-white"> ${group.name} </h3> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
      group.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${group.active ? "Activo" : "Inactivo"} </span> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]",
      group.required ? "border-amber-400/20 bg-amber-400/10 text-amber-300" : "border-white/10 bg-white/[0.04] text-slate-300"
    ], "class:list")}> ${group.required ? "Obligatorio" : "Opcional"} </span> <span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-violet-300">
min ${group.minSelect} · max ${group.maxSelect} </span> </div> </div> <div class="grid gap-3 sm:grid-cols-3 lg:w-[430px]"> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Productos
</div> <div class="mt-2 text-lg font-semibold text-white"> ${linkedProducts} </div> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Opciones
</div> <div class="mt-2 text-lg font-semibold text-white"> ${totalGroupOptions} </div> </div> <div class="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Activas
</div> <div class="mt-2 text-lg font-semibold text-white"> ${activeGroupOptions} </div> </div> </div> </div> <form method="post" action="/api/admin/modifier-groups" class="mt-6 grid gap-5"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="groupId"${addAttribute(group.id, "value")}> <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_160px_160px_140px]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="text" name="name"${addAttribute(group.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Min select
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="minSelect" min="0" step="1"${addAttribute(group.minSelect, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Max select
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="maxSelect" min="1" step="1"${addAttribute(group.maxSelect, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(group.sortOrder, "value")} required> </label> </div> <div class="flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <div class="flex flex-wrap gap-6"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="required"${addAttribute(group.required, "checked")}>
Obligatorio
</label> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-violet-400" type="checkbox" name="active"${addAttribute(group.active, "checked")}>
Activo
</label> </div> <button type="submit" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-400/10 px-4 py-2.5 text-sm font-semibold text-violet-100 transition hover:border-violet-400/30 hover:bg-violet-400/15">
Guardar group
</button> </div> </form> <section class="mt-6 rounded-[28px] border border-fuchsia-400/20 bg-fuchsia-400/10 p-5 lg:p-6"> <div class="flex flex-wrap items-end justify-between gap-4 border-b border-fuchsia-300/15 pb-5"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Opciones
</div> <h4 class="mt-2 text-lg font-semibold text-white">
Catálogo del group
</h4> <p class="mt-3 text-sm leading-7 text-fuchsia-100/80">
Estas opciones se comparten entre todos los productos
                          que usan${" "} <strong class="text-white">${group.name}</strong>.
</p> </div> <div class="rounded-[22px] border border-fuchsia-300/15 bg-fuchsia-300/10 px-4 py-3 text-sm text-fuchsia-100/80"> ${totalGroupOptions} total · ${activeGroupOptions} activas
</div> </div> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.id}/options`, "action")} class="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px_auto]"> <input type="hidden" name="intent" value="create"> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/modificadores${anchor}`, "value")}> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="text" name="name" placeholder="Extra queso" required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Δ precio (€)
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01" value="0.00" required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-100/80">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-fuchsia-300/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(groupOptions.length, "value")}> </label> <div class="flex items-end"> <button class="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/15 px-4 py-3 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/30 hover:bg-fuchsia-300/20" type="submit">
Añadir opción
</button> </div> <label class="block rounded-[24px] border border-white/10 bg-slate-950/40 p-4 lg:col-span-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-fuchsia-400" type="checkbox" name="active" checked> <div> <div class="text-sm font-semibold text-white">
Activa por defecto
</div> <p class="mt-1 text-sm leading-6 text-slate-300">
La opción quedará disponible para todos los
                              productos que usen este group.
</p> </div> </div> </label> </form> <div class="mt-5 space-y-4"> ${groupOptions.length === 0 ? renderTemplate`<div class="rounded-[24px] border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-400">
Este group todavía no tiene opciones.
</div>` : groupOptions.map((option) => renderTemplate`<article class="rounded-[24px] border border-white/10 bg-slate-950/40 p-5"> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.id}/options`, "action")} class="grid gap-5"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="optionId"${addAttribute(option.id, "value")}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/modificadores${anchor}`, "value")}> <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_180px_140px]"> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="text" name="name"${addAttribute(option.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Δ precio (€)
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="number" name="priceDeltaEur" step="0.01"${addAttribute((Number(option.priceDeltaCents) / 100).toFixed(2), "value")} required> </label> <label class="block"> <span class="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#07101f] px-4 py-3 text-sm text-white focus:border-fuchsia-400/40 focus:outline-none" type="number" name="sortOrder" step="1"${addAttribute(option.sortOrder, "value")}> </label> </div> <div class="flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-fuchsia-400" type="checkbox" name="active"${addAttribute(option.active, "checked")}>
Activa
</label> <button class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/15 px-4 py-2.5 text-sm font-semibold text-fuchsia-100 transition hover:border-fuchsia-300/30 hover:bg-fuchsia-300/20" type="submit">
Guardar opción
</button> </div> </form> <form method="post"${addAttribute(`/api/admin/modifier-groups/${group.id}/options`, "action")} class="mt-4 border-t border-white/[0.08] pt-4"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="optionId"${addAttribute(option.id, "value")}> <input type="hidden" name="redirectTo"${addAttribute(`/admin/catalogo/modificadores${anchor}`, "value")}> <button class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2.5 text-sm font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15" type="submit">
Eliminar opción
</button> </form> </article>`)} </div> </section> <div class="mt-5 flex flex-col gap-4 border-t border-white/[0.08] pt-5 lg:flex-row lg:items-center lg:justify-between"> <div class="text-sm text-slate-500"> ${linkedProducts} producto${linkedProducts === 1 ? "" : "s"}${" "}
enlazado${linkedProducts === 1 ? "" : "s"} ·${" "} ${totalGroupOptions} opción
${totalGroupOptions === 1 ? "" : "es"} </div> <form method="post" action="/api/admin/modifier-groups"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="groupId"${addAttribute(group.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex min-h-10 items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500"
    ], "class:list")}>
Borrar group
</button> </form> </div> </section>`;
  })} </div>`} </section> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/modificadores.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/modificadores.astro";
const $$url = "/admin/catalogo/modificadores";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Modificadores,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
