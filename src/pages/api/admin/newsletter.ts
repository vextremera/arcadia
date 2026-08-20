import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { db, NewsletterSubscriber, eq } from "astro:db";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";

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

function cleanEnv(value: unknown) {
  const text = String(value ?? "").trim();

  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    return text.slice(1, -1).trim();
  }

  return text;
}

function parseBooleanEnv(value: unknown) {
  const text = cleanEnv(value).toLowerCase();
  return text === "1" || text === "true" || text === "yes";
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");

  if (!local || !domain) {
    return email;
  }

  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function normalizeAddress(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "address" in value &&
    typeof value.address === "string"
  ) {
    return value.address;
  }

  return String(value ?? "");
}

function formatMailError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      code: (error as { code?: unknown }).code,
      command: (error as { command?: unknown }).command,
      response: (error as { response?: unknown }).response,
      responseCode: (error as { responseCode?: unknown }).responseCode,
    };
  }

  return {
    message: String(error),
  };
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
  const host = cleanEnv(import.meta.env.SMTP_HOST);
  const port = Number(cleanEnv(import.meta.env.SMTP_PORT));
  const secure = parseBooleanEnv(import.meta.env.SMTP_SECURE);
  const from = cleanEnv(import.meta.env.SMTP_FROM);
  const replyTo = cleanEnv(import.meta.env.SMTP_REPLY_TO) || undefined;
  const authUser = cleanEnv(import.meta.env.SMTP_USER);
  const authPass = cleanEnv(import.meta.env.SMTP_PASS);

  if (!host || !port || !from || !authUser || !authPass) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  if (![465, 587, 578].includes(port)) {
    throw new Error("SMTP_INVALID_PORT");
  }

  if (port === 465 && !secure) {
    throw new Error("SMTP_INVALID_SECURITY");
  }

  if ((port === 587 || port === 578) && secure) {
    throw new Error("SMTP_INVALID_SECURITY");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: authUser,
      pass: authPass,
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

  await transporter.verify();

  console.log("[newsletter] smtp verified", {
    host,
    port,
    secure,
    user: maskEmail(authUser),
    from,
    replyTo,
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
      const info = await transporter.sendMail({
        from,
        to: email,
        replyTo,
        subject: params.subject,
        text: `${params.body}\n\n---\n${footerText}`,
        html,
      });

      const accepted = Array.isArray(info.accepted)
        ? info.accepted.map(normalizeAddress)
        : [];

      const rejected = Array.isArray(info.rejected)
        ? info.rejected.map(normalizeAddress)
        : [];

      console.log("[newsletter] mail result", {
        to: maskEmail(email),
        messageId: info.messageId,
        accepted: accepted.map(maskEmail),
        rejected: rejected.map(maskEmail),
        response: info.response,
      });

      if (accepted.length > 0 && rejected.length === 0) {
        sent += 1;
      } else {
        failed += 1;
      }
    } catch (error) {
      failed += 1;
      console.error("[newsletter] send failed", {
        to: maskEmail(email),
        error: formatMailError(error),
      });
    }
  }

  return { sent, failed };
}

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin) {
    return context.redirect("/admin/login");
  }

  const { ip, userAgent } = getRequestAuditMeta(context.request);
  const actorAdminId = admin.id;

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
      .select({
        id: NewsletterSubscriber.id,
        email: NewsletterSubscriber.email,
        active: NewsletterSubscriber.active,
      })
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

    try {
      await writeAuditLog({
        actorAdminId,
        action: active
          ? "NEWSLETTER_SUBSCRIBER_ENABLED"
          : "NEWSLETTER_SUBSCRIBER_DISABLED",
        entityType: "newsletter_subscriber",
        entityId: String(subscriberId),
        diff: {
          email: subscriber.email,
          previousActive: subscriber.active,
          nextActive: active,
        },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] newsletter toggle failed", error);
    }

    return context.redirect(withQuery(redirectPath, { saved: "subscriber" }));
  }

  if (intent === "send") {
    const subject = safeText(form.get("subject"));
    const body = safeText(form.get("body"));
    const preset = safeText(form.get("preset")) || "GENERAL";

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
      .select({
        id: NewsletterSubscriber.id,
        email: NewsletterSubscriber.email,
      })
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

      try {
        await writeAuditLog({
          actorAdminId,
          action: "NEWSLETTER_SENT",
          entityType: "newsletter_broadcast",
          entityId: new Date().toISOString(),
          diff: {
            preset,
            subject,
            recipients: recipients.length,
            sent: result.sent,
            failed: result.failed,
          },
          ip,
          userAgent,
        });
      } catch (error) {
        console.error("[audit] newsletter send failed", error);
      }

      return context.redirect(
        withQuery(redirectPath, {
          saved: "send",
          sent: String(result.sent),
          failed: String(result.failed),
        }),
      );
    } catch (error) {
      console.error("[newsletter] send failed", formatMailError(error));

      if (
        error instanceof Error &&
        [
          "SMTP_NOT_CONFIGURED",
          "SMTP_INVALID_PORT",
          "SMTP_INVALID_SECURITY",
        ].includes(error.message)
      ) {
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