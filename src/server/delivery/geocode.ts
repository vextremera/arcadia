/**
 * Geocodificación de direcciones con Nominatim (OpenStreetMap).
 *
 * Se eligió OSM y no Google porque no exige clave ni facturación: el mapa del
 * checkout se dibuja con los mismos datos y funciona desde el primer día.
 *
 * Nominatim es gratuito pero su política pide identificarse, no pasar de una
 * consulta por segundo y cachear los resultados. De ahí la tabla GeocodeCache
 * y la cola de un solo hilo: sin ellas, cada tecla del formulario sería una
 * petición y acabarían bloqueando el servicio.
 *
 * Si el volumen creciera, el reemplazo natural es la API de Geocoding de
 * Google, cambiando sólo `lookupRemote`.
 */
import { db, GeocodeCache, eq } from "astro:db";

export type GeocodeResult = {
  found: boolean;
  lat: number | null;
  lng: number | null;
  label: string | null;
};

const NOT_FOUND: GeocodeResult = { found: false, lat: null, lng: null, label: null };

const ENDPOINT = "https://nominatim.openstreetmap.org/search";
const MIN_INTERVAL_MS = 1100;

/** Última consulta enviada, para no pasar del límite de una por segundo. */
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Normaliza la dirección para que variaciones triviales compartan caché. */
export function normalizeQuery(parts: {
  line1?: string | null;
  city?: string | null;
  postalCode?: string | null;
}): string {
  return [parts.line1, parts.postalCode, parts.city, "España"]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(", ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

async function readCache(query: string): Promise<GeocodeResult | null> {
  const [row] = await db
    .select({ found: GeocodeCache.found, lat: GeocodeCache.lat, lng: GeocodeCache.lng, label: GeocodeCache.label })
    .from(GeocodeCache)
    .where(eq(GeocodeCache.query, query))
    .limit(1);

  if (!row) return null;

  return {
    found: Boolean(row.found),
    lat: row.lat ?? null,
    lng: row.lng ?? null,
    label: row.label ?? null,
  };
}

async function writeCache(query: string, result: GeocodeResult): Promise<void> {
  const rows = await db.select({ id: GeocodeCache.id }).from(GeocodeCache);
  const nextId = rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;

  try {
    await db.insert(GeocodeCache).values({
      id: nextId,
      query,
      found: result.found,
      lat: result.lat ?? undefined,
      lng: result.lng ?? undefined,
      label: result.label ?? undefined,
      createdAt: new Date(),
    });
  } catch {
    // Otra petición cacheó la misma dirección primero. No es un problema.
  }
}

/** Consulta real, serializada y espaciada para cumplir la política de uso. */
async function lookupRemote(query: string): Promise<GeocodeResult> {
  const wait = Math.max(0, lastRequestAt + MIN_INTERVAL_MS - Date.now());
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastRequestAt = Date.now();

  const url = new URL(ENDPOINT);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "es");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    headers: {
      // Nominatim exige identificar la aplicación; sin esto puede rechazar.
      "user-agent": "Arcadia-Lloret/1.0 (pedidos web)",
      "accept-language": "es",
    },
  });

  if (!response.ok) return NOT_FOUND;

  const data = (await response.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
  const first = data?.[0];
  if (!first?.lat || !first?.lon) return NOT_FOUND;

  const lat = Number(first.lat);
  const lng = Number(first.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return NOT_FOUND;

  return { found: true, lat, lng, label: first.display_name ?? null };
}

/** Sitúa una dirección en el mapa. Devuelve `found: false` si no se encuentra. */
export async function geocodeAddress(parts: {
  line1?: string | null;
  city?: string | null;
  postalCode?: string | null;
}): Promise<GeocodeResult> {
  const query = normalizeQuery(parts);

  // Sin calle no hay nada que buscar: el centro del pueblo daría un falso
  // "dentro de zona" para cualquier dirección.
  if (!parts.line1 || String(parts.line1).trim().length < 3) return NOT_FOUND;

  const cached = await readCache(query);
  if (cached) return cached;

  // Las peticiones se encadenan para que dos clientes a la vez no disparen
  // dos consultas simultáneas contra Nominatim.
  const result = await (queue = queue.then(
    () => lookupRemote(query).catch(() => NOT_FOUND),
    () => lookupRemote(query).catch(() => NOT_FOUND),
  ) as Promise<GeocodeResult>);

  await writeCache(query, result);
  return result;
}
