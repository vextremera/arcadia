import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import { addToCart } from "@/islands/cart/cartClient";
import FavoriteButton from "@/islands/favorites/FavoriteButton";

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

  useEffect(() => {
    const header = document.getElementById("site-header");
    const h = header?.getBoundingClientRect().height;
    if (h && Number.isFinite(h)) setStickyTop(Math.ceil(h));
  }, []);

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
      "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), url('/pedir-hero.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div class="w-full" id="top">
      {/* Cabecero (full width) */}
      <section class="relative w-full overflow-hidden bg-zinc-900" style={heroStyle}>
        <div class="h-44 sm:h-56" />
        <div class="absolute inset-0">
          <div class="flex h-full w-full items-end px-4 pb-6 sm:px-10">
            <div class="text-white">
              <div class="text-3xl sm:text-4xl font-black tracking-tight">Pedir</div>
              <div class="mt-1 text-sm sm:text-base text-white/80">
                Elige tus productos y personalízalos al momento.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Submenu categorías (sticky bajo header, full width) */}
      <div
        class="sticky z-30 border-b border-zinc-200 bg-white/95 backdrop-blur"
        style={{ top: `${stickyTop}px` }}
      >
        <div class="w-full px-4 py-3 sm:px-10">
          {loading && menu.length === 0 ? (
            <div class="text-sm text-zinc-600">Cargando categorías…</div>
          ) : navCategories.length === 0 ? (
            <div class="text-sm text-zinc-600">No hay categorías disponibles.</div>
          ) : (
            <nav class="arcadia-catnav flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none]">
              <style>{".arcadia-catnav::-webkit-scrollbar{display:none}"}</style>

              {navCategories.map((c) => (
                <a
                  key={c.id}
                  href={`#cat-${c.slug}`}
                  class="whitespace-nowrap rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
                >
                  {c.name}
                </a>
              ))}
            </nav>
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
              <section key={cat.id} id={`cat-${cat.slug}`} class="scroll-mt-40">
                <div class="flex items-baseline justify-between gap-3">
                  <h2 class="text-xl sm:text-2xl font-semibold tracking-tight">{cat.name}</h2>
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
                      const ingredientsText = ing.length > 0 ? ing.join(", ") : p.description ? p.description : "";

                      const busy = addingId === p.id;
                      const flashed = flashAddedId === p.id;
                      const displayName = shortTitle(p.name);

                      return (
                        <article
                          key={p.id}
                          class="group relative rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5 transition hover:bg-zinc-50 cursor-pointer"
                          onClick={() => openProduct(p.id)}
                        >
                          <div class="flex gap-4">
                            {/* Texto */}
                            <div class="min-w-0 flex-1 flex flex-col">
                              <div class="min-w-0">
                                <div class="flex items-center gap-2 min-w-0">
                                  <h3
                                    class="min-w-0 truncate text-base sm:text-lg font-semibold leading-tight"
                                    title={p.name}
                                  >
                                    {displayName}
                                  </h3>

                                  <FavoriteButton productId={p.id} variant="icon" />
                                </div>

                                {ingredientsText ? (
                                  <p class="mt-2 text-sm text-zinc-600 line-clamp-3">{ingredientsText}</p>
                                ) : (
                                  <p class="mt-2 text-sm text-zinc-500">(Sin descripción)</p>
                                )}
                              </div>

                              {/* Franja inferior: precio + (futuro) alérgenos */}
                              <div class="mt-auto pt-4 flex items-end justify-between gap-3">
                                <div class="text-lg sm:text-xl font-black">{money(p.priceCents)}</div>

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
                              </div>
                            </div>

                            {/* Imagen */}
                            <div class="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0">
                              {p.imageUrl ? (
                                <img
                                  class="h-full w-full rounded-2xl object-cover border border-zinc-200 bg-zinc-100"
                                  src={p.imageUrl}
                                  alt={p.name}
                                  loading="lazy"
                                />
                              ) : (
                                <div class="h-full w-full rounded-2xl border border-zinc-200 bg-zinc-100" />
                              )}

                              {/* + overlay */}
                              <button
                                type="button"
                                aria-label={p.isConfigurable ? "Abrir configurador" : "Añadir al carrito"}
                                title={p.isConfigurable ? "Personalizar" : "Añadir"}
                                onClick={(e) => onPlusClick(e, p)}
                                class={`absolute -top-2 -right-2 grid h-11 w-11 place-items-center rounded-full border border-zinc-200 bg-white shadow-sm transition ${busy ? "opacity-70 pointer-events-none" : "hover:scale-[1.02]"
                                  }`}
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