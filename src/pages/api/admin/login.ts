import type { APIRoute } from "astro";
import { db, User, eq, and } from "astro:db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { randomUUID } from "node:crypto";
import { checkRateLimit, clientKey } from "@/server/security/rateLimit";

/** Ver la explicación en /api/auth/login: iguala el tiempo de respuesta. */
const DUMMY_HASH = hashPassword(randomUUID());

export const POST: APIRoute = async (context) => {
  const { request, session, redirect } = context;
  if (!session) return new Response("Session not available", { status: 500 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  /**
   * Cinco intentos por minuto: más estricto que el login de clientes.
   *
   * Aquí no hay captcha y detrás está el panel completo — catálogo, pedidos,
   * datos de clientes y usuarios. Un puñado de cuentas conocidas probadas sin
   * límite es la vía más directa para entrar.
   */
  const limit = await checkRateLimit({
    key: `admin-login:${clientKey(context)}`,
    limit: 5,
    windowSeconds: 60,
  });

  if (!limit.allowed) return redirect("/admin/login?error=rate", 302);

  if (!email || !password) return redirect("/admin/login?error=invalid", 302);

  const [u] = await db
    .select({
      id: User.id,
      email: User.email,
      name: User.name,
      role: User.role,
      active: User.active,
      passwordHash: User.passwordHash,
    })
    .from(User)
    .where(and(eq(User.email, email), eq(User.active, true)))
    .limit(1);

  const ok = verifyPassword(password, u?.passwordHash ?? DUMMY_HASH);
  const allowed = u ? u.role === "ADMIN" || u.role === "STAFF" : false;

  if (!u || !ok || !allowed) return redirect("/admin/login?error=invalid", 302);

  // Sesión nueva al entrar, para que un identificador conocido de antes no
  // quede convertido en una sesión de administrador.
  await session.regenerate();

  await session.set("user", { id: u.id, email: u.email, name: u.name, role: u.role });

  return redirect("/admin", 302);
};
