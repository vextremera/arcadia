import { useState } from "preact/hooks";
import { addToCart } from "./cartClient";

export default function AddToCartButton(props: {
  productId: number;
  name: string;
  basePriceCents: number;
  channel: "DELIVERY" | "PICKUP" | "DINE_IN";
  enabled: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function onAdd() {
    if (!props.enabled || loading) return;
    setLoading(true);
    try {
      await addToCart({ productId: props.productId, qty: 1 });
      window.dispatchEvent(new CustomEvent("arcadia:cart:open"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      class={`w-full rounded-xl px-4 py-2 text-sm font-semibold ${
        props.enabled ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-500"
      }`}
      disabled={!props.enabled || loading}
      onClick={onAdd}
      type="button"
    >
      {loading ? "Añadiendo..." : "Añadir"}
    </button>
  );
}
