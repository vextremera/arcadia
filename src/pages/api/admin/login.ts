import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";
import { hashPassword } from "@/server/auth/password";
import { checkRateLimit, clientKey } from "@/server/security/rateLimit";
import { findByUsername, checkPassword, markLogin, normalizeUsername } from "@/server/auth/adminUsers";
import { ADMIN_ROLE_HOME, isAdminRole } from "@/lib/admin/roles";

/** Ver la explicación en /api/auth/login: iguala el tiempo de respuesta. */
const DUMMY_HASH = hashPassword(randomUUID());

export const POST: APIRoute = async (context) => {
  const { request, session, redirect } = context;
  if (!session) return new Response("Session not available", { status: 500 });

  const form = await request.formData();
  const username = normalizeUsername(form.get("username"));
  const password = String(form.get("password") ?? "");

  /**
   * Cinco intentos por minuto: más estricto que el login de clientes.
   *
   * Aquí no hay captcha y detrás está el panel completo. Y los nombres de
   * usuario del personal son cortos, más fáciles de adivinar que un correo.
   */
  const limit = await checkRateLimit({
    key: `admin-login:${clientKey(context)}`,
    limit: 5,
    windowSeconds: 60,
  });

  if (!limit.allowed) return redirect("/admin/login?error=rate", 302);

  if (!username || !password) return redirect("/admin/login?error=invalid", 302);

  const account = await findByUsername(username);

  // Se comprueba siempre algo, exista la cuenta o no, para que las dos
  // respuestas tarden lo mismo y no se pueda tantear qué usuarios hay.
  const passwordOk = checkPassword(account?.passwordHash ?? DUMMY_HASH, password);

  if (!account || !account.active || !passwordOk) {
    return redirect("/admin/login?error=invalid", 302);
  }

  // Identificador de sesión nuevo al entrar, para que uno conocido de antes no
  // quede convertido en una sesión del panel.
  await session.regenerate();

  const role = isAdminRole(account.role) ? account.role : "WORKER";

  await session.set("admin", {
    id: account.id,
    username: account.username,
    displayName: account.displayName ?? null,
    role,
  });

  await markLogin(account.id);

  return redirect(ADMIN_ROLE_HOME[role], 302);
};
