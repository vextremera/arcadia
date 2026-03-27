import { e as createComponent, k as renderComponent, r as renderTemplate } from '../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { a as api, b as addToCart, $ as $$SiteLayout } from '../chunks/SiteLayout_Qpsqvz8u.mjs';
import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import { jsxs, jsx, Fragment } from 'preact/jsx-runtime';
export { renderers } from '../renderers.mjs';

function money(cents) {
  return `${(cents / 100).toFixed(2)} €`;
}
function openProduct(productId) {
  window.dispatchEvent(new CustomEvent("arcadia:product:open", {
    detail: {
      productId
    }
  }));
}
function allergenIconPath(allergen) {
  return allergen.iconUrl ?? `/images/allergens/${allergen.slug}.webp`;
}
function CartaKiosk() {
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stickyTop, setStickyTop] = useState(84);
  const [addingId, setAddingId] = useState(null);
  const [flashAddedId, setFlashAddedId] = useState(null);
  const [scrollOffset, setScrollOffset] = useState(160);
  const [mobileCatMenuTop, setMobileCatMenuTop] = useState(160);
  const catBarRef = useRef(null);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  function scrollToCategory(slug) {
    const id = `cat-${slug}`;
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
      history.replaceState(null, "", `#${id}`);
    }
    setCatMenuOpen(false);
  }
  useEffect(() => {
    if (!catMenuOpen) return;
    const onKey = (event) => {
      if (event.key === "Escape") setCatMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catMenuOpen]);
  useEffect(() => {
    const update = () => {
      const header = document.getElementById("site-header");
      const headerHeight = header?.getBoundingClientRect().height ?? 70;
      const barHeight = catBarRef.current?.getBoundingClientRect().height ?? 0;
      setStickyTop(Math.ceil(headerHeight));
      setScrollOffset(Math.ceil(headerHeight + barHeight + 12));
      setMobileCatMenuTop(Math.ceil(headerHeight + barHeight));
    };
    update();
    requestAnimationFrame(update);
    window.addEventListener("resize", update, {
      passive: true
    });
    return () => window.removeEventListener("resize", update);
  }, [menu.length]);
  useEffect(() => {
    setLoading(true);
    api("/api/catalog/menu").then((res) => setMenu(res.categories ?? [])).finally(() => setLoading(false));
  }, []);
  const navCategories = useMemo(() => menu.filter((category) => (category.products ?? []).length > 0), [menu]);
  async function quickAdd(product) {
    setAddingId(product.id);
    try {
      await addToCart({
        productId: product.id,
        qty: 1,
        modifierOptionIds: [],
        addedIngredientIds: [],
        removedIngredientIds: []
      });
      setFlashAddedId(product.id);
      window.setTimeout(() => setFlashAddedId(null), 900);
    } catch (error) {
      alert(error?.message || "No se pudo añadir al carrito");
    } finally {
      setAddingId(null);
    }
  }
  function onPlusClick(event, product) {
    event.stopPropagation();
    if (product.isConfigurable) openProduct(product.id);
    else void quickAdd(product);
  }
  const heroStyle = {
    backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), url('/images/general/domicilio-header.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
  return jsxs("div", {
    class: "w-full",
    id: "top",
    children: [jsxs("section", {
      class: "relative w-full overflow-hidden bg-zinc-900 rounded-t-4xl sm:rounded-t-[50px]",
      style: heroStyle,
      children: [jsx("div", {
        class: "h-56 sm:h-150"
      }), jsxs("div", {
        class: "absolute inset-0",
        children: [jsx("div", {
          class: "absolute inset-x-0 bottom-0 h-6 bg-bg z-20 rounded-t-3xl sm:h-8 sm:rounded-t-[40px]"
        }), jsx("div", {
          class: "flex h-full w-full items-center justify-center px-4 pb-12 pt-8 text-center sm:px-10 sm:pb-18 sm:pt-0 sm:mt-10",
          children: jsxs("div", {
            class: "text-white",
            children: [jsx("div", {
              class: "text-3xl sm:text-5xl font-black tracking-widest sigmar-regular",
              children: "PEDIR"
            }), jsx("div", {
              class: "mt-1 text-sm sm:text-[20px] text-white/80",
              children: "Elige tus productos y personalízalos al momento."
            })]
          })
        })]
      })]
    }), jsx("div", {
      ref: catBarRef,
      class: "sticky z-30 border-b border-zinc-200 bg-[#FFFFF795] backdrop-blur",
      style: {
        top: `${stickyTop}px`
      },
      children: jsx("div", {
        class: "mx-auto w-full max-w-448 px-4 py-3 sm:px-10",
        children: loading && menu.length === 0 ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "Cargando categorías…"
        }) : navCategories.length === 0 ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "No hay categorías disponibles."
        }) : jsxs(Fragment, {
          children: [jsxs("div", {
            class: "flex items-center justify-between sm:hidden",
            children: [jsx("div", {
              class: "text-sm font-semibold text-zinc-700",
              children: "Categorías"
            }), jsxs("button", {
              type: "button",
              class: "inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50",
              "aria-haspopup": "dialog",
              "aria-expanded": catMenuOpen,
              onClick: () => setCatMenuOpen(true),
              children: [jsx("span", {
                children: "Ver"
              }), jsx("span", {
                "aria-hidden": "true",
                children: "☰"
              })]
            })]
          }), jsx("nav", {
            class: "hidden flex-wrap items-center gap-2 sm:flex",
            "aria-label": "Categorías",
            children: navCategories.map((category) => jsx("a", {
              href: `#cat-${category.slug}`,
              class: "whitespace-nowrap rounded-full border border-zinc-300 bg-bg px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-[#fffff1]",
              children: category.name
            }, category.id))
          }), catMenuOpen ? jsxs("div", {
            class: "fixed inset-x-0 bottom-0 z-60 max-h-[calc(100dvh-1.5rem)] sm:hidden",
            style: {
              top: `${mobileCatMenuTop}px`
            },
            children: [jsx("button", {
              type: "button",
              class: "absolute inset-0 h-full w-full bg-black/35",
              "aria-label": "Cerrar categorías",
              onClick: () => setCatMenuOpen(false)
            }), jsx("div", {
              class: "absolute inset-x-3 top-0 max-h-[calc(100dvh-2rem)] overflow-auto rounded-4xl border border-zinc-200 bg-white p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)]",
              children: jsx("nav", {
                class: "grid gap-1",
                "aria-label": "Categorías",
                children: navCategories.map((category) => jsx("button", {
                  type: "button",
                  class: "rounded-2xl px-4 py-3 text-left text-sm font-semibold text-zinc-800 hover:bg-zinc-50",
                  onClick: () => scrollToCategory(category.slug),
                  children: category.name
                }, category.id))
              })
            })]
          }) : null]
        })
      })
    }), jsx("div", {
      class: "w-full px-4 py-6 sm:px-10 sm:py-8",
      children: jsx("div", {
        class: "mx-auto w-full max-w-448",
        children: loading && menu.length === 0 ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "Cargando productos…"
        }) : menu.length === 0 ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "No hay productos disponibles."
        }) : jsx("div", {
          class: "space-y-8 sm:space-y-10",
          children: menu.map((category) => jsxs("section", {
            id: `cat-${category.slug}`,
            style: {
              scrollMarginTop: `${scrollOffset}px`
            },
            children: [jsxs("div", {
              class: "flex flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3",
              children: [jsx("h2", {
                class: "text-xl sm:text-2xl font-medium tracking-widest sigmar-regular",
                children: category.name
              }), jsx("a", {
                class: "text-xs font-semibold text-zinc-500 hover:underline",
                href: "#top",
                children: "↑ arriba"
              })]
            }), category.products.length === 0 ? jsx("div", {
              class: "mt-3 text-sm text-zinc-600",
              children: "No hay productos en esta categoría."
            }) : jsx("div", {
              class: "mt-4 grid gap-3 sm:gap-4 md:grid-cols-2",
              children: category.products.map((product) => {
                const ingredients = product.ingredients ?? [];
                const ingredientsText = ingredients.length > 0 ? ingredients.join(", ") : product.description ? product.description : "";
                const busy = addingId === product.id;
                const flashed = flashAddedId === product.id;
                const imageSrc = product.imageUrl && product.imageUrl.startsWith("/") ? product.imageUrl : product.imageUrl ? `/${product.imageUrl}` : null;
                return jsx("article", {
                  class: "group relative cursor-pointer rounded-3xl border border-zinc-200 bg-bg p-3 shadow-md transition hover:bg-[#fffff1] sm:p-5",
                  onClick: () => openProduct(product.id),
                  children: jsxs("div", {
                    class: "flex flex-col gap-4 min-[520px]:flex-row sm:gap-4",
                    children: [jsxs("div", {
                      class: "min-w-0 flex-1 flex flex-col",
                      children: [jsxs("div", {
                        class: "min-w-0",
                        children: [jsx("h3", {
                          class: "text-base font-semibold leading-tight wrap-break-words sm:text-lg",
                          title: product.name,
                          children: product.name
                        }), ingredientsText ? jsx("p", {
                          class: "mt-2 line-clamp-3 text-sm text-zinc-600",
                          children: ingredientsText
                        }) : jsx("p", {
                          class: "mt-2 text-sm text-zinc-500",
                          children: "(Sin descripción)"
                        })]
                      }), jsxs("div", {
                        class: "mt-auto flex flex-wrap items-end gap-3 pt-4",
                        children: [jsx("div", {
                          class: "text-lg font-black sm:text-xl",
                          children: money(product.priceCents)
                        }), product.allergens.length > 0 ? jsx("div", {
                          class: "ml-auto flex flex-wrap justify-end gap-2",
                          children: product.allergens.map((allergen) => jsx("img", {
                            src: allergenIconPath(allergen),
                            alt: allergen.name,
                            title: allergen.name,
                            class: "h-7 w-7 object-contain sm:h-8 sm:w-8",
                            loading: "lazy"
                          }, `${product.id}-${allergen.slug}`))
                        }) : jsx("div", {
                          class: "ml-auto"
                        })]
                      })]
                    }), jsxs("div", {
                      class: "relative h-44 w-full shrink-0 min-[520px]:h-36 min-[520px]:w-36 xl:h-40 xl:w-40",
                      children: [imageSrc ? jsx("img", {
                        class: "h-full w-full rounded-2xl border border-zinc-200 bg-zinc-500 object-cover",
                        src: imageSrc,
                        alt: product.name,
                        loading: "lazy"
                      }) : jsx("div", {
                        class: "h-full w-full rounded-2xl border border-zinc-200 bg-white backdrop-blur-2xl"
                      }), jsx("button", {
                        type: "button",
                        "aria-label": product.isConfigurable ? "Abrir configurador" : "Añadir al carrito",
                        title: product.isConfigurable ? "Personalizar" : "Añadir",
                        onClick: (event) => onPlusClick(event, product),
                        class: ["absolute -top-2 -right-2 grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm transition sm:h-11 sm:w-11", busy ? "pointer-events-none opacity-70" : "hover:scale-[1.02]"].join(" "),
                        children: jsx("span", {
                          class: "text-lg font-black leading-none",
                          children: flashed ? "✓" : "+"
                        })
                      })]
                    })]
                  })
                }, product.id);
              })
            })]
          }, category.id))
        })
      })
    })]
  });
}

const $$Pedir = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Pedir \xB7 Arcadia", "fullWidth": true }, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "CartaKiosk", CartaKiosk, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/order/CartaKiosk", "client:component-export": "default" })} ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/pedir.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/pedir.astro";
const $$url = "/pedir";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Pedir,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
