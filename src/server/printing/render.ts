/**
 * Construye el documento imprimible de un pedido.
 *
 * Devuelve el modelo de documento (ver escpos.ts), no bytes: lo que se guarda en
 * PrintJob.document. Dos formatos según el destino:
 *
 * - TICKET  → ticket de cliente: importes, totales, forma de pago.
 * - KITCHEN → comanda de cocina: sin precios, líneas grandes, y los cambios
 *   sobre el producto (quitar/añadir ingredientes) destacados, que es lo único
 *   que la cocina necesita leer de un vistazo.
 */
import type { DocNode, PrintDocument } from "@/server/printing/escpos";
import type { TicketLayout } from "@/pages/api/admin/tickets";

export type PrintableOrderItem = {
  nameSnapshot: string;
  variantSnapshot: string | null;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  notes: string | null;
  modifiers: {
    modifierOptions?: { name: string; priceDeltaCents?: number }[];
    ingredientsAdded?: { name: string; priceDeltaCents?: number }[];
    ingredientsRemoved?: { name: string }[];
  } | null;
};

export type PrintableOrder = {
  publicId: string;
  type: "DELIVERY" | "PICKUP";
  createdAt: Date;
  customerName: string | null;
  customerPhone: string | null;
  notes: string | null;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: "CASH" | "CARD" | null;
  paymentStatus: string;
  addressSnapshot: Record<string, unknown> | null;
  items: PrintableOrderItem[];
};

const DEFAULT_LAYOUT: TicketLayout = {
  showLogo: true,
  headerText: "",
  showModifiers: true,
  showAllergens: false,
  showQR: false,
  footerText: "",
};

/**
 * Importe en formato español: coma decimal y símbolo €.
 * El € viaja como 0xD5 en CP858, que es justo para lo que existe esa tabla —
 * la página de prueba lo imprime para poder verificarlo en papel.
 */
function money(cents: number): string {
  return `${(Number(cents ?? 0) / 100).toFixed(2).replace(".", ",")} €`;
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(value);
}

/** Dirección de entrega en líneas, tolerante a snapshots antiguos. */
function addressLines(snapshot: Record<string, unknown> | null): string[] {
  if (!snapshot) return [];

  const pick = (key: string) => {
    const value = snapshot[key];
    return typeof value === "string" && value.trim() ? value.trim() : "";
  };

  const street = [pick("street"), pick("number")].filter(Boolean).join(" ");
  const detail = [pick("floor"), pick("door")].filter(Boolean).join(" ");
  const city = [pick("postalCode"), pick("city")].filter(Boolean).join(" ");

  return [street, detail, city, pick("notes")].filter(Boolean);
}

function itemModifierLines(item: PrintableOrderItem): string[] {
  const lines: string[] = [];
  const mods = item.modifiers;
  if (!mods) return lines;

  for (const removed of mods.ingredientsRemoved ?? []) lines.push(`  SIN ${removed.name}`);
  for (const added of mods.ingredientsAdded ?? []) lines.push(`  + ${added.name}`);
  for (const option of mods.modifierOptions ?? []) lines.push(`  > ${option.name}`);

  return lines;
}

type ItemBreakdown = {
  /** Importe del producto sin suplementos, ya multiplicado por la cantidad. */
  baseCents: number;
  /** Suplementos con importe, ya multiplicados por la cantidad. */
  charged: Array<{ label: string; cents: number }>;
  /** Cambios sin coste: quitados y opciones incluidas. */
  free: string[];
};

/**
 * Separa la línea en base + suplementos.
 *
 * El checkout guarda `unitPriceCents` ya con los suplementos dentro
 * (unitCents = base + opciones + extras), así que la base se deduce restando
 * los deltas. Se multiplica todo por la cantidad para que las cifras del ticket
 * sumen exactamente el total de la línea: si se imprimieran los deltas por
 * unidad junto a un total de línea que sí va multiplicado, las cuentas no
 * cuadrarían a ojo del cliente.
 */
function itemBreakdown(item: PrintableOrderItem): ItemBreakdown {
  const mods = item.modifiers;
  const charged: Array<{ label: string; cents: number }> = [];
  const free: string[] = [];

  let deltaPerUnit = 0;

  for (const removed of mods?.ingredientsRemoved ?? []) {
    free.push(`  SIN ${removed.name}`);
  }

  for (const added of mods?.ingredientsAdded ?? []) {
    const delta = Number(added.priceDeltaCents ?? 0);
    deltaPerUnit += delta;
    if (delta) charged.push({ label: `  + ${added.name}`, cents: delta * item.qty });
    else free.push(`  + ${added.name}`);
  }

  for (const option of mods?.modifierOptions ?? []) {
    const delta = Number(option.priceDeltaCents ?? 0);
    deltaPerUnit += delta;
    if (delta) charged.push({ label: `  > ${option.name}`, cents: delta * item.qty });
    else free.push(`  > ${option.name}`);
  }

  return {
    baseCents: (item.unitPriceCents - deltaPerUnit) * item.qty,
    charged,
    free,
  };
}

// --- Ticket de cliente ------------------------------------------------------

function buildTicketNodes(order: PrintableOrder, layout: TicketLayout): DocNode[] {
  const nodes: DocNode[] = [];

  if (layout.showLogo) {
    nodes.push({ type: "text", value: "ARCADIA", align: "center", bold: true, size: "double" });
  }
  if (layout.headerText) {
    nodes.push({ type: "text", value: layout.headerText, align: "center" });
  }

  nodes.push({ type: "feed", lines: 1 });
  nodes.push({ type: "text", value: `Pedido ${order.publicId}`, align: "center", bold: true });
  nodes.push({ type: "text", value: formatDateTime(order.createdAt), align: "center" });
  nodes.push({
    type: "text",
    value: order.type === "DELIVERY" ? "ENTREGA A DOMICILIO" : "RECOGIDA EN LOCAL",
    align: "center",
    bold: true,
  });
  nodes.push({ type: "rule" });

  if (order.customerName) nodes.push({ type: "text", value: `Cliente: ${order.customerName}` });
  if (order.customerPhone) nodes.push({ type: "text", value: `Teléfono: ${order.customerPhone}` });

  if (order.type === "DELIVERY") {
    for (const line of addressLines(order.addressSnapshot)) {
      nodes.push({ type: "text", value: line });
    }
  }

  nodes.push({ type: "rule" });

  for (const item of order.items) {
    const breakdown = itemBreakdown(item);
    const title = `${item.qty}x ${item.nameSnapshot}${item.variantSnapshot ? ` (${item.variantSnapshot})` : ""}`;

    // Sólo se desglosa si los suplementos van a imprimirse: si la plantilla los
    // oculta, poner la base en la cabecera dejaría un ticket cuyas líneas no
    // suman el total.
    const desglosar = layout.showModifiers && breakdown.charged.length > 0;

    nodes.push({
      type: "row",
      left: title,
      right: money(desglosar ? breakdown.baseCents : item.lineTotalCents),
      bold: true,
    });

    if (layout.showModifiers) {
      for (const supplement of breakdown.charged) {
        nodes.push({ type: "row", left: supplement.label, right: money(supplement.cents) });
      }
      for (const line of breakdown.free) {
        nodes.push({ type: "text", value: line });
      }
    }

    if (item.notes) nodes.push({ type: "text", value: `  Nota: ${item.notes}` });
  }

  nodes.push({ type: "rule" });
  nodes.push({ type: "row", left: "Subtotal", right: money(order.subtotalCents) });

  if (order.deliveryFeeCents > 0) {
    nodes.push({ type: "row", left: "Envío", right: money(order.deliveryFeeCents) });
  }
  if (order.discountCents > 0) {
    nodes.push({ type: "row", left: "Descuento", right: `-${money(order.discountCents)}` });
  }

  nodes.push({ type: "text", value: "", bold: false });
  nodes.push({ type: "row", left: "TOTAL", right: money(order.totalCents), bold: true });
  nodes.push({ type: "rule" });

  const method = order.paymentMethod === "CARD" ? "Tarjeta" : order.paymentMethod === "CASH" ? "Efectivo" : "-";
  nodes.push({ type: "row", left: "Forma de pago", right: method });
  nodes.push({
    type: "row",
    left: "Estado",
    right: order.paymentStatus === "PAID" ? "PAGADO" : "PENDIENTE DE PAGO",
  });

  if (order.notes) {
    nodes.push({ type: "feed", lines: 1 });
    nodes.push({ type: "text", value: `Observaciones: ${order.notes}` });
  }

  nodes.push({ type: "feed", lines: 1 });
  if (layout.footerText) {
    nodes.push({ type: "text", value: layout.footerText, align: "center" });
  }

  // IVA incluido: obligatorio en el ticket, el desglose va en la factura.
  nodes.push({ type: "text", value: "IVA incluido", align: "center" });
  nodes.push({ type: "feed", lines: 3 });
  nodes.push({ type: "cut" });

  return nodes;
}

// --- Comanda de cocina ------------------------------------------------------

function buildKitchenNodes(order: PrintableOrder, layout: TicketLayout): DocNode[] {
  const nodes: DocNode[] = [];

  nodes.push({
    type: "text",
    value: order.type === "DELIVERY" ? "DOMICILIO" : "RECOGIDA",
    align: "center",
    bold: true,
    size: "double",
  });
  nodes.push({ type: "text", value: order.publicId, align: "center", bold: true, size: "doubleHeight" });
  nodes.push({ type: "text", value: formatDateTime(order.createdAt), align: "center" });
  nodes.push({ type: "rule", char: "=" });

  for (const item of order.items) {
    nodes.push({
      type: "text",
      value: `${item.qty}x ${item.nameSnapshot}${item.variantSnapshot ? ` (${item.variantSnapshot})` : ""}`,
      bold: true,
      size: "doubleHeight",
    });

    // En cocina los modificadores no son opcionales: son la comanda.
    for (const line of itemModifierLines(item)) {
      nodes.push({ type: "text", value: line, bold: true });
    }
    if (item.notes) nodes.push({ type: "text", value: `  NOTA: ${item.notes}`, bold: true });

    nodes.push({ type: "rule" });
  }

  if (order.notes) {
    nodes.push({ type: "text", value: `OBSERVACIONES: ${order.notes}`, bold: true });
    nodes.push({ type: "rule", char: "=" });
  }

  if (layout.footerText) nodes.push({ type: "text", value: layout.footerText, align: "center" });

  nodes.push({ type: "feed", lines: 3 });
  nodes.push({ type: "cut" });

  return nodes;
}

// --- Entradas públicas ------------------------------------------------------

export function buildOrderDocument(
  order: PrintableOrder,
  kind: "TICKET" | "KITCHEN",
  paperWidth: number,
  layout?: Partial<TicketLayout> | null,
): PrintDocument {
  const resolved: TicketLayout = { ...DEFAULT_LAYOUT, ...(layout ?? {}) };

  return {
    paperWidth: paperWidth === 58 ? 58 : 80,
    nodes: kind === "KITCHEN" ? buildKitchenNodes(order, resolved) : buildTicketNodes(order, resolved),
  };
}

/** Página de prueba: sirve para validar ancho, acentos, euro y corte. */
export function buildTestDocument(printerName: string, paperWidth: number): PrintDocument {
  const width = paperWidth === 58 ? 58 : 80;

  return {
    paperWidth: width,
    nodes: [
      { type: "text", value: "ARCADIA", align: "center", bold: true, size: "double" },
      { type: "text", value: "Prueba de impresión", align: "center" },
      { type: "rule" },
      { type: "text", value: `Impresora: ${printerName}` },
      { type: "text", value: `Ancho: ${width} mm` },
      { type: "text", value: formatDateTime(new Date()) },
      { type: "rule" },
      { type: "text", value: "Acentos: aeiou AEIOU nN cC" },
      { type: "text", value: "Acentos: áéíóú ÁÉÍÓÚ ñÑ çÇ àèòï" },
      { type: "text", value: "Símbolos: 12,34 € ¿? ¡! ·" },
      { type: "rule" },
      { type: "row", left: "Columna izquierda", right: "9,99 €" },
      { type: "row", left: "TOTAL", right: "9,99 €", bold: true },
      { type: "feed", lines: 3 },
      { type: "cut" },
    ],
  };
}
