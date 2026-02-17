import { useEffect, useState } from "preact/hooks";

declare global {
  interface Window {
    __arcadiaFavIds?: Set<number>;
    __arcadiaFavPromise?: Promise<Set<number>>;
  }
}

async function loadFavIds(): Promise<Set<number>> {
  if (typeof window === "undefined") return new Set();

  if (window.__arcadiaFavIds) return window.__arcadiaFavIds;

  if (!window.__arcadiaFavPromise) {
    window.__arcadiaFavPromise = fetch("/api/favorites/ids")
      .then((r) => r.json().catch(() => ({ ids: [] })))
      .then((data) => new Set<number>((data?.ids ?? []).map((n: any) => Number(n)).filter(Number.isFinite)));
  }

  const set = await window.__arcadiaFavPromise;
  window.__arcadiaFavIds = set;
  return set;
}

type Props = {
  productId: number;
  // opcional por si quieres hidratar desde server más adelante
  initial?: boolean;
};

export default function FavoriteButton({ productId, initial }: Props) {
  const [ready, setReady] = useState(false);
  const [fav, setFav] = useState<boolean>(!!initial);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const set = await loadFavIds();
      if (!alive) return;
      setFav(set.has(productId));
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [productId]);

  async function toggle() {
    setBusy(true);
    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (!res.ok) {
        // Si no está logueado como CUSTOMER, mostramos mensaje simple
        if (res.status === 401) {
          window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        const data = await res.json().catch(() => ({}));
        alert(data?.message || data?.error || "No se pudo actualizar el favorito");
        return;
      }

      const data = await res.json().catch(() => ({ favorited: !fav }));
      const nextFav = !!data?.favorited;
      setFav(nextFav);

      // actualizar cache global
      const set = await loadFavIds();
      if (nextFav) set.add(productId);
      else set.delete(productId);

      // por si otras partes quieren reaccionar (ej: /cuenta/favoritos)
      window.dispatchEvent(new CustomEvent("arcadia:favorites:updated"));
    } finally {
      setBusy(false);
    }
  }

  // Si no está ready, lo mostramos igual pero “apagado”
  return (
    <button
      type="button"
      aria-label={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
      title={fav ? "Quitar de favoritos" : "Añadir a favoritos"}
      onClick={toggle}
      class={`grid h-10 w-10 place-items-center rounded-xl border ${
        fav ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-300 bg-white text-zinc-900"
      } ${busy ? "opacity-60 pointer-events-none" : ""} ${!ready ? "opacity-80" : ""}`}
    >
      {/* corazón simple (sin librerías) */}
      <span class="text-base leading-none">{fav ? "♥" : "♡"}</span>
    </button>
  );
}
