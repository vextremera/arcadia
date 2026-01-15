import { useEffect, useMemo, useState } from "preact/hooks";

type CartLine = {
  lineId: string;
  productId: number;
  name: string;
  imageUrl?: string | null;

  variantId?: number;
  variantName?: string | null;

  qty: number;

  unitPriceCents: number;
  lineTotalCents: number;

  modifiers: Array<{ id: number; name: string; priceDeltaCents: number }>;
  ingredientsAdded: Array<{ id: number; name: string; priceDeltaCents: number }>;
  ingredientsRemoved: Array<{ id: number; name: string }>;
};

type CartResponse = {
  currency: "EUR";
  items: CartLine[];
  subtotalCents: number;
  count: number;
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "content-type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCart() {
    setLoading(true);
    try {
      const data = await api<CartResponse>("/api/cart");
      setCart(data);
    } finally {
      setLoading(false);
    }
  }

  // Eventos globales para abrir/cerrar (útil para header button)
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

  // Cargar carrito al abrir
  useEffect(() => {
    if (open) void loadCart();
  }, [open]);

  const items = cart?.items ?? [];
  const subtotal = cart?.subtotalCents ?? 0;

  const empty = useMemo(() => !loading && items.length === 0, [loading, items.length]);

  async function setQty(lineId: string, qty: number) {
    const safeQty = Math.max(1, Math.min(99, qty));
    await api("/api/cart/set-qty", {
      method: "POST",
      body: JSON.stringify({ lineId, qty: safeQty }),
    });
    await loadCart();
  }

  async function removeLine(lineId: string) {
    await api("/api/cart/remove", { method: "POST", body: JSON.stringify({ lineId }) });
    await loadCart();
  }

  async function clearCart() {
    await api("/api/cart/clear", { method: "POST" });
    await loadCart();
  }

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

      <div class="absolute right-0 top-0 h-full w-[92vw] max-w-md bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-zinc-200 p-4">
          <div>
            <div class="text-xs text-zinc-600">Tu pedido</div>
            <div class="text-base font-semibold">Carrito</div>
          </div>

          <button class="text-sm text-zinc-600 hover:underline" type="button" onClick={() => setOpen(false)}>
            Cerrar
          </button>
        </div>

        <div class="h-[calc(100%-160px)] overflow-y-auto p-4">
          {loading && !cart ? (
            <div class="text-sm text-zinc-600">Cargando…</div>
          ) : empty ? (
            <div class="text-sm text-zinc-600">Tu carrito está vacío.</div>
          ) : (
            <div class="space-y-4">
              {items.map((it) => (
                <div class="rounded-2xl border border-zinc-200 p-4" key={it.lineId}>
                  <div class="flex gap-3">
                    {it.imageUrl ? (
                      <img class="h-14 w-14 rounded-xl object-cover" src={it.imageUrl} alt={it.name} />
                    ) : (
                      <div class="h-14 w-14 rounded-xl bg-zinc-100" />
                    )}

                    <div class="min-w-0 flex-1">
                      <div class="truncate text-sm font-semibold">{it.name}</div>
                      {it.variantName ? (
                        <div class="text-xs text-zinc-600">{it.variantName}</div>
                      ) : null}

                      <div class="mt-1 text-xs text-zinc-600">
                        {money(it.unitPriceCents)} / ud
                      </div>

                      {/* Modificadores (extras tipo pan/salsas) */}
                      {it.modifiers?.length ? (
                        <div class="mt-2 text-xs text-zinc-600">
                          <span class="font-semibold">Extras:</span>{" "}
                          {it.modifiers
                            .map((m) => `${m.name} (+${(m.priceDeltaCents / 100).toFixed(2)}€)`)
                            .join(", ")}
                        </div>
                      ) : null}

                      {/* Ingredientes quitados */}
                      {it.ingredientsRemoved?.length ? (
                        <div class="mt-2 text-xs text-zinc-600">
                          <span class="font-semibold">Sin:</span>{" "}
                          {it.ingredientsRemoved.map((x) => x.name).join(", ")}
                        </div>
                      ) : null}

                      {/* Ingredientes añadidos */}
                      {it.ingredientsAdded?.length ? (
                        <div class="mt-1 text-xs text-zinc-600">
                          <span class="font-semibold">Añadido:</span>{" "}
                          {it.ingredientsAdded
                            .map((x) => `${x.name} (+${(x.priceDeltaCents / 100).toFixed(2)}€)`)
                            .join(", ")}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div class="mt-3 flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <button
                        class="h-9 w-9 rounded-xl border border-zinc-300 text-sm font-semibold"
                        type="button"
                        onClick={() => setQty(it.lineId, it.qty - 1)}
                      >
                        −
                      </button>

                      <div class="w-10 text-center text-sm font-semibold">{it.qty}</div>

                      <button
                        class="h-9 w-9 rounded-xl border border-zinc-300 text-sm font-semibold"
                        type="button"
                        onClick={() => setQty(it.lineId, it.qty + 1)}
                      >
                        +
                      </button>
                    </div>

                    <div class="text-sm font-semibold">{money(it.lineTotalCents)}</div>
                  </div>

                  <div class="mt-3 flex justify-end">
                    <button
                      class="text-xs font-semibold text-red-700 hover:underline"
                      type="button"
                      onClick={() => removeLine(it.lineId)}
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div class="border-t border-zinc-200 p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-zinc-600">Subtotal</span>
            <span class="font-semibold">{money(subtotal)}</span>
          </div>

          <div class="mt-3 flex gap-2">
            <button
              class="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold"
              type="button"
              onClick={clearCart}
              disabled={items.length === 0}
            >
              Vaciar
            </button>

            <a
              class={`flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold text-white ${
                items.length === 0 ? "bg-zinc-400 pointer-events-none" : "bg-zinc-900"
              }`}
              href="/checkout"
            >
              Finalizar
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
