import { useEffect, useMemo, useState } from "preact/hooks";

type Props = {
  query: string; // "BAR ARCADIA, Carrer..., Lloret de Mar"
  title?: string;
  className?: string;
};

/**
 * Mapa incrustado de Google.
 *
 * Es de un tercero y pone sus cookies, así que no se carga hasta que el usuario
 * ha aceptado. Si no ha aceptado, en lugar del iframe se ofrece abrir Google
 * Maps en otra pestaña: allí la decisión sobre cookies es suya y de Google, no
 * algo que le hayamos colado desde aquí.
 *
 * Seguir pidiendo un clic aun habiendo aceptado no es por permisos: es que un
 * iframe de mapa pesa bastante y en la portada casi nadie lo mira.
 */
export default function LazyMap({ query, title = "Mapa", className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [consent, setConsent] = useState<string>("pending");

  useEffect(() => {
    const leer = () => setConsent(document.documentElement.dataset.cookieConsent ?? "pending");

    leer();
    window.addEventListener("arcadia:cookie-consent", leer);
    return () => window.removeEventListener("arcadia:cookie-consent", leer);
  }, []);

  const src = useMemo(() => {
    const q = encodeURIComponent(query);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, [query]);

  const enlaceExterno = useMemo(
    () => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    [query],
  );

  const permitido = consent === "accepted";

  return (
    <div class={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 ${className}`}>
      {!loaded || !permitido ? (
        <div class="flex h-80 w-full flex-col items-center justify-center gap-3 p-5 text-center sm:h-110 sm:p-6">
          <div class="text-sm font-semibold text-zinc-700">{title}</div>

          {permitido ? (
            <>
              <div class="text-xs text-zinc-600">Cargamos el mapa solo si lo necesitas.</div>
              <button
                type="button"
                class="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto"
                onClick={() => setLoaded(true)}
              >
                Ver mapa
              </button>
            </>
          ) : (
            <>
              <div class="max-w-sm text-xs leading-5 text-zinc-600">
                El mapa lo pone Google y usa cookies suyas. Puedes aceptarlas para verlo
                aquí, o abrirlo directamente en Google Maps.
              </div>
              <a
                href={enlaceExterno}
                target="_blank"
                rel="noreferrer"
                class="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-zinc-900 px-5 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto"
              >
                Abrir en Google Maps
              </a>
              <button
                type="button"
                data-cookie-settings
                class="text-xs font-semibold text-zinc-700 underline hover:text-zinc-900"
              >
                Cambiar mi decisión sobre cookies
              </button>
            </>
          )}
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
