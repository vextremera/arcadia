import { useState } from "preact/hooks";

type Featured = {
  id: number;
  name: string;
  categoryName: string | null;
  priceCents: number;
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)}€`;
}

export default function FeaturedProducts(props: { items: Featured[] }) {
  const [busyId, setBusyId] = useState<number | null>(null);

  async function add(productId: number) {
    setBusyId(productId);
    try {
      const res = await fetch("/api/cart/add", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          qty: 1,
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

      window.dispatchEvent(new Event("arcadia:cart:updated"));
      window.dispatchEvent(new Event("arcadia:cart:open"));
    } finally {
      setBusyId(null);
    }
  }

  function view(productId: number) {
    window.dispatchEvent(new CustomEvent("arcadia:product:open", { detail: { productId } }));
  }

  return (
    <div class="grid gap-5 md:grid-cols-3">
      {props.items.map((p) => (
        <div class="rounded-2xl bg-white p-4 shadow-sm" key={p.id}>
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="truncate text-sm font-black">{p.name}</div>
              <div class="mt-1 text-xs text-zinc-500">{p.categoryName ?? "Arcadia"}</div>
            </div>

            <div class="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
              {money(p.priceCents)}
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              class={`flex-1 rounded-full bg-[#7A1E1E] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 ${
                busyId === p.id ? "opacity-60 pointer-events-none" : ""
              }`}
              type="button"
              onClick={() => add(p.id)}
            >
              {busyId === p.id ? "Añadiendo…" : "Añadir"}
            </button>

            <button
              class="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
              type="button"
              onClick={() => view(p.id)}
            >
              Ver
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
