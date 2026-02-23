import type { APIRoute } from "astro";
import { db, User, eq } from "astro:db";
import { hashPassword } from "@/server/auth/password";
import { randomUUID } from "node:crypto";

const SESSION_COOKIE = "astro-session";

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

export const POST: APIRoute = async ({ request, session, redirect, cookies }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const name = String(form.get("name") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/cuenta").trim() || "/cuenta";

  if (!email.includes("@")) return redirect(`/registro?error=email${toNextParam(next)}`, 302);
  if (!passwordOk(password)) return redirect(`/registro?error=password${toNextParam(next)}`, 302);

  // Mantener carrito: reutilizamos el sessionId si existe
  const url = new URL(request.url);
  const secure = url.protocol === "https:";
  const existingSessionId = cookies.get(SESSION_COOKIE)?.value;
  const sessionId = existingSessionId || randomUUID();
  if (!existingSessionId) {
    await session.load(sessionId);
    cookies.set(SESSION_COOKIE, sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure,
    });
  }

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

  await session.set("user", {
    id: u.id,
    email: u.email,
    name: u.name ?? null,
    role: u.role as any,
  });

  return redirect(next);
};