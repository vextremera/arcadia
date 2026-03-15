import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import { addToCart } from "@/islands/cart/cartClient";
import FavoriteHoverButton from "@/islands/favorites/FavoriteHoverButton";

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
  allergens?: string[];
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
  window.dispatchEvent(new CustomEvent("arcadia:product:open", { detail: { productId } }));
}

function shortTitle(name: string) {
  const TITLE_MAX = 50;
  return name.length > TITLE_MAX ? `${name.slice(0, TITLE_MAX)}…` : name;
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
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", `#${id}`);
    }
    setCatMenuOpen(false);
  }

  useEffect(() => {
    if (!catMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCatMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [catMenuOpen]);

  useEffect(() => {
    const update = () => {
      const header = document.getElementById("site-header");
      const headerH = header?.getBoundingClientRect().height ?? 70;
      const barH = catBarRef.current?.getBoundingClientRect().height ?? 0;

      setStickyTop(Math.ceil(headerH));
      setScrollOffset(Math.ceil(headerH + barH + 12)); // +12px aire
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

  const navCategories = useMemo(() => menu.filter((c) => (c.products ?? []).length > 0), [menu]);

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
      window.dispatchEvent(new Event("arcadia:upsell:open"));
    } catch (err) {
      alert((err as any)?.message || "No se pudo añadir al carrito");
    } finally {
      setAddingId(null);
    }
  }

  function onPlusClick(e: any, p: MenuProduct) {
    e.stopPropagation();
    if (p.isConfigurable) openProduct(p.id);
    else void quickAdd(p);
  }

  const heroStyle = {
    backgroundImage:
      "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), url('/images/general/domicilio-header.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div class="w-full" id="top">
      {/* Cabecero (full width) */}
      <section class="relative w-full overflow-hidden bg-zinc-900 rounded-t-[50px]" style={heroStyle}>
        <div class="h-70 sm:h-150" />
        <div class="absolute inset-0">
        <div class="absolute inset-x-0 bottom-0 h-8 bg-bg z-20 rounded-t-[40px]" />
          <div class="flex h-full w-full items-center justify-center text-center px-4 pb-18 sm:px-10 mt-10">
            <div class="text-white">
              <div class="text-4xl sm:text-5xl font-black tracking-widest sigmar-regular">PEDIR</div> 
              <div class="mt-1 text-base sm:text-[20px] text-white/80">
                Elige tus productos y perso nalízalos al momento.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submenu categorías (sticky bajo header, full width) */}
      <div
        ref={catBarRef}
        class="sticky z-30 border-b border-zinc-200 bg-[#FFFFF795] backdrop-blur"
        style={{ top: `${stickyTop}px` }}
      >
        <div class="w-full px-4 py-3 sm:px-10">
          {loading && menu.length === 0 ? (
            <div class="text-sm text-zinc-600">Cargando categorías…</div>
          ) : navCategories.length === 0 ? (
            <div class="text-sm text-zinc-600">No hay categorías disponibles.</div>
          ) : (
            <>
              {/* móvil: botón hamburguesa */}
              <div class="flex items-center justify-between sm:hidden">
                <div class="text-sm font-semibold text-zinc-700">Categorías</div>
                <button
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                  aria-haspopup="dialog"
                  aria-expanded={catMenuOpen}
                  onClick={() => setCatMenuOpen(true)}
                >
                  <span>Ver</span>
                  <span aria-hidden="true">☰</span>
                </button>
              </div>

              {/* sm+: chips normales (wrap) */}
              <nav class="hidden sm:flex flex-wrap items-center gap-2" aria-label="Categorías">
                {navCategories.map((c) => (
                  <a
                    key={c.id}
                    href={`#cat-${c.slug}`}
                    class="whitespace-nowrap rounded-full border border-zinc-300 bg-bg px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-[#fffff1]"
                  >
                    {c.name}
                  </a>
                ))}
              </nav>

              {/* sheet móvil */}
              {catMenuOpen ? (
                <div
                  class="fixed inset-0 z-60 bg-black/40 sm:hidden"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Categorías"
                  onClick={() => setCatMenuOpen(false)}
                >
                  <div
                    class="fixed inset-x-0 bottom-0 rounded-t-3xl bg-white p-4 shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div class="flex items-center justify-between">
                      <div class="text-base font-black">Categorías</div>
                      <button
                        type="button"
                        class="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                        onClick={() => setCatMenuOpen(false)}
                      >
                        Cerrar
                      </button>
                    </div>

                    <div class="mt-3 max-h-[60vh] overflow-auto">
                      <div class="grid gap-2">
                        {navCategories.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            class="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm font-semibold hover:bg-zinc-50"
                            onClick={() => scrollToCategory(c.slug)}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {/* Contenido (full width) */}
      <div class="w-full px-4 py-8 sm:px-10">
        {loading && menu.length === 0 ? (
          <div class="text-sm text-zinc-600">Cargando productos…</div>
        ) : menu.length === 0 ? (
          <div class="text-sm text-zinc-600">No hay productos disponibles.</div>
        ) : (
          <div class="space-y-10">
            {menu.map((cat) => (
              <section key={cat.id} id={`cat-${cat.slug}`} style={{ scrollMarginTop: `${scrollOffset}px` }}>
                <div class="flex items-baseline justify-between gap-3">
                  <h2 class="text-xl sm:text-2xl font-medium tracking-widest sigmar-regular">{cat.name}</h2>
                  <a class="text-xs font-semibold text-zinc-500 hover:underline" href="#top">
                    ↑ arriba
                  </a>
                </div>

                {cat.products.length === 0 ? (
                  <div class="mt-3 text-sm text-zinc-600">No hay productos en esta categoría.</div>
                ) : (
                  <div class="mt-4 grid gap-4 md:grid-cols-2">
                    {cat.products.map((p) => {
                      const ing = p.ingredients ?? [];
                      const ingredientsText =
                        ing.length > 0 ? ing.join(", ") : p.description ? p.description : "";

                      const busy = addingId === p.id;
                      const flashed = flashAddedId === p.id;
                      const displayName = shortTitle(p.name);

                      const imgSrc =
                        p.imageUrl && p.imageUrl.startsWith("/")
                          ? p.imageUrl
                          : p.imageUrl
                            ? `/${p.imageUrl}`
                            : null;

                      return (
                        <article
                          key={p.id}
                          class="group relative cursor-pointer rounded-3xl border border-zinc-200 bg-bg p-4 transition hover:bg-[#fffff1] sm:p-5 shadow-md"
                          onClick={() => openProduct(p.id)}
                        >

                          <div class="flex gap-4">
                            {/* Texto */}
                            <div class="min-w-0 flex-1 flex flex-col">
                              <div class="min-w-0">
                                <div class="flex items-center gap-2 min-w-0">
                                  <h3
                                    class="min-w-0 truncate text-base font-semibold leading-tight sm:text-lg"
                                    title={p.name}
                                  >
                                    {displayName}
                                  </h3>
                                </div>

                                {ingredientsText ? (
                                  <p class="mt-2 line-clamp-3 text-sm text-zinc-600">{ingredientsText}</p>
                                ) : (
                                  <p class="mt-2 text-sm text-zinc-500">(Sin descripción)</p>
                                )}
                              </div>

                              {/* Franja inferior: precio + alérgenos + ❤️ */}
                              <div class="mt-auto flex items-end justify-between gap-3 pt-4">
                                <div class="text-lg font-black sm:text-xl">{money(p.priceCents)}</div>

                                {p.allergens?.length ? (
                                  <div class="flex flex-wrap gap-2">
                                    {p.allergens.map((a) => (
                                      <span
                                        key={a}
                                        class="grid h-7 w-7 place-items-center rounded-full border border-zinc-300 text-[10px] font-bold text-zinc-700"
                                        title={a}
                                      >
                                        {a.slice(0, 2).toUpperCase()}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <div class="h-7" />
                                )}

                                <FavoriteHoverButton productId={p.id} variant="icon" />
                              </div>
                            </div>

                            {/* Imagen */}
                            <div class="relative h-40 w-40 shrink-0 sm:h-44 sm:w-44">
                              {imgSrc ? (
                                <img
                                  class="h-full w-full rounded-2xl border border-zinc-200 bg-zinc-500 object-cover"
                                  src={imgSrc}
                                  alt={p.name}
                                  loading="lazy"
                                />
                              ) : (
                                <div class="h-full w-full rounded-2xl border border-zinc-200 bg-white backdrop-blur-2xl" />
                              )}

                              {/* + overlay */}
                              <button
                                type="button"
                                aria-label={p.isConfigurable ? "Abrir configurador" : "Añadir al carrito"}
                                title={p.isConfigurable ? "Personalizar" : "Añadir"}
                                onClick={(e) => onPlusClick(e, p)}
                                class={[
                                  "absolute -top-2 -right-2 grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm transition",
                                  busy ? "pointer-events-none opacity-70" : "hover:scale-[1.02]",
                                ].join(" ")}
                              >
                                <span class="text-lg font-black leading-none">{flashed ? "✓" : "+"}</span>
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
  );
}
