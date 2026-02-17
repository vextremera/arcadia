import type { APIRoute } from "astro";
import { db, User, eq } from "astro:db";
import { verifyPassword } from "@/server/auth/password";

function bad(msg: string, status = 400) {
  return new Response(msg, { status });
}

export const POST: APIRoute = async ({ request, session, redirect }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "").trim();

  if (!email || !password) return bad("Faltan campos");

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

  if (!u || !u.active) return bad("Credenciales inválidas", 401);

  const ok = verifyPassword(password, u.passwordHash);
  if (!ok) return bad("Credenciales inválidas", 401);

  await session.set("user", {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role as any,
  });

  // si es admin/staff y no te pasaron next, llévalo al panel
  if (!next) {
    if (u.role === "ADMIN" || u.role === "STAFF") return redirect("/admin");
    return redirect("/cuenta");
  }

  return redirect(next);
};
