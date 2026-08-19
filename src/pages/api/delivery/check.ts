/**
 * Comprueba si una dirección entra en la zona de reparto.
 *
 * Devuelve además las coordenadas del local y el radio, que es lo que el mapa
 * del checkout necesita para dibujar el círculo. La geocodificación va en
 * servidor y no en el navegador para poder cachearla y respetar el límite de
 * consultas de Nominatim.
 */
import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";
import { geocodeAddress } from "@/server/delivery/geocode";
import {
  normalizeDeliveryAreaRule,
  validateDeliveryPoint,
  DEFAULT_DELIVERY_AREA_RULE,
} from "@/server/delivery/area";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export async function getDeliveryAreaRule() {
  const [row] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, "deliveryAreaRule"))
    .limit(1);

  return normalizeDeliveryAreaRule(row?.value ?? DEFAULT_DELIVERY_AREA_RULE);
}

export const POST: APIRoute = async ({ request }) => {
  let body: { line1?: string; city?: string; postalCode?: string } = {};

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ error: "INVALID_JSON" }, 400);
  }

  const rule = await getDeliveryAreaRule();

  const point = rule.enabled
    ? await geocodeAddress({ line1: body.line1, city: body.city, postalCode: body.postalCode })
    : null;

  const coords = point?.found && point.lat !== null && point.lng !== null
    ? { lat: point.lat, lng: point.lng }
    : null;

  const validation = validateDeliveryPoint(coords, rule);

  return json({
    ok: true,
    ...validation,
    address: coords ? { ...coords, label: point?.label ?? null } : null,
    // El mapa necesita el centro y el radio para pintar la zona.
    area: { lat: rule.lat, lng: rule.lng, radiusMeters: rule.radiusMeters, enabled: rule.enabled },
  });
};
