import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, l as MenuDish, m as MenuDishAssignment, n as Menu, o as MenuItem, A as AppSetting } from './_astro_db_Bcz5lWRF.mjs';
import { g as getPublicMenuState } from './public_Bt464a34.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Menu = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
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
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
  }
  function moneyInput(cents) {
    return (Number(cents ?? 0) / 100).toFixed(2);
  }
  const config = await getMenuConfig();
  const publicState = await getPublicMenuState();
  const dishRows = await db.select({
    id: MenuDish.id,
    name: MenuDish.name,
    slug: MenuDish.slug,
    createdAt: MenuDish.createdAt,
    updatedAt: MenuDish.updatedAt
  }).from(MenuDish);
  const dishes = [...dishRows].sort((a, b) => {
    const byName = a.name.localeCompare(b.name, "es");
    if (byName !== 0) return byName;
    return a.id - b.id;
  });
  const assignmentRows = await db.select({
    assignmentId: MenuDishAssignment.id,
    kind: MenuDishAssignment.kind,
    course: MenuDishAssignment.course,
    createdAt: MenuDishAssignment.createdAt,
    dishId: MenuDish.id,
    dishName: MenuDish.name,
    dishSlug: MenuDish.slug
  }).from(MenuDishAssignment).innerJoin(MenuDish, eq(MenuDishAssignment.dishId, MenuDish.id));
  const courseOrder = {
    PRIMERO: 1,
    SEGUNDO: 2,
    POSTRE: 3
  };
  const assignments = [...assignmentRows].sort((a, b) => {
    if (a.kind !== b.kind) return a.kind.localeCompare(b.kind, "es");
    const byCourse = courseOrder[a.course] - courseOrder[b.course];
    if (byCourse !== 0) return byCourse;
    const byCreatedAt = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (byCreatedAt !== 0) return byCreatedAt;
    return a.assignmentId - b.assignmentId;
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
    planner[row.kind][row.course].push(row);
  }
  const assignmentByDishAndKind = /* @__PURE__ */ new Map();
  const assignmentCountByDishId = /* @__PURE__ */ new Map();
  for (const row of assignments) {
    assignmentByDishAndKind.set(`${row.dishId}:${row.kind}`, row);
    assignmentCountByDishId.set(
      row.dishId,
      (assignmentCountByDishId.get(row.dishId) ?? 0) + 1
    );
  }
  const totalDishes = dishes.length;
  const assignedDishIds = new Set(assignments.map((row) => row.dishId));
  const assignedDishCount = assignedDishIds.size;
  const unassignedDishCount = totalDishes - assignedDishCount;
  function getKindStats(kind) {
    const rows = assignments.filter((row) => row.kind === kind);
    const byCourse = {
      PRIMERO: 0,
      SEGUNDO: 0,
      POSTRE: 0
    };
    for (const row of rows) {
      byCourse[row.course] += 1;
    }
    const published = config[kind].active && rows.length > 0;
    const reason = !config[kind].active ? "Variante oculta" : rows.length === 0 ? "Sin platos asignados" : "Publicación limpia";
    return {
      totalAssignments: rows.length,
      published,
      reason,
      byCourse
    };
  }
  const kindStats = {
    DIARIO: getKindStats("DIARIO"),
    FESTIVO: getKindStats("FESTIVO")
  };
  const legacyMenus = await db.select({ id: Menu.id }).from(Menu);
  const legacyMenuItems = await db.select({ id: MenuItem.id }).from(MenuItem);
  const canImportLegacy = dishes.length === 0 && assignments.length === 0 && legacyMenus.length > 0 && legacyMenuItems.length > 0;
  const hasV2Data = dishes.length > 0 || assignments.length > 0;
  const legacyMenusCount = legacyMenus.length;
  const legacyMenuItemsCount = legacyMenuItems.length;
  const hasUsableLegacyData = legacyMenusCount > 0 && legacyMenuItemsCount > 0;
  const publishedKinds = KINDS.filter(
    (kind) => config[kind.key].active && assignments.some((row) => row.kind === kind.key)
  );
  const hasPublishedV2Data = publishedKinds.length > 0;
  const hasBlockedV2Transition = hasV2Data && !hasPublishedV2Data && hasUsableLegacyData;
  const publicSourceLabel = publicState.source === "V2" ? "V2 canónico" : publicState.source === "LEGACY" ? "Fallback legacy activo" : "Sin datos publicados";
  const legacyStatusLabel = canImportLegacy ? "Importable" : hasBlockedV2Transition ? "Bloqueado por V2 incompleto" : hasUsableLegacyData ? "Solo respaldo" : "Vacío";
  const legacyGuidance = hasPublishedV2Data ? `La página pública ya queda gobernada por el sistema nuevo. Publicando: ${publishedKinds.map((kind) => kind.label.toLowerCase()).join(" y ")}.` : hasBlockedV2Transition ? "La pública sigue leyendo el menú legacy, pero la importación ya está bloqueada porque existen datos V2 sin variante publicable." : canImportLegacy ? "Todavía puedes importar el contenido legacy al sistema nuevo mientras V2 siga vacío." : hasUsableLegacyData ? "Existe respaldo legacy, pero solo como referencia o importación puntual." : "No hay contenido legacy utilizable.";
  const publicationStateLabel = hasPublishedV2Data ? publishedKinds.map((kind) => kind.label).join(" + ") : hasV2Data ? "Datos sin publicar" : "Vacío";
  const publicationGuidance = hasPublishedV2Data ? "Hay al menos una variante activa con platos asignados, así que la página pública ya puede resolverse desde V2." : hasV2Data ? "Existe biblioteca o asignaciones V2, pero todavía no hay ninguna variante realmente publicable." : "Aún no hay platos ni asignaciones en el sistema nuevo.";
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") ?? "";
  const error = url.searchParams.get("error") ?? "";
  const successMessage = saved === "config" ? "Configuración del menú guardada correctamente." : saved === "dish" ? "Biblioteca de platos actualizada correctamente." : saved === "assignment" ? "Asignaciones del menú actualizadas correctamente." : saved === "import" ? "Menú legacy importado correctamente al sistema nuevo." : "";
  const errorMessage = error === "missing-name" ? "El nombre del plato es obligatorio." : error === "invalid-slug" ? "El slug no es válido." : error === "invalid-dish" ? "El plato indicado no es válido." : error === "dish-not-found" ? "El plato ya no existe." : error === "dish-in-use" ? "No se puede borrar el plato mientras siga asignado a un menú." : error === "invalid-assignment" ? "La asignación indicada no es válida." : error === "assignment-not-found" ? "La asignación ya no existe." : error === "invalid-kind" ? "El tipo de menú no es válido." : error === "invalid-course" ? "El bloque del menú no es válido." : error === "invalid-price" ? "El precio del menú no es válido." : error === "already-v2-data" ? "Ya existe información en el sistema nuevo y no se puede importar encima." : error === "import-failed" ? "No se ha podido importar el menú legacy." : error === "invalid-intent" ? "Acción de menú no válida." : "";
  const summaryCards = [
    {
      label: "Biblioteca",
      value: totalDishes,
      note: `${unassignedDishCount} sin asignar`,
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Asignados",
      value: assignedDishCount,
      note: "Platos presentes en algún menú",
      tone: "border-cyan-400/15 bg-cyan-400/8"
    },
    {
      label: "Diario",
      value: kindStats.DIARIO.totalAssignments,
      note: kindStats.DIARIO.reason,
      tone: kindStats.DIARIO.published ? "border-sky-400/15 bg-sky-400/8" : "border-amber-400/15 bg-amber-400/8"
    },
    {
      label: "Festivo",
      value: kindStats.FESTIVO.totalAssignments,
      note: kindStats.FESTIVO.reason,
      tone: kindStats.FESTIVO.published ? "border-violet-400/15 bg-violet-400/8" : "border-amber-400/15 bg-amber-400/8"
    }
  ];
  return renderTemplate(_a || (_a = __template(["", ` <script>
  (() => {
    const ROOT_SELECTOR = "#menu-admin-ajax-root";
    const PAGE_PATH = "/admin/menu";
    let abortController = null;
    let activeRequestId = 0;

    function getRoot() {
      return document.querySelector(ROOT_SELECTOR);
    }

    function parseHtml(htmlText) {
      return new DOMParser().parseFromString(htmlText, "text/html");
    }

    function setBusy(root, busy) {
      if (!(root instanceof HTMLElement)) return;
      root.classList.toggle("pointer-events-none", busy);
      root.classList.toggle("opacity-80", busy);
      root.setAttribute("aria-busy", busy ? "true" : "false");
    }

    async function swapWithHtmlResponse(response, fallbackUrl) {
      const currentRoot = getRoot();
      if (!currentRoot) {
        window.location.href = fallbackUrl || PAGE_PATH;
        return false;
      }

      const htmlText = await response.text();
      const nextDocument = parseHtml(htmlText);
      const nextRoot = nextDocument.querySelector(ROOT_SELECTOR);

      if (!nextRoot) {
        window.location.href = response.url || fallbackUrl || PAGE_PATH;
        return false;
      }

      currentRoot.innerHTML = nextRoot.innerHTML;
      document.title = nextDocument.title || document.title;
      history.replaceState({}, "", response.url || fallbackUrl || PAGE_PATH);
      initMenuAdmin();
      return true;
    }

    async function fetchAndSwap(url, options = {}) {
      const currentRoot = getRoot();
      if (!currentRoot) {
        window.location.href = typeof url === "string" ? url : PAGE_PATH;
        return false;
      }

      const requestId = ++activeRequestId;
      setBusy(currentRoot, true);

      try {
        const response = await fetch(url, {
          credentials: "same-origin",
          ...options,
          headers: {
            "X-Requested-With": "fetch",
            ...(options.headers || {}),
          },
        });

        if (requestId !== activeRequestId) return false;
        return await swapWithHtmlResponse(
          response,
          typeof url === "string" ? url : PAGE_PATH,
        );
      } catch {
        window.location.href = typeof url === "string" ? url : PAGE_PATH;
        return false;
      } finally {
        const latestRoot = getRoot();
        if (latestRoot) {
          setBusy(latestRoot, false);
        }
      }
    }

    function attachAjaxForms(root, signal) {
      root.addEventListener(
        "submit",
        async (event) => {
          const form = event.target;
          if (!(form instanceof HTMLFormElement)) return;

          const action = form.getAttribute("action") || "";
          if (!action.startsWith("/api/admin/menu-v2")) return;

          event.preventDefault();

          const submitter = event.submitter;
          const submitButtons = Array.from(
            form.querySelectorAll(
              'button[type="submit"], input[type="submit"]',
            ),
          );

          submitButtons.forEach((button) => {
            button.setAttribute("disabled", "disabled");
          });

          try {
            const formData = submitter
              ? new FormData(form, submitter)
              : new FormData(form);

            const response = await fetch(action, {
              method: "POST",
              body: formData,
              credentials: "same-origin",
              headers: {
                "X-Requested-With": "fetch",
              },
            });

            await swapWithHtmlResponse(response, PAGE_PATH);
          } catch {
            window.location.href = PAGE_PATH;
          }
        },
        { signal },
      );
    }

    function attachDragAndDrop(root, signal) {
      const state = {
        type: null,
        dishId: null,
        assignmentId: null,
        sourceKind: null,
        sourceCourse: null,
        draggedEl: null,
      };

      const zones = Array.from(root.querySelectorAll("[data-menu-dropzone]"));

      function resetState() {
        if (state.draggedEl instanceof Element) {
          state.draggedEl.classList.remove("opacity-60");
        }

        zones.forEach((zone) => {
          zone.classList.remove("ring-2", "ring-sky-400/30");
        });

        state.type = null;
        state.dishId = null;
        state.assignmentId = null;
        state.sourceKind = null;
        state.sourceCourse = null;
        state.draggedEl = null;
      }

      function encode(params) {
        return new URLSearchParams(params).toString();
      }

      document.addEventListener(
        "dragstart",
        (event) => {
          const target = event.target;
          if (!(target instanceof Element)) return;

          const assignmentCard = target.closest("[data-menu-assignment-card]");
          const dishCard = target.closest("[data-menu-dish-card]");

          if (assignmentCard && root.contains(assignmentCard)) {
            state.type = "assignment";
            state.assignmentId = assignmentCard.getAttribute(
              "data-menu-assignment-card",
            );
            state.sourceKind = assignmentCard.getAttribute("data-kind");
            state.sourceCourse = assignmentCard.getAttribute("data-course");
            state.draggedEl = assignmentCard;
            assignmentCard.classList.add("opacity-60");

            if (event.dataTransfer) {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData(
                "text/plain",
                state.assignmentId || "",
              );
            }

            return;
          }

          if (dishCard && root.contains(dishCard)) {
            state.type = "dish";
            state.dishId = dishCard.getAttribute("data-menu-dish-card");
            state.draggedEl = dishCard;
            dishCard.classList.add("opacity-60");

            if (event.dataTransfer) {
              event.dataTransfer.effectAllowed = "copyMove";
              event.dataTransfer.setData("text/plain", state.dishId || "");
            }
          }
        },
        { signal },
      );

      document.addEventListener(
        "dragend",
        () => {
          resetState();
        },
        { signal },
      );

      zones.forEach((zone) => {
        zone.addEventListener(
          "dragover",
          (event) => {
            if (!state.type) return;
            event.preventDefault();
            zone.classList.add("ring-2", "ring-sky-400/30");
          },
          { signal },
        );

        zone.addEventListener(
          "dragleave",
          () => {
            zone.classList.remove("ring-2", "ring-sky-400/30");
          },
          { signal },
        );

        zone.addEventListener(
          "drop",
          async (event) => {
            if (!state.type) return;
            event.preventDefault();

            const kind = zone.getAttribute("data-kind") || "";
            const course = zone.getAttribute("data-course") || "";

            zone.classList.remove("ring-2", "ring-sky-400/30");

            if (state.type === "assignment") {
              if (state.sourceKind === kind && state.sourceCourse === course) {
                resetState();
                return;
              }

              try {
                await fetchAndSwap("/api/admin/menu-v2", {
                  method: "POST",
                  headers: {
                    "content-type":
                      "application/x-www-form-urlencoded;charset=UTF-8",
                  },
                  body: encode({
                    intent: "move-assignment",
                    assignmentId: String(state.assignmentId || ""),
                    kind,
                    course,
                  }),
                });
              } catch {
                window.location.href = PAGE_PATH;
              } finally {
                resetState();
              }

              return;
            }

            if (state.type === "dish") {
              try {
                await fetchAndSwap("/api/admin/menu-v2", {
                  method: "POST",
                  headers: {
                    "content-type":
                      "application/x-www-form-urlencoded;charset=UTF-8",
                  },
                  body: encode({
                    intent: "assign-dish",
                    dishId: String(state.dishId || ""),
                    kind,
                    course,
                  }),
                });
              } catch {
                window.location.href = PAGE_PATH;
              } finally {
                resetState();
              }
            }
          },
          { signal },
        );
      });
    }

    function initMenuAdmin() {
      if (abortController) {
        abortController.abort();
      }

      const root = getRoot();
      if (!root) return;

      abortController = new AbortController();
      const { signal } = abortController;

      attachAjaxForms(root, signal);
      attachDragAndDrop(root, signal);
    }

    initMenuAdmin();
  })();
<\/script>`])), renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Menú · Admin · Arcadia", "heading": "Menú del día", "description": "Sistema nuevo del menú diario y festivo, separado del catálogo real y basado en biblioteca neutra + asignaciones.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/menu" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver página pública
</a> <a href="/admin" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Volver al dashboard
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  <div id="menu-admin-ajax-root" data-menu-admin-root> ${successMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200"> ${successMessage} </section>` : null} ${errorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null} ${hasBlockedV2Transition ? renderTemplate`<section class="mb-6 rounded-3xl border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100">
Hay datos en V2, pero todavía no existe una variante publicable. La
          página pública sigue leyendo el menú legacy y la importación ya está
          bloqueada porque el sistema nuevo no está vacío.
</section>` : null} <section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${card.label} </div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white"> ${card.value} </div> <p class="mt-2 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300">
Configuración fija
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Menú diario y festivo
</h2> <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
Ya no existen múltiples menús editables. Aquí solo configuras las
            dos variantes reales del negocio y su precio. Los platos viven en
            una biblioteca neutra y se publican únicamente cuando están
            asignados.
</p> </div> <div class="flex flex-wrap gap-3"> ${canImportLegacy ? renderTemplate`<form method="post" action="/api/admin/menu-v2"> <input type="hidden" name="intent" value="import-legacy"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:border-amber-400/30 hover:bg-amber-400/15">
Importar menú legacy
</button> </form>` : null} <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
Separado completamente del catálogo real
</div> </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-3"> <article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Fuente pública actual
</div> <div class="mt-3 text-lg font-semibold tracking-tight text-white"> ${publicSourceLabel} </div> <p class="mt-2 text-sm leading-6 text-slate-400">${legacyGuidance}</p> </article> <article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Legacy detectado
</div> <div class="mt-3 text-lg font-semibold tracking-tight text-white"> ${legacyStatusLabel} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${legacyMenusCount} menús legacy · ${legacyMenuItemsCount} items legacy.
</p> </article> <article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Publicación V2
</div> <div class="mt-3 text-lg font-semibold tracking-tight text-white"> ${publicationStateLabel} </div> <p class="mt-2 text-sm leading-6 text-slate-400"> ${publicationGuidance} </p> </article> </div> <form method="post" action="/api/admin/menu-v2" class="mt-6"> <input type="hidden" name="intent" value="save-config"> <div class="grid gap-6 xl:grid-cols-2"> ${KINDS.map((kind) => renderTemplate`<article class="rounded-[28px] border border-white/10 bg-slate-950/40 p-5"> <div class="flex items-start justify-between gap-3"> <div> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    kind.tone
  ], "class:list")}> ${kind.label} </span> <h3 class="mt-3 text-lg font-semibold text-white">
Menú ${kind.label.toLowerCase()} </h3> </div> <div class="text-right"> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">
Precio actual
</div> <div class="mt-1 text-lg font-semibold text-white"> ${money(config[kind.key].priceCents)} </div> </div> </div> <div class="mt-5 grid gap-4 sm:grid-cols-[180px_auto]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Precio €
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" min="0" step="0.01"${addAttribute(`${kind.key}_priceEur`, "name")}${addAttribute(moneyInput(config[kind.key].priceCents), "value")}> </label> <label class="flex items-end rounded-3xl border border-white/10 bg-[#0b1120]/60 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox"${addAttribute(`${kind.key}_active`, "name")}${addAttribute(config[kind.key].active, "checked")}> <div> <div class="text-sm font-semibold text-white">
Publicado
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Controla si esta variante se muestra en la página
                          pública.
</p> </div> </div> </label> </div> </article>`)} </div> <div class="mt-6"> <button class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400" type="submit">
Guardar configuración del menú
</button> </div> </form> </section> <section class="mt-6 space-y-6"> ${KINDS.map((kind) => renderTemplate`<section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-center justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Planner
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Menú ${kind.label.toLowerCase()} </h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"> <div> ${config[kind.key].active ? "Publicado" : "Oculto"} ·${" "} ${money(config[kind.key].priceCents)} </div> <div class="mt-1 text-xs text-slate-500"> ${kindStats[kind.key].totalAssignments} asignaciones ·${" "} ${kindStats[kind.key].reason} </div> </div> </div> <div class="mt-6 grid gap-4 xl:grid-cols-3"> ${COURSES.map((course) => renderTemplate`<section${addAttribute([
    "rounded-[28px] border p-4",
    kindStats[kind.key].byCourse[course.key] > 0 ? "border-white/10 bg-slate-950/40" : "border-white/10 bg-slate-950/25"
  ], "class:list")}> <div class="flex items-center justify-between gap-3"> <div> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"> ${course.key} </div> <div class="mt-1 text-sm font-semibold text-white"> ${course.label} </div> </div> <div class="text-sm font-semibold text-slate-300"> ${kindStats[kind.key].byCourse[course.key]} </div> </div> <div data-menu-dropzone${addAttribute(kind.key, "data-kind")}${addAttribute(course.key, "data-course")} class="mt-4 min-h-[180px] rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-3 transition"> ${planner[kind.key][course.key].length === 0 ? renderTemplate`<div class="flex min-h-[148px] items-center justify-center rounded-[20px] border border-white/10 bg-slate-950/30 px-4 text-center text-sm leading-6 text-slate-500">
Arrastra platos aquí o usa la asignación rápida desde la
                        biblioteca.
</div>` : renderTemplate`<div class="space-y-3"> ${planner[kind.key][course.key].map((item) => renderTemplate`<article draggable="true"${addAttribute(item.assignmentId, "data-menu-assignment-card")}${addAttribute(item.kind, "data-kind")}${addAttribute(item.course, "data-course")} class="cursor-grab rounded-2xl border border-white/10 bg-white/[0.05] p-4 active:cursor-grabbing"> <div class="flex flex-wrap items-start justify-between gap-3"> <div class="min-w-0 flex-1"> <div class="text-sm font-semibold text-white"> ${item.dishName} </div> <div class="mt-1"> <code class="rounded-xl border border-white/10 bg-[#0b1120] px-2.5 py-1.5 text-xs text-slate-300"> ${item.dishSlug} </code> </div> </div> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    kind.key === "DIARIO" ? "border-sky-400/20 bg-sky-400/10 text-sky-300" : "border-violet-400/20 bg-violet-400/10 text-violet-300"
  ], "class:list")}> ${course.label} </span> </div> <div class="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3"> <div class="text-xs uppercase tracking-[0.14em] text-slate-500">
Arrastrar para mover
</div> <form method="post" action="/api/admin/menu-v2"> <input type="hidden" name="intent" value="unassign-dish"> <input type="hidden" name="assignmentId"${addAttribute(item.assignmentId, "value")}> <button type="submit" class="inline-flex items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-3 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15">
Quitar
</button> </form> </div> </article>`)} </div>`} </div> </section>`)} </div> </section>`)} </section> <section class="mt-6 space-y-6"> <div class="grid gap-6 xl:grid-cols-2"> <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Nuevo plato de biblioteca
</h2> <form method="post" action="/api/admin/menu-v2" class="mt-6 grid gap-4"> <input type="hidden" name="intent" value="create-dish"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name" placeholder="Canelones de carne gratinados" required> </label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Crear plato
</button> </form> </section> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Modelo nuevo del menú
</h2> <div class="mt-6 space-y-4"> <div class="rounded-3xl border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">
Biblioteca neutra
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
El plato no tiene ni curso, ni activo, ni descripción, ni orden.
                Solo existe en biblioteca.
</p> </div> <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">
Publicar = asignar
</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
Un plato cuenta solo cuando está asignado a <strong>DIARIO</strong> o <strong>FESTIVO</strong> y dentro de <strong>PRIMERO</strong>, <strong>SEGUNDO</strong> o <strong>POSTRE</strong>.
</p> </div> <div class="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">
Mover es cambiar asignación
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Si arrastras un plato entre columnas, cambias su curso o su
                menú, no el plato de biblioteca.
</p> </div> </div> </section> </div> <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-end justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Biblioteca
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Platos del menú
</h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
Arrastra al planner o usa asignación rápida
</div> </div> <div class="mt-6 grid gap-6 xl:grid-cols-3"> ${dishes.length === 0 ? renderTemplate`<div class="xl:col-span-3 rounded-3xl border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-400">
Todavía no hay platos en la biblioteca del menú.
</div>` : dishes.map((dish) => {
    const diarioAssignment = assignmentByDishAndKind.get(`${dish.id}:DIARIO`) ?? null;
    const festivoAssignment = assignmentByDishAndKind.get(`${dish.id}:FESTIVO`) ?? null;
    const assignmentCount = assignmentCountByDishId.get(dish.id) ?? 0;
    const canDelete = assignmentCount === 0;
    return renderTemplate`<article draggable="true"${addAttribute(dish.id, "data-menu-dish-card")} class="cursor-grab rounded-3xl border border-white/10 bg-slate-950/40 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.14)] active:cursor-grabbing"> <div class="flex flex-wrap items-start justify-between gap-3"> <div class="min-w-0 flex-1"> <div class="text-sm font-semibold text-white"> ${dish.name} </div> <div class="mt-1"> <code class="rounded-xl border border-white/10 bg-[#0b1120] px-2.5 py-1.5 text-xs text-slate-300"> ${dish.slug} </code> </div> </div> <div class="flex flex-wrap gap-2"> ${diarioAssignment ? renderTemplate`<span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300">
Diario · ${diarioAssignment.course} </span>` : null} ${festivoAssignment ? renderTemplate`<span class="inline-flex items-center rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-violet-300">
Festivo · ${festivoAssignment.course} </span>` : null} ${!diarioAssignment && !festivoAssignment ? renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
Sin asignar
</span>` : null} </div> </div> <form method="post" action="/api/admin/menu-v2" class="mt-5 grid gap-4"> <input type="hidden" name="intent" value="update-dish"> <input type="hidden" name="dishId"${addAttribute(dish.id, "value")}> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name"${addAttribute(dish.name, "value")} required> </label> <div class="flex justify-end"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Guardar plato
</button> </div> </form> <div class="mt-4 grid gap-4 border-t border-white/10 pt-4"> <form method="post" action="/api/admin/menu-v2" class="grid gap-3"> <input type="hidden" name="intent" value="assign-dish"> <input type="hidden" name="dishId"${addAttribute(dish.id, "value")}> <input type="hidden" name="kind" value="DIARIO"> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Diario
</div> <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="course"> ${COURSES.map((course) => renderTemplate`<option${addAttribute(course.key, "value")}${addAttribute(
      (diarioAssignment?.course ?? "PRIMERO") === course.key,
      "selected"
    )}> ${course.label} </option>`)} </select> <button type="submit"${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      diarioAssignment ? "border border-sky-400/20 bg-sky-400/10 text-sky-300 hover:border-sky-400/30 hover:bg-sky-400/15" : "bg-sky-500 text-slate-950 hover:bg-sky-400"
    ], "class:list")}> ${diarioAssignment ? "Mover diario" : "Añadir diario"} </button> </div> </form> <form method="post" action="/api/admin/menu-v2" class="grid gap-3"> <input type="hidden" name="intent" value="assign-dish"> <input type="hidden" name="dishId"${addAttribute(dish.id, "value")}> <input type="hidden" name="kind" value="FESTIVO"> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Festivo
</div> <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-violet-400/40 focus:outline-none" name="course"> ${COURSES.map((course) => renderTemplate`<option${addAttribute(course.key, "value")}${addAttribute(
      (festivoAssignment?.course ?? "PRIMERO") === course.key,
      "selected"
    )}> ${course.label} </option>`)} </select> <button type="submit"${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      festivoAssignment ? "border border-violet-400/20 bg-violet-400/10 text-violet-300 hover:border-violet-400/30 hover:bg-violet-400/15" : "bg-violet-400 text-slate-950 hover:bg-violet-300"
    ], "class:list")}> ${festivoAssignment ? "Mover festivo" : "Añadir festivo"} </button> </div> </form> <div class="border-t border-white/10 pt-4"> <form method="post" action="/api/admin/menu-v2"> <input type="hidden" name="intent" value="delete-dish"> <input type="hidden" name="dishId"${addAttribute(dish.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
    ], "class:list")}>
Borrar plato
</button> </form> </div> </div> </article>`;
  })} </div> </section> </section> </div> ` }));
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/menu.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/menu.astro";
const $$url = "/admin/menu";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Menu,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
