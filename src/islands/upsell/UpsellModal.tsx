import { useEffect, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import { addToCart } from "@/islands/cart/cartClient";

type UpsellProduct = {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  active: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default function UpsellModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ products: UpsellProduct[] }>("/api/catalog/upsell");
      setProducts(res.products ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      load();
    };

    window.addEventListener("arcadia:upsell:open", onOpen as any);
    return () => window.removeEventListener("arcadia:upsell:open", onOpen as any);
  }, []);

  async function quickAdd(productId: number) {
    setBusyId(productId);
    try {
      // Añadido “rápido”: sin personalización
      await addToCart({
        productId,
        qty: 1,
        modifierOptionIds: [],
        addedIngredientIds: [],
        removedIngredientIds: [],
      });
      setOpen(false);
    } catch (err) {
      alert((err as any)?.message || "No se pudo añadir");
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-60">
      <button
        class="absolute inset-0 bg-black/40"
        aria-label="Cerrar"
        onClick={() => setOpen(false)}
        type="button"
      />

      <div class="fixed inset-x-0 bottom-0 max-h-[84dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl sm:relative sm:mx-auto sm:mt-24 sm:max-h-none sm:w-[min(92vw,720px)] sm:overflow-visible sm:rounded-3xl sm:p-5">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="text-xl font-semibold tracking-tight">¿Quieres algo más?</div>
            <div class="mt-1 text-sm text-zinc-600">Añade algo rápido al carrito.</div>
          </div>

          <button
            class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold sm:w-auto"
            onClick={() => setOpen(false)}
            type="button"
          >
            No, gracias
          </button>
        </div>

        <div class="mt-4">
          {loading ? (
            <div class="text-sm text-zinc-600">Cargando sugerencias…</div>
          ) : products.length === 0 ? (
            <div class="text-sm text-zinc-600">No hay sugerencias ahora mismo.</div>
          ) : (
            <div class="grid gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <div class="rounded-2xl border border-zinc-200 p-3 sm:p-4" key={p.id}>
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold">{p.name}</div>
                      {p.description ? (
                        <div class="mt-1 line-clamp-2 text-xs text-zinc-600">{p.description}</div>
                      ) : null}
                      <div class="mt-2 text-sm font-semibold">{money(p.priceCents)}</div>
                    </div>

                    {p.imageUrl ? (
                      <img class="h-12 w-12 rounded-xl object-cover sm:h-14 sm:w-14" src={p.imageUrl} alt={p.name} />
                    ) : (
                      <div class="h-12 w-12 rounded-xl bg-zinc-100 sm:h-14 sm:w-14" />
                    )}
                  </div>

                  <button
                    class={`mt-3 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${busyId === p.id ? "opacity-60 pointer-events-none" : ""
                      }`}
                    type="button"
                    onClick={() => quickAdd(p.id)}
                  >
                    {busyId === p.id ? "Añadiendo…" : "Añadir"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <button
            class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold sm:w-auto"
            type="button"
            onClick={() => window.dispatchEvent(new Event("arcadia:cart:open"))}
          >
            Ver carrito
          </button>

          <a class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white sm:w-auto" href="/checkout">
            Ir a checkout
          </a>
        </div>
      </div>
    </div>
  );
}