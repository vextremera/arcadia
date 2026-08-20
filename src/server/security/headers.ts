/**
 * Cabeceras de seguridad de las respuestas.
 *
 * La web no enviaba ninguna: se podía incrustar en un iframe ajeno para robar
 * clics sobre el panel de administración, el navegador adivinaba el tipo de los
 * ficheros servidos, y la URL completa (con el `publicId` del pedido) viajaba
 * como `Referer` a cualquier dominio externo que se enlazara.
 *
 * Sobre el alcance de la Content-Security-Policy de abajo: **no** protege
 * contra un script inyectado en el propio HTML, porque lleva 'unsafe-inline'.
 * No es un descuido. El generador de Astro, que sí calcula hashes y permitiría
 * quitarlo, sólo cubre los scripts que él procesa, y los diez de este proyecto
 * son `is:inline` (dos de ellos con `define:vars`, que lo exige). Con hashes
 * activados el navegador bloqueaba el menú móvil y medio panel de admin.
 *
 * Lo que sí aporta, y no es poco: un `<script src>` a un dominio ajeno no se
 * ejecuta, un `<base>` inyectado no puede reescribir las rutas del sitio, un
 * formulario no puede enviarse fuera, y las imágenes y peticiones sólo pueden
 * ir a los destinos previstos, que son las vías habituales para sacar datos.
 *
 * Para llegar a una política estricta habría que convertir esos `is:inline` en
 * scripts que Astro procese; es un cambio bastante mayor que este repaso.
 */

/**
 * Orígenes externos que el sitio necesita de verdad.
 *
 * - Google Maps: el mapa incrustado de la home es un iframe suyo.
 * - reCAPTCHA: carga su script y su marco desde google.com y gstatic.com.
 * - OpenStreetMap: teselas y geocodificación del mapa de reparto del checkout.
 * - Vercel Blob: las imágenes de producto que se suben desde el panel.
 * - googleusercontent: la foto de perfil de quien entra con Google.
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://www.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://lh3.googleusercontent.com",
  "frame-src https://www.google.com https://maps.google.com https://www.gstatic.com",
  "connect-src 'self' https://nominatim.openstreetmap.org",
  "font-src 'self' data:",
].join("; ");

export function applySecurityHeaders(response: Response, isHttps: boolean): void {
  const headers = response.headers;

  headers.set("Content-Security-Policy", CSP);

  // Duplica `frame-ancestors` para los navegadores que aún no lo aplican.
  headers.set("X-Frame-Options", "DENY");

  // Sin esto el navegador puede tratar un .txt subido como si fuera script.
  headers.set("X-Content-Type-Options", "nosniff");

  // Al salir a un dominio externo se manda el origen, nunca la ruta: las URL de
  // seguimiento de pedido llevan el publicId y no tienen por qué filtrarse.
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // La web no usa cámara, micrófono ni geolocalización. Negarlas evita que algo
  // incrustado las pida en nombre del sitio.
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");

  // HSTS sólo tiene sentido servido por https; en local rompería el desarrollo.
  // Sin `preload` a propósito: entrar en la lista de los navegadores es difícil
  // de revertir y afectaría a todos los subdominios.
  if (isHttps) {
    headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
}

/**
 * Rutas cuya respuesta no debe quedar cacheada por proxies o por el navegador.
 *
 * El panel y las respuestas de la API llevan datos de clientes y pedidos; una
 * copia en una caché compartida podría servírsela a otra persona.
 */
export function isPrivatePath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/cuenta" ||
    pathname.startsWith("/cuenta/") ||
    pathname.startsWith("/api/")
  );
}
