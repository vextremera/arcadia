import { e as createComponent, s as spreadAttributes, u as unescapeHTML, r as renderTemplate, g as addAttribute, k as renderComponent, m as maybeRenderHead, h as createAstro, o as renderHead, p as renderSlot } from './astro/server_CA5VZefa.mjs';
import 'piccolore';
/* empty css                        */
import { useState, useEffect, useMemo } from 'preact/hooks';
import { jsxs, jsx, Fragment } from 'preact/jsx-runtime';
import 'clsx';
/* empty css                         */

async function api(url, init) {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...init?.headers ?? {},
      "content-type": "application/json"
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return await res.json();
}

let snapshot = null;
const EVENT = "arcadia:cart";
function emit() {
  window.dispatchEvent(new CustomEvent(EVENT));
}
function getCartSnapshot() {
  return snapshot;
}
function subscribeCart(cb) {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
async function refreshCart() {
  snapshot = await api("/api/cart");
  emit();
  return snapshot;
}
async function addToCart(payload) {
  await api("/api/cart/add", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  return refreshCart();
}
async function setQty(lineId, qty) {
  await api("/api/cart/set-qty", {
    method: "POST",
    body: JSON.stringify({
      lineId,
      qty
    })
  });
  return refreshCart();
}
async function removeLine(lineId) {
  await api("/api/cart/remove", {
    method: "POST",
    body: JSON.stringify({
      lineId
    })
  });
  return refreshCart();
}
async function clearCart() {
  await api("/api/cart/clear", {
    method: "POST",
    body: JSON.stringify({})
  });
  return refreshCart();
}

function CartBadge({
  iconSvg
}) {
  const [count, setCount] = useState(getCartSnapshot()?.count ?? 0);
  useEffect(() => {
    refreshCart().catch(() => {
    });
    return subscribeCart(() => setCount(getCartSnapshot()?.count ?? 0));
  }, []);
  const showBadge = count > 0;
  const svg = useMemo(() => {
    return iconSvg || `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/></svg>`;
  }, [iconSvg]);
  return jsxs("button", {
    class: "relative grid h-10 w-10 place-items-center rounded-full cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-transform",
    onClick: () => window.dispatchEvent(new CustomEvent("arcadia:cart:open")),
    type: "button",
    "aria-label": "Carrito",
    title: "Carrito",
    children: [jsx("span", {
      class: "pointer-events-none",
      dangerouslySetInnerHTML: {
        __html: svg
      }
    }), showBadge ? jsx("span", {
      class: "absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#7b1f1f] px-1 text-[11px] font-bold leading-none text-white",
      children: count
    }) : null]
  });
}

function createSvgComponent({ meta, attributes, children }) {
  const Component = createComponent((_, props) => {
    const normalizedProps = normalizeProps(attributes, props);
    return renderTemplate`<svg${spreadAttributes(normalizedProps)}>${unescapeHTML(children)}</svg>`;
  });
  Object.defineProperty(Component, "toJSON", {
    value: () => meta,
    enumerable: false
  });
  return Object.assign(Component, meta);
}
const ATTRS_TO_DROP = ["xmlns", "xmlns:xlink", "version"];
const DEFAULT_ATTRS = {};
function dropAttributes(attributes) {
  for (const attr of ATTRS_TO_DROP) {
    delete attributes[attr];
  }
  return attributes;
}
function normalizeProps(attributes, props) {
  return dropAttributes({ ...DEFAULT_ATTRS, ...attributes, ...props });
}

const NegativeLogo = createSvgComponent({"meta":{"src":"/_astro/ARCADIA_LOGO.CLLA16tQ.svg","width":667,"height":667,"format":"svg"},"attributes":{"width":"500.000000pt","height":"500.000000pt","viewBox":"0 0 500.000000 500.000000","preserveAspectRatio":"xMidYMid meet"},"children":"\r\n<g transform=\"translate(0.000000,500.000000) scale(0.100000,-0.100000)\" fill=\"#000000\" stroke=\"none\">\r\n<path d=\"M1592 4918 c-38 -19 -40 -85 -11 -533 12 -196 26 -505 35 -786 l7\r\n-226 -39 -27 c-47 -32 -66 -33 -97 -3 l-25 22 -11 535 c-14 665 -28 787 -100\r\n859 -78 78 -169 73 -191 -10 -8 -29 -11 -267 -9 -794 4 -819 7 -770 -53 -801\r\n-21 -11 -33 -12 -48 -4 -20 10 -20 22 -20 463 0 249 -4 499 -10 557 -5 58 -14\r\n168 -19 246 -15 222 -64 314 -166 314 -59 0 -82 -25 -91 -99 -7 -51 18 -766\r\n33 -941 19 -233 2 -553 -37 -688 -27 -92 -16 -157 32 -197 48 -41 101 -31 281\r\n55 80 38 89 21 107 -212 31 -399 31 -1424 0 -2083 -14 -299 -1 -356 90 -403\r\n56 -28 104 -28 155 1 64 36 78 73 71 196 -3 57 -1 345 4 640 12 589 3 1101\r\n-26 1606 -15 258 -16 308 -4 350 16 58 58 109 113 136 l39 21 67 -70 c89 -94\r\n183 -121 236 -68 51 51 77 214 50 306 -9 30 -21 98 -26 150 -5 52 -14 138 -19\r\n190 -6 52 -15 194 -20 315 -28 613 -54 830 -109 907 -42 60 -141 100 -189 76z\" />\r\n<path d=\"M2677 4896 c-21 -21 -46 -63 -63 -107 -15 -41 -73 -166 -130 -279\r\n-189 -380 -212 -478 -218 -945 -5 -364 28 -666 114 -1061 51 -232 64 -248 194\r\n-225 90 15 92 13 100 -112 4 -56 13 -183 21 -282 8 -99 17 -234 20 -300 3 -66\r\n10 -185 16 -265 5 -80 13 -356 18 -615 9 -533 9 -532 78 -553 85 -25 165 -10\r\n213 42 45 49 37 366 -35 1351 -46 639 -77 1729 -76 2693 0 571 1 563 -67 623\r\n-82 72 -138 82 -185 35z m-24 -1524 c3 -508 1 -624 -10 -633 -21 -18 -29 25\r\n-60 296 -30 257 -19 790 18 905 6 19 13 41 15 48 2 8 10 12 18 10 13 -3 15\r\n-93 19 -626z\" />\r\n<path d=\"M3656 4890 c-154 -136 -323 -830 -302 -1244 24 -463 80 -639 240\r\n-744 116 -76 138 -128 150 -357 4 -66 11 -167 16 -225 5 -58 12 -215 15 -350\r\n13 -533 72 -1384 111 -1586 30 -153 101 -234 205 -234 101 0 132 74 105 252\r\n-23 156 -44 317 -61 478 -9 80 -20 183 -25 230 -5 46 -12 163 -15 260 -4 96\r\n-8 181 -11 188 -2 8 -6 78 -9 155 -3 78 -10 256 -15 396 -6 139 -10 321 -10\r\n403 l0 150 35 51 c19 29 53 70 75 91 27 27 41 51 45 75 8 56 20 96 74 251 83\r\n238 86 259 85 545 0 271 -2 284 -65 515 -87 324 -174 482 -328 598 -175 132\r\n-252 157 -315 102z m280 -455 c160 -325 169 -956 17 -1272 l-34 -73 -43 0\r\nc-62 0 -146 45 -168 90 -58 123 -73 585 -29 884 35 232 104 499 134 518 21 13\r\n77 -55 123 -147z\" />\r\n</g>\r\n"});

var __freeze = Object.freeze;
var __defProp = Object.defineProperty;
var __template = (cooked, raw) => __freeze(__defProp(cooked, "raw", { value: __freeze(cooked.slice()) }));
var _a;
const $$Astro$1 = createAstro();
const $$Header = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$Header;
  const user = Astro2.locals.user;
  const pathname = Astro2.url.pathname;
  const next = encodeURIComponent(pathname);
  const navLinks = [
    { href: "/#sobre", label: "Sobre Nosotros" },
    { href: "/#horarios", label: "Horario" },
    { href: "/#ubicacion", label: "Ubicaci\xF3n" },
    { href: "/carta", label: "Carta" },
    { href: "/menu", label: "Men\xFA" },
    { href: "/pedir", label: "Domicilio" }
  ];
  return renderTemplate(_a || (_a = __template(["", '<header id="site-header" class="sticky top-0 z-40 bg-bg/95 backdrop-blur supports-backdrop-filter:bg-bg/95"> <div class="mx-auto flex w-full max-w-340 items-center justify-between gap-3 px-2 py-3 sm:py-4 2xl:max-w-448"> <a href="/" class="text-xl font-black tracking-[0.28em]"> <img', ' alt="Arcadia Logo" class="h-7 sm:h-8"> </a> <nav class="hidden items-center gap-8 text-sm font-semibold text-stone-700 xl:flex 2xl:gap-10" aria-label="Navegaci\xF3n principal"> ', ' </nav> <div class="flex items-center gap-2 sm:gap-3"> <details class="xl:hidden" data-mobile-nav> <summary class="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full transition-transform hover:-translate-y-0.5 active:translate-y-0 [&::-webkit-details-marker]:hidden" aria-label="Abrir men\xFA" title="Men\xFA"> <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f" aria-hidden="true"> <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z"></path> </svg> </summary> <!-- overlay solo por debajo del header --> <div class="fixed inset-x-0 bottom-0 top-19 z-50 sm:top-21"> <button type="button" class="absolute inset-0 h-full w-full bg-black/35" aria-label="Cerrar men\xFA"></button> <div class="fixed left-3 right-3 top-19 max-h-[calc(100dvh-5.5rem)] overflow-auto rounded-4xl border border-zinc-200 bg-white p-2 shadow-[0_18px_40px_rgba(0,0,0,0.14)] sm:left-5 sm:right-5 sm:top-21"> <nav class="grid gap-1" aria-label="Navegaci\xF3n m\xF3vil"> ', " </nav> </div> </div> </details> ", " ", ' </div> </div> </header> <script>\n  (() => {\n    const header = document.getElementById("site-header");\n    if (!header) return;\n\n    const details = header.querySelector("details[data-mobile-nav]");\n    if (!(details instanceof HTMLDetailsElement)) return;\n\n    const closeMenu = () => {\n      details.open = false;\n    };\n\n    header.querySelectorAll("details[data-mobile-nav] a").forEach((link) => {\n      link.addEventListener("click", closeMenu);\n    });\n\n    window.addEventListener("keydown", (event) => {\n      if (event.key === "Escape") closeMenu();\n    });\n\n    window.addEventListener("resize", () => {\n      if (window.innerWidth >= 1280) closeMenu();\n    });\n\n    const overlayButton = header.querySelector("details[data-mobile-nav] > div > button");\n    if (overlayButton instanceof HTMLButtonElement) {\n      overlayButton.addEventListener("click", closeMenu);\n    }\n  })();\n<\/script>'])), maybeRenderHead(), addAttribute(NegativeLogo.src, "src"), navLinks.map((link) => renderTemplate`<a class="hover:text-stone-900"${addAttribute(link.href, "href")}>${link.label}</a>`), navLinks.map((link) => renderTemplate`<a class="rounded-2xl px-4 py-3 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"${addAttribute(link.href, "href")}> ${link.label} </a>`), renderComponent($$result, "CartBadge", CartBadge, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/cart/CartBadge", "client:component-export": "default" }), user ? renderTemplate`<a class="grid h-10 w-10 place-items-center rounded-full cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0" href="/cuenta" aria-label="Cuenta" title="Cuenta"> <span class="text-sm"> <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"> <path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"></path> </svg> </span> </a>` : renderTemplate`<a class="grid h-10 w-10 place-items-center rounded-full cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-y-0"${addAttribute(`/login?next=${next}`, "href")} aria-label="Entrar" title="Entrar"> <span class="text-sm"> <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"> <path d="M367-527q-47-47-47-113t47-113q47-47 113-47t113 47q47 47 47 113t-47 113q-47 47-113 47t-113-47ZM160-160v-112q0-34 17.5-62.5T224-378q62-31 126-46.5T480-440q66 0 130 15.5T736-378q29 15 46.5 43.5T800-272v112H160Zm80-80h480v-32q0-11-5.5-20T700-306q-54-27-109-40.5T480-360q-56 0-111 13.5T260-306q-9 5-14.5 14t-5.5 20v32Zm296.5-343.5Q560-607 560-640t-23.5-56.5Q513-720 480-720t-56.5 23.5Q400-673 400-640t23.5 56.5Q447-560 480-560t56.5-23.5ZM480-640Zm0 400Z"></path> </svg> </span> </a>`);
}, "C:/Users/VICTOR/Dev/arcadia/src/components/layout/Header.astro", void 0);

const $$Footer = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<footer class="mt-16 border-t border-zinc-200"> <div class="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-12"> <div class="grid gap-6 sm:gap-8 md:grid-cols-3"> <div> <div class="text-lg font-black tracking-[0.28em]">ARCADIA</div> <div class="mt-3 text-sm text-zinc-700">
Bar restaurante en Lloret de Mar.<br>
Tapas, bocatas, hamburguesas y menús.
</div> </div> <div class="text-sm text-zinc-700"> <div class="font-semibold text-zinc-900">Contacto</div> <div class="mt-3 space-y-2"> <div>C/ Maria Aurèlia Campmany i Farnés, nº 2</div> <div>17310 Lloret de Mar (Girona)</div> <div class="pt-2">+34 600 00 00 00</div> <div>info@bararcadia.com</div> </div> </div> <div class="text-sm text-zinc-700"> <div class="font-semibold text-zinc-900">Enlaces</div> <div class="mt-3 flex flex-col gap-2"> <a class="hover:text-zinc-900" href="/#sobre">Sobre nosotros</a> <a class="hover:text-zinc-900" href="/pedir">Pedir</a> <a class="hover:text-zinc-900" href="/#horarios">Horarios</a> <a class="hover:text-zinc-900" href="/#ubicacion">Ubicación</a> </div> </div> </div> <div class="mt-10 flex flex-col items-start justify-between gap-3 border-t border-zinc-200 pt-6 text-xs text-zinc-600 sm:flex-row sm:items-center"> <div>© ${(/* @__PURE__ */ new Date()).getFullYear()} Arcadia</div> <div class="flex flex-wrap gap-x-4 gap-y-2"> <a class="hover:text-zinc-900" href="/legal">Legal</a> <a class="hover:text-zinc-900" href="/privacidad">Privacidad</a> </div> </div> </div> </footer>`;
}, "C:/Users/VICTOR/Dev/arcadia/src/components/layout/Footer.astro", void 0);

function money$2(cents) {
  return `${(cents / 100).toFixed(2)} €`;
}
function allergenIconPath(allergen) {
  return allergen.iconUrl ?? `/images/allergens/${allergen.slug}.webp`;
}
function ProductConfiguratorModal() {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [removedIds, setRemovedIds] = useState([]);
  const [addedIds, setAddedIds] = useState([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [search, setSearch] = useState("");
  useEffect(() => {
    const handler = (event) => {
      const customEvent = event;
      setProductId(customEvent.detail.productId);
      setOpen(true);
    };
    window.addEventListener("arcadia:product:open", handler);
    return () => window.removeEventListener("arcadia:product:open", handler);
  }, []);
  useEffect(() => {
    if (!open || !productId) return;
    setLoading(true);
    setData(null);
    setStep(0);
    setRemovedIds([]);
    setAddedIds([]);
    setSelectedOptionIds([]);
    setSearch("");
    api(`/api/products/${productId}`).then((response) => setData(response)).finally(() => setLoading(false));
  }, [open, productId]);
  const includedSet = useMemo(() => {
    const set = /* @__PURE__ */ new Set();
    (data?.productIngredients ?? []).forEach((productIngredient) => {
      if (productIngredient.defaultIncluded) set.add(productIngredient.ingredientId);
    });
    return set;
  }, [data]);
  const removable = useMemo(() => (data?.productIngredients ?? []).filter((item) => item.defaultIncluded && item.removable), [data]);
  const commonToAdd = useMemo(() => {
    const commonIngredients = data?.commonIngredients ?? [];
    return commonIngredients.filter((ingredient) => !includedSet.has(ingredient.id));
  }, [data, includedSet]);
  const allToAdd = useMemo(() => {
    const allIngredients = data?.allIngredients ?? [];
    const commonIds = new Set((data?.commonIngredients ?? []).map((item) => item.id));
    return allIngredients.filter((ingredient) => !includedSet.has(ingredient.id)).filter((ingredient) => !commonIds.has(ingredient.id)).filter((ingredient) => ingredient.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [data, includedSet, search]);
  function toggleRemoved(id) {
    setRemovedIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  }
  function toggleAdded(id) {
    setAddedIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  }
  function toggleOption(group, optionId) {
    setSelectedOptionIds((previous) => {
      const groupOptionIds = new Set(group.options.map((option) => option.id));
      const selectedInGroup = previous.filter((id) => groupOptionIds.has(id));
      const isSelected = previous.includes(optionId);
      if (group.maxSelect === 1) {
        if (isSelected) return previous.filter((id) => id !== optionId);
        return [...previous.filter((id) => !groupOptionIds.has(id)), optionId];
      }
      if (isSelected) return previous.filter((id) => id !== optionId);
      if (selectedInGroup.length >= group.maxSelect) return previous;
      return [...previous, optionId];
    });
  }
  const priceExtrasCents = useMemo(() => {
    if (!data) return 0;
    const optionMap = /* @__PURE__ */ new Map();
    data.modifierGroups.forEach((group) => group.options.forEach((option) => optionMap.set(option.id, option.priceDeltaCents)));
    const optionCents = selectedOptionIds.reduce((accumulator, id) => accumulator + (optionMap.get(id) ?? 0), 0);
    const ingredientMap = /* @__PURE__ */ new Map();
    data.allIngredients.forEach((ingredient) => ingredientMap.set(ingredient.id, ingredient.addPriceDeltaCents));
    const addedCents = addedIds.reduce((accumulator, id) => accumulator + (ingredientMap.get(id) ?? 0), 0);
    return optionCents + addedCents;
  }, [data, selectedOptionIds, addedIds]);
  const totalCents = useMemo(() => {
    if (!data) return 0;
    return data.product.priceCents + priceExtrasCents;
  }, [data, priceExtrasCents]);
  async function onAdd() {
    if (!data) return;
    await addToCart({
      productId: data.product.id,
      qty: 1,
      modifierOptionIds: selectedOptionIds,
      addedIngredientIds: addedIds,
      removedIngredientIds: removedIds
    });
    setOpen(false);
    setProductId(null);
  }
  if (!open) return null;
  return jsxs("div", {
    class: "fixed inset-0 z-50",
    children: [jsx("div", {
      class: "absolute inset-0 bg-black/40",
      onClick: () => setOpen(false)
    }), jsxs("div", {
      class: "absolute inset-x-0 bottom-0 h-[92dvh] w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:left-1/2 sm:top-1/2 sm:h-[90dvh] sm:w-[95vw] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl 2xl:max-w-5xl",
      children: [jsxs("div", {
        class: "flex items-center justify-between border-b border-zinc-200 p-3 sm:p-4",
        children: [jsxs("div", {
          class: "min-w-0",
          children: [jsx("div", {
            class: "text-xs text-zinc-600",
            children: "Personalizar"
          }), jsx("div", {
            class: "truncate text-sm font-semibold sm:text-base",
            children: loading ? "Cargando..." : data?.product.name ?? "Producto"
          })]
        }), jsx("button", {
          class: "shrink-0 text-sm text-zinc-600 hover:underline",
          type: "button",
          onClick: () => setOpen(false),
          children: "Cerrar"
        })]
      }), jsx("div", {
        class: "h-[calc(100%-8.5rem)] overflow-y-auto p-3 sm:h-[calc(100%-9rem)] sm:p-4 lg:p-5",
        children: loading || !data ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "Cargando configuración…"
        }) : jsxs(Fragment, {
          children: [jsxs("div", {
            class: "mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4",
            children: [jsxs("div", {
              class: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
              children: [jsxs("div", {
                class: "min-w-0",
                children: [jsx("div", {
                  class: "text-base font-semibold text-zinc-900",
                  children: data.product.name
                }), data.product.description ? jsx("div", {
                  class: "mt-1 text-sm text-zinc-600",
                  children: data.product.description
                }) : null]
              }), jsx("div", {
                class: "shrink-0 text-base font-black text-zinc-900",
                children: money$2(data.product.priceCents)
              })]
            }), data.allergens.length > 0 ? jsx("div", {
              class: "mt-3 flex flex-wrap gap-2",
              children: data.allergens.map((allergen) => jsx("img", {
                src: allergenIconPath(allergen),
                alt: allergen.name,
                title: allergen.name,
                class: "h-7 w-7 object-contain sm:h-8 sm:w-8",
                loading: "lazy"
              }, allergen.slug))
            }) : null]
          }), jsx("div", {
            class: "mb-4 -mx-1 overflow-x-auto pb-1",
            children: jsx("div", {
              class: "flex min-w-max gap-2 px-1 text-xs sm:min-w-0 sm:flex-wrap",
              children: ["Quitar", "Añadir comunes", "Añadir otros", "Extras", "Confirmar"].map((title, index) => jsxs("button", {
                type: "button",
                class: `shrink-0 rounded-full border px-3 py-1 ${index === step ? "border-zinc-900 text-zinc-900" : "border-zinc-300 text-zinc-600"}`,
                onClick: () => setStep(index),
                children: [index + 1, ". ", title]
              }))
            })
          }), step === 0 && jsxs("section", {
            class: "space-y-3",
            children: [jsx("h2", {
              class: "text-base font-semibold sm:text-lg",
              children: "Quitar ingredientes"
            }), removable.length === 0 ? jsx("p", {
              class: "text-sm text-zinc-600",
              children: "Este producto no tiene ingredientes quitables configurados."
            }) : jsx("div", {
              class: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
              children: removable.map((productIngredient) => jsxs("label", {
                class: "flex items-center gap-3 rounded-xl border border-zinc-200 p-3",
                children: [jsx("input", {
                  type: "checkbox",
                  checked: removedIds.includes(productIngredient.ingredientId),
                  onChange: () => toggleRemoved(productIngredient.ingredientId)
                }), jsxs("span", {
                  class: "text-sm",
                  children: ["Sin ", productIngredient.name]
                })]
              }))
            })]
          }), step === 1 && jsxs("section", {
            class: "space-y-3",
            children: [jsx("h2", {
              class: "text-base font-semibold sm:text-lg",
              children: "Añadir ingredientes comunes"
            }), commonToAdd.length === 0 ? jsx("p", {
              class: "text-sm text-zinc-600",
              children: "No hay ingredientes comunes disponibles para añadir."
            }) : jsx("div", {
              class: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
              children: commonToAdd.map((ingredient) => jsxs("label", {
                class: "flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3",
                children: [jsx("span", {
                  class: "text-sm",
                  children: ingredient.name
                }), jsxs("span", {
                  class: "flex items-center gap-3",
                  children: [jsxs("span", {
                    class: "text-xs text-zinc-600",
                    children: ["+", money$2(ingredient.addPriceDeltaCents)]
                  }), jsx("input", {
                    type: "checkbox",
                    checked: addedIds.includes(ingredient.id),
                    onChange: () => toggleAdded(ingredient.id)
                  })]
                })]
              }))
            })]
          }), step === 2 && jsxs("section", {
            class: "space-y-3",
            children: [jsx("h2", {
              class: "text-base font-semibold sm:text-lg",
              children: "Añadir otros ingredientes"
            }), jsx("input", {
              class: "w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              placeholder: "Buscar ingrediente…",
              value: search,
              onInput: (event) => setSearch(event.target.value)
            }), jsx("div", {
              class: "grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
              children: allToAdd.map((ingredient) => jsxs("label", {
                class: "flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3",
                children: [jsx("span", {
                  class: "text-sm",
                  children: ingredient.name
                }), jsxs("span", {
                  class: "flex items-center gap-3",
                  children: [jsxs("span", {
                    class: "text-xs text-zinc-600",
                    children: ["+", money$2(ingredient.addPriceDeltaCents)]
                  }), jsx("input", {
                    type: "checkbox",
                    checked: addedIds.includes(ingredient.id),
                    onChange: () => toggleAdded(ingredient.id)
                  })]
                })]
              }))
            }), allToAdd.length === 0 && jsx("p", {
              class: "text-sm text-zinc-600",
              children: "No hay resultados."
            })]
          }), step === 3 && jsxs("section", {
            class: "space-y-4",
            children: [jsx("h2", {
              class: "text-base font-semibold sm:text-lg",
              children: "Extras"
            }), data.modifierGroups.length === 0 ? jsx("p", {
              class: "text-sm text-zinc-600",
              children: "Este producto no tiene extras configurados."
            }) : data.modifierGroups.map((group) => {
              const groupOptionIds = new Set(group.options.map((option) => option.id));
              const selectedInGroup = selectedOptionIds.filter((id) => groupOptionIds.has(id));
              return jsxs("div", {
                class: "rounded-2xl border border-zinc-200 p-3 sm:p-4",
                children: [jsxs("div", {
                  class: "flex items-baseline justify-between gap-3",
                  children: [jsx("div", {
                    class: "font-semibold",
                    children: group.name
                  }), jsx("div", {
                    class: "text-xs text-zinc-600",
                    children: group.maxSelect === 1 ? "Elige 1 (opcional)" : `Máx ${group.maxSelect}`
                  })]
                }), jsx("div", {
                  class: "mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3",
                  children: group.options.map((option) => {
                    const checked = selectedOptionIds.includes(option.id);
                    const disable = !checked && group.maxSelect > 1 && selectedInGroup.length >= group.maxSelect;
                    return jsxs("button", {
                      type: "button",
                      class: `flex items-center justify-between rounded-xl border p-3 text-left text-sm ${checked ? "border-zinc-900" : "border-zinc-200"} ${disable ? "opacity-50 pointer-events-none" : ""}`,
                      onClick: () => toggleOption(group, option.id),
                      disabled: disable,
                      children: [jsx("span", {
                        children: option.name
                      }), jsxs("span", {
                        class: "text-xs text-zinc-600",
                        children: ["+", money$2(option.priceDeltaCents)]
                      })]
                    }, option.id);
                  })
                })]
              }, group.id);
            })]
          }), step === 4 && jsxs("section", {
            class: "space-y-3",
            children: [jsx("h2", {
              class: "text-base font-semibold sm:text-lg",
              children: "Confirmar"
            }), jsxs("div", {
              class: "rounded-2xl border border-zinc-200 p-3 text-sm sm:p-4",
              children: [jsxs("div", {
                class: "flex items-center justify-between",
                children: [jsx("span", {
                  class: "text-zinc-600",
                  children: "Base"
                }), jsx("span", {
                  class: "font-semibold",
                  children: money$2(data.product.priceCents)
                })]
              }), jsxs("div", {
                class: "mt-2 flex items-center justify-between",
                children: [jsx("span", {
                  class: "text-zinc-600",
                  children: "Extras"
                }), jsx("span", {
                  class: "font-semibold",
                  children: money$2(priceExtrasCents)
                })]
              }), jsxs("div", {
                class: "mt-3 flex items-center justify-between border-t border-zinc-200 pt-3",
                children: [jsx("span", {
                  class: "text-zinc-600",
                  children: "Total unidad"
                }), jsx("span", {
                  class: "text-base font-semibold",
                  children: money$2(totalCents)
                })]
              }), removedIds.length > 0 && jsxs("div", {
                class: "mt-3 text-xs text-zinc-600",
                children: [jsx("span", {
                  class: "font-semibold",
                  children: "Sin:"
                }), " ", removedIds.map((id) => data.productIngredients.find((item) => item.ingredientId === id)?.name).filter(Boolean).join(", ")]
              }), addedIds.length > 0 && jsxs("div", {
                class: "mt-1 text-xs text-zinc-600",
                children: [jsx("span", {
                  class: "font-semibold",
                  children: "Extra:"
                }), " ", addedIds.map((id) => data.allIngredients.find((item) => item.id === id)).filter(Boolean).map((item) => `${item.name} (+${money$2(item.addPriceDeltaCents)})`).join(", ")]
              })]
            }), jsx("button", {
              class: "w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white",
              type: "button",
              onClick: onAdd,
              children: "Añadir al carrito"
            })]
          })]
        })
      }), jsx("div", {
        class: "border-t border-zinc-200 p-3 sm:p-4",
        children: jsxs("div", {
          class: "flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between",
          children: [jsx("button", {
            class: "w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold sm:w-auto",
            type: "button",
            onClick: () => setStep((current) => Math.max(0, current - 1)),
            disabled: step === 0,
            children: "Atrás"
          }), jsx("button", {
            class: "w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto",
            type: "button",
            onClick: () => setStep((current) => Math.min(4, current + 1)),
            disabled: step === 4 || loading || !data,
            children: "Siguiente"
          })]
        })
      })]
    })]
  });
}

function money$1(cents) {
  return `${(cents / 100).toFixed(2)} €`;
}
function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(getCartSnapshot());
  const [loading, setLoading] = useState(false);
  async function loadCart() {
    setLoading(true);
    try {
      const data = await refreshCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    return subscribeCart(() => setCart(getCartSnapshot()));
  }, []);
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onClose = () => setOpen(false);
    const onToggle = () => setOpen((v) => !v);
    window.addEventListener("arcadia:cart:open", onOpen);
    window.addEventListener("arcadia:cart:close", onClose);
    window.addEventListener("arcadia:cart:toggle", onToggle);
    return () => {
      window.removeEventListener("arcadia:cart:open", onOpen);
      window.removeEventListener("arcadia:cart:close", onClose);
      window.removeEventListener("arcadia:cart:toggle", onToggle);
    };
  }, []);
  useEffect(() => {
    if (open) void loadCart();
  }, [open]);
  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalCents ?? 0;
  const empty = useMemo(() => !loading && items.length === 0, [loading, items.length]);
  async function setQty$1(lineId, qty) {
    const safeQty = Math.max(1, Math.min(99, qty));
    await setQty(lineId, safeQty);
  }
  async function removeLine$1(lineId) {
    await removeLine(lineId);
  }
  async function clearCart$1() {
    await clearCart();
  }
  function openUpsell() {
    if (items.length === 0) return;
    setOpen(false);
    window.dispatchEvent(new Event("arcadia:upsell:open"));
  }
  if (!open) return null;
  return jsxs("div", {
    class: "fixed inset-0 z-50",
    children: [jsx("div", {
      class: "absolute inset-0 bg-black/40",
      onClick: () => setOpen(false)
    }), jsxs("div", {
      class: "absolute inset-x-0 bottom-0 h-[88dvh] w-full rounded-t-3xl bg-white shadow-xl sm:right-0 sm:top-0 sm:inset-x-auto sm:h-full sm:w-[92vw] sm:max-w-md sm:rounded-none",
      children: [jsxs("div", {
        class: "flex items-center justify-between border-b border-zinc-200 p-3 sm:p-4",
        children: [jsxs("div", {
          children: [jsx("div", {
            class: "text-xs text-zinc-600",
            children: "Tu pedido"
          }), jsx("div", {
            class: "text-base font-semibold",
            children: "Carrito"
          })]
        }), jsx("button", {
          class: "text-sm text-zinc-600 hover:underline",
          type: "button",
          onClick: () => setOpen(false),
          children: "Cerrar"
        })]
      }), jsx("div", {
        class: "h-[calc(100%-150px)] overflow-y-auto p-3 sm:h-[calc(100%-160px)] sm:p-4",
        children: loading && !cart ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "Cargando…"
        }) : empty ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "Tu carrito está vacío."
        }) : jsx("div", {
          class: "space-y-3 sm:space-y-4",
          children: items.map((it) => jsxs("div", {
            class: "rounded-2xl border border-zinc-200 p-3 sm:p-4",
            children: [jsxs("div", {
              class: "flex gap-3",
              children: [it.imageUrl ? jsx("img", {
                class: "h-12 w-12 rounded-xl object-cover sm:h-14 sm:w-14",
                src: it.imageUrl,
                alt: it.name
              }) : jsx("div", {
                class: "h-12 w-12 rounded-xl bg-zinc-100 sm:h-14 sm:w-14"
              }), jsxs("div", {
                class: "min-w-0 flex-1",
                children: [jsx("div", {
                  class: "truncate text-sm font-semibold",
                  children: it.name
                }), it.variantName ? jsx("div", {
                  class: "text-xs text-zinc-600",
                  children: it.variantName
                }) : null, jsxs("div", {
                  class: "mt-1 text-xs text-zinc-600",
                  children: [money$1(it.unitPriceCents), " / ud"]
                }), it.modifiers?.length ? jsxs("div", {
                  class: "mt-2 text-xs text-zinc-600",
                  children: [jsx("span", {
                    class: "font-semibold",
                    children: "Extras:"
                  }), " ", it.modifiers.map((m) => `${m.name} (+${(m.priceDeltaCents / 100).toFixed(2)}€)`).join(", ")]
                }) : null, it.ingredientsRemoved?.length ? jsxs("div", {
                  class: "mt-2 text-xs text-zinc-600",
                  children: [jsx("span", {
                    class: "font-semibold",
                    children: "Sin:"
                  }), " ", it.ingredientsRemoved.map((x) => x.name).join(", ")]
                }) : null, it.ingredientsAdded?.length ? jsxs("div", {
                  class: "mt-1 text-xs text-zinc-600",
                  children: [jsx("span", {
                    class: "font-semibold",
                    children: "Añadido:"
                  }), " ", it.ingredientsAdded.map((x) => `${x.name} (+${(x.priceDeltaCents / 100).toFixed(2)}€)`).join(", ")]
                }) : null, it.notes ? jsxs("div", {
                  class: "mt-2 text-xs text-zinc-600",
                  children: ["Nota: ", it.notes]
                }) : null]
              })]
            }), jsxs("div", {
              class: "mt-3 flex items-center justify-between",
              children: [jsxs("div", {
                class: "flex items-center gap-2",
                children: [jsx("button", {
                  class: "h-9 w-9 rounded-xl border border-zinc-300 text-sm font-semibold",
                  type: "button",
                  onClick: () => setQty$1(it.lineId, it.qty - 1),
                  children: "−"
                }), jsx("div", {
                  class: "w-10 text-center text-sm font-semibold",
                  children: it.qty
                }), jsx("button", {
                  class: "h-9 w-9 rounded-xl border border-zinc-300 text-sm font-semibold",
                  type: "button",
                  onClick: () => setQty$1(it.lineId, it.qty + 1),
                  children: "+"
                })]
              }), jsx("div", {
                class: "text-sm font-semibold",
                children: money$1(it.lineTotalCents)
              })]
            }), jsx("div", {
              class: "mt-3 flex justify-end",
              children: jsx("button", {
                class: "text-xs font-semibold text-red-700 hover:underline",
                type: "button",
                onClick: () => removeLine$1(it.lineId),
                children: "Quitar"
              })
            })]
          }, it.lineId))
        })
      }), jsxs("div", {
        class: "border-t border-zinc-200 p-3 sm:p-4",
        children: [jsxs("div", {
          class: "flex items-center justify-between text-sm",
          children: [jsx("span", {
            class: "text-zinc-600",
            children: "Subtotal"
          }), jsx("span", {
            class: "font-semibold",
            children: money$1(subtotal)
          })]
        }), jsxs("div", {
          class: "mt-3 flex flex-col gap-2 sm:flex-row",
          children: [jsx("button", {
            class: "flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold",
            type: "button",
            onClick: clearCart$1,
            disabled: items.length === 0,
            children: "Vaciar"
          }), jsx("button", {
            class: `flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-white ${items.length === 0 ? "bg-zinc-400 pointer-events-none" : "bg-zinc-900"}`,
            type: "button",
            onClick: openUpsell,
            disabled: items.length === 0,
            children: "Finalizar"
          })]
        })]
      })]
    })]
  });
}

function money(cents) {
  return `${(cents / 100).toFixed(2)} €`;
}
function goToCheckout() {
  window.location.href = "/checkout";
}
function UpsellModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [busyId, setBusyId] = useState(null);
  async function load() {
    setLoading(true);
    try {
      const res = await api("/api/catalog/upsell");
      const list = res.products ?? [];
      setProducts(list);
      return list;
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    const onOpen = async () => {
      setOpen(true);
      const list = await load();
      if (list.length === 0) {
        setOpen(false);
        goToCheckout();
      }
    };
    window.addEventListener("arcadia:upsell:open", onOpen);
    return () => window.removeEventListener("arcadia:upsell:open", onOpen);
  }, []);
  async function quickAdd(productId) {
    setBusyId(productId);
    try {
      await addToCart({
        productId,
        qty: 1,
        modifierOptionIds: [],
        addedIngredientIds: [],
        removedIngredientIds: []
      });
      setOpen(false);
      goToCheckout();
    } catch (err) {
      alert(err?.message || "No se pudo añadir");
    } finally {
      setBusyId(null);
    }
  }
  if (!open) return null;
  return jsxs("div", {
    class: "fixed inset-0 z-60",
    children: [jsx("button", {
      class: "absolute inset-0 bg-black/40",
      "aria-label": "Cerrar",
      onClick: () => setOpen(false),
      type: "button"
    }), jsxs("div", {
      class: "fixed inset-x-0 bottom-0 max-h-[84dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:relative sm:mx-auto sm:mt-24 sm:max-h-none sm:w-[min(92vw,720px)] sm:overflow-visible sm:rounded-3xl sm:p-5",
      children: [jsxs("div", {
        class: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
        children: [jsxs("div", {
          children: [jsx("div", {
            class: "text-xl font-semibold tracking-tight",
            children: "¿Quieres algo más?"
          }), jsx("div", {
            class: "mt-1 text-sm text-zinc-600",
            children: "Añade algo rápido antes de terminar tu pedido."
          })]
        }), jsx("button", {
          class: "w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold sm:w-auto",
          onClick: goToCheckout,
          type: "button",
          children: "No, gracias"
        })]
      }), jsx("div", {
        class: "mt-4",
        children: loading ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "Cargando sugerencias…"
        }) : products.length === 0 ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: "No hay sugerencias ahora mismo."
        }) : jsx("div", {
          class: "grid gap-3 sm:grid-cols-2",
          children: products.map((p) => jsxs("div", {
            class: "rounded-2xl border border-zinc-200 p-3 sm:p-4",
            children: [jsxs("div", {
              class: "flex items-start justify-between gap-3",
              children: [jsxs("div", {
                class: "min-w-0",
                children: [jsx("div", {
                  class: "truncate text-sm font-semibold",
                  children: p.name
                }), p.description ? jsx("div", {
                  class: "mt-1 line-clamp-2 text-xs text-zinc-600",
                  children: p.description
                }) : null, jsx("div", {
                  class: "mt-2 text-sm font-semibold",
                  children: money(p.priceCents)
                })]
              }), p.imageUrl ? jsx("img", {
                class: "h-12 w-12 rounded-xl object-cover sm:h-14 sm:w-14",
                src: p.imageUrl,
                alt: p.name
              }) : jsx("div", {
                class: "h-12 w-12 rounded-xl bg-zinc-100 sm:h-14 sm:w-14"
              })]
            }), jsx("button", {
              class: `mt-3 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${busyId === p.id ? "opacity-60 pointer-events-none" : ""}`,
              type: "button",
              onClick: () => quickAdd(p.id),
              children: busyId === p.id ? "Añadiendo…" : "Añadir"
            })]
          }, p.id))
        })
      }), jsxs("div", {
        class: "mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap",
        children: [jsx("button", {
          class: "w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold sm:w-auto",
          type: "button",
          onClick: () => {
            setOpen(false);
            window.dispatchEvent(new Event("arcadia:cart:open"));
          },
          children: "Ver carrito"
        }), jsx("button", {
          class: "w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto",
          type: "button",
          onClick: goToCheckout,
          children: "Ir a checkout"
        })]
      })]
    })]
  });
}

const $$Astro = createAstro();
const $$SiteLayout = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$SiteLayout;
  const {
    title = "Arcadia",
    variant = "default",
    fullWidth = false
  } = Astro2.props;
  const isLanding = variant === "landing";
  const bodyClass = isLanding ? "min-h-dvh bg-[#fbfaf7] text-zinc-900" : "min-h-dvh bg-white text-zinc-900";
  const mainClass = fullWidth || isLanding ? "w-full" : "mx-auto w-full max-w-6xl px-4 py-6 sm:py-8 2xl:max-w-[112rem]";
  return renderTemplate`<html lang="es"> <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="generator"${addAttribute(Astro2.generator, "content")}><link rel="icon" type="image/svg+xml" href="/ARCADIA_LOGO.svg"><title>${title}</title>${renderHead()}</head> <body${addAttribute(bodyClass, "class")}> ${renderComponent($$result, "Header", $$Header, {})} <main${addAttribute(mainClass, "class")}> ${renderSlot($$result, $$slots["default"])} </main> ${renderComponent($$result, "Footer", $$Footer, {})} ${renderComponent($$result, "ProductConfiguratorModal", ProductConfiguratorModal, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/product/ProductConfiguratorModal", "client:component-export": "default" })} ${renderComponent($$result, "CartDrawer", CartDrawer, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/cart/CartDrawer", "client:component-export": "default" })} ${renderComponent($$result, "UpsellModal", UpsellModal, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/upsell/UpsellModal", "client:component-export": "default" })} </body></html>`;
}, "C:/Users/VICTOR/Dev/arcadia/src/layouts/SiteLayout.astro", void 0);

export { $$SiteLayout as $, api as a, addToCart as b, createSvgComponent as c };
