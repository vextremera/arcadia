import type { APIRoute } from "astro";
import { db, User, eq } from "astro:db";
import { hashPassword } from "@/server/auth/password";
import { checkRateLimit, clientKey } from "@/server/security/rateLimit";
import { safeInternalPath } from "@/server/security/redirects";

function toNextParam(next: string) {
  const n = String(next ?? "").trim();
  return n ? `&next=${encodeURIComponent(n)}` : "";
}

function passwordOk(pw: string) {
  const s = String(pw ?? "");
  return (
    s.length >= 8 &&
    /[A-Z]/.test(s) &&
    /[a-z]/.test(s) &&
    /[0-9]/.test(s) &&
    /[^A-Za-z0-9]/.test(s)
  );
}

export const POST: APIRoute = async (context) => {
  const { request, session, redirect } = context;
  if (!session) return new Response("Session not available", { status: 500 });

  // Cinco altas por hora e IP: crear cuentas en masa ensucia la base de
  // clientes y sirve para tantear qué correos ya están registrados.
  const limit = await checkRateLimit({
    key: `register:${clientKey(context)}`,
    limit: 5,
    windowSeconds: 60 * 60,
  });

  if (!limit.allowed) return redirect("/registro?error=rate", 302);

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  // Sólo rutas internas: seguir `next` a ciegas permitía mandar al recién
  // registrado a una copia del sitio.
  const next = safeInternalPath(form.get("next"), "/cuenta") || "/cuenta";

  if (!email.includes("@")) return redirect(`/registro?error=email${toNextParam(next)}`, 302);
  if (!passwordOk(password)) return redirect(`/registro?error=password${toNextParam(next)}`, 302);

  const [existing] = await db.select({ id: User.id }).from(User).where(eq(User.email, email)).limit(1);
  if (existing) return redirect(`/registro?error=exists${toNextParam(next)}`, 302);

  const passwordHash = hashPassword(password);

  try {
    await db.insert(User).values({
      email,
      name: name || null,
      passwordHash,
      role: "CUSTOMER",
      active: true,
    });
  } catch {
    return redirect(`/registro?error=exists${toNextParam(next)}`, 302);
  }

  const [u] = await db
    .select({ id: User.id, email: User.email, name: User.name, role: User.role, active: User.active })
    .from(User)
    .where(eq(User.email, email))
    .limit(1);

  if (!u || !u.active) return redirect(`/registro?error=invalid${toNextParam(next)}`, 302);

  // Identificador de sesión nuevo al quedar autenticado, conservando el
  // carrito. Ver la explicación en /api/auth/login.
  await session.regenerate();

  await session.set("user", {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role as any,
  });

  return redirect(next);
};