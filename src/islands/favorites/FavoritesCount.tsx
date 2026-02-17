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
      .then((data) => {
        const ids = (data?.ids ?? [])
          .map((n: any) => Number(n))
          .filter((n: any) => Number.isFinite(n));
        return new Set<number>(ids);
      });
  }

  const set = await window.__arcadiaFavPromise;
  window.__arcadiaFavIds = set;
  return set;
}

export default function FavoritesCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;

    (async () => {
      const set = await loadFavIds();
      if (!alive) return;
      setCount(set.size);
    })();

    const onUpdate = async () => {
      const set = window.__arcadiaFavIds ?? (await loadFavIds());
      setCount(set.size);
    };

    window.addEventListener("arcadia:favorites:updated", onUpdate as any);
    return () => {
      alive = false;
      window.removeEventListener("arcadia:favorites:updated", onUpdate as any);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span class="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-black text-white">
      {count}
    </span>
  );
}
