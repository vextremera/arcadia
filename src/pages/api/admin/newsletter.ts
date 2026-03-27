import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { db, NewsletterSubscriber, eq } from "astro:db";

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function textToHtml(body: string) {
  return body
    .split(/\n{2,}/)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");
}

async function sendNewsletterEmails(params: {
  to: string[];
  subject: string;
  body: string;
}) {
  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT || 0);
  const secure =
    import.meta.env.SMTP_SECURE === "1" ||
    import.meta.env.SMTP_SECURE === "true";
  const from = import.meta.env.SMTP_FROM;
  const replyTo = import.meta.env.SMTP_REPLY_TO || undefined;

  if (!host || !port || !from) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const authUser = import.meta.env.SMTP_USER || undefined;
  const authPass = import.meta.env.SMTP_PASS || undefined;

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: authUser && authPass ? { user: authUser, pass: authPass } : undefined,
  });

  const footerText =
    "Recibes este correo porque estás suscrito al newsletter de Arcadia. Si quieres darte de baja y tienes cuenta, puedes hacerlo desde tu perfil.";

  const html = `${textToHtml(params.body)}
<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb" />
<p style="font-size:12px;color:#6b7280">${escapeHtml(footerText)}</p>`;

  let sent = 0;
  let failed = 0;

  for (const email of params.to) {
    try {
      await transporter.sendMail({
        from,
        to: email,
        replyTo,
        subject: params.subject,
        text: `${params.body}\n\n---\n${footerText}`,
        html,
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("[newsletter] send failed", email, error);
    }
  }

  return { sent, failed };
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  const allowed = user && (user.role === "ADMIN" || user.role === "STAFF");
  if (!allowed) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  const redirectPath = "/admin/newsletter";

  if (intent === "toggle-subscriber") {
    const subscriberId = parseId(form.get("subscriberId"));
    const active = safeText(form.get("active")) === "1";

    if (!subscriberId) {
      return context.redirect(
        withQuery(redirectPath, { error: "invalid-subscriber" }),
      );
    }

    const [subscriber] = await db
      .select({ id: NewsletterSubscriber.id })
      .from(NewsletterSubscriber)
      .where(eq(NewsletterSubscriber.id, subscriberId))
      .limit(1);

    if (!subscriber) {
      return context.redirect(
        withQuery(redirectPath, { error: "invalid-subscriber" }),
      );
    }

    await db
      .update(NewsletterSubscriber)
      .set({ active, updatedAt: new Date() })
      .where(eq(NewsletterSubscriber.id, subscriberId));

    return context.redirect(withQuery(redirectPath, { saved: "subscriber" }));
  }

  if (intent === "send") {
    const subject = safeText(form.get("subject"));
    const body = safeText(form.get("body"));

    if (!subject) {
      return context.redirect(
        withQuery(redirectPath, { error: "missing-subject" }),
      );
    }

    if (!body) {
      return context.redirect(
        withQuery(redirectPath, { error: "missing-body" }),
      );
    }

    const activeSubscribers = await db
      .select({ email: NewsletterSubscriber.email })
      .from(NewsletterSubscriber)
      .where(eq(NewsletterSubscriber.active, true));

    const recipients = [
      ...new Set(
        activeSubscribers
          .map((row) => row.email.trim().toLowerCase())
          .filter(Boolean),
      ),
    ];

    if (recipients.length === 0) {
      return context.redirect(
        withQuery(redirectPath, { error: "no-subscribers" }),
      );
    }

    try {
      const result = await sendNewsletterEmails({
        to: recipients,
        subject,
        body,
      });

      return context.redirect(
        withQuery(redirectPath, {
          saved: "send",
          sent: String(result.sent),
          failed: String(result.failed),
        }),
      );
    } catch (error) {
      console.error("[newsletter] send failed", error);

      if (error instanceof Error && error.message === "SMTP_NOT_CONFIGURED") {
        return context.redirect(
          withQuery(redirectPath, { error: "smtp-not-configured" }),
        );
      }

      return context.redirect(
        withQuery(redirectPath, { error: "send-failed" }),
      );
    }
  }

  return context.redirect(redirectPath);
};