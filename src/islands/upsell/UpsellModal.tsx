import { useEffect, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";

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
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          qty: 1,
          // sin personalización:
          modifierOptionIds: [],
          addedIngredientIds: [],
          removedIngredientIds: [],
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data?.message || data?.error || "No se pudo añadir");
        return;
      }

      // refrescar UI del carrito
      window.dispatchEvent(new Event("arcadia:cart:updated"));
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

      <div class="absolute inset-x-0 bottom-0 mx-auto w-full max-w-3xl rounded-t-3xl bg-white p-5 shadow-2xl">
        <div class="flex items-start justify-between gap-3">
          <div>
            <div class="text-xl font-semibold tracking-tight">¿Quieres algo más?</div>
            <div class="mt-1 text-sm text-zinc-600">
              Añade algo rápido al carrito.
            </div>
          </div>

          <button
            class="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold"
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
                <div class="rounded-2xl border border-zinc-200 p-4" key={p.id}>
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <div class="truncate text-sm font-semibold">{p.name}</div>
                      {p.description ? (
                        <div class="mt-1 line-clamp-2 text-xs text-zinc-600">{p.description}</div>
                      ) : null}
                      <div class="mt-2 text-sm font-semibold">{money(p.priceCents)}</div>
                    </div>

                    {p.imageUrl ? (
                      <img class="h-14 w-14 rounded-xl object-cover" src={p.imageUrl} alt={p.name} />
                    ) : (
                      <div class="h-14 w-14 rounded-xl bg-zinc-100" />
                    )}
                  </div>

                  <button
                    class={`mt-3 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${
                      busyId === p.id ? "opacity-60 pointer-events-none" : ""
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

        <div class="mt-4 flex flex-wrap gap-2">
          <button
            class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold"
            type="button"
            onClick={() => window.dispatchEvent(new Event("arcadia:cart:open"))}
          >
            Ver carrito
          </button>

          <a class="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" href="/checkout">
            Ir a checkout
          </a>
        </div>
      </div>
    </div>
  );
}
