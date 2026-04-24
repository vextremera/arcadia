import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import { addToCart } from "@/islands/cart/cartClient";

type ProductAllergen = {
  slug: string;
  name: string;
  iconUrl: string | null;
};

type MenuProduct = {
  id: number;
  categoryId: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  ingredients: string[];
  isConfigurable: boolean;
  allergens: ProductAllergen[];
};

type MenuCategory = {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  products: MenuProduct[];
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

function openProduct(productId: number) {
  window.dispatchEvent(
    new CustomEvent("arcadia:product:open", { detail: { productId } }),
  );
}

function allergenIconPath(allergen: ProductAllergen) {
  return allergen.iconUrl ?? `/images/allergens/${allergen.slug}.webp`;
}

export default function CartaKiosk() {
  const [menu, setMenu] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [stickyTop, setStickyTop] = useState(84);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [flashAddedId, setFlashAddedId] = useState<number | null>(null);

  const [scrollOffset, setScrollOffset] = useState(160);
  const catBarRef = useRef<HTMLDivElement>(null);

  const [catMenuOpen, setCatMenuOpen] = useState(false);

  function scrollToCategory(slug: string) {
    const id = `cat-${slug}`;
    const element = document.getElementById(id);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }

    setCatMenuOpen(false);
  }

  useEffect(() => {
    if (!catMenuOpen) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setCatMenuOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catMenuOpen]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const html = document.documentElement;
    const body = document.body;

    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyTouchAction = body.style.touchAction;

    if (catMenuOpen) {
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      body.style.touchAction = "none";
    }

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevBodyTouchAction;
    };
  }, [catMenuOpen]);

  useEffect(() => {
    const update = () => {
      const header = document.getElementById("site-header");
      const headerHeight = header?.getBoundingClientRect().height ?? 70;
      const barHeight = catBarRef.current?.getBoundingClientRect().height ?? 0;

      setStickyTop(Math.ceil(headerHeight));
      setScrollOffset(Math.ceil(headerHeight + barHeight + 12));
    };

    update();
    requestAnimationFrame(update);

    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, [menu.length]);

  useEffect(() => {
    setLoading(true);
    api<{ categories: MenuCategory[] }>("/api/catalog/menu")
      .then((res) => setMenu(res.categories ?? []))
      .finally(() => setLoading(false));
  }, []);

  const navCategories = useMemo(
    () => menu.filter((category) => (category.products ?? []).length > 0),
    [menu],
  );

  async function quickAdd(product: MenuProduct) {
    setAddingId(product.id);

    try {
      await addToCart({
        productId: product.id,
        qty: 1,
        modifierOptionIds: [],
        addedIngredientIds: [],
        removedIngredientIds: [],
      });

      setFlashAddedId(product.id);
      window.setTimeout(() => setFlashAddedId(null), 900);
    } catch (error) {
      alert((error as any)?.message || "No se pudo añadir al carrito");
    } finally {
      setAddingId(null);
    }
  }

  function onPlusClick(event: MouseEvent, product: MenuProduct) {
    event.stopPropagation();

    if (product.isConfigurable) openProduct(product.id);
    else void quickAdd(product);
  }

  const heroStyle = {
    backgroundImage:
      "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), url('/images/general/domicilio-header.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div class="w-full" id="top">
      <section
        class="relative w-full overflow-hidden rounded-t-4xl bg-zinc-900 sm:rounded-t-[50px]"
        style={heroStyle}
      >
        <div class="h-56 sm:h-150" />
        <div class="absolute inset-0">
          <div class="absolute inset-x-0 bottom-0 z-20 h-6 rounded-t-3xl bg-bg sm:h-8 sm:rounded-t-[40px]" />
          <div class="flex h-full w-full items-center justify-center px-4 pt-8 pb-12 text-center sm:mt-10 sm:px-10 sm:pt-0 sm:pb-18">
            <div class="text-white">
              <div class="sigmar-regular text-3xl font-black tracking-widest sm:text-5xl">
                PEDIR
              </div>
              <div class="mt-1 text-sm text-white/80 sm:text-[20px]">
                Elige tus productos y personalízalos al momento.
              </div>
            </div>
          </div>
        </div>
      </section>

      <div
        ref={catBarRef}
        class="sticky z-30 border-b border-zinc-200 bg-[#FFFFF795] backdrop-blur"
        style={{ top: `${stickyTop}px` }}
      >
        <div class="mx-auto w-full max-w-448 px-4 py-3 sm:px-10">
          {loading && menu.length === 0 ? (
            <div class="text-sm text-zinc-600">Cargando categorías…</div>
          ) : navCategories.length === 0 ? (
            <div class="text-sm text-zinc-600">
              No hay categorías disponibles.
            </div>
          ) : (
            <>
              <div class="flex items-center justify-between sm:hidden">
                <div class="text-sm font-semibold text-zinc-700">
                  Categorías
                </div>

                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
                  aria-haspopup="dialog"
                  aria-expanded={catMenuOpen}
                  onClick={() => setCatMenuOpen(true)}
                >
                  <span>Ver</span>
                  <span aria-hidden="true">☰</span>
                </button>
              </div>

              <nav
                class="hidden flex-wrap items-center gap-2 sm:flex"
                aria-label="Categorías"
              >
                {navCategories.map((category) => (
                  <a
                    key={category.id}
                    href={`#cat-${category.slug}`}
                    class="whitespace-nowrap rounded-full border border-zinc-300 bg-bg px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-[#fffff1]"
                  >
                    {category.name}
                  </a>
                ))}
              </nav>
            </>
          )}
        </div>
      </div>

      {catMenuOpen ? (
        <div
          class="fixed inset-0 z-[80] sm:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Categorías"
        >
          <div
            class="absolute inset-0 bg-black/40"
            onClick={() => setCatMenuOpen(false)}
          />

          <div class="absolute inset-0 flex h-full flex-col bg-[#f8f7ef]">
            <div class="shrink-0 border-b border-zinc-200 bg-white/90 px-4 pt-[calc(1rem+env(safe-area-inset-top))] pb-4 backdrop-blur">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <div class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Navegación
                  </div>
                  <div class="mt-1 text-2xl font-black text-zinc-900">
                    Categorías
                  </div>
                </div>

                <button
                  type="button"
                  class="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
                  onClick={() => setCatMenuOpen(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>

            <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <div class="grid gap-3">
                {navCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    class="flex min-h-[60px] items-center justify-between rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-left shadow-sm transition hover:bg-zinc-50"
                    onClick={() => scrollToCategory(category.slug)}
                  >
                    <span class="text-base font-semibold text-zinc-900">
                      {category.name}
                    </span>
                    <span
                      class="text-lg font-black text-zinc-400"
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div class="w-full px-4 py-6 sm:px-10 sm:py-8">
        <div class="mx-auto w-full max-w-448">
          {loading && menu.length === 0 ? (
            <div class="text-sm text-zinc-600">Cargando productos…</div>
          ) : menu.length === 0 ? (
            <div class="text-sm text-zinc-600">
              No hay productos disponibles.
            </div>
          ) : (
            <div class="space-y-8 sm:space-y-10">
              {menu.map((category) => (
                <section
                  key={category.id}
                  id={`cat-${category.slug}`}
                  style={{ scrollMarginTop: `${scrollOffset}px` }}
                >
                  <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
                    <h2 class="sigmar-regular text-xl font-medium tracking-widest sm:text-2xl">
                      {category.name}
                    </h2>
                    <a
                      class="text-xs font-semibold text-zinc-500 hover:underline"
                      href="#top"
                    >
                      ↑ arriba
                    </a>
                  </div>

                  {category.products.length === 0 ? (
                    <div class="mt-3 text-sm text-zinc-600">
                      No hay productos en esta categoría.
                    </div>
                  ) : (
                    <div class="mt-4 grid gap-3 sm:gap-4 md:grid-cols-2">
                      {category.products.map((product) => {
                        const ingredients = product.ingredients ?? [];
                        const ingredientsText =
                          ingredients.length > 0
                            ? ingredients.join(", ")
                            : product.description
                              ? product.description
                              : "";

                        const busy = addingId === product.id;
                        const flashed = flashAddedId === product.id;

                        const imageSrc =
                          product.imageUrl && product.imageUrl.startsWith("/")
                            ? product.imageUrl
                            : product.imageUrl
                              ? `/${product.imageUrl}`
                              : null;

                        return (
                          <article
                            key={product.id}
                            class="group relative cursor-pointer rounded-3xl border border-zinc-200 bg-bg p-3 shadow-md transition hover:bg-[#fffff1] sm:p-5"
                            onClick={() => openProduct(product.id)}
                          >
                            <div class="flex flex-col gap-4 min-[520px]:flex-row sm:gap-4">
                              <div class="flex min-w-0 flex-1 flex-col">
                                <div class="min-w-0">
                                  <h3
                                    class="wrap-break-words text-base font-semibold leading-tight sm:text-lg"
                                    title={product.name}
                                  >
                                    {product.name}
                                  </h3>

                                  {ingredientsText ? (
                                    <p class="mt-2 line-clamp-3 text-sm text-zinc-600">
                                      {ingredientsText}
                                    </p>
                                  ) : (
                                    <p class="mt-2 text-sm text-zinc-500">
                                      (Sin descripción)
                                    </p>
                                  )}
                                </div>

                                <div class="mt-auto flex flex-wrap items-end gap-3 pt-4">
                                  <div class="text-lg font-black sm:text-xl">
                                    {money(product.priceCents)}
                                  </div>

                                  {product.allergens.length > 0 ? (
                                    <div class="ml-auto flex flex-wrap justify-end gap-2">
                                      {product.allergens.map((allergen) => (
                                        <img
                                          key={`${product.id}-${allergen.slug}`}
                                          src={allergenIconPath(allergen)}
                                          alt={allergen.name}
                                          title={allergen.name}
                                          class="h-7 w-7 object-contain sm:h-8 sm:w-8"
                                          loading="lazy"
                                        />
                                      ))}
                                    </div>
                                  ) : (
                                    <div class="ml-auto" />
                                  )}
                                </div>
                              </div>

                              <div class="relative h-44 w-full shrink-0 min-[520px]:h-36 min-[520px]:w-36 xl:h-40 xl:w-40">
                                {imageSrc ? (
                                  <img
                                    class="h-full w-full rounded-2xl border border-zinc-200 bg-zinc-500 object-cover"
                                    src={imageSrc}
                                    alt={product.name}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div class="h-full w-full rounded-2xl border border-zinc-200 bg-white backdrop-blur-2xl" />
                                )}

                                <button
                                  type="button"
                                  aria-label={
                                    product.isConfigurable
                                      ? "Abrir configurador"
                                      : "Añadir al carrito"
                                  }
                                  title={
                                    product.isConfigurable
                                      ? "Personalizar"
                                      : "Añadir"
                                  }
                                  onClick={(event) => onPlusClick(event, product)}
                                  class={[
                                    "absolute -top-2 -right-2 grid h-10 w-10 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm transition sm:h-11 sm:w-11",
                                    busy
                                      ? "pointer-events-none opacity-70"
                                      : "hover:scale-[1.02]",
                                  ].join(" ")}
                                >
                                  <span class="text-lg font-black leading-none">
                                    {flashed ? "✓" : "+"}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}