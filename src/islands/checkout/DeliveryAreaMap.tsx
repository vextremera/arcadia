import { useEffect, useRef } from "preact/hooks";
import "leaflet/dist/leaflet.css";

/**
 * Mapa de la zona de reparto: círculo del radio, el local en el centro y la
 * dirección del cliente, para que se vea de un vistazo si entra o no.
 *
 * Usa Leaflet con teselas de OpenStreetMap. El mapa incrustado de Google que
 * hay en la home es un iframe y no admite dibujar encima; hacerlo con Google
 * exigiría su API de JavaScript, con clave propia y facturación.
 *
 * Leaflet se carga de forma diferida y sólo en el navegador: es una librería
 * que toca el DOM directamente y no puede ejecutarse en el render de servidor.
 */

type Point = { lat: number; lng: number };

type Props = {
  area: Point & { radiusMeters: number };
  address: Point | null;
  inside: boolean;
  /** Textos de los marcadores, que el checkout está en cuatro idiomas. */
  labels: { local: string; you: string };
};

export default function DeliveryAreaMap({ area, address, inside, labels }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, {
          zoomControl: true,
          // El mapa es informativo: el scroll debe seguir moviendo la página,
          // no hacer zoom cuando el dedo pasa por encima en el checkout.
          scrollWheelZoom: false,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
      }

      const map = mapRef.current;

      for (const layer of layersRef.current) map.removeLayer(layer);
      layersRef.current = [];

      const circle = L.circle([area.lat, area.lng], {
        radius: area.radiusMeters,
        color: inside ? "#059669" : "#e11d48",
        fillColor: inside ? "#059669" : "#e11d48",
        fillOpacity: 0.1,
        weight: 2,
      }).addTo(map);
      layersRef.current.push(circle);

      const local = L.circleMarker([area.lat, area.lng], {
        radius: 7,
        color: "#18181b",
        fillColor: "#18181b",
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip(labels.local, { permanent: false });
      layersRef.current.push(local);

      if (address) {
        const marker = L.circleMarker([address.lat, address.lng], {
          radius: 8,
          color: "#ffffff",
          weight: 3,
          fillColor: inside ? "#059669" : "#e11d48",
          fillOpacity: 1,
        })
          .addTo(map)
          .bindTooltip(labels.you, { permanent: false });
        layersRef.current.push(marker);

        // Encuadra local y dirección a la vez, para que se entienda la
        // distancia entre ambos aunque quede fuera del círculo.
        map.fitBounds(
          L.latLngBounds([
            [area.lat, area.lng],
            [address.lat, address.lng],
          ]).pad(0.35),
        );
      } else {
        map.fitBounds(circle.getBounds().pad(0.1));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [area.lat, area.lng, area.radiusMeters, address?.lat, address?.lng, inside, labels.local, labels.you]);

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      class="h-56 w-full overflow-hidden rounded-2xl border border-zinc-200 sm:h-64"
      role="img"
      aria-label={
        address
          ? inside
            ? "Mapa: tu dirección está dentro de la zona de reparto"
            : "Mapa: tu dirección está fuera de la zona de reparto"
          : "Mapa de la zona de reparto"
      }
    />
  );
}
