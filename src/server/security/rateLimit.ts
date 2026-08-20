/**
 * Límite de peticiones por IP.
 *
 * Sin esto, `/api/auth/login` acepta intentos de contraseña sin fin, `/api/contact`
 * deja mandar correos ilimitados con la cuenta SMTP del restaurante (que acaba
 * bloqueada por el proveedor) y `/api/delivery/check` permite agotar la cuota
 * de Nominatim de todos los clientes a la vez.
 *
 * El contador vive en Upstash Redis, que ya es obligatorio en producción para
 * las sesiones. Tiene que ser compartido: en Vercel cada petición puede caer en
 * una instancia distinta, así que un contador en memoria no cuenta casi nada.
 * En local, sin Upstash, se usa un Map — suficiente para desarrollo, inútil
 * para defenderse de verdad, y por eso el build de producción ya falla si
 * faltan las variables de Upstash.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Intentos que quedan en la ventana actual. */
  remaining: number;
  /** Segundos que faltan para poder reintentar. Sólo útil si `allowed` es false. */
  retryAfterSeconds: number;
};

type RateLimitOptions = {
  /** Identificador de lo que se limita, normalmente ruta + IP. */
  key: string;
  /** Peticiones permitidas dentro de la ventana. */
  limit: number;
  windowSeconds: number;
};

const PREFIX = "arcadia:ratelimit:";

/** Contador local para desarrollo, cuando no hay Upstash configurado. */
const memoryCounters = new Map<string, { count: number; expiresAt: number }>();

function upstashConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
}

/**
 * INCR + EXPIRE en una sola ida y vuelta.
 *
 * El EXPIRE lleva NX para que sólo se fije la primera vez: si se renovara en
 * cada intento, la ventana nunca vencería y un atacante constante quedaría
 * bloqueado para siempre en vez de durante un minuto.
 */
async function hitUpstash(
  config: { url: string; token: string },
  key: string,
  windowSeconds: number,
): Promise<{ count: number; ttl: number } | null> {
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", key],
        ["EXPIRE", key, String(windowSeconds), "NX"],
        ["TTL", key],
      ]),
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(payload?.[0]?.result);
    const ttl = Number(payload?.[2]?.result);

    if (!Number.isFinite(count)) return null;

    return { count, ttl: Number.isFinite(ttl) && ttl > 0 ? ttl : windowSeconds };
  } catch {
    return null;
  }
}

function hitMemory(key: string, windowSeconds: number): { count: number; ttl: number } {
  const now = Date.now();
  const current = memoryCounters.get(key);

  if (!current || current.expiresAt <= now) {
    const expiresAt = now + windowSeconds * 1000;
    memoryCounters.set(key, { count: 1, expiresAt });

    // El Map crecería sin fin en un proceso largo: se barren los vencidos.
    if (memoryCounters.size > 5000) {
      for (const [k, v] of memoryCounters) {
        if (v.expiresAt <= now) memoryCounters.delete(k);
      }
    }

    return { count: 1, ttl: windowSeconds };
  }

  current.count += 1;
  return { count: current.count, ttl: Math.ceil((current.expiresAt - now) / 1000) };
}

/**
 * Cuenta un intento y dice si se puede seguir.
 *
 * Si Redis falla se deja pasar. Es deliberado: quedarse sin contador no debe
 * dejar al restaurante sin poder recibir pedidos. El riesgo se asume aquí
 * porque la única defensa nunca debería ser el límite de peticiones.
 */
export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const key = `${PREFIX}${options.key}`;
  const config = upstashConfig();

  const hit = config
    ? (await hitUpstash(config, key, options.windowSeconds)) ?? hitMemory(key, options.windowSeconds)
    : hitMemory(key, options.windowSeconds);

  const allowed = hit.count <= options.limit;

  return {
    allowed,
    remaining: Math.max(0, options.limit - hit.count),
    retryAfterSeconds: allowed ? 0 : hit.ttl,
  };
}

/**
 * IP del cliente, sin que la petición se caiga por intentar averiguarla.
 *
 * `clientAddress` es un descriptor que **lanza una excepción** cuando el
 * adaptador no puede resolverla, y el adaptador de Vercel la saca de
 * `x-forwarded-for`. Como basta con nombrarla al desestructurar el contexto
 * para que salte, un endpoint que la pidiera se quedaba en 500 en cuanto esa
 * cabecera faltaba o traía algo que no era una IP. Por eso se lee aquí dentro,
 * protegida, y nunca en la firma de la ruta.
 *
 * Si no hay forma de identificar al cliente, todos comparten cubo. Es
 * deliberado: preferimos que el límite apriete de más a que desaparezca justo
 * en la petición de alguien que ha sabido quitar la cabecera.
 */
export function clientKey(context: { clientAddress?: string; request: Request }): string {
  try {
    const address = String(context.clientAddress ?? "").trim();
    if (address) return address;
  } catch {
    // El adaptador no la expone en esta petición; se prueba la cabecera.
  }

  const forwarded = context.request.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "desconocida";
}

/** Respuesta estándar al superar el límite. */
export function tooManyRequests(result: RateLimitResult, message: string): Response {
  return new Response(JSON.stringify({ error: "RATE_LIMITED", message }), {
    status: 429,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "retry-after": String(result.retryAfterSeconds || 60),
      "cache-control": "no-store",
    },
  });
}
