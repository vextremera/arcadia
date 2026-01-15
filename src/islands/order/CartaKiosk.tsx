import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";

type Category = { id: number; name: string; slug: string; sortOrder: number };
type Product = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
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

  // cargar categorías
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

  // cargar productos de categoría
  useEffect(() => {
    if (!categoryId) return;
    setLoadingProducts(true);
    api<{ products: Product[] }>(`/api/catalog/categories/${categoryId}/products`)
      .then((res) => setProducts(res.products))
      .finally(() => setLoadingProducts(false));
  }, [categoryId]);

  const selected = useMemo(() => categories.find((c) => c.id === categoryId) ?? null, [categories, categoryId]);

  function openProduct(productId: number) {
    window.dispatchEvent(new CustomEvent("arcadia:product:open", { detail: { productId } }));
  }

  return (
    <div class="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
      {/* Aside categorías */}
      <aside class="lg:sticky lg:top-4 lg:h-[calc(100dvh-120px)] lg:overflow-y-auto">
        <div class="rounded-2xl border border-zinc-200 p-4">
          <div class="text-sm font-semibold">Categorías</div>

          {loadingCats ? (
            <div class="mt-3 text-sm text-zinc-600">Cargando…</div>
          ) : (
            <div class="mt-3 flex flex-col gap-1">
              {categories.map((c) => {
                const active = c.id === categoryId;
                return (
                  <button
                    type="button"
                    class={`w-full rounded-xl px-3 py-2 text-left text-sm font-semibold ${
                      active ? "bg-zinc-900 text-white" : "hover:bg-zinc-50"
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
      </aside>

      {/* Main productos */}
      <main class="min-w-0">
        <div class="flex items-baseline justify-between gap-4">
          <h1 class="text-2xl font-semibold tracking-tight">
            {selected ? selected.name : "Carta"}
          </h1>

          <button
            class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold"
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
          <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <article class="rounded-2xl border border-zinc-200 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <div class="truncate text-sm font-semibold">{p.name}</div>
                    {p.description ? (
                      <div class="mt-1 line-clamp-2 text-xs text-zinc-600">{p.description}</div>
                    ) : null}
                    <div class="mt-2 text-sm font-semibold">{money(p.priceCents)}</div>
                  </div>

                  {p.imageUrl ? (
                    <img class="h-16 w-16 rounded-xl object-cover" src={p.imageUrl} alt={p.name} />
                  ) : (
                    <div class="h-16 w-16 rounded-xl bg-zinc-100" />
                  )}
                </div>

                <button
                  class="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                  type="button"
                  onClick={() => openProduct(p.id)}
                >
                  Personalizar
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
