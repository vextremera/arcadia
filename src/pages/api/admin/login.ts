import type { APIRoute } from "astro";
import { db, User, eq, and } from "astro:db";

export const POST: APIRoute = async ({ request, session, redirect }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

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

  if (!u) return redirect("/admin/login?error=invalid", 302);

  const ok = u.passwordHash === `dev:${password}`;
  const allowed = u.role === "ADMIN" || u.role === "STAFF";

  if (!ok || !allowed) return redirect("/admin/login?error=invalid", 302);

  await session.set("user", { id: u.id, email: u.email, name: u.name, role: u.role });

  return redirect("/admin", 302);
};
