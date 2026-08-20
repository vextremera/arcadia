import type { APIRoute } from "astro";
import { db, TicketTemplate, eq } from "astro:db";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";

const PAGE_PATH = "/admin/tickets";

type TicketKind = "TICKET" | "KITCHEN";

export type TicketLayout = {
  showLogo: boolean;
  headerText: string;
  showModifiers: boolean;
  showAllergens: boolean;
  showQR: boolean;
  footerText: string;
};

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function isKind(value: string): value is TicketKind {
  return value === "TICKET" || value === "KITCHEN";
}

function isPaperWidth(value: number) {
  return value === 58 || value === 80;
}

function parseLayout(form: FormData): TicketLayout {
  return {
    showLogo: form.get("showLogo") === "on",
    headerText: safeText(form.get("headerText")),
    showModifiers: form.get("showModifiers") === "on",
    showAllergens: form.get("showAllergens") === "on",
    showQR: form.get("showQR") === "on",
    footerText: safeText(form.get("footerText")),
  };
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

async function getNextId() {
  const rows = await db.select({ id: TicketTemplate.id }).from(TicketTemplate);
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

  if (intent === "create") {
    const name = safeText(form.get("name"));
    const kind = safeText(form.get("kind")).toUpperCase();
    const paperWidth = Number(safeText(form.get("paperWidth")));

    if (!name) return context.redirect(withQuery(PAGE_PATH, { error: "missing-name" }));
    if (!isKind(kind)) return context.redirect(withQuery(PAGE_PATH, { error: "invalid-kind" }));
    if (!isPaperWidth(paperWidth)) return context.redirect(withQuery(PAGE_PATH, { error: "invalid-width" }));

    const layout = parseLayout(form);
    const nextId = await getNextId();

    await db.insert(TicketTemplate).values({
      id: nextId,
      name,
      kind,
      paperWidth,
      layout,
      active: form.get("active") === "on",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    try {
      await writeAuditLog({
        actorAdminId: admin.id,
        action: "TICKET_TEMPLATE_CREATED",
        entityType: "ticket_template",
        entityId: String(nextId),
        diff: { next: { name, kind, paperWidth, layout } },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] ticket template create failed", error);
    }

    return context.redirect(withQuery(PAGE_PATH, { saved: "1" }));
  }

  const templateId = Number(safeText(form.get("templateId")));
  if (!Number.isFinite(templateId)) {
    return context.redirect(withQuery(PAGE_PATH, { error: "invalid-template" }));
  }

  const [existing] = await db
    .select()
    .from(TicketTemplate)
    .where(eq(TicketTemplate.id, templateId))
    .limit(1);

  if (!existing) {
    return context.redirect(withQuery(PAGE_PATH, { error: "not-found" }));
  }

  if (intent === "update") {
    const name = safeText(form.get("name"));
    const kind = safeText(form.get("kind")).toUpperCase();
    const paperWidth = Number(safeText(form.get("paperWidth")));

    if (!name) return context.redirect(withQuery(PAGE_PATH, { error: "missing-name" }));
    if (!isKind(kind)) return context.redirect(withQuery(PAGE_PATH, { error: "invalid-kind" }));
    if (!isPaperWidth(paperWidth)) return context.redirect(withQuery(PAGE_PATH, { error: "invalid-width" }));

    const layout = parseLayout(form);
    const active = form.get("active") === "on";

    await db
      .update(TicketTemplate)
      .set({ name, kind, paperWidth, layout, active, updatedAt: new Date() })
      .where(eq(TicketTemplate.id, templateId));

    try {
      await writeAuditLog({
        actorAdminId: admin.id,
        action: "TICKET_TEMPLATE_UPDATED",
        entityType: "ticket_template",
        entityId: String(templateId),
        diff: {
          previous: { name: existing.name, kind: existing.kind, paperWidth: existing.paperWidth, layout: existing.layout, active: existing.active },
          next: { name, kind, paperWidth, layout, active },
        },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] ticket template update failed", error);
    }

    return context.redirect(withQuery(PAGE_PATH, { saved: "1" }));
  }

  if (intent === "toggle-active") {
    const nextActive = !existing.active;
    await db.update(TicketTemplate).set({ active: nextActive, updatedAt: new Date() }).where(eq(TicketTemplate.id, templateId));

    try {
      await writeAuditLog({
        actorAdminId: admin.id,
        action: "TICKET_TEMPLATE_TOGGLED",
        entityType: "ticket_template",
        entityId: String(templateId),
        diff: { previous: { active: existing.active }, next: { active: nextActive } },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] ticket template toggle failed", error);
    }

    return context.redirect(withQuery(PAGE_PATH, { saved: "1" }));
  }

  if (intent === "delete") {
    await db.delete(TicketTemplate).where(eq(TicketTemplate.id, templateId));

    try {
      await writeAuditLog({
        actorAdminId: admin.id,
        action: "TICKET_TEMPLATE_DELETED",
        entityType: "ticket_template",
        entityId: String(templateId),
        diff: { previous: { name: existing.name, kind: existing.kind } },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] ticket template delete failed", error);
    }

    return context.redirect(withQuery(PAGE_PATH, { saved: "1" }));
  }

  return context.redirect(withQuery(PAGE_PATH, { error: "invalid-intent" }));
};
