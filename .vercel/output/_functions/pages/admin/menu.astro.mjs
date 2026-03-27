import { e as createComponent, r as renderTemplate, k as renderComponent, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_CaEDeM2K.mjs';
import { d as db, k as MenuDish, l as MenuDishAssignment, m as Menu, n as MenuItem, A as AppSetting } from '../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$Menu = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Menu;
  const DEFAULT_MENU_CONFIG = {
    DIARIO: { active: true, priceCents: 1350 },
    FESTIVO: { active: true, priceCents: 1590 }
  };
  const COURSES = [
    { key: "PRIMERO", label: "Primeros" },
    { key: "SEGUNDO", label: "Segundos" },
    { key: "POSTRE", label: "Postres" }
  ];
  const KINDS = [
    {
      key: "DIARIO",
      label: "Diario",
      tone: "border-sky-400/20 bg-sky-400/10 text-sky-300"
    },
    {
      key: "FESTIVO",
      label: "Festivo",
      tone: "border-violet-400/20 bg-violet-400/10 text-violet-300"
    }
  ];
  async function getMenuConfig() {
    const [row] = await db.select({ value: AppSetting.value }).from(AppSetting).where(eq(AppSetting.key, "menuConfigV2")).limit(1);
    const value = row?.value;
    return {
      DIARIO: {
        active: value?.DIARIO?.active ?? DEFAULT_MENU_CONFIG.DIARIO.active,
        priceCents: typeof value?.DIARIO?.priceCents === "number" ? value.DIARIO.priceCents : DEFAULT_MENU_CONFIG.DIARIO.priceCents
      },
      FESTIVO: {
        active: value?.FESTIVO?.active ?? DEFAULT_MENU_CONFIG.FESTIVO.active,
        priceCents: typeof value?.FESTIVO?.priceCents === "number" ? value.FESTIVO.priceCents : DEFAULT_MENU_CONFIG.FESTIVO.priceCents
      }
    };
  }
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} \u20AC`;
  }
  function moneyInput(cents) {
    return (Number(cents ?? 0) / 100).toFixed(2);
  }
  function getAssignedKinds(map, dishId) {
    return map.get(dishId) ?? /* @__PURE__ */ new Set();
  }
  const config = await getMenuConfig();
  const dishRows = await db.select({
    id: MenuDish.id,
    name: MenuDish.name,
    slug: MenuDish.slug,
    description: MenuDish.description,
    course: MenuDish.course,
    active: MenuDish.active,
    sortOrder: MenuDish.sortOrder
  }).from(MenuDish);
  const dishes = [...dishRows].sort((a, b) => {
    const courseOrder = {
      PRIMERO: 1,
      SEGUNDO: 2,
      POSTRE: 3
    };
    const c = courseOrder[a.course] - courseOrder[b.course];
    if (c !== 0) return c;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.name.localeCompare(b.name, "es");
  });
  const assignmentRows = await db.select({
    assignmentId: MenuDishAssignment.id,
    kind: MenuDishAssignment.kind,
    sortOrder: MenuDishAssignment.sortOrder,
    dishId: MenuDish.id,
    dishName: MenuDish.name,
    dishSlug: MenuDish.slug,
    dishDescription: MenuDish.description,
    dishCourse: MenuDish.course,
    dishActive: MenuDish.active,
    dishSortOrder: MenuDish.sortOrder
  }).from(MenuDishAssignment).innerJoin(MenuDish, eq(MenuDishAssignment.dishId, MenuDish.id));
  const assignments = [...assignmentRows].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind, "es");
    const courseOrder = {
      PRIMERO: 1,
      SEGUNDO: 2,
      POSTRE: 3
    };
    const c = courseOrder[a.dishCourse] - courseOrder[b.dishCourse];
    if (c !== 0) return c;
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.dishSortOrder !== b.dishSortOrder) return a.dishSortOrder - b.dishSortOrder;
    return a.dishName.localeCompare(b.dishName, "es");
  });
  const planner = {
    DIARIO: {
      PRIMERO: [],
      SEGUNDO: [],
      POSTRE: []
    },
    FESTIVO: {
      PRIMERO: [],
      SEGUNDO: [],
      POSTRE: []
    }
  };
  for (const row of assignments) {
    planner[row.kind][row.dishCourse].push(row);
  }
  const assignedKindsByDishId = /* @__PURE__ */ new Map();
  for (const row of assignments) {
    if (!assignedKindsByDishId.has(row.dishId)) {
      assignedKindsByDishId.set(row.dishId, /* @__PURE__ */ new Set());
    }
    assignedKindsByDishId.get(row.dishId)?.add(row.kind);
  }
  const assignmentCountByDishId = /* @__PURE__ */ new Map();
  for (const row of assignments) {
    assignmentCountByDishId.set(
      row.dishId,
      (assignmentCountByDishId.get(row.dishId) ?? 0) + 1
    );
  }
  const dishesByCourse = {
    PRIMERO: dishes.filter((dish) => dish.course === "PRIMERO"),
    SEGUNDO: dishes.filter((dish) => dish.course === "SEGUNDO"),
    POSTRE: dishes.filter((dish) => dish.course === "POSTRE")
  };
  const totalDishes = dishes.length;
  const activeDishes = dishes.filter((dish) => dish.active).length;
  const diarioAssignments = assignments.filter((row) => row.kind === "DIARIO").length;
  const festivoAssignments = assignments.filter((row) => row.kind === "FESTIVO").length;
  const legacyMenus = await db.select({ id: Menu.id }).from(Menu);
  const legacyMenuItems = await db.select({ id: MenuItem.id }).from(MenuItem);
  const canImportLegacy = dishes.length === 0 && assignments.length === 0 && legacyMenus.length > 0 && legacyMenuItems.length > 0;
  const hasV2Data = dishes.length > 0 || assignments.length > 0;
  const legacyMenusCount = legacyMenus.length;
  const legacyMenuItemsCount = legacyMenuItems.length;
  const publicSourceLabel = hasV2Data ? "V2 can\xF3nico" : canImportLegacy ? "Fallback legacy activo" : "Sin datos publicados";
  const legacyStatusLabel = canImportLegacy ? "Importable" : legacyMenusCount > 0 || legacyMenuItemsCount > 0 ? "Solo respaldo" : "Vac\xEDo";
  const legacyGuidance = hasV2Data ? "La p\xE1gina p\xFAblica ya queda gobernada por el sistema nuevo. Lo legacy se conserva solo como respaldo hist\xF3rico e importaci\xF3n puntual." : canImportLegacy ? "Todav\xEDa puedes importar el contenido legacy al sistema nuevo. Mientras no existan platos o asignaciones V2, la p\xE1gina p\xFAblica puede seguir leyendo esa base antigua." : "No hay contenido legacy utilizable y tampoco hay datos V2 suficientes publicados todav\xEDa.";
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") ?? "";
  const error = url.searchParams.get("error") ?? "";
  const successMessage = saved === "config" ? "Configuraci\xF3n del men\xFA guardada correctamente." : saved === "dish" ? "Platos de men\xFA actualizados correctamente." : saved === "assignment" ? "Asignaciones del men\xFA actualizadas correctamente." : saved === "import" ? "Men\xFA legacy importado correctamente al sistema nuevo." : "";
  const errorMessage = error === "missing-name" ? "El nombre del plato es obligatorio." : error === "invalid-course" ? "El curso del plato no es v\xE1lido." : error === "invalid-kind" ? "El tipo de men\xFA no es v\xE1lido." : error === "invalid-price" ? "El precio del men\xFA no es v\xE1lido." : error === "invalid-dish" ? "El plato indicado no es v\xE1lido." : error === "dish-not-found" ? "El plato ya no existe." : error === "dish-in-use" ? "No se puede borrar el plato mientras siga asignado a un men\xFA." : error === "invalid-assignment" ? "La asignaci\xF3n indicada no es v\xE1lida." : error === "already-v2-data" ? "Ya existe informaci\xF3n en el sistema nuevo y no se puede importar encima." : error === "import-failed" ? "No se ha podido importar el men\xFA legacy." : error === "legacy-read-only" ? "El sistema legacy del men\xFA ha quedado en modo solo respaldo. Usa /admin/menu y el endpoint /api/admin/menu-v2 para cualquier cambio." : error === "invalid-intent" ? "Acci\xF3n de men\xFA no v\xE1lida." : error === "reorder-failed" ? "No se ha podido reordenar la lista. Recarga y vuelve a intentarlo." : "";
  return renderTemplate(_a || (_a = __template(["", ' <script>\n  (() => {\n    let dragged = null;\n\n    function getCardFromEventTarget(target) {\n      if (!(target instanceof Element)) return null;\n      return target.closest("[data-menu-assignment-card]");\n    }\n\n    function clearDraggedState() {\n      if (dragged instanceof Element) {\n        dragged.classList.remove("opacity-60");\n      }\n      dragged = null;\n    }\n\n    document.addEventListener("dragstart", (event) => {\n      const card = getCardFromEventTarget(event.target);\n      if (!card) return;\n\n      dragged = card;\n      card.classList.add("opacity-60");\n\n      if (event.dataTransfer) {\n        event.dataTransfer.effectAllowed = "move";\n        event.dataTransfer.setData("text/plain", card.getAttribute("data-menu-assignment-card") || "");\n      }\n    });\n\n    document.addEventListener("dragend", () => {\n      clearDraggedState();\n    });\n\n    const zones = Array.from(document.querySelectorAll("[data-menu-dropzone]"));\n\n    function getAfterElement(zone, clientY) {\n      const cards = Array.from(zone.querySelectorAll("[data-menu-assignment-card]")).filter(\n        (card) => card !== dragged\n      );\n\n      let closest = null;\n      let closestOffset = Number.NEGATIVE_INFINITY;\n\n      for (const card of cards) {\n        const rect = card.getBoundingClientRect();\n        const offset = clientY - rect.top - rect.height / 2;\n        if (offset < 0 && offset > closestOffset) {\n          closestOffset = offset;\n          closest = card;\n        }\n      }\n\n      return closest;\n    }\n\n    zones.forEach((zone) => {\n      zone.addEventListener("dragover", (event) => {\n        if (!dragged) return;\n        if (!(dragged instanceof Element)) return;\n\n        const sameKind = dragged.getAttribute("data-kind") === zone.getAttribute("data-kind");\n        const sameCourse = dragged.getAttribute("data-course") === zone.getAttribute("data-course");\n        if (!sameKind || !sameCourse) return;\n\n        event.preventDefault();\n\n        const afterElement = getAfterElement(zone, event.clientY);\n        if (!afterElement) {\n          zone.appendChild(dragged);\n        } else {\n          zone.insertBefore(dragged, afterElement);\n        }\n      });\n\n      zone.addEventListener("drop", async (event) => {\n        if (!dragged) return;\n        if (!(dragged instanceof Element)) return;\n\n        const sameKind = dragged.getAttribute("data-kind") === zone.getAttribute("data-kind");\n        const sameCourse = dragged.getAttribute("data-course") === zone.getAttribute("data-course");\n        if (!sameKind || !sameCourse) {\n          clearDraggedState();\n          return;\n        }\n\n        event.preventDefault();\n\n        const orderedIds = Array.from(\n          zone.querySelectorAll("[data-menu-assignment-card]")\n        )\n          .map((card) => card.getAttribute("data-menu-assignment-card"))\n          .filter(Boolean);\n\n        const params = new URLSearchParams();\n        params.set("intent", "reorder-assignments");\n        params.set("kind", zone.getAttribute("data-kind") || "");\n        params.set("course", zone.getAttribute("data-course") || "");\n        params.set("orderedIds", orderedIds.join(","));\n\n        try {\n          const response = await fetch("/api/admin/menu-v2", {\n            method: "POST",\n            headers: {\n              "content-type": "application/x-www-form-urlencoded;charset=UTF-8",\n            },\n            body: params.toString(),\n          });\n\n          if (!response.ok) {\n            window.location.href = "/admin/menu?error=reorder-failed";\n            return;\n          }\n\n          window.location.reload();\n        } catch {\n          window.location.href = "/admin/menu?error=reorder-failed";\n        } finally {\n          clearDraggedState();\n        }\n      });\n    });\n  })();\n<\/script>'])), renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Men\xFA \xB7 Admin \xB7 Arcadia", "heading": "Men\xFA del d\xEDa", "description": "Sistema nuevo del men\xFA diario y festivo, completamente separado del cat\xE1logo de productos real de delivery, pickup y sala.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/menu" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver página pública
</a> <a href="/admin" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${successMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200"> ${successMessage} </section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> <article class="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Biblioteca
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${totalDishes} </div> <p class="mt-2 text-sm text-slate-400">Platos propios del menú</p> </article> <article class="rounded-[28px] border border-emerald-400/15 bg-emerald-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">
Activos
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${activeDishes} </div> <p class="mt-2 text-sm text-emerald-100/70">Visibles para asignar</p> </article> <article class="rounded-[28px] border border-sky-400/15 bg-sky-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-200/80">
Diario
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${diarioAssignments} </div> <p class="mt-2 text-sm text-sky-100/70">Platos asignados al menú diario</p> </article> <article class="rounded-[28px] border border-violet-400/15 bg-violet-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
Festivo
</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${festivoAssignments} </div> <p class="mt-2 text-sm text-violet-100/70">Platos asignados al menú festivo</p> </article> </section> <section class="mt-6 rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
Configuración fija
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Menú diario y festivo
</h2> <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
Ya no existen múltiples menús editables. Aquí solo configuras las dos variantes reales del negocio y su precio. Los platos viven en su propia biblioteca y se asignan por separado.
</p> </div> <div class="flex flex-wrap gap-3"> ${canImportLegacy ? renderTemplate`<form method="post" action="/api/admin/menu-v2"> <input type="hidden" name="intent" value="import-legacy"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-400/30 hover:bg-amber-400/15">
Importar menú legacy
</button> </form>` : null} <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
Separado completamente del catálogo real
</div> </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-3"> <article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Fuente pública actual
</div> <div class="mt-3 text-lg font-semibold tracking-tight text-white"> ${publicSourceLabel} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${legacyGuidance} </p> </article> <article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Legacy detectado
</div> <div class="mt-3 text-lg font-semibold tracking-tight text-white"> ${legacyStatusLabel} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${legacyMenusCount} menús legacy · ${legacyMenuItemsCount} items legacy.
</p> </article> <article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Sistema canónico
</div> <div class="mt-3 text-lg font-semibold tracking-tight text-white">
Biblioteca propia + asignaciones
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
El alta, edición y ordenación del menú deben pasar por <code>/api/admin/menu-v2</code>. El CRUD legacy queda retirado.
</p> </article> </div> <form method="post" action="/api/admin/menu-v2" class="mt-6"> <input type="hidden" name="intent" value="save-config"> <div class="grid gap-6 xl:grid-cols-2"> ${KINDS.map((kind) => renderTemplate`<article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-start justify-between gap-3"> <div> <span${addAttribute(["inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]", kind.tone], "class:list")}> ${kind.label} </span> <h3 class="mt-3 text-lg font-semibold text-white">
Menú ${kind.label.toLowerCase()} </h3> </div> <div class="text-right"> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">
Precio actual
</div> <div class="mt-1 text-lg font-semibold text-white"> ${money(config[kind.key].priceCents)} </div> </div> </div> <div class="mt-5 grid gap-4 sm:grid-cols-[180px_auto]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Precio €
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" min="0" step="0.01"${addAttribute(`${kind.key}_priceEur`, "name")}${addAttribute(moneyInput(config[kind.key].priceCents), "value")}> </label> <label class="flex items-end rounded-3xl border border-white/10 bg-[#0b1120]/60 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox"${addAttribute(`${kind.key}_active`, "name")}${addAttribute(config[kind.key].active, "checked")}> <div> <div class="text-sm font-semibold text-white">Publicado</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Controla si esta variante se muestra en la página pública.
</p> </div> </div> </label> </div> </article>`)} </div> <div class="mt-6"> <button class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400" type="submit">
Guardar configuración del menú
</button> </div> </form> </section> <section class="mt-6 space-y-6"> ${KINDS.map((kind) => renderTemplate`<section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-center justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Planner
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Menú ${kind.label.toLowerCase()} </h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"> ${config[kind.key].active ? "Publicado" : "Oculto"} · ${money(config[kind.key].priceCents)} </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-3"> ${COURSES.map((course) => renderTemplate`<section class="rounded-[28px] border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-center justify-between gap-3"> <div> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"> ${course.key} </div> <div class="mt-1 text-sm font-semibold text-white"> ${course.label} </div> </div> <div class="text-sm text-slate-400"> ${planner[kind.key][course.key].length} </div> </div> <div class="mt-4 space-y-3 min-h-16" data-menu-dropzone${addAttribute(kind.key, "data-kind")}${addAttribute(course.key, "data-course")}> ${planner[kind.key][course.key].length === 0 ? renderTemplate`<div class="rounded-2xl border border-dashed border-white/10 bg-white/3 px-4 py-4 text-sm text-slate-500">
Sin platos asignados en este curso.
</div>` : planner[kind.key][course.key].map((item) => renderTemplate`<article draggable="true"${addAttribute(item.assignmentId, "data-menu-assignment-card")}${addAttribute(kind.key, "data-kind")}${addAttribute(course.key, "data-course")} class="rounded-2xl border border-white/10 bg-white/5 p-4 cursor-move"> <div class="flex flex-wrap items-start justify-between gap-3"> <div> <div class="text-sm font-semibold text-white">${item.dishName}</div> ${item.dishDescription ? renderTemplate`<p class="mt-1 text-sm leading-6 text-slate-400"> ${item.dishDescription} </p>` : null} </div> <div class="flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    item.dishActive ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"
  ], "class:list")}> ${item.dishActive ? "Activo" : "Inactivo"} </span> </div> </div> <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"> <div class="text-xs uppercase tracking-[0.14em] text-slate-500">
Arrastrar para reordenar
</div> <form method="post" action="/api/admin/menu-v2"> <input type="hidden" name="intent" value="unassign-dish"> <input type="hidden" name="assignmentId"${addAttribute(item.assignmentId, "value")}> <button type="submit" class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15">
Quitar
</button> </form> </div> </article>`)} </div> </section>`)} </div> </section>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"> <aside class="space-y-6"> <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Nuevo plato de menú
</h2> <form method="post" action="/api/admin/menu-v2" class="mt-6 grid gap-4"> <input type="hidden" name="intent" value="create-dish"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name" placeholder="Canelones de carne gratinados" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Curso
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="course"> <option value="PRIMERO">PRIMERO</option> <option value="SEGUNDO">SEGUNDO</option> <option value="POSTRE">POSTRE</option> </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Descripción
</span> <textarea class="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="description" placeholder="Texto corto para la parte pública del menú"></textarea> </label> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden base
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" min="0" step="1" name="sortOrder"${addAttribute(dishes.length, "value")}> </label> <label class="flex items-end rounded-3xl border border-white/10 bg-[#0b1120]/60 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active" checked> <div> <div class="text-sm font-semibold text-white">Activo</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible para asignar
</p> </div> </div> </label> </div> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Crear plato
</button> </form> </section> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Modelo nuevo del menú
</h2> <div class="mt-6 space-y-4"> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">Separado del catálogo</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Los platos del menú ya no dependen de <code>Product</code>. Tienen su propia biblioteca y su propia asignación.
</p> </div> <div class="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">Dos variantes fijas</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Solo existen <strong>DIARIO</strong> y <strong>FESTIVO</strong>. No hay CRUD de menús infinitos.
</p> </div> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">Migración sin romper</div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${legacyGuidance} </p> </div> </div> </section> </aside> <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Biblioteca
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Platos propios del menú
</h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
Asignación rápida a diario / festivo
</div> </div> <div class="mt-6 space-y-6"> ${COURSES.map((course) => renderTemplate`<section class="rounded-3xl border border-white/10 bg-white/4 p-5"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"> ${course.key} </div> <h3 class="mt-2 text-lg font-semibold text-white"> ${course.label} </h3> </div> <div class="text-sm text-slate-400"> ${dishesByCourse[course.key].length} plato${dishesByCourse[course.key].length === 1 ? "" : "s"} </div> </div> <div class="mt-4 space-y-4"> ${dishesByCourse[course.key].length === 0 ? renderTemplate`<div class="rounded-3xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-400">
No hay platos creados en este curso.
</div>` : dishesByCourse[course.key].map((dish) => {
    const assignedKinds = getAssignedKinds(assignedKindsByDishId, dish.id);
    const assignmentCount = assignmentCountByDishId.get(dish.id) ?? 0;
    const canDelete = assignmentCount === 0;
    return renderTemplate`<article class="rounded-3xl border border-white/10 bg-slate-950/40 p-4"> <div class="flex flex-wrap items-start justify-between gap-3"> <div> <div class="text-sm font-semibold text-white">${dish.name}</div> <div class="mt-1"> <code class="rounded-xl border border-white/10 bg-[#0b1120] px-2.5 py-1.5 text-xs text-slate-300"> ${dish.slug} </code> </div> ${dish.description ? renderTemplate`<p class="mt-3 text-sm leading-6 text-slate-400"> ${dish.description} </p>` : null} </div> <div class="flex flex-wrap gap-2"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
      dish.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"
    ], "class:list")}> ${dish.active ? "Activo" : "Inactivo"} </span> ${assignedKinds.has("DIARIO") ? renderTemplate`<span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">
Diario
</span>` : null} ${assignedKinds.has("FESTIVO") ? renderTemplate`<span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">
Festivo
</span>` : null} </div> </div> <form method="post" action="/api/admin/menu-v2" class="mt-5 grid gap-4"> <input type="hidden" name="intent" value="update-dish"> <input type="hidden" name="dishId"${addAttribute(dish.id, "value")}> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name"${addAttribute(dish.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Curso
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="course"> <option value="PRIMERO"${addAttribute(dish.course === "PRIMERO", "selected")}>PRIMERO</option> <option value="SEGUNDO"${addAttribute(dish.course === "SEGUNDO", "selected")}>SEGUNDO</option> <option value="POSTRE"${addAttribute(dish.course === "POSTRE", "selected")}>POSTRE</option> </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Orden
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" min="0" step="1" name="sortOrder"${addAttribute(dish.sortOrder, "value")}> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Descripción
</span> <textarea class="min-h-24 w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="description">${dish.description ?? ""}</textarea> </label> <div class="flex flex-wrap items-center justify-between gap-3"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(dish.active, "checked")}>
Activo
</label> <div class="flex flex-wrap gap-2"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Guardar plato
</button> </div> </div> </form> <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"> <div class="flex flex-wrap gap-2"> ${["DIARIO", "FESTIVO"].map((kind) => renderTemplate`<form method="post" action="/api/admin/menu-v2"> <input type="hidden" name="intent" value="assign-dish"> <input type="hidden" name="dishId"${addAttribute(dish.id, "value")}> <input type="hidden" name="kind"${addAttribute(kind, "value")}> <button type="submit"${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      assignedKinds.has(kind) ? kind === "DIARIO" ? "border border-sky-400/20 bg-sky-400/10 text-sky-300" : "border border-violet-400/20 bg-violet-400/10 text-violet-300" : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"
    ], "class:list")}> ${assignedKinds.has(kind) ? `Asignado a ${kind === "DIARIO" ? "diario" : "festivo"}` : `A\xF1adir a ${kind === "DIARIO" ? "diario" : "festivo"}`} </button> </form>`)} </div> <form method="post" action="/api/admin/menu-v2"> <input type="hidden" name="intent" value="delete-dish"> <input type="hidden" name="dishId"${addAttribute(dish.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
    ], "class:list")}>
Borrar plato
</button> </form> </div> </article>`;
  })} </div> </section>`)} </div> </section> </section> ` }));
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/menu.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/menu.astro";
const $$url = "/admin/menu";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Menu,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
