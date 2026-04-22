import nodemailer from 'nodemailer';
import { d as db, N as NewsletterSubscriber } from './_astro_db_Bcz5lWRF.mjs';
import { g as getRequestAuditMeta, w as writeAuditLog } from './log_54D100FY.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}
function safeText(value) {
  return String(value ?? "").trim();
}
function parseId(value) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function escapeHtml(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function textToHtml(body) {
  return body.split(/\n{2,}/).map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`).join("");
}
async function sendNewsletterEmails(params) {
  const host = "smtp.victorextremera.cat";
  const port = Number("443");
  const secure = true;
  const from = "Arcadia <arcadia@victorextremera.cat>";
  const replyTo = "arcadia@victorextremera.cat";
  if (!port || !from) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }
  const authUser = "arcadia@victorextremera.cat";
  const authPass = "iCUWW_8vmL5xjh3";
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: authUser,
      pass: authPass
    } 
  });
  const footerText = "Recibes este correo porque estás suscrito al newsletter de Arcadia. Si quieres darte de baja y tienes cuenta, puedes hacerlo desde tu perfil.";
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
        text: `${params.body}

---
${footerText}`,
        html
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("[newsletter] send failed", email, error);
    }
  }
  return {
    sent,
    failed
  };
}
const POST = async (context) => {
  const user = context.locals.user;
  const allowed = user && (user.role === "ADMIN" || user.role === "STAFF");
  if (!allowed) {
    return context.redirect("/admin/login");
  }
  const {
    ip,
    userAgent
  } = getRequestAuditMeta(context.request);
  const actorUserId = user.id;
  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  const redirectPath = "/admin/newsletter";
  if (intent === "toggle-subscriber") {
    const subscriberId = parseId(form.get("subscriberId"));
    const active = safeText(form.get("active")) === "1";
    if (!subscriberId) {
      return context.redirect(withQuery(redirectPath, {
        error: "invalid-subscriber"
      }));
    }
    const [subscriber] = await db.select({
      id: NewsletterSubscriber.id,
      email: NewsletterSubscriber.email,
      active: NewsletterSubscriber.active
    }).from(NewsletterSubscriber).where(eq(NewsletterSubscriber.id, subscriberId)).limit(1);
    if (!subscriber) {
      return context.redirect(withQuery(redirectPath, {
        error: "invalid-subscriber"
      }));
    }
    await db.update(NewsletterSubscriber).set({
      active,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(NewsletterSubscriber.id, subscriberId));
    try {
      await writeAuditLog({
        actorUserId,
        action: active ? "NEWSLETTER_SUBSCRIBER_ENABLED" : "NEWSLETTER_SUBSCRIBER_DISABLED",
        entityType: "newsletter_subscriber",
        entityId: String(subscriberId),
        diff: {
          email: subscriber.email,
          previousActive: subscriber.active,
          nextActive: active
        },
        ip,
        userAgent
      });
    } catch (error) {
      console.error("[audit] newsletter toggle failed", error);
    }
    return context.redirect(withQuery(redirectPath, {
      saved: "subscriber"
    }));
  }
  if (intent === "send") {
    const subject = safeText(form.get("subject"));
    const body = safeText(form.get("body"));
    const preset = safeText(form.get("preset")) || "GENERAL";
    if (!subject) {
      return context.redirect(withQuery(redirectPath, {
        error: "missing-subject"
      }));
    }
    if (!body) {
      return context.redirect(withQuery(redirectPath, {
        error: "missing-body"
      }));
    }
    const activeSubscribers = await db.select({
      id: NewsletterSubscriber.id,
      email: NewsletterSubscriber.email
    }).from(NewsletterSubscriber).where(eq(NewsletterSubscriber.active, true));
    const recipients = [...new Set(activeSubscribers.map((row) => row.email.trim().toLowerCase()).filter(Boolean))];
    if (recipients.length === 0) {
      return context.redirect(withQuery(redirectPath, {
        error: "no-subscribers"
      }));
    }
    try {
      const result = await sendNewsletterEmails({
        to: recipients,
        subject,
        body
      });
      try {
        await writeAuditLog({
          actorUserId,
          action: "NEWSLETTER_SENT",
          entityType: "newsletter_broadcast",
          entityId: (/* @__PURE__ */ new Date()).toISOString(),
          diff: {
            preset,
            subject,
            recipients: recipients.length,
            sent: result.sent,
            failed: result.failed
          },
          ip,
          userAgent
        });
      } catch (error) {
        console.error("[audit] newsletter send failed", error);
      }
      return context.redirect(withQuery(redirectPath, {
        saved: "send",
        sent: String(result.sent),
        failed: String(result.failed)
      }));
    } catch (error) {
      console.error("[newsletter] send failed", error);
      if (error instanceof Error && error.message === "SMTP_NOT_CONFIGURED") {
        return context.redirect(withQuery(redirectPath, {
          error: "smtp-not-configured"
        }));
      }
      return context.redirect(withQuery(redirectPath, {
        error: "send-failed"
      }));
    }
  }
  return context.redirect(redirectPath);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
