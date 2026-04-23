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

function goToCheckout() {
  window.location.href = "/checkout";
}

function ProductImageOrPlaceholder(props: {
  imageUrl: string | null;
  name: string;
}) {
  if (props.imageUrl) {
    return (
      <img
        class="h-full w-full rounded-[22px] object-cover"
        src={props.imageUrl}
        alt={props.name}
        loading="lazy"
      />
    );
  }

  return <div class="h-full w-full rounded-[22px] bg-zinc-100" aria-hidden="true" />;
}

export default function UpsellModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<UpsellProduct[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load(): Promise<UpsellProduct[]> {
    setLoading(true);
    try {
      const res = await api<{ products: UpsellProduct[] }>("/api/catalog/upsell");
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

    window.addEventListener("arcadia:upsell:open", onOpen as EventListener);
    return () =>
      window.removeEventListener("arcadia:upsell:open", onOpen as EventListener);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  async function quickAdd(productId: number) {
    setBusyId(productId);
    try {
      await addToCart({
        productId,
        qty: 1,
        modifierOptionIds: [],
        addedIngredientIds: [],
        removedIngredientIds: [],
      });
      setOpen(false);
      goToCheckout();
    } catch (err) {
      alert((err as any)?.message || "No se pudo añadir");
    } finally {
      setBusyId(null);
    }
  }

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-[70]">
      <button
        class="absolute inset-0 bg-black/45"
        aria-label="Cerrar"
        onClick={() => setOpen(false)}
        type="button"
      />

      <div class="absolute left-1/2 top-1/2 flex h-[88dvh] w-[95vw] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[30px] bg-white shadow-2xl">
        <div class="border-b border-zinc-200 px-5 py-4 sm:px-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div class="text-2xl font-semibold tracking-tight text-zinc-900">
                ¿Quieres algo más?
              </div>
              <div class="mt-1 text-sm text-zinc-600 sm:text-base">
                Añade algo rápido antes de terminar tu pedido.
              </div>
            </div>

            <button
              class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold sm:w-auto"
              onClick={goToCheckout}
              type="button"
            >
              No, gracias
            </button>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div class="text-sm text-zinc-600">Cargando sugerencias…</div>
          ) : products.length === 0 ? (
            <div class="text-sm text-zinc-600">No hay sugerencias ahora mismo.</div>
          ) : (
            <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <article
                  class="flex min-h-[320px] flex-col rounded-[26px] border border-zinc-200 bg-white p-4 sm:min-h-[340px] sm:p-5"
                  key={p.id}
                >
                  <div class="mx-auto w-full max-w-[220px]">
                    <div class="aspect-square w-full">
                      <ProductImageOrPlaceholder imageUrl={p.imageUrl} name={p.name} />
                    </div>
                  </div>

                  <div class="mt-4 min-w-0 text-center">
                    <div class="text-lg font-semibold text-zinc-900">{p.name}</div>
                    {p.description ? (
                      <div class="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">
                        {p.description}
                      </div>
                    ) : (
                      <div class="mt-2 text-sm text-zinc-400"> </div>
                    )}
                  </div>

                  <div class="mt-auto pt-4">
                    <div class="text-center text-xl font-black text-zinc-900">
                      {money(p.priceCents)}
                    </div>

                    <button
                      class={`mt-4 w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white ${busyId === p.id ? "pointer-events-none opacity-60" : ""
                        }`}
                      type="button"
                      onClick={() => quickAdd(p.id)}
                    >
                      {busyId === p.id ? "Añadiendo…" : "Añadir"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div class="border-t border-zinc-200 px-5 py-4 sm:px-6">
          <div class="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <button
              class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold sm:w-auto"
              type="button"
              onClick={() => {
                setOpen(false);
                window.dispatchEvent(new Event("arcadia:cart:open"));
              }}
            >
              Ver carrito
            </button>

            <button
              class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
              type="button"
              onClick={goToCheckout}
            >
              Ir a checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}