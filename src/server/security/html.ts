/**
 * Escapado de texto que va dentro de HTML.
 *
 * El formulario de contacto metía el nombre, el asunto y el mensaje tal cual en
 * el cuerpo del correo que recibe el restaurante. Cualquiera podía mandar
 * `<a href="https://sitio-falso">Pincha aquí</a>` y el personal veía un enlace
 * con aspecto legítimo dentro de un correo que sí venía de la web.
 */

const REPLACEMENTS: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => REPLACEMENTS[char] ?? char);
}

/**
 * Escapa y convierte los saltos de línea en `<br />`.
 *
 * El orden importa: primero se escapa todo y sólo después se añade la etiqueta,
 * para que un `<br />` escrito por el remitente siga siendo texto.
 */
export function escapeHtmlWithBreaks(value: unknown): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br />");
}
