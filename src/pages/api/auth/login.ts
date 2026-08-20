import type { APIRoute } from "astro";
import { db, User, eq } from "astro:db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { randomUUID } from "node:crypto";
import { checkRateLimit, clientKey } from "@/server/security/rateLimit";
import { safeInternalPath } from "@/server/security/redirects";

const SESSION_COOKIE = "astro-session";

/**
 * Hash de descarte para gastar el mismo tiempo con un email que no existe.
 *
 * Comprobar la contraseña cuesta unos milisegundos medibles. Al salir antes de
 * tiempo cuando el usuario no existía, la respuesta llegaba notablemente más
 * rápido y eso permite comprobar qué correos están registrados en el
 * restaurante sin acertar ni una contraseña.
 */
const DUMMY_HASH = hashPassword(randomUUID());

function toNextParam(next: string) {
  const n = String(next ?? "").trim();
  return n ? `&next=${encodeURIComponent(n)}` : "";
}

async function verifyRecaptcha(token: string, remoteip?: string | null) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // si no hay secret, no verificamos
  if (!token) return false;

  const recaptchaURL = "https://www.google.com/recaptcha/api/siteverify";
  const requestBody = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteip) requestBody.set("remoteip", remoteip);

  const res = await fetch(recaptchaURL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: requestBody,
  });

  if (!res.ok) return false;
  const data = (await res.json().catch(() => null)) as any;
  return !!data?.success;
}

export const POST: APIRoute = async (context) => {
  const { request, session, redirect, cookies } = context;
  if (!session) return new Response("Session not available", { status: 500 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  // Sólo rutas internas: `next` venía del formulario y se seguía a ciegas, así
  // que servía para llevar al usuario recién identificado a un sitio ajeno.
  const next = safeInternalPath(form.get("next"));
  const remember = String(form.get("remember") ?? "") === "on";

  const clientIp = clientKey(context);

  // Diez intentos por minuto y IP. Sin esto se pueden probar contraseñas sin
  // límite: el captcha ayuda, pero desaparece si falta la clave del servicio.
  const limit = await checkRateLimit({
    key: `login:${clientIp}`,
    limit: 10,
    windowSeconds: 60,
  });

  if (!limit.allowed) {
    return redirect(`/login?error=rate${toNextParam(next)}`, 302);
  }

  const captchaToken = String(form.get("g-recaptcha-response") ?? "").trim();
  // La IP se toma de la misma función protegida que el límite: leer
  // `context.clientAddress` a pelo tira la petición cuando el adaptador no
  // puede resolverla.
  const captchaOk = await verifyRecaptcha(captchaToken, clientIp);
  if (!captchaOk) return redirect(`/login?error=captcha${toNextParam(next)}`, 302);

  if (!email || !password) return redirect(`/login?error=invalid${toNextParam(next)}`, 302);

  const [u] = await db
    .select({
      id: User.id,
      email: User.email,
      name: User.name,
      passwordHash: User.passwordHash,
      role: User.role,
      active: User.active,
    })
    .from(User)
    .where(eq(User.email, email))
    .limit(1);

  // Se comprueba siempre algo, exista el usuario o no, para que las dos
  // respuestas tarden lo mismo.
  const passwordOk = verifyPassword(password, u?.passwordHash ?? DUMMY_HASH);

  if (!u || !u.active || !passwordOk) {
    return redirect(`/login?error=invalid${toNextParam(next)}`, 302);
  }

  /**
   * Sesión nueva al entrar, conservando el carrito.
   *
   * Antes se reutilizaba el identificador de sesión que ya trajera el
   * navegador. Quien consiguiera fijar esa cookie en el navegador de otra
   * persona (desde un subdominio, una wifi sin https, un enlace preparado)
   * conocía de antemano el identificador que, tras identificarse la víctima,
   * pasaba a estar autenticado como ella. Rotarlo corta ese vínculo.
   *
   * `regenerate` conserva los datos, así que el carrito sigue donde estaba, y
   * borra la sesión antigua del almacén.
   */
  await session.regenerate();

  await session.set("user", {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role as any,
  });

  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const sessionId = cookies.get(SESSION_COOKIE)?.value ?? randomUUID();

  // Remember me: cookie persistente 30 días
  cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure,
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });

  if (!next) {
    if (u.role === "ADMIN" || u.role === "STAFF") return redirect("/admin");
    return redirect("/cuenta");
  }

  return redirect(next);
};
