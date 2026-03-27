import { e as createComponent, m as maybeRenderHead, g as addAttribute, r as renderTemplate, h as createAstro, p as renderSlot, k as renderComponent, o as renderHead } from './astro/server_CA5VZefa.mjs';
import 'piccolore';
/* empty css                        */
import 'clsx';
/* empty css                        */

const $$Astro$1 = createAstro();
const $$AdminSidebar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$AdminSidebar;
  const { currentPath, user = null } = Astro2.props;
  const navGroups = [
    {
      title: "General",
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          description: "Resumen operativo del d\xEDa"
        }
      ]
    },
    {
      title: "Operativa",
      items: [
        {
          href: "/admin/pedidos",
          label: "Pedidos",
          description: "Lista y seguimiento"
        },
        {
          href: "/admin/cocina",
          label: "Cocina",
          description: "Board en tiempo real"
        },
        {
          href: "/admin/operativa",
          label: "Operativa",
          description: "Horarios, flags y pausas"
        }
      ]
    },
    {
      title: "Cat\xE1logo",
      items: [
        {
          href: "/admin/catalogo/productos",
          label: "Productos",
          description: "Listado real del men\xFA"
        },
        {
          href: "/admin/catalogo/ingredientes",
          label: "Ingredientes",
          description: "Extras y base global"
        },
        {
          href: "/admin/catalogo/compatibilidades",
          label: "Compatibilidades",
          description: "Categor\xEDa \u2194 ingrediente"
        },
        {
          href: "/admin/catalogo/modificadores",
          label: "Modificadores",
          description: "Grupos y opciones"
        },
        {
          href: "/admin/catalogo/alergenos",
          label: "Al\xE9rgenos",
          description: "Iconos y cat\xE1logo visual"
        },
        {
          href: "/admin/categorias",
          label: "Categor\xEDas",
          description: "Estructura base"
        },
        {
          href: "/admin/menu",
          label: "Men\xFA",
          description: "Diario y festivo"
        },
        {
          href: "/admin/upsell",
          label: "Upsell",
          description: "Venta sugerida"
        }
      ]
    },
    {
      title: "Clientes",
      items: [
        {
          href: "/admin/usuarios",
          label: "Usuarios",
          description: "Clientes, direcciones y loyalty"
        },
        {
          href: "/admin/loyalty",
          label: "Loyalty",
          description: "Tiers y reglas de puntos"
        },
        {
          href: "/admin/newsletter",
          label: "Newsletter",
          description: "Suscriptores y env\xEDo manual"
        }
      ]
    },
    {
      title: "Ajustes",
      items: [
        {
          href: "/admin/cupones",
          label: "Cupones",
          description: "Descuentos y promociones"
        },
        {
          href: "/admin/ajustes/pagos",
          label: "Pagos",
          description: "M\xE9todos disponibles"
        },
        {
          href: "/admin/ajustes/fees",
          label: "Fees",
          description: "Tarifas activas"
        }
      ]
    }
  ];
  function isActive(href, pathname) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  const displayName = user?.name?.trim() || user?.email?.trim() || "Sesi\xF3n admin";
  const displayRole = user?.role?.trim() || "STAFF";
  return renderTemplate`${maybeRenderHead()}<aside data-admin-sidebar class="hidden xl:flex xl:w-72 xl:flex-col xl:transition-[width] xl:duration-200 xl:ease-out"> <div class="sticky top-4 flex h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#111827] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.45)]"> <div data-admin-sidebar-top class="border-b border-white/10 px-6 py-6 transition-all duration-200"> <a href="/admin" class="block"> <div data-admin-sidebar-logo-wrap class="flex items-center gap-3"> <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10"> <img src="/ARCADIA_LOGO_WHITE.svg" alt="Arcadia" class="h-6 w-6 object-contain"> </div> <div data-admin-sidebar-brand-text class="min-w-0"> <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
Arcadia
</div> <div class="truncate text-base font-semibold text-white">
Admin Panel
</div> </div> </div> </a> </div> <div data-admin-sidebar-session class="border-b border-white/10 px-6 py-5 transition-all duration-200"> <div class="rounded-2xl border border-white/10 bg-white/5 p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
Sesión activa
</div> <div class="mt-2 truncate text-sm font-semibold text-white"> ${displayName} </div> <div class="mt-1 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300"> <span class="h-1.5 w-1.5 rounded-full bg-emerald-300"></span> ${displayRole} </div> </div> </div> <nav data-admin-sidebar-nav class="flex-1 overflow-y-auto px-4 py-5 transition-all duration-200"> <div class="space-y-6"> ${navGroups.map((group) => renderTemplate`<section> <div data-admin-sidebar-group-title class="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${group.title} </div> <div class="mt-3 space-y-1.5"> ${group.items.map((item) => {
    const active = isActive(item.href, currentPath);
    return renderTemplate`<a data-admin-sidebar-item${addAttribute(item.href, "href")}${addAttribute(item.label, "title")}${addAttribute([
      "group block rounded-2xl border px-4 py-3 transition-all duration-200",
      active ? "border-sky-400/30 bg-sky-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5"
    ], "class:list")}> <div data-admin-sidebar-item-row class="flex items-start gap-3 transition-all duration-200"> <span data-admin-sidebar-item-dot${addAttribute([
      "mt-1 h-2.5 w-2.5 shrink-0 rounded-full transition-all duration-200",
      active ? "bg-sky-300 shadow-[0_0_0_5px_rgba(125,211,252,0.08)]" : "bg-slate-600 group-hover:bg-slate-400"
    ], "class:list")}></span> <div data-admin-sidebar-item-copy class="min-w-0"> <div${addAttribute([
      "text-sm font-semibold transition",
      active ? "text-white" : "text-slate-200 group-hover:text-white"
    ], "class:list")}> ${item.label} </div> <div${addAttribute([
      "mt-1 text-xs transition",
      active ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"
    ], "class:list")}> ${item.description} </div> </div> </div> </a>`;
  })} </div> </section>`)} </div> </nav> <div class="border-t border-white/10 px-4 py-4"> <form method="post" action="/api/admin/logout"> <button type="submit" class="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Cerrar sesión
</button> </form> </div> </div> </aside>`;
}, "C:/Users/VICTOR/Dev/arcadia/src/components/admin/AdminSidebar.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro = createAstro();
const $$AdminLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$AdminLayout;
  const {
    title = "Admin \xB7 Arcadia",
    heading,
    description,
    actions = false
  } = Astro2.props;
  const user = Astro2.locals.user;
  const pathname = Astro2.url.pathname;
  const pageHeading = heading ?? "Admin";
  const pageDescription = description ?? "";
  const pageTitle = title;
  function initialsFromUser(value) {
    const base = value?.name?.trim() || value?.email?.trim() || "A";
    const clean = base.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ]/g, "").trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
    }
    return clean.slice(0, 2).toUpperCase() || "A";
  }
  const userInitials = initialsFromUser(user);
  const displayName = user?.name?.trim() || user?.email?.trim() || "Sesi\xF3n admin";
  const displayRole = user?.role?.trim() || "STAFF";
  return renderTemplate(_a || (_a = __template(['<html lang="es"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><link rel="icon" type="image/svg+xml" href="/ARCADIA_LOGO.svg"><title>', "</title>", '</head> <body class="min-h-dvh bg-[#0b1120] text-slate-100 antialiased"> <div id="admin-shell" data-sidebar-collapsed="false" class="min-h-dvh bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_28%),linear-gradient(180deg,#0b1120_0%,#111827_100%)]"> <div class="mx-auto flex w-full max-w-480 gap-6 px-4 py-4 sm:px-6 sm:py-6 2xl:px-8"> ', ' <div class="min-w-0 flex-1"> <header class="sticky top-4 z-20 mb-6 rounded-[28px] border border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur xl:px-6"> <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"> <div class="min-w-0"> <div class="flex items-center gap-3"> <button type="button" id="admin-sidebar-toggle" class="hidden xl:inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white" aria-label="Contraer o expandir sidebar" aria-pressed="false" title="Contraer o expandir sidebar"> <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"> <path d="M4 6h16"></path> <path d="M4 12h16"></path> <path d="M4 18h16"></path> </svg> </button> <div class="min-w-0"> <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">\nArcadia \xB7 Administraci\xF3n\n</div> <h1 class="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-[2rem]"> ', " </h1> </div> </div> ", ' </div> <div class="flex flex-wrap items-center gap-3"> <div class="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 md:flex md:items-center md:gap-3"> <div class="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-400/15 text-sm font-bold text-sky-300 ring-1 ring-sky-300/15"> ', ' </div> <div class="min-w-0"> <div class="truncate text-sm font-semibold text-white"> ', ' </div> <div class="text-xs uppercase tracking-[0.16em] text-slate-400"> ', ' </div> </div> </div> <form method="post" action="/api/admin/logout"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">\nCerrar sesi\xF3n\n</button> </form> </div> </div> ', ' </header> <main class="pb-10"> ', ' </main> </div> </div> </div>  <script>\n      (() => {\n        const root = document.getElementById("admin-shell");\n        const toggle = document.getElementById("admin-sidebar-toggle");\n        if (!root || !toggle) return;\n\n        const storageKey = "arcadia-admin-sidebar-collapsed";\n\n        function readState() {\n          try {\n            return window.localStorage.getItem(storageKey) === "1";\n          } catch {\n            return false;\n          }\n        }\n\n        function writeState(collapsed) {\n          try {\n            window.localStorage.setItem(storageKey, collapsed ? "1" : "0");\n          } catch {\n            // noop\n          }\n        }\n\n        function applyState(collapsed) {\n          root.setAttribute("data-sidebar-collapsed", collapsed ? "true" : "false");\n          toggle.setAttribute("aria-pressed", collapsed ? "true" : "false");\n          toggle.setAttribute(\n            "title",\n            collapsed ? "Expandir sidebar" : "Contraer sidebar"\n          );\n        }\n\n        let collapsed = readState();\n        applyState(collapsed);\n\n        toggle.addEventListener("click", () => {\n          collapsed = !collapsed;\n          writeState(collapsed);\n          applyState(collapsed);\n        });\n      })();\n    <\/script> </body> </html>'])), addAttribute(Astro2.generator, "content"), pageTitle, renderHead(), renderComponent($$result, "AdminSidebar", $$AdminSidebar, { "currentPath": pathname, "user": user }), pageHeading, pageDescription ? renderTemplate`<p class="mt-3 max-w-4xl text-sm leading-6 text-slate-400"> ${pageDescription} </p>` : null, userInitials, displayName, displayRole, actions ? renderTemplate`<div class="mt-4"> ${renderSlot($$result, $$slots["actions"])} </div>` : null, renderSlot($$result, $$slots["default"]));
}, "C:/Users/VICTOR/Dev/arcadia/src/layouts/AdminLayout.astro", void 0);

export { $$AdminLayout as $ };
