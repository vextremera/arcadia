import type { APIRoute } from "astro";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";
import { recordTestPrint, togglePrinterStatus } from "@/server/printing/mock";

const PAGE_PATH = "/admin/impresoras";

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  const printerId = safeText(form.get("printerId"));
  const { ip, userAgent } = getRequestAuditMeta(context.request);

  if (!printerId) {
    return context.redirect(withQuery(PAGE_PATH, { error: "invalid-printer" }));
  }

  if (intent === "test-print") {
    const job = await recordTestPrint(printerId);
    if (!job) return context.redirect(withQuery(PAGE_PATH, { error: "not-found" }));

    try {
      await writeAuditLog({
        actorUserId: user.id,
        action: "PRINTER_TEST_PRINT",
        entityType: "printer_mock",
        entityId: printerId,
        diff: { job },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] printer test-print failed", error);
    }

    return context.redirect(withQuery(PAGE_PATH, { saved: "print" }));
  }

  if (intent === "toggle-status") {
    const printer = await togglePrinterStatus(printerId);
    if (!printer) return context.redirect(withQuery(PAGE_PATH, { error: "not-found" }));

    try {
      await writeAuditLog({
        actorUserId: user.id,
        action: "PRINTER_STATUS_TOGGLED",
        entityType: "printer_mock",
        entityId: printerId,
        diff: { next: { status: printer.status } },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] printer toggle failed", error);
    }

    return context.redirect(withQuery(PAGE_PATH, { saved: "status" }));
  }

  return context.redirect(withQuery(PAGE_PATH, { error: "invalid-intent" }));
};
