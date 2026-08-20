/**
 * Confirmación del pedido al cliente.
 *
 * No es una cortesía: en una venta a distancia hay que entregar la
 * confirmación del contrato en un soporte que el cliente pueda guardar y
 * volver a leer. La página de seguimiento no sirve para eso — vive en el
 * servidor y su contenido puede cambiar. El correo sí: queda en su bandeja tal
 * como se envió.
 *
 * Por eso lleva el detalle completo (líneas, importes, forma de pago,
 * dirección y el enlace de seguimiento) y no un simple "hemos recibido tu
 * pedido".
 *
 * Sale una vez por pedido: al crearlo si es en efectivo, o al confirmarse el
 * pago si es con tarjeta, que es cuando el pedido pasa a ser firme.
 */
import { db, Order, OrderItem, eq } from "astro:db";
import { escapeHtml } from "@/server/security/html";
import { formatEuros } from "@/lib/money";
import { sendMail } from "@/server/notify/mailer";
import { BUSINESS, businessLegalLine } from "@/lib/legal/business";

export type LineaPedido = {
  nameSnapshot: string;
  qty: number;
  lineTotalCents: number;
};

/** Lo que hace falta del pedido para montar el correo. */
export type PedidoParaCorreo = {
  publicId: string;
  type: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  createdAt: Date | string | null;
  addressSnapshot: unknown;
};

function formatearFecha(value: Date | string | null): string {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(date);
}

function metodoPago(snapshot: unknown): string {
  const raw = (snapshot ?? {}) as { paymentMethod?: string };
  return raw.paymentMethod === "CARD" ? "Tarjeta" : "Efectivo";
}

function direccionEntrega(snapshot: unknown): string | null {
  const raw = (snapshot ?? {}) as { address?: Record<string, string> | null };
  const dir = raw.address;
  if (!dir) return null;

  return [dir.line1, dir.line2, dir.postalCode, dir.city].filter(Boolean).join(", ") || null;
}

/**
 * Monta el correo sin enviarlo.
 *
 * Separado del envío a propósito: así se puede comprobar lo que sale sin
 * depender de que haya un servidor SMTP contestando.
 */
export function buildOrderConfirmation(
  order: PedidoParaCorreo,
  items: LineaPedido[],
  origin: string,
): { subject: string; text: string; html: string } {
  const seguimiento = `${origin}/pedido/${order.publicId}`;
  const entrega = direccionEntrega(order.addressSnapshot);
  const esDomicilio = String(order.type) === "DELIVERY";
  const modoEntrega = esDomicilio ? "Entrega a domicilio" : "Recogida en el local";

  const filas = items
    .map(
      (item) =>
        `<tr><td style="padding:6px 0">${escapeHtml(item.qty)}× ${escapeHtml(item.nameSnapshot)}</td>` +
        `<td style="padding:6px 0;text-align:right">${escapeHtml(formatEuros(item.lineTotalCents))}</td></tr>`,
    )
    .join("");

  const importes: Array<[string, number]> = [["Subtotal", order.subtotalCents]];
  if (order.deliveryFeeCents) importes.push(["Gastos de envío", order.deliveryFeeCents]);
  if (order.discountCents) importes.push(["Descuento", -order.discountCents]);

  const filasImportes = importes
    .map(
      ([etiqueta, importe]) =>
        `<tr><td style="padding:2px 0;color:#52525b">${escapeHtml(etiqueta)}</td>` +
        `<td style="padding:2px 0;text-align:right;color:#52525b">${escapeHtml(formatEuros(importe))}</td></tr>`,
    )
    .join("");

  const text = [
    `Pedido ${order.publicId}`,
    "",
    `Fecha: ${formatearFecha(order.createdAt)}`,
    `Tipo: ${modoEntrega}`,
    entrega ? `Dirección: ${entrega}` : null,
    `Pago: ${metodoPago(order.addressSnapshot)}`,
    "",
    ...items.map((i) => `${i.qty}× ${i.nameSnapshot} — ${formatEuros(i.lineTotalCents)}`),
    "",
    ...importes.map(([etiqueta, importe]) => `${etiqueta}: ${formatEuros(importe)}`),
    `Total: ${formatEuros(order.totalCents)} (IVA incluido)`,
    "",
    `Seguimiento: ${seguimiento}`,
    "",
    "Guarda este correo como comprobante de tu pedido.",
    businessLegalLine(),
  ]
    .filter((linea): linea is string => linea !== null)
    .join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#18181b">
      <h1 style="font-size:20px;margin:0 0 4px">Pedido confirmado</h1>
      <p style="margin:0 0 20px;color:#52525b">Referencia <strong>${escapeHtml(order.publicId)}</strong> · ${escapeHtml(formatearFecha(order.createdAt))}</p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">${filas}</table>

      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:12px;border-top:1px solid #e4e4e7">
        ${filasImportes}
        <tr>
          <td style="padding:8px 0 0;font-weight:700">Total</td>
          <td style="padding:8px 0 0;text-align:right;font-weight:700">${escapeHtml(formatEuros(order.totalCents))}</td>
        </tr>
      </table>
      <p style="margin:4px 0 20px;font-size:12px;color:#71717a">IVA incluido.</p>

      <p style="margin:0 0 4px;font-size:14px"><strong>${escapeHtml(modoEntrega)}</strong></p>
      ${entrega ? `<p style="margin:0 0 4px;font-size:14px;color:#52525b">${escapeHtml(entrega)}</p>` : ""}
      <p style="margin:0 0 20px;font-size:14px;color:#52525b">Pago: ${escapeHtml(metodoPago(order.addressSnapshot))}</p>

      <p style="margin:0 0 24px">
        <a href="${escapeHtml(seguimiento)}" style="display:inline-block;background:#18181b;color:#fff;padding:10px 18px;border-radius:10px;text-decoration:none;font-size:14px">Ver el estado del pedido</a>
      </p>

      <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a">
        Guarda este correo como comprobante de tu pedido.<br />
        ${escapeHtml(businessLegalLine())}
      </p>
    </div>
  `;

  return {
    subject: `Pedido ${order.publicId} confirmado · ${BUSINESS.tradeName}`,
    text,
    html,
  };
}

/**
 * Manda la confirmación.
 *
 * Nunca lanza: un pedido válido no se puede perder porque el correo falle.
 * Devuelve false si no salió, para que quien llame pueda registrarlo.
 */
export async function sendOrderConfirmation(orderId: number, origin: string): Promise<boolean> {
  try {
    const [order] = await db.select().from(Order).where(eq(Order.id, orderId)).limit(1);
    if (!order?.customerEmail) return false;

    const items = (await db
      .select({
        nameSnapshot: OrderItem.nameSnapshot,
        qty: OrderItem.qty,
        lineTotalCents: OrderItem.lineTotalCents,
      })
      .from(OrderItem)
      .where(eq(OrderItem.orderId, orderId))) as LineaPedido[];

    const correo = buildOrderConfirmation(order as unknown as PedidoParaCorreo, items, origin);

    return await sendMail({ to: order.customerEmail, ...correo });
  } catch (error) {
    console.error("[order-confirmation] no se pudo enviar", orderId, error);
    return false;
  }
}
