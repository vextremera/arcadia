/**
 * Cola de impresión: encolar, reclamar y confirmar trabajos.
 *
 * El flujo real es de *pull*, no de push: Vercel no puede abrir un socket contra
 * una IP privada de la LAN del restaurante, así que es el bridge del local quien
 * pregunta "¿hay algo para imprimir?" cada pocos segundos. Por eso `claimJobs`
 * marca SENT al entregar y espera un ack posterior — si el bridge muere entre
 * medias, `requeueStaleJobs` los devuelve a PENDING en vez de perderlos.
 */
import { db, Printer, PrintJob, Order, OrderItem, eq, and, lt, inArray } from "astro:db";
import { buildOrderDocument, buildTestDocument, type PrintableOrder } from "@/server/printing/render";
import type { PrintDocument } from "@/server/printing/escpos";
import type { TicketLayout } from "@/pages/api/admin/tickets";

export type PrinterRow = {
  id: number;
  name: string;
  location: string;
  kind: "TICKET" | "KITCHEN";
  host: string;
  port: number;
  paperWidth: number;
  templateId: number | null;
  autoPrint: boolean;
  enabled: boolean;
  lastSeenAt: Date | null;
  lastError: string | null;
};

export type PrintJobRow = {
  id: number;
  printerId: number;
  orderId: number | null;
  kind: "TICKET" | "KITCHEN" | "TEST";
  title: string;
  document: PrintDocument;
  status: "PENDING" | "SENT" | "DONE" | "ERROR";
  attempts: number;
  lastError: string | null;
  createdAt: Date;
  claimedAt: Date | null;
  doneAt: Date | null;
};

/** Un trabajo entregado al bridge se reintenta pasado este tiempo sin ack. */
const STALE_CLAIM_MS = 60_000;
const MAX_ATTEMPTS = 5;

// --- IDs --------------------------------------------------------------------

/**
 * El repo genera IDs con max(id)+1 porque Astro DB no expone autoincrement.
 * Dos pedidos confirmados a la vez pueden calcular el mismo id, así que el
 * insert se reintenta en vez de perder la comanda.
 */
async function insertJobWithRetry(values: Omit<PrintJobRow, "id" | "createdAt" | "claimedAt" | "doneAt">) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const rows = await db.select({ id: PrintJob.id }).from(PrintJob);
    const nextId = rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1 + attempt;

    try {
      await db.insert(PrintJob).values({ ...values, id: nextId, createdAt: new Date() });
      return nextId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isCollision = message.includes("UNIQUE") || message.includes("PRIMARY");
      if (!isCollision || attempt === 4) throw error;
    }
  }

  return null;
}

// --- Carga del pedido -------------------------------------------------------

type AddressSnapshot = { paymentMethod?: "CASH" | "CARD" | string } & Record<string, unknown>;

export async function loadPrintableOrder(orderId: number): Promise<PrintableOrder | null> {
  const [order] = await db.select().from(Order).where(eq(Order.id, orderId)).limit(1);
  if (!order) return null;

  const items = await db.select().from(OrderItem).where(eq(OrderItem.orderId, orderId));
  const snapshot = (order.addressSnapshot ?? null) as AddressSnapshot | null;
  const method = snapshot?.paymentMethod;

  return {
    publicId: order.publicId,
    type: order.type as "DELIVERY" | "PICKUP",
    createdAt: order.createdAt instanceof Date ? order.createdAt : new Date(order.createdAt),
    customerName: order.customerName ?? null,
    customerPhone: order.customerPhone ?? null,
    notes: order.notes ?? null,
    subtotalCents: order.subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    paymentMethod: method === "CARD" ? "CARD" : method === "CASH" ? "CASH" : null,
    paymentStatus: order.paymentStatus,
    addressSnapshot: snapshot,
    items: items.map((item) => ({
      nameSnapshot: item.nameSnapshot,
      variantSnapshot: item.variantSnapshot ?? null,
      qty: item.qty,
      unitPriceCents: item.unitPriceCents,
      lineTotalCents: item.lineTotalCents,
      notes: item.notes ?? null,
      modifiers: (item.modifiers ?? null) as PrintableOrder["items"][number]["modifiers"],
    })),
  };
}

async function resolveLayout(templateId: number | null): Promise<Partial<TicketLayout> | null> {
  if (!templateId) return null;

  const { TicketTemplate } = await import("astro:db");
  const [template] = await db
    .select({ layout: TicketTemplate.layout })
    .from(TicketTemplate)
    .where(eq(TicketTemplate.id, templateId))
    .limit(1);

  return (template?.layout ?? null) as Partial<TicketLayout> | null;
}

// --- Encolar ----------------------------------------------------------------

export async function getPrinters(): Promise<PrinterRow[]> {
  return (await db.select().from(Printer)) as unknown as PrinterRow[];
}

/**
 * Encola el pedido en todas las impresoras con autoPrint activo.
 * Idempotente por (orderId, printerId): reintentar la confirmación de un pedido
 * no debe sacar la comanda dos veces.
 */
export async function enqueueOrderPrints(orderId: number): Promise<number> {
  const order = await loadPrintableOrder(orderId);
  if (!order) return 0;

  const printers = (await getPrinters()).filter((printer) => printer.enabled && printer.autoPrint);
  if (!printers.length) return 0;

  const existing = await db
    .select({ printerId: PrintJob.printerId })
    .from(PrintJob)
    .where(eq(PrintJob.orderId, orderId));
  const alreadyQueued = new Set(existing.map((row) => Number(row.printerId)));

  let queued = 0;

  for (const printer of printers) {
    if (alreadyQueued.has(printer.id)) continue;

    const layout = await resolveLayout(printer.templateId);
    const document = buildOrderDocument(order, printer.kind, printer.paperWidth, layout);

    await insertJobWithRetry({
      printerId: printer.id,
      orderId,
      kind: printer.kind,
      title: `${printer.kind === "KITCHEN" ? "Comanda" : "Ticket"} ${order.publicId}`,
      document,
      status: "PENDING",
      attempts: 0,
      lastError: null,
    });

    queued += 1;
  }

  return queued;
}

/** Reimpresión manual desde el admin, saltándose el filtro de autoPrint. */
export async function enqueueOrderPrintForPrinter(orderId: number, printerId: number): Promise<boolean> {
  const order = await loadPrintableOrder(orderId);
  if (!order) return false;

  const [printer] = (await db
    .select()
    .from(Printer)
    .where(eq(Printer.id, printerId))
    .limit(1)) as unknown as PrinterRow[];
  if (!printer) return false;

  const layout = await resolveLayout(printer.templateId);
  const document = buildOrderDocument(order, printer.kind, printer.paperWidth, layout);

  await insertJobWithRetry({
    printerId: printer.id,
    orderId,
    kind: printer.kind,
    title: `Reimpresión ${order.publicId}`,
    document,
    status: "PENDING",
    attempts: 0,
    lastError: null,
  });

  return true;
}

export async function enqueueTestPrint(printerId: number): Promise<boolean> {
  const [printer] = (await db
    .select()
    .from(Printer)
    .where(eq(Printer.id, printerId))
    .limit(1)) as unknown as PrinterRow[];
  if (!printer) return false;

  await insertJobWithRetry({
    printerId: printer.id,
    orderId: null,
    kind: "TEST",
    title: `Prueba de impresión - ${printer.name}`,
    document: buildTestDocument(printer.name, printer.paperWidth),
    status: "PENDING",
    attempts: 0,
    lastError: null,
  });

  return true;
}

// --- Reclamar y confirmar ---------------------------------------------------

/** Devuelve a PENDING los trabajos entregados que nadie confirmó. */
export async function requeueStaleJobs(): Promise<number> {
  const threshold = new Date(Date.now() - STALE_CLAIM_MS);

  const stale = await db
    .select({ id: PrintJob.id, attempts: PrintJob.attempts })
    .from(PrintJob)
    .where(and(eq(PrintJob.status, "SENT"), lt(PrintJob.claimedAt, threshold)));

  if (!stale.length) return 0;

  const giveUp = stale.filter((job) => Number(job.attempts) >= MAX_ATTEMPTS).map((job) => Number(job.id));
  const retry = stale.filter((job) => Number(job.attempts) < MAX_ATTEMPTS).map((job) => Number(job.id));

  if (giveUp.length) {
    await db
      .update(PrintJob)
      .set({ status: "ERROR", lastError: "Sin respuesta del bridge tras varios intentos", doneAt: new Date() })
      .where(inArray(PrintJob.id, giveUp));
  }

  if (retry.length) {
    await db
      .update(PrintJob)
      .set({ status: "PENDING", claimedAt: null })
      .where(inArray(PrintJob.id, retry));
  }

  return retry.length;
}

/** Entrega los trabajos pendientes al bridge y los marca como enviados. */
export async function claimJobs(limit = 10): Promise<PrintJobRow[]> {
  await requeueStaleJobs();

  const pending = (await db
    .select()
    .from(PrintJob)
    .where(eq(PrintJob.status, "PENDING"))) as unknown as PrintJobRow[];

  const batch = pending
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, limit);

  if (!batch.length) return [];

  await db
    .update(PrintJob)
    .set({ status: "SENT", claimedAt: new Date() })
    .where(inArray(PrintJob.id, batch.map((job) => job.id)));

  return batch.map((job) => ({ ...job, attempts: job.attempts + 1 }));
}

export async function ackJob(jobId: number, ok: boolean, error?: string | null): Promise<void> {
  const [job] = await db
    .select({ id: PrintJob.id, attempts: PrintJob.attempts })
    .from(PrintJob)
    .where(eq(PrintJob.id, jobId))
    .limit(1);
  if (!job) return;

  const attempts = Number(job.attempts) + 1;

  if (ok) {
    await db
      .update(PrintJob)
      .set({ status: "DONE", attempts, lastError: null, doneAt: new Date() })
      .where(eq(PrintJob.id, jobId));
    return;
  }

  // Se reintenta hasta MAX_ATTEMPTS; después queda en ERROR y visible en admin.
  const exhausted = attempts >= MAX_ATTEMPTS;
  await db
    .update(PrintJob)
    .set({
      status: exhausted ? "ERROR" : "PENDING",
      attempts,
      lastError: error ?? "Error desconocido",
      claimedAt: null,
      doneAt: exhausted ? new Date() : null,
    })
    .where(eq(PrintJob.id, jobId));
}

/** El bridge reporta si consiguió abrir el socket contra cada impresora. */
export async function reportPrinterHealth(
  printerId: number,
  online: boolean,
  error?: string | null,
): Promise<void> {
  await db
    .update(Printer)
    .set(
      online
        ? { lastSeenAt: new Date(), lastError: null, updatedAt: new Date() }
        : { lastError: error ?? "Sin conexion", updatedAt: new Date() },
    )
    .where(eq(Printer.id, printerId));
}

export async function getRecentJobs(limit = 20): Promise<(PrintJobRow & { printerName: string })[]> {
  const [jobs, printers] = await Promise.all([
    db.select().from(PrintJob) as unknown as Promise<PrintJobRow[]>,
    getPrinters(),
  ]);

  const names = new Map(printers.map((printer) => [printer.id, printer.name]));

  return jobs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit)
    .map((job) => ({ ...job, printerName: names.get(job.printerId) ?? `#${job.printerId}` }));
}
