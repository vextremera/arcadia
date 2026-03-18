import { useMemo, useState } from "preact/hooks";

type Props = {
  query: string; // "BAR ARCADIA, Carrer..., Lloret de Mar"
  title?: string;
  className?: string;
};

export default function LazyMap({ query, title = "Mapa", className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);

  const src = useMemo(() => {
    const q = encodeURIComponent(query);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, [query]);

  return (
    <div class={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 ${className}`}>
      {!loaded ? (
        <div class="flex h-80 w-full flex-col items-center justify-center gap-3 p-5 text-center sm:h-110 sm:p-6">
          <div class="text-sm font-semibold text-zinc-700">{title}</div>
          <div class="text-xs text-zinc-600">
            Cargamos el mapa solo si lo necesitas.
          </div>

          <button
            type="button"
            class="w-full rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto"
            onClick={() => setLoaded(true)}
          >
            Ver mapa
          </button>
        </div>
      ) : (
        <iframe
          title={title}
          class="h-80 w-full sm:h-110"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={src}
        />
      )}
    </div>
  );
}