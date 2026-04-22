import { d as db, U as User } from './_astro_db_Bcz5lWRF.mjs';
import { v as verifyPassword } from './password_DsiHb1Tp.mjs';
import { and, eq } from '@astrojs/db/dist/runtime/virtual.js';

const POST = async ({
  request,
  session,
  redirect
}) => {
  if (!session) return new Response("Session not available", {
    status: 500
  });
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if (!email || !password) return redirect("/admin/login?error=invalid", 302);
  const [u] = await db.select({
    id: User.id,
    email: User.email,
    name: User.name,
    role: User.role,
    active: User.active,
    passwordHash: User.passwordHash
  }).from(User).where(and(eq(User.email, email), eq(User.active, true))).limit(1);
  if (!u) return redirect("/admin/login?error=invalid", 302);
  const ok = verifyPassword(password, u.passwordHash);
  const allowed = u.role === "ADMIN" || u.role === "STAFF";
  if (!ok || !allowed) return redirect("/admin/login?error=invalid", 302);
  await session.set("user", {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role
  });
  return redirect("/admin", 302);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
