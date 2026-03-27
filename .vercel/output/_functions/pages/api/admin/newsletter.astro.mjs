import 'nodemailer';
import { d as db, N as NewsletterSubscriber } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

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
async function sendNewsletterEmails(params) {
  {
    throw new Error("SMTP_NOT_CONFIGURED");
  }
}
const POST = async (context) => {
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
      return context.redirect(withQuery(redirectPath, {
        error: "invalid-subscriber"
      }));
    }
    const [subscriber] = await db.select({
      id: NewsletterSubscriber.id
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
    return context.redirect(withQuery(redirectPath, {
      saved: "subscriber"
    }));
  }
  if (intent === "send") {
    const subject = safeText(form.get("subject"));
    const body = safeText(form.get("body"));
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
