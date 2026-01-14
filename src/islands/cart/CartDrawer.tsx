import { useEffect, useMemo, useState } from "preact/hooks";
import { clearCart, getCartSnapshot, refreshCart, removeLine, setQty, subscribeCart } from "./cartClient";

export default function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [cart, setCart] = useState(getCartSnapshot());

  useEffect(() => {
    refreshCart().catch(() => {});
    const off1 = subscribeCart(() => setCart(getCartSnapshot()));
    const onOpen = () => setOpen(true);
    window.addEventListener("arcadia:cart:open", onOpen);
    return () => {
      off1();
      window.removeEventListener("arcadia:cart:open", onOpen);
    };
  }, []);

  const items = cart?.items ?? [];
  const subtotal = useMemo(() => (cart?.subtotalCents ?? 0) / 100, [cart?.subtotalCents]);

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <aside class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div class="flex items-center justify-between border-b border-zinc-200 p-4">
          <div class="font-semibold">Carrito</div>
          <button class="text-sm text-zinc-600 hover:underline" onClick={() => setOpen(false)} type="button">
            Cerrar
          </button>
        </div>

        <div class="p-4">
          {items.length === 0 ? (
            <p class="text-sm text-zinc-600">Tu carrito está vacío.</p>
          ) : (
            <div class="space-y-3">
              {items.map((it) => (
                <div key={it.lineId} class="rounded-xl border border-zinc-200 p-3">
                  <div class="flex items-start justify-between gap-3">
                    <div>
                      <div class="text-sm font-semibold">{it.name}</div>
                      <div class="mt-1 text-sm text-zinc-600">
                        {(it.unitPriceCents / 100).toFixed(2)} € · x{it.qty}
                      </div>
                    </div>

                    <button
                      class="text-sm text-zinc-600 hover:underline"
                      onClick={() => removeLine(it.lineId).catch(() => {})}
                      type="button"
                    >
                      Quitar
                    </button>
                  </div>

                  <div class="mt-3 flex items-center gap-2">
                    <button
                      class="rounded-lg border border-zinc-300 px-3 py-1 text-sm"
                      onClick={() => setQty(it.lineId, Math.max(0, it.qty - 1)).catch(() => {})}
                      type="button"
                    >
                      −
                    </button>
                    <button
                      class="rounded-lg border border-zinc-300 px-3 py-1 text-sm"
                      onClick={() => setQty(it.lineId, it.qty + 1).catch(() => {})}
                      type="button"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              <div class="mt-4 rounded-xl border border-zinc-200 p-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-zinc-600">Subtotal</span>
                  <span class="font-semibold">{subtotal.toFixed(2)} €</span>
                </div>

                <div class="mt-3 flex gap-2">
                  <a class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white" href="/checkout">
                    Checkout
                  </a>
                  <button class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold" onClick={() => clearCart().catch(() => {})} type="button">
                    Vaciar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
