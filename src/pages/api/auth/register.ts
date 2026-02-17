import type { APIRoute } from "astro";
import { db, User, eq } from "astro:db";
import { hashPassword } from "@/server/auth/password";

function bad(msg: string, status = 400) {
  return new Response(msg, { status });
}

export const POST: APIRoute = async ({ request, session, redirect }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/cuenta").trim() || "/cuenta";

  if (!email.includes("@")) return bad("Email inválido");
  if (password.length < 8) return bad("La contraseña debe tener mínimo 8 caracteres");

  // si ya existe
  const [existing] = await db
    .select({ id: User.id })
    .from(User)
    .where(eq(User.email, email))
    .limit(1);

  if (existing) return bad("Ese email ya está registrado");

  const passwordHash = hashPassword(password);

  try {
    await db.insert(User).values({
      email,
      name: name || null,
      passwordHash,
      role: "CUSTOMER",
      active: true,
    });
  } catch (e: any) {
    // fallback por si salta unique constraint
    return bad("No se pudo crear el usuario");
  }

  // leer el user recién creado
  const [u] = await db
    .select({
      id: User.id,
      email: User.email,
      name: User.name,
      role: User.role,
      active: User.active,
    })
    .from(User)
    .where(eq(User.email, email))
    .limit(1);

  if (!u || !u.active) return bad("Usuario inactivo", 403);

  await session.set("user", {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role as any,
  });

  return redirect(next);
};
