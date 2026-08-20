/**
 * Gestión de impresoras desde el admin.
 *
 * "Imprimir prueba" no imprime aquí: encola. Quien saca el papel es el bridge
 * del local (tools/print-bridge), así que el resultado real aparece unos
 * segundos después en la cola, no en la respuesta de esta petición.
 */
import type { APIRoute } from "astro";
import { db, Printer, PrintJob, eq } from "astro:db";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";
import { enqueueTestPrint } from "@/server/printing/queue";

const PAGE_PATH = "/admin/impresoras";

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

/** Acepta IPv4, hostname o nombre NetBIOS: la LAN del local puede ser cualquiera. */
function isValidHost(host: string) {
  if (!host || host.length > 253) return false;
  return /^[a-zA-Z0-9.\-_]+$/.test(host);
}

async function getNextPrinterId() {
  const rows = await db.select({ id: Printer.id }).from(Printer);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  const { ip, userAgent } = getRequestAuditMeta(context.request);

  const audit = async (action: string, entityId: string, diff: unknown) => {
    try {
      await writeAuditLog({
        actorAdminId: admin.id,
        action,
        entityType: "printer",
        entityId,
        diff: diff as Record<string, unknown>,
        ip,
        userAgent,
      });
    } catch (error) {
      console.error(`[audit] ${action} failed`, error);
    }
  };

  if (intent === "create" || intent === "update") {
    const name = safeText(form.get("name"));
    const host = safeText(form.get("host"));
    const location = safeText(form.get("location"));
    const kind = (safeText(form.get("kind")) === "KITCHEN" ? "KITCHEN" : "TICKET") as "TICKET" | "KITCHEN";
    const port = Number(safeText(form.get("port")) || 9100);
    const paperWidth = Number(safeText(form.get("paperWidth")) || 80);
    const templateRaw = safeText(form.get("templateId"));
    const templateId = templateRaw ? Number(templateRaw) : null;
    const autoPrint = form.get("autoPrint") === "on";
    const enabled = form.get("enabled") === "on";

    if (!name) return context.redirect(withQuery(PAGE_PATH, { error: "missing-name" }));
    if (!isValidHost(host)) return context.redirect(withQuery(PAGE_PATH, { error: "invalid-host" }));
    if (!Number.isFinite(port) || port < 1 || port > 65535) {
      return context.redirect(withQuery(PAGE_PATH, { error: "invalid-port" }));
    }
    if (paperWidth !== 58 && paperWidth !== 80) {
      return context.redirect(withQuery(PAGE_PATH, { error: "invalid-width" }));
    }

    const values = {
      name,
      location,
      kind,
      host,
      port,
      paperWidth,
      templateId: templateId && Number.isFinite(templateId) ? templateId : null,
      autoPrint,
      enabled,
      updatedAt: new Date(),
    };

    if (intent === "create") {
      const id = await getNextPrinterId();
      await db.insert(Printer).values({ ...values, id, createdAt: new Date() });
      await audit("PRINTER_CREATED", String(id), { next: values });
      return context.redirect(withQuery(PAGE_PATH, { saved: "created" }));
    }

    const printerId = Number(safeText(form.get("printerId")));
    if (!Number.isFinite(printerId)) {
      return context.redirect(withQuery(PAGE_PATH, { error: "invalid-printer" }));
    }

    const [existing] = await db.select().from(Printer).where(eq(Printer.id, printerId)).limit(1);
    if (!existing) return context.redirect(withQuery(PAGE_PATH, { error: "not-found" }));

    await db.update(Printer).set(values).where(eq(Printer.id, printerId));
    await audit("PRINTER_UPDATED", String(printerId), { prev: existing, next: values });
    return context.redirect(withQuery(PAGE_PATH, { saved: "updated" }));
  }

  const printerId = Number(safeText(form.get("printerId")));
  if (!Number.isFinite(printerId)) {
    return context.redirect(withQuery(PAGE_PATH, { error: "invalid-printer" }));
  }

  if (intent === "test-print") {
    const queued = await enqueueTestPrint(printerId);
    if (!queued) return context.redirect(withQuery(PAGE_PATH, { error: "not-found" }));

    await audit("PRINTER_TEST_PRINT", String(printerId), { queued: true });
    return context.redirect(withQuery(PAGE_PATH, { saved: "print" }));
  }

  if (intent === "delete") {
    const [existing] = await db.select().from(Printer).where(eq(Printer.id, printerId)).limit(1);
    if (!existing) return context.redirect(withQuery(PAGE_PATH, { error: "not-found" }));

    // PrintJob referencia a Printer: sin esto el borrado falla por clave ajena.
    // La cola es transitoria, así que se va con la impresora.
    await db.delete(PrintJob).where(eq(PrintJob.printerId, printerId));
    await db.delete(Printer).where(eq(Printer.id, printerId));
    await audit("PRINTER_DELETED", String(printerId), { prev: existing });
    return context.redirect(withQuery(PAGE_PATH, { saved: "deleted" }));
  }

  return context.redirect(withQuery(PAGE_PATH, { error: "invalid-intent" }));
};
