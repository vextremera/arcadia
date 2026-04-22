import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { B as maybeRenderHead, a4 as addAttribute, F as Fragment, T as renderTemplate, D as renderSlot, ba as renderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
/* empty css                 */

const $$AdminSidebar = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$AdminSidebar;
  const { currentPath } = Astro2.props;
  const navGroups = [
    {
      title: "General",
      items: [
        {
          href: "/admin",
          label: "Dashboard",
          description: "Resumen operativo del día",
          icon: "dashboard"
        },
        {
          href: "/admin/audit",
          label: "Audit",
          description: "Trazabilidad de cambios",
          icon: "audit"
        }
      ]
    },
    {
      title: "Operativa",
      items: [
        {
          href: "/admin/pedidos",
          label: "Pedidos",
          description: "Lista y seguimiento",
          icon: "orders"
        },
        {
          href: "/admin/cocina",
          label: "Cocina",
          description: "Board en tiempo real",
          icon: "kitchen"
        },
        {
          href: "/admin/operativa",
          label: "Operativa",
          description: "Horarios, flags y pausas",
          icon: "ops"
        }
      ]
    },
    {
      title: "Catálogo",
      items: [
        {
          href: "/admin/catalogo/productos",
          label: "Productos",
          description: "Listado real del menú",
          icon: "products"
        },
        {
          href: "/admin/catalogo/ingredientes",
          label: "Ingredientes",
          description: "Extras y base global",
          icon: "ingredients"
        },
        {
          href: "/admin/catalogo/compatibilidades",
          label: "Compatibilidades",
          description: "Categoría ↔ ingrediente",
          icon: "compatibility"
        },
        {
          href: "/admin/catalogo/modificadores",
          label: "Modificadores",
          description: "Grupos y opciones",
          icon: "modifiers"
        },
        {
          href: "/admin/catalogo/alergenos",
          label: "Alérgenos",
          description: "Iconos y catálogo visual",
          icon: "allergens"
        },
        {
          href: "/admin/categorias",
          label: "Categorías",
          description: "Estructura base",
          icon: "categories"
        },
        {
          href: "/admin/menu",
          label: "Menú",
          description: "Diario y festivo",
          icon: "menu"
        },
        {
          href: "/admin/upsell",
          label: "Upsell",
          description: "Venta sugerida",
          icon: "upsell"
        }
      ]
    },
    {
      title: "Clientes",
      items: [
        {
          href: "/admin/usuarios",
          label: "Usuarios",
          description: "Clientes, direcciones y loyalty",
          icon: "users"
        },
        {
          href: "/admin/loyalty",
          label: "Loyalty",
          description: "Tiers y reglas de puntos",
          icon: "loyalty"
        },
        {
          href: "/admin/newsletter",
          label: "Newsletter",
          description: "Suscriptores y envío manual",
          icon: "newsletter"
        }
      ]
    },
    {
      title: "Ajustes",
      items: [
        {
          href: "/admin/cupones",
          label: "Cupones",
          description: "Descuentos y promociones",
          icon: "coupons"
        },
        {
          href: "/admin/ajustes/pagos",
          label: "Pagos",
          description: "Métodos disponibles",
          icon: "payments"
        },
        {
          href: "/admin/ajustes/fees",
          label: "Fees",
          description: "Tarifas activas",
          icon: "fees"
        }
      ]
    }
  ];
  function isActive(href, pathname) {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  }
  return renderTemplate`${maybeRenderHead()}<aside data-admin-sidebar class="hidden h-dvh w-[var(--admin-sidebar-width)] shrink-0 bg-[#0b1220] text-slate-100 xl:flex xl:flex-col xl:transition-[width] xl:duration-200 xl:ease-out"> <div class="flex h-dvh flex-col overflow-hidden"> <div data-admin-sidebar-top class="shrink-0 border-b border-white/[0.08] px-4 py-4 transition-all duration-200"> <div data-admin-sidebar-brand-row class="flex items-center justify-between gap-3 transition-all duration-200"> <a href="/admin" data-admin-sidebar-brand-link class="min-w-0 flex-1"> <div data-admin-sidebar-brand-inner class="flex items-center gap-3"> <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]"> <img src="/ARCADIA_LOGO_WHITE.svg" alt="Arcadia" class="h-6 w-6 object-contain"> </div> <div data-admin-sidebar-brand-text class="min-w-0"> <div class="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">
Arcadia
</div> <div class="mt-1 truncate text-base font-semibold text-white">
Admin Panel
</div> </div> </div> </a> <button type="button" id="admin-sidebar-toggle" data-admin-sidebar-toggle class="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-300 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white" aria-label="Contraer sidebar" aria-pressed="false" title="Contraer sidebar"> <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"> <rect x="3" y="4" width="18" height="16" rx="2"></rect> <path d="M9 4v16"></path> <path d="m14 9 3 3-3 3"></path> </svg> </button> </div> </div> <nav data-admin-sidebar-nav class="min-h-0 flex-1 overflow-y-auto px-3 py-5 transition-all duration-200"> <div class="space-y-6"> ${navGroups.map((group) => renderTemplate`<section> <div data-admin-sidebar-group-title class="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600"> ${group.title} </div> <div class="mt-3 space-y-1.5"> ${group.items.map((item) => {
    const active = isActive(item.href, currentPath);
    return renderTemplate`<a data-admin-sidebar-item${addAttribute(item.href, "href")}${addAttribute(item.label, "title")}${addAttribute([
      "group block rounded-[22px] border px-4 py-3.5 transition-all duration-200",
      active ? "border-sky-400/15 bg-sky-400/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]" : "border-transparent bg-transparent hover:border-white/[0.08] hover:bg-white/[0.03]"
    ], "class:list")}> <div data-admin-sidebar-item-row class="flex items-start gap-3 transition-all duration-200"> <span data-admin-sidebar-item-icon${addAttribute([
      "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all duration-200",
      active ? "border-sky-300/15 bg-sky-300/10 text-sky-200" : "border-white/[0.08] bg-white/[0.03] text-slate-400 group-hover:border-white/12 group-hover:bg-white/[0.05] group-hover:text-slate-200"
    ], "class:list")}> <svg viewBox="0 0 24 24" class="h-[18px] w-[18px]" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"> ${item.icon === "dashboard" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M4 13h7V4H4z"></path> <path d="M13 20h7v-9h-7z"></path> <path d="M13 11h7V4h-7z"></path> <path d="M4 20h7v-5H4z"></path> ` })}`} ${item.icon === "audit" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M12 3a7 7 0 1 0 7 7"></path> <path d="M12 7v5l3 3"></path> <path d="M17 3h4v4"></path> <path d="M21 3l-5 5"></path> ` })}`} ${item.icon === "orders" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M5 6h14"></path> <path d="M5 12h14"></path> <path d="M5 18h9"></path> <path d="M18 17.5 20.5 20 23 17.5"></path> ` })}`} ${item.icon === "kitchen" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M7 4v8"></path> <path d="M10 4v8"></path> <path d="M7 8h3"></path> <path d="M17 4v16"></path> <path d="M17 11c2.5 0 3-2.5 3-4V4"></path> ` })}`} ${item.icon === "ops" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <circle cx="12" cy="12" r="3"></circle> <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 1-2 0 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 1 0-2 1.7 1.7 0 0 0 .6-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 1 2 0 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c0 .38.21.74.6 1a1.7 1.7 0 0 1 0 2c-.39.26-.6.62-.6 1Z"></path> ` })}`} ${item.icon === "products" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="m7.5 4.5 9 4.5-9 4.5L3 9l4.5-4.5Z"></path> <path d="M3 9v6l4.5 4.5V13.5"></path> <path d="M16.5 9v6L12 19.5"></path> ` })}`} ${item.icon === "ingredients" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M12 3c-1.5 3-5 4.5-5 9a5 5 0 1 0 10 0c0-4.5-3.5-6-5-9Z"></path> <path d="M10 14c.5.7 1.2 1 2 1"></path> ` })}`} ${item.icon === "compatibility" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M8 7h8"></path> <path d="M8 12h8"></path> <path d="M8 17h5"></path> <path d="M5 7h.01"></path> <path d="M5 12h.01"></path> <path d="M5 17h.01"></path> ` })}`} ${item.icon === "modifiers" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M4 7h16"></path> <path d="M7 7v10"></path> <path d="M12 11v6"></path> <path d="M17 9v8"></path> ` })}`} ${item.icon === "allergens" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M12 3 4 7v5c0 5 3.5 7.5 8 9 4.5-1.5 8-4 8-9V7l-8-4Z"></path> <path d="m9 12 2 2 4-4"></path> ` })}`} ${item.icon === "categories" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <rect x="4" y="4" width="7" height="7" rx="1.5"></rect> <rect x="13" y="4" width="7" height="7" rx="1.5"></rect> <rect x="4" y="13" width="7" height="7" rx="1.5"></rect> <rect x="13" y="13" width="7" height="7" rx="1.5"></rect> ` })}`} ${item.icon === "menu" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M7 5h10"></path> <path d="M7 10h10"></path> <path d="M7 15h7"></path> <path d="M5 5h.01"></path> <path d="M5 10h.01"></path> <path d="M5 15h.01"></path> ` })}`} ${item.icon === "upsell" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M4 16 10 10"></path> <path d="m12 8 2-2 6 6-2 2"></path> <path d="m14 6 1.5-1.5"></path> <path d="M4 20h4l10-10-4-4L4 16v4Z"></path> ` })}`} ${item.icon === "users" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"></path> <circle cx="9.5" cy="7" r="3"></circle> <path d="M20 8v6"></path> <path d="M23 11h-6"></path> ` })}`} ${item.icon === "loyalty" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="m12 3 2.5 5.1 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3Z"></path> ` })}`} ${item.icon === "newsletter" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M4 6h16v12H4z"></path> <path d="m4 8 8 5 8-5"></path> ` })}`} ${item.icon === "coupons" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M8 4h8l4 4v8l-4 4H8l-4-4V8l4-4Z"></path> <path d="M9 9h.01"></path> <path d="M15 15h.01"></path> <path d="m15 9-6 6"></path> ` })}`} ${item.icon === "payments" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <rect x="3" y="6" width="18" height="12" rx="2"></rect> <path d="M3 10h18"></path> <path d="M7 15h3"></path> ` })}`} ${item.icon === "fees" && renderTemplate`${renderComponent($$result, "Fragment", Fragment, {}, { "default": ($$result2) => renderTemplate` <path d="M12 2v20"></path> <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14.5a3.5 3.5 0 0 1 0 7H6"></path> ` })}`} </svg> </span> <div data-admin-sidebar-item-copy class="min-w-0"> <div${addAttribute([
      "text-sm font-semibold transition",
      active ? "text-white" : "text-slate-200 group-hover:text-white"
    ], "class:list")}> ${item.label} </div> <div${addAttribute([
      "mt-1 text-[13px] leading-5 transition",
      active ? "text-slate-300" : "text-slate-500 group-hover:text-slate-400"
    ], "class:list")}> ${item.description} </div> </div> </div> </a>`;
  })} </div> </section>`)} </div> </nav> <div data-admin-sidebar-footer class="shrink-0 border-t border-white/[0.08] px-3 py-4 transition-all duration-200"> <div data-admin-sidebar-footer-text class="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.2em] text-slate-600">
Entorno interno
</div> <form method="post" action="/api/admin/logout"> <button type="submit" class="flex w-full items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Cerrar sesión
</button> </form> </div> </div> </aside>`;
}, "C:/Users/vicre/Dev/arcadia/src/components/admin/AdminSidebar.astro", void 0);

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$AdminLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$AdminLayout;
  const {
    title = "Admin · Arcadia",
    heading,
    description,
    actions = false
  } = Astro2.props;
  const pathname = Astro2.url.pathname;
  const pageHeading = heading ?? "Admin";
  const pageDescription = description ?? "";
  const pageTitle = title;
  return renderTemplate(_a || (_a = __template(['<html lang="es"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"', '><link rel="icon" type="image/svg+xml" href="/ARCADIA_LOGO.svg"><title>', "</title>", '</head> <body class="h-dvh overflow-hidden bg-[#0b1120] text-slate-100 antialiased"> <div id="admin-shell" data-sidebar-collapsed="false" class="h-dvh bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_28%),linear-gradient(180deg,#0b1120_0%,#111827_100%)]"> <div class="flex h-dvh w-full gap-0 overflow-hidden"> ', ' <div class="min-w-0 flex-1 xl:border-l xl:border-white/5"> <div class="flex h-dvh min-w-0 flex-col overflow-hidden"> <header class="shrink-0 border-b border-white/[0.08] bg-[#0d1628]/92 backdrop-blur"> <div class="flex flex-col gap-3 px-5 py-3 sm:px-6 lg:px-8 xl:px-10 xl:py-3.5"> <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0"> <div class="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">\nArcadia · Administración\n</div> <h1 class="mt-1.5 text-[1.55rem] font-semibold tracking-[-0.04em] text-white sm:text-[1.85rem]"> ', " </h1> ", ' </div> <div class="flex shrink-0 items-center gap-3 lg:justify-end"> <form method="post" action="/api/admin/logout"> <button type="submit" class="inline-flex min-h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">\nCerrar sesión\n</button> </form> </div> </div> ', ' </div> </header> <main data-admin-main-scroll class="min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-6 lg:px-8 xl:px-10 xl:py-8"> ', ' </main> </div> </div> </div> </div>  <script>\n      (() => {\n        const root = document.getElementById("admin-shell");\n        const toggle = document.getElementById("admin-sidebar-toggle");\n        if (!root || !toggle) return;\n\n        const storageKey = "arcadia-admin-sidebar-collapsed";\n\n        function readState() {\n          try {\n            return window.localStorage.getItem(storageKey) === "1";\n          } catch {\n            return false;\n          }\n        }\n\n        function writeState(collapsed) {\n          try {\n            window.localStorage.setItem(storageKey, collapsed ? "1" : "0");\n          } catch {\n            // noop\n          }\n        }\n\n        function applyState(collapsed) {\n          root.setAttribute(\n            "data-sidebar-collapsed",\n            collapsed ? "true" : "false",\n          );\n          toggle.setAttribute("aria-pressed", collapsed ? "true" : "false");\n          toggle.setAttribute(\n            "title",\n            collapsed ? "Expandir sidebar" : "Contraer sidebar",\n          );\n          toggle.setAttribute(\n            "aria-label",\n            collapsed ? "Expandir sidebar" : "Contraer sidebar",\n          );\n        }\n\n        let collapsed = readState();\n        applyState(collapsed);\n\n        toggle.addEventListener("click", () => {\n          collapsed = !collapsed;\n          writeState(collapsed);\n          applyState(collapsed);\n        });\n      })();\n    <\/script> </body> </html>'])), addAttribute(Astro2.generator, "content"), pageTitle, renderHead(), renderComponent($$result, "AdminSidebar", $$AdminSidebar, { "currentPath": pathname }), pageHeading, pageDescription ? renderTemplate`<p class="mt-1.5 max-w-4xl text-sm leading-6 text-slate-400"> ${pageDescription} </p>` : null, actions ? renderTemplate`<div class="border-t border-white/[0.08] pt-3"> ${renderSlot($$result, $$slots["actions"])} </div>` : null, renderSlot($$result, $$slots["default"]));
}, "C:/Users/vicre/Dev/arcadia/src/layouts/AdminLayout.astro", void 0);

export { $$AdminLayout as $ };
