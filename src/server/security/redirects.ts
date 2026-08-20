/**
 * Destinos de redirección seguros.
 *
 * `/api/auth/login` devolvía al usuario a lo que viniera en el campo `next` sin
 * mirarlo. Bastaba con mandarle un enlace a `/login?next=https://sitio-falso/`
 * para que, tras escribir su contraseña de verdad en Arcadia, acabara en una
 * copia del sitio pidiéndosela otra vez. El acierto del ataque es que la
 * primera pantalla, la que genera confianza, es auténtica.
 *
 * Sólo se aceptan rutas internas. `//evil.com` se descarta aparte porque el
 * navegador lo interpreta como una URL absoluta heredando el protocolo, y
 * empieza por barra igual que una ruta legítima.
 */

export function safeInternalPath(value: unknown, fallback = ""): string {
  const next = String(value ?? "").trim();

  if (!next) return fallback;
  if (!next.startsWith("/")) return fallback;
  // Protocolo relativo: //otro-dominio.com sale del sitio.
  if (next.startsWith("//")) return fallback;
  // Algunos navegadores normalizan la barra invertida como si fuera barra.
  if (next.startsWith("/\\") || next.startsWith("/%5C") || next.startsWith("/%5c")) return fallback;

  return next;
}
