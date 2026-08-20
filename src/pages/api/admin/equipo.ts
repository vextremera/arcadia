/**
 * Cuentas de acceso al panel.
 *
 * Sólo para `ADMIN`: el middleware ya cierra la ruta a un trabajador, y aquí se
 * vuelve a comprobar porque una defensa que vive en un solo sitio se pierde en
 * cuanto alguien reorganiza los ficheros.
 */
import type { APIRoute } from "astro";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";
import { isAdminRole } from "@/lib/admin/roles";
import {
  countActiveAdmins,
  createAdminAccount,
  deleteAdminAccount,
  findByUsername,
  getAdminAccount,
  isValidPassword,
  isValidUsername,
  normalizeUsername,
  setAdminPassword,
  updateAdminAccount,
} from "@/server/auth/adminUsers";

const LIST_PATH = "/admin/equipo";

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return `${url.pathname}${url.search}`;
}

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export const POST: APIRoute = async (context) => {
  const admin = context.locals.admin;
  if (!admin || admin.role !== "ADMIN") {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  const { ip, userAgent } = getRequestAuditMeta(context.request);

  const audit = (action: string, entityId: string, diff?: unknown) =>
    writeAuditLog({
      actorAdminId: admin.id,
      action,
      entityType: "AdminUser",
      entityId,
      diff,
      ip,
      userAgent,
    }).catch(() => undefined);

  if (intent === "create") {
    const username = normalizeUsername(form.get("username"));
    const displayName = safeText(form.get("displayName"));
    const password = String(form.get("password") ?? "");
    const role = safeText(form.get("role")).toUpperCase();

    if (!isValidUsername(username)) {
      return context.redirect(withQuery(LIST_PATH, { error: "invalid-username" }));
    }
    if (!isValidPassword(password)) {
      return context.redirect(withQuery(LIST_PATH, { error: "weak-password" }));
    }
    if (!isAdminRole(role)) {
      return context.redirect(withQuery(LIST_PATH, { error: "invalid-role" }));
    }
    if (await findByUsername(username)) {
      return context.redirect(withQuery(LIST_PATH, { error: "duplicate-username" }));
    }

    const id = await createAdminAccount({ username, displayName, password, role });
    await audit("admin_user.create", String(id), { username, role });

    return context.redirect(withQuery(LIST_PATH, { saved: "created" }));
  }

  const targetId = parseId(form.get("adminId"));
  if (!targetId) {
    return context.redirect(withQuery(LIST_PATH, { error: "not-found" }));
  }

  const target = await getAdminAccount(targetId);
  if (!target) {
    return context.redirect(withQuery(LIST_PATH, { error: "not-found" }));
  }

  const detailPath = `${LIST_PATH}/${targetId}`;

  if (intent === "update") {
    const username = normalizeUsername(form.get("username"));
    const displayName = safeText(form.get("displayName"));
    const role = safeText(form.get("role")).toUpperCase();
    const active = form.get("active") === "on";

    if (!isValidUsername(username)) {
      return context.redirect(withQuery(detailPath, { error: "invalid-username" }));
    }
    if (!isAdminRole(role)) {
      return context.redirect(withQuery(detailPath, { error: "invalid-role" }));
    }

    const duplicate = await findByUsername(username);
    if (duplicate && duplicate.id !== targetId) {
      return context.redirect(withQuery(detailPath, { error: "duplicate-username" }));
    }

    /**
     * Nadie se quita a sí mismo el mando ni el acceso.
     *
     * Si el único administrador se degrada o se desactiva, el panel se queda
     * sin quien reparta permisos y no hay forma de recuperarlo desde la web:
     * habría que entrar a la base de datos a mano.
     */
    if (targetId === admin.id && (role !== "ADMIN" || !active)) {
      return context.redirect(withQuery(detailPath, { error: "self-lockout" }));
    }

    const losesAdmin = target.role === "ADMIN" && target.active && (role !== "ADMIN" || !active);
    if (losesAdmin && (await countActiveAdmins()) <= 1) {
      return context.redirect(withQuery(detailPath, { error: "last-admin" }));
    }

    await updateAdminAccount(targetId, { username, displayName, role, active });
    await audit("admin_user.update", String(targetId), {
      antes: { username: target.username, role: target.role, active: target.active },
      despues: { username, role, active },
    });

    return context.redirect(withQuery(detailPath, { saved: "updated" }));
  }

  if (intent === "reset-password") {
    const password = String(form.get("password") ?? "");

    if (!isValidPassword(password)) {
      return context.redirect(withQuery(detailPath, { error: "weak-password" }));
    }

    await setAdminPassword(targetId, password);
    // Nunca se registra la contraseña, ni siquiera su longitud.
    await audit("admin_user.reset_password", String(targetId), { username: target.username });

    return context.redirect(withQuery(detailPath, { saved: "password" }));
  }

  if (intent === "delete") {
    if (targetId === admin.id) {
      return context.redirect(withQuery(detailPath, { error: "self-delete" }));
    }

    if (target.role === "ADMIN" && target.active && (await countActiveAdmins()) <= 1) {
      return context.redirect(withQuery(detailPath, { error: "last-admin" }));
    }

    await deleteAdminAccount(targetId);
    await audit("admin_user.delete", String(targetId), { username: target.username });

    return context.redirect(withQuery(LIST_PATH, { saved: "deleted" }));
  }

  return context.redirect(withQuery(LIST_PATH, { error: "invalid-intent" }));
};
