import { useEffect, useState } from "preact/hooks";
import { getCartSnapshot, refreshCart, subscribeCart } from "./cartClient";

export default function CartBadge() {
  const [count, setCount] = useState<number>(getCartSnapshot()?.count ?? 0);

  useEffect(() => {
    refreshCart().catch(() => {});
    return subscribeCart(() => setCount(getCartSnapshot()?.count ?? 0));
  }, []);

  return (
    <button
      class="rounded-xl border border-zinc-300 px-3 py-1.5 text-sm font-semibold"
      onClick={() => window.dispatchEvent(new CustomEvent("arcadia:cart:open"))}
      type="button"
    >
      Carrito · {count}
    </button>
  );
}
