import { d as db, j as User } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
import { v as verifyPassword } from '../../../chunks/password_DsiHb1Tp.mjs';
import { randomUUID } from 'node:crypto';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

const SESSION_COOKIE = "astro-session";
function toNextParam(next) {
  const n = String(next ?? "").trim();
  return n ? `&next=${encodeURIComponent(n)}` : "";
}
async function verifyRecaptcha(token, remoteip) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  const recaptchaURL = "https://www.google.com/recaptcha/api/siteverify";
  const requestBody = new URLSearchParams({
    secret,
    response: token
  });
  if (remoteip) requestBody.set("remoteip", remoteip);
  const res = await fetch(recaptchaURL, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: requestBody
  });
  if (!res.ok) return false;
  const data = await res.json().catch(() => null);
  return !!data?.success;
}
const POST = async ({
  request,
  session,
  redirect,
  cookies,
  clientAddress
}) => {
  if (!session) return new Response("Session not available", {
    status: 500
  });
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "").trim();
  const remember = String(form.get("remember") ?? "") === "on";
  const captchaToken = String(form.get("g-recaptcha-response") ?? "").trim();
  const captchaOk = await verifyRecaptcha(captchaToken, clientAddress ?? null);
  if (!captchaOk) return redirect(`/login?error=captcha${toNextParam(next)}`, 302);
  if (!email || !password) return redirect(`/login?error=invalid${toNextParam(next)}`, 302);
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const existingSessionId = cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existingSessionId || randomUUID();
  if (!existingSessionId) {
    await session.load(sessionId);
  }
  const [u] = await db.select({
    id: User.id,
    email: User.email,
    name: User.name,
    passwordHash: User.passwordHash,
    role: User.role,
    active: User.active
  }).from(User).where(eq(User.email, email)).limit(1);
  if (!u || !u.active) return redirect(`/login?error=invalid${toNextParam(next)}`, 302);
  const ok = verifyPassword(password, u.passwordHash);
  if (!ok) return redirect(`/login?error=invalid${toNextParam(next)}`, 302);
  await session.set("user", {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role
  });
  cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    ...remember ? {
      maxAge: 60 * 60 * 24 * 30
    } : {}
  });
  if (!next) {
    if (u.role === "ADMIN" || u.role === "STAFF") return redirect("/admin");
    return redirect("/cuenta");
  }
  return redirect(next);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
