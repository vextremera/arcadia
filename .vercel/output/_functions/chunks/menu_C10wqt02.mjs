import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, B as maybeRenderHead, a4 as addAttribute } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$SiteLayout } from './SiteLayout_CblPac9t.mjs';
import { useState, useEffect, useMemo } from 'preact/hooks';
import { jsxs, jsx } from 'preact/jsx-runtime';
import { g as getPublicMenuState } from './public_Bt464a34.mjs';

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
  const heroStyle = {
    backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), url('/images/general/domicilio-header.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
  const { diarioData, festivoData } = await getPublicMenuState();
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Menú · Arcadia", "fullWidth": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="w-full" id="top"> <section class="relative w-full overflow-hidden bg-zinc-900 rounded-t-4xl sm:rounded-t-[50px]"${addAttribute(heroStyle, "style")}> <div class="h-56 sm:h-150"></div> <div class="absolute inset-0"> <div class="absolute inset-x-0 bottom-0 h-6 bg-bg z-20 rounded-t-3xl sm:h-8 sm:rounded-t-[40px]"></div> <div class="flex h-full w-full items-center justify-center text-center px-4 pb-12 pt-8 sm:px-10 sm:pb-18 sm:pt-0 sm:mt-10"> <div class="text-white"> <div class="text-3xl sm:text-5xl font-black tracking-widest sigmar-regular">
MENÚ
</div> <div class="mt-1 text-sm sm:text-[20px] text-white/80">
Platos especiales seleccionados por nuestro chef.
</div> </div> </div> </div> </section> <div class="w-full px-4 py-2 sm:px-10"> <div class="mx-auto w-full max-w-4xl"> ${renderComponent($$result2, "MenuTabs", MenuTabs, { "client:load": true, "diario": diarioData, "festivo": festivoData, "client:component-hydration": "load", "client:component-path": "@/islands/menu/MenuTabs", "client:component-export": "default" })} </div> </div> </div> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/menu.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/menu.astro";
const $$url = "/menu";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Menu,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
