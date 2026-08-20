/**
 * La cuenta propia: cambiar la contraseña desde dentro del panel.
 *
 * Abierta a cualquier rol, porque cada uno gestiona sólo la suya. Se pide la
 * contraseña actual aunque ya haya sesión iniciada: si alguien se deja el panel
 * abierto en la tablet de cocina, quien pase por delante no debe poder
 * quedarse con la cuenta cambiándole la clave.
 */
import type { APIRoute } from "astro";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";
import {
  checkPassword,
  findByUsername,
  isValidPassword,
  setAdminPassword,
} from "@/server/auth/adminUsers";

const PATH = "/admin/cuenta";

function withQuery(params: Record<string, string>) {
  const url = new URL(PATH, "http://local");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin) return context.redirect("/admin/login");

  const form = await context.request.formData();
  const currentPassword = String(form.get("currentPassword") ?? "");
  const newPassword = String(form.get("newPassword") ?? "");
  const repeatPassword = String(form.get("repeatPassword") ?? "");

  const account = await findByUsername(admin.username);
  if (!account) return context.redirect("/admin/login");

  if (!checkPassword(account.passwordHash, currentPassword)) {
    return context.redirect(withQuery({ error: "wrong-current" }));
  }

  if (!isValidPassword(newPassword)) {
    return context.redirect(withQuery({ error: "weak-password" }));
  }

  if (newPassword !== repeatPassword) {
    return context.redirect(withQuery({ error: "mismatch" }));
  }

  if (newPassword === currentPassword) {
    return context.redirect(withQuery({ error: "same-password" }));
  }

  await setAdminPassword(admin.id, newPassword);

  const { ip, userAgent } = getRequestAuditMeta(context.request);
  await writeAuditLog({
    actorAdminId: admin.id,
    action: "admin_user.change_own_password",
    entityType: "AdminUser",
    entityId: String(admin.id),
    // Ni la contraseña ni ninguna pista sobre ella.
    diff: { username: admin.username },
    ip,
    userAgent,
  }).catch(() => undefined);

  return context.redirect(withQuery({ saved: "password" }));
};
