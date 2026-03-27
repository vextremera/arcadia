import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../chunks/SiteLayout_Qpsqvz8u.mjs';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { jsxs, jsx } from 'preact/jsx-runtime';
import { d as db, k as MenuDish, l as MenuDishAssignment, m as Menu, n as MenuItem, c as Product, A as AppSetting } from '../chunks/_astro_db_ChTDrd2j.mjs';
import { eq, inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../renderers.mjs';

function MenuTabs(props) {
  const hasDiario = !!props.diario;
  const hasFestivo = !!props.festivo;
  const defaultKind = hasDiario ? "DIARIO" : "FESTIVO";
  const [active, setActive] = useState(defaultKind);
  useEffect(() => {
    if (active === "DIARIO" && !hasDiario && hasFestivo) setActive("FESTIVO");
    if (active === "FESTIVO" && !hasFestivo && hasDiario) setActive("DIARIO");
  }, [active, hasDiario, hasFestivo]);
  const current = useMemo(() => active === "DIARIO" ? props.diario : props.festivo, [active, props]);
  function onKeyDown(e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (hasDiario && hasFestivo) setActive(active === "DIARIO" ? "FESTIVO" : "DIARIO");
    }
  }
  return jsxs("div", {
    class: "space-y-5 sm:space-y-6",
    children: [jsx("div", {
      class: "flex justify-center",
      children: jsxs("div", {
        class: "inline-flex rounded-2xl border border-zinc-200 bg-bg p-1 shadow-sm",
        role: "tablist",
        "aria-label": "Seleccionar menú",
        tabIndex: 0,
        onKeyDown,
        children: [jsx("button", {
          type: "button",
          role: "tab",
          "aria-selected": active === "DIARIO",
          disabled: !hasDiario,
          onClick: () => setActive("DIARIO"),
          class: ["rounded-xl px-4 py-2 text-xs font-black tracking-widest sigmar-regular transition sm:px-5 sm:text-sm", active === "DIARIO" ? "bg-zinc-900 text-white shadow" : "text-zinc-800 hover:bg-white", !hasDiario ? "opacity-40 cursor-not-allowed" : ""].join(" "),
          children: "DIARIO"
        }), jsx("button", {
          type: "button",
          role: "tab",
          "aria-selected": active === "FESTIVO",
          disabled: !hasFestivo,
          onClick: () => setActive("FESTIVO"),
          class: ["rounded-xl px-4 py-2 text-xs font-black tracking-widest sigmar-regular transition sm:px-5 sm:text-sm", active === "FESTIVO" ? "bg-zinc-900 text-white shadow" : "text-zinc-800 hover:bg-white", !hasFestivo ? "opacity-40 cursor-not-allowed" : ""].join(" "),
          children: "FESTIVO"
        })]
      })
    }), !current ? jsx("div", {
      class: "rounded-3xl border border-zinc-200 bg-bg p-5 text-center text-sm text-zinc-600 sm:p-6",
      children: "No hay menú publicado todavía."
    }) : jsxs("div", {
      class: "rounded-3xl border border-zinc-200 bg-bg p-5 shadow-sm sm:p-6",
      children: [jsxs("div", {
        class: "text-center",
        children: [jsx("div", {
          class: "text-xl sm:text-3xl font-black tracking-widest sigmar-regular",
          children: active === "DIARIO" ? "MENÚ DIARIO" : "MENÚ FESTIVO"
        }), jsx("div", {
          class: "mt-1 text-sm text-zinc-700",
          children: "Entrantes + Principales + Bebida + Postre o Café · Pan incluido"
        }), current.priceText ? jsx("div", {
          class: "mt-2 text-lg tracking-widest font-bold text-zinc-900 sm:text-xl",
          children: current.priceText
        }) : null]
      }), jsx("div", {
        class: "mt-5 space-y-5 sm:mt-6 sm:space-y-6",
        children: ["ENTRANTES", "PRINCIPALES", "POSTRES"].map((course) => {
          const list = current.courses[course] ?? [];
          return jsxs("div", {
            class: "rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6",
            children: [jsx("div", {
              class: "text-center text-base font-medium tracking-widest sigmar-regular sm:text-lg",
              children: course
            }), list.length === 0 ? jsx("div", {
              class: "mt-4 text-center text-sm text-zinc-500",
              children: "Pendiente de publicar."
            }) : jsx("div", {
              class: "mt-4 divide-y divide-zinc-200/80",
              children: list.map((it) => jsxs("div", {
                class: "py-3 text-center",
                children: [jsx("div", {
                  class: "font-semibold text-zinc-900",
                  children: it.name
                }), it.desc ? jsx("div", {
                  class: "mt-1 text-sm text-zinc-600",
                  children: it.desc
                }) : null]
              }))
            })]
          });
        })
      }), jsxs("p", {
        class: "text-sm space-y-6 mt-5 mb-1 text-center text-zinc-500 tracking-widest sm:mt-6 sm:mb-2",
        children: ["Menús personalizados disponibles bajo petición.", jsx("br", {}), "Horario de menú de ", jsx("strong", {
          children: "13:00 a 15:30"
        }), "."]
      })]
    })]
  });
}

const $$Menu = createComponent(async ($$result, $$props, $$slots) => {
  const DEFAULT_MENU_CONFIG = {
    DIARIO: { active: true, priceCents: 1350 },
    FESTIVO: { active: true, priceCents: 1590 }
  };
  function centsToPriceText(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2).replace(".", ",")}\u20AC`;
  }
  function extractPriceText(title) {
    const m = title.match(/(\d+(?:[.,]\d{1,2})?)\s*€/);
    if (!m) return null;
    return `${m[1].replace(".", ",")}\u20AC`;
  }
  function isWithin(m, now) {
    if (m.validFrom && now < m.validFrom) return false;
    if (m.validTo && now > m.validTo) return false;
    return true;
  }
  function pickBest(kind, menus, now) {
    const candidates = menus.filter((m) => m.kind === kind);
    const within = candidates.filter((m) => isWithin(m, now));
    const list = within.length ? within : candidates;
    if (!list.length) return null;
    return [...list].sort((a, b) => {
      const ta = a.validFrom ? a.validFrom.getTime() : 0;
      const tb = b.validFrom ? b.validFrom.getTime() : 0;
      if (ta !== tb) return tb - ta;
      return b.id - a.id;
    })[0];
  }
  const heroStyle = {
    backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), url('/images/general/domicilio-header.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
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
  const v2Config = await getMenuConfig();
  const v2Rows = await db.select({
    kind: MenuDishAssignment.kind,
    sortOrder: MenuDishAssignment.sortOrder,
    dishId: MenuDish.id,
    dishName: MenuDish.name,
    dishDescription: MenuDish.description,
    dishCourse: MenuDish.course,
    dishActive: MenuDish.active,
    dishSortOrder: MenuDish.sortOrder
  }).from(MenuDishAssignment).innerJoin(MenuDish, eq(MenuDishAssignment.dishId, MenuDish.id));
  const v2Assignments = [...v2Rows].sort((a, b) => {
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
  function buildV2MenuData(kind) {
    const config = v2Config[kind];
    if (!config.active) return null;
    const rows = v2Assignments.filter(
      (row) => row.kind === kind && row.dishActive
    );
    if (rows.length === 0) return null;
    const grouped = {
      PRIMERO: [],
      SEGUNDO: [],
      POSTRE: []
    };
    for (const row of rows) {
      grouped[row.dishCourse].push({
        name: row.dishName,
        desc: row.dishDescription ? String(row.dishDescription).trim() || null : null
      });
    }
    return {
      id: kind === "DIARIO" ? 1 : 2,
      kind,
      title: kind === "DIARIO" ? "Men\xFA diario" : "Men\xFA festivo",
      priceText: centsToPriceText(config.priceCents),
      courses: {
        ENTRANTES: grouped.PRIMERO,
        PRINCIPALES: grouped.SEGUNDO,
        POSTRES: grouped.POSTRE
      }
    };
  }
  let diarioData = buildV2MenuData("DIARIO");
  let festivoData = buildV2MenuData("FESTIVO");
  const hasV2Menu = !!diarioData || !!festivoData;
  if (!hasV2Menu) {
    let buildLegacyMenuData = function(menu) {
      if (!menu) return null;
      const grouped = {
        PRIMERO: [],
        SEGUNDO: [],
        POSTRE: []
      };
      const its = items.filter((it) => it.menuId === menu.id).sort((a, b) => {
        const sa = a.sortOrder ?? 0;
        const sb = b.sortOrder ?? 0;
        if (sa !== sb) return sa - sb;
        return a.id - b.id;
      });
      for (const it of its) {
        const p = productById.get(it.productId);
        if (!p) continue;
        const desc = (p.details ?? p.description ?? "").trim();
        grouped[it.course].push({
          name: p.name,
          desc: desc || null,
          sort: it.sortOrder ?? 0
        });
      }
      return {
        id: menu.id,
        kind: menu.kind,
        title: menu.title,
        priceText: extractPriceText(menu.title),
        courses: {
          ENTRANTES: grouped.PRIMERO.map((x) => ({ name: x.name, desc: x.desc })),
          PRINCIPALES: grouped.SEGUNDO.map((x) => ({ name: x.name, desc: x.desc })),
          POSTRES: grouped.POSTRE.map((x) => ({ name: x.name, desc: x.desc }))
        }
      };
    };
    const menusRaw = await db.select({
      id: Menu.id,
      title: Menu.title,
      kind: Menu.kind,
      active: Menu.active,
      validFrom: Menu.validFrom,
      validTo: Menu.validTo
    }).from(Menu).where(eq(Menu.active, true));
    const now = /* @__PURE__ */ new Date();
    const diario = pickBest("DIARIO", menusRaw, now);
    const festivo = pickBest("FESTIVO", menusRaw, now);
    const activeMenus = [diario, festivo].filter(Boolean);
    const menuIds = activeMenus.map((m) => m.id);
    const items = menuIds.length ? await db.select({
      id: MenuItem.id,
      menuId: MenuItem.menuId,
      productId: MenuItem.productId,
      course: MenuItem.course,
      sortOrder: MenuItem.sortOrder
    }).from(MenuItem).where(inArray(MenuItem.menuId, menuIds)) : [];
    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = productIds.length ? await db.select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      details: Product.details
    }).from(Product).where(inArray(Product.id, productIds)) : [];
    const productById = new Map(products.map((p) => [p.id, p]));
    diarioData = buildLegacyMenuData(diario);
    festivoData = buildLegacyMenuData(festivo);
  }
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Men\xFA \xB7 Arcadia", "fullWidth": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="w-full" id="top"> <section class="relative w-full overflow-hidden bg-zinc-900 rounded-t-4xl sm:rounded-t-[50px]"${addAttribute(heroStyle, "style")}> <div class="h-56 sm:h-150"></div> <div class="absolute inset-0"> <div class="absolute inset-x-0 bottom-0 h-6 bg-bg z-20 rounded-t-3xl sm:h-8 sm:rounded-t-[40px]"></div> <div class="flex h-full w-full items-center justify-center text-center px-4 pb-12 pt-8 sm:px-10 sm:pb-18 sm:pt-0 sm:mt-10"> <div class="text-white"> <div class="text-3xl sm:text-5xl font-black tracking-widest sigmar-regular">
MENÚ
</div> <div class="mt-1 text-sm sm:text-[20px] text-white/80">
Platos especiales seleccionados por nuestro chef.
</div> </div> </div> </div> </section> <div class="w-full px-4 py-2 sm:px-10"> <div class="mx-auto w-full max-w-4xl"> ${renderComponent($$result2, "MenuTabs", MenuTabs, { "client:load": true, "diario": diarioData, "festivo": festivoData, "client:component-hydration": "load", "client:component-path": "@/islands/menu/MenuTabs", "client:component-export": "default" })} </div> </div> </div> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/menu.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/menu.astro";
const $$url = "/menu";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Menu,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
