import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import FavoriteButton from "@/islands/favorites/FavoriteButton";

type Category = { id: number; name: string; slug: string; sortOrder: number };

type Product = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  ingredients?: string[];
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default function CartaKiosk() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    setLoadingCats(true);
    api<{ categories: Category[] }>("/api/catalog/categories")
      .then((res) => {
        setCategories(res.categories);
        if (res.categories.length && categoryId == null) setCategoryId(res.categories[0].id);
      })
      .finally(() => setLoadingCats(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!categoryId) return;
    setLoadingProducts(true);
    api<{ products: Product[] }>(`/api/catalog/categories/${categoryId}/products`)
      .then((res) => setProducts(res.products))
      .finally(() => setLoadingProducts(false));
  }, [categoryId]);

  const selected = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId]
  );

  function openProduct(productId: number) {
    window.dispatchEvent(new CustomEvent("arcadia:product:open", { detail: { productId } }));
  }

  return (
    // alto del viewport menos header (aprox). Ajusta 64/72 si cambias header.
    <div class="h-[calc(100dvh-94px)] grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Aside categorías */}
      <aside class="h-full">
        <div class="h-full rounded-3xl border border-zinc-200 bg-white p-4 flex flex-col">
          <div class="text-sm font-semibold">Categorías</div>

          <div class="mt-3 flex-1 overflow-y-auto pr-1">
            {loadingCats ? (
              <div class="text-sm text-zinc-600">Cargando…</div>
            ) : (
              <div class="flex flex-col gap-1">
                {categories.map((c) => {
                  const active = c.id === categoryId;
                  return (
                    <button
                      type="button"
                      class={`w-full rounded-2xl px-3 py-2 text-left text-sm font-semibold transition ${
                        active ? "bg-zinc-900 text-white" : "hover:bg-zinc-50 text-zinc-800"
                      }`}
                      onClick={() => setCategoryId(c.id)}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main productos (scroll independiente) */}
      <main class="h-full min-w-0 overflow-y-auto pr-1">
        <div class="flex items-center justify-between gap-4">
          <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight">
            {selected ? selected.name : "Carta"}
          </h1>

          <button
            class="rounded-2xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
            type="button"
            onClick={() => window.dispatchEvent(new Event("arcadia:cart:open"))}
          >
            Ver carrito
          </button>
        </div>

        {loadingProducts ? (
          <div class="mt-6 text-sm text-zinc-600">Cargando productos…</div>
        ) : products.length === 0 ? (
          <div class="mt-6 text-sm text-zinc-600">No hay productos en esta categoría.</div>
        ) : (
          <div class="mt-6 grid gap-4 md:grid-cols-2 pb-8">
            {products.map((p) => {
              const ing = p.ingredients ?? [];
              const ingredientsText = ing.length > 0 ? ing.join(", ") : (p.description ?? "");

              return (
                <article class="relative rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5">
                  {/* Favorito */}
                  <div class="absolute right-4 top-4 z-10">
                    <FavoriteButton productId={p.id} />
                  </div>

                  <div class="flex gap-4">
                    <div class="min-w-0 flex-1">
                      <h3 class="text-base sm:text-lg font-semibold leading-snug">{p.name}</h3>

                      {ingredientsText ? (
                        <p class="mt-2 text-sm text-zinc-600 line-clamp-3">{ingredientsText}</p>
                      ) : (
                        <p class="mt-2 text-sm text-zinc-500">(Sin descripción)</p>
                      )}

                      <div class="mt-3 flex items-baseline justify-between gap-3">
                        <div class="text-lg sm:text-xl font-black">{money(p.priceCents)}</div>
                        <div class="text-xs text-zinc-500">
                          {p.deliveryEnabled ? "Delivery" : "Sin delivery"} ·{" "}
                          {p.pickupEnabled ? "Recogida" : "Sin recogida"}
                        </div>
                      </div>
                    </div>

                    {p.imageUrl ? (
                      <img
                        class="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl object-cover border border-zinc-200 bg-zinc-100"
                        src={p.imageUrl}
                        alt={p.name}
                        loading="lazy"
                      />
                    ) : (
                      <div class="h-28 w-28 sm:h-32 sm:w-32 rounded-2xl border border-zinc-200 bg-zinc-100" />
                    )}
                  </div>

                  <button
                    class="mt-4 w-full rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:opacity-95"
                    type="button"
                    onClick={() => openProduct(p.id)}
                  >
                    Personalizar
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
