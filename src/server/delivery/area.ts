/**
 * Zona de reparto por radio.
 *
 * Antes la zona se decidía comparando ciudad y código postal con cadenas fijas
 * ("lloret de mar" + "17310"). Eso aceptaba una dirección al otro extremo del
 * municipio y rechazaba una a 200 metros con el código mal escrito. Ahora se
 * geocodifica la dirección y se mide la distancia real al local.
 *
 * La comprobación del cliente es sólo para enseñar el mapa: el checkout la
 * repite en servidor antes de crear el pedido, porque el navegador puede
 * mandar las coordenadas que quiera.
 */

export type DeliveryAreaRule = {
  enabled: boolean;
  /** Centro del radio: el local. */
  lat: number;
  lng: number;
  radiusMeters: number;
};

export type DeliveryAreaStatus = "DISABLED" | "INSIDE" | "OUTSIDE" | "INCOMPLETE" | "UNKNOWN";

export type DeliveryAreaValidation = {
  enabled: boolean;
  allowed: boolean;
  status: DeliveryAreaStatus;
  message: string;
  /** Distancia al local en metros, si se pudo situar la dirección. */
  distanceMeters: number | null;
};

/**
 * Coordenadas del local (Carrer de Maria Aurèlia Campmany i Farnés, Lloret de
 * Mar) y radio de reparto. Son sólo el punto de partida: se editan desde
 * /admin/operativa y se guardan en AppSetting.
 */
export const DEFAULT_DELIVERY_AREA_RULE: DeliveryAreaRule = {
  enabled: false,
  lat: 41.70791,
  lng: 2.83837,
  radiusMeters: 1500,
};

/** Normaliza lo que venga de AppSetting, que puede ser de una versión anterior. */
export function normalizeDeliveryAreaRule(value: unknown): DeliveryAreaRule {
  const raw = (value ?? {}) as Partial<DeliveryAreaRule>;

  const num = (candidate: unknown, fallback: number) =>
    typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallback;

  return {
    enabled: raw.enabled === true,
    lat: num(raw.lat, DEFAULT_DELIVERY_AREA_RULE.lat),
    lng: num(raw.lng, DEFAULT_DELIVERY_AREA_RULE.lng),
    // Un radio de 0 dejaría fuera a todo el mundo sin explicación.
    radiusMeters: Math.max(100, num(raw.radiusMeters, DEFAULT_DELIVERY_AREA_RULE.radiusMeters)),
  };
}

/**
 * Distancia en metros entre dos puntos (fórmula del semiverseno).
 *
 * A escala de un pueblo el error frente a una geodésica real es de
 * centímetros, así que no compensa traer una librería.
 */
export function distanceMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Comprueba una dirección ya situada en el mapa contra la zona de reparto. */
export function validateDeliveryPoint(
  point: { lat: number; lng: number } | null,
  rule: DeliveryAreaRule = DEFAULT_DELIVERY_AREA_RULE,
): DeliveryAreaValidation {
  if (!rule.enabled) {
    return {
      enabled: false,
      allowed: true,
      status: "DISABLED",
      message: "La validación por zona está desactivada.",
      distanceMeters: null,
    };
  }

  if (!point) {
    // No se pudo situar la dirección. Se deja pasar y que lo resuelva el
    // restaurante al llamar: bloquear por no encontrar una calle en el mapa
    // castigaría al cliente por un fallo del geocodificador.
    return {
      enabled: true,
      allowed: true,
      status: "UNKNOWN",
      message: "No hemos podido situar la dirección en el mapa. La confirmaremos al preparar el pedido.",
      distanceMeters: null,
    };
  }

  const distance = distanceMeters(point, { lat: rule.lat, lng: rule.lng });

  if (distance <= rule.radiusMeters) {
    return {
      enabled: true,
      allowed: true,
      status: "INSIDE",
      message: `Dentro de la zona de reparto, a ${formatDistance(distance)} del local.`,
      distanceMeters: distance,
    };
  }

  return {
    enabled: true,
    allowed: false,
    status: "OUTSIDE",
    message: `Fuera de la zona de reparto: está a ${formatDistance(distance)} y repartimos hasta ${formatDistance(rule.radiusMeters)}.`,
    distanceMeters: distance,
  };
}
