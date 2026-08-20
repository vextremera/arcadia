/**
 * Cuentas de acceso al panel.
 *
 * Viven en `AdminUser`, separadas de `User`: quien pide a domicilio y quien
 * trabaja aquí no tienen por qué ser el mismo registro, y así ningún camino
 * desde el formulario público de registro puede acabar abriendo el panel.
 */
import { db, AdminUser, eq, and } from "astro:db";
import { hashPassword, verifyPassword } from "@/server/auth/password";
import { isAdminRole, type AdminRole } from "@/lib/admin/roles";

export type AdminAccount = {
  id: number;
  username: string;
  displayName: string | null;
  role: AdminRole;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date | null;
};

/** Lo que se guarda en la sesión: lo justo para pintar el panel y decidir. */
export type AdminSessionUser = {
  id: number;
  username: string;
  displayName: string | null;
  role: AdminRole;
};

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 32;
export const PASSWORD_MIN = 8;

/**
 * Normaliza un nombre de usuario.
 *
 * Se guarda en minúsculas para que "Marta" y "marta" no acaben siendo dos
 * cuentas distintas, que con gente compartiendo turnos es cuestión de días.
 */
export function normalizeUsername(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  if (username.length < USERNAME_MIN || username.length > USERNAME_MAX) return false;
  // Letras, números, punto, guion y guion bajo. Nada de espacios ni acentos:
  // esto se dicta en voz alta en una cocina.
  return /^[a-z0-9._-]+$/.test(username);
}

/**
 * ¿La contraseña vale?
 *
 * Se pide longitud en vez de la mezcla de símbolos que exige el registro
 * público. Son cuentas que se teclean a diario en una tablet de cocina y una
 * regla retorcida acaba en un papel pegado al monitor, que es peor.
 */
export function isValidPassword(password: string): boolean {
  return String(password ?? "").length >= PASSWORD_MIN;
}

function toAccount(row: {
  id: number;
  username: string;
  displayName: string | null;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
  createdAt: Date | null;
}): AdminAccount {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName ?? null,
    role: isAdminRole(row.role) ? row.role : "WORKER",
    active: Boolean(row.active),
    lastLoginAt: row.lastLoginAt ?? null,
    createdAt: row.createdAt ?? null,
  };
}

const ACCOUNT_COLUMNS = {
  id: AdminUser.id,
  username: AdminUser.username,
  displayName: AdminUser.displayName,
  role: AdminUser.role,
  active: AdminUser.active,
  lastLoginAt: AdminUser.lastLoginAt,
  createdAt: AdminUser.createdAt,
};

export async function listAdminAccounts(): Promise<AdminAccount[]> {
  const rows = await db.select(ACCOUNT_COLUMNS).from(AdminUser).orderBy(AdminUser.username);
  return rows.map(toAccount);
}

export async function getAdminAccount(id: number): Promise<AdminAccount | null> {
  const [row] = await db.select(ACCOUNT_COLUMNS).from(AdminUser).where(eq(AdminUser.id, id)).limit(1);
  return row ? toAccount(row) : null;
}

export async function findByUsername(username: string) {
  const [row] = await db
    .select({ ...ACCOUNT_COLUMNS, passwordHash: AdminUser.passwordHash })
    .from(AdminUser)
    .where(eq(AdminUser.username, normalizeUsername(username)))
    .limit(1);

  return row ?? null;
}

/** Cuántos administradores totales quedan en pie. */
export async function countActiveAdmins(): Promise<number> {
  const rows = await db
    .select({ id: AdminUser.id })
    .from(AdminUser)
    .where(and(eq(AdminUser.role, "ADMIN"), eq(AdminUser.active, true)));

  return rows.length;
}

async function nextId(): Promise<number> {
  const rows = await db.select({ id: AdminUser.id }).from(AdminUser);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

export async function createAdminAccount(input: {
  username: string;
  displayName?: string | null;
  password: string;
  role: AdminRole;
  active?: boolean;
}): Promise<number> {
  const id = await nextId();

  await db.insert(AdminUser).values({
    id,
    username: normalizeUsername(input.username),
    displayName: input.displayName?.trim() || undefined,
    passwordHash: hashPassword(input.password),
    role: input.role,
    active: input.active ?? true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return id;
}

export async function updateAdminAccount(
  id: number,
  changes: { username?: string; displayName?: string | null; role?: AdminRole; active?: boolean },
): Promise<void> {
  await db
    .update(AdminUser)
    .set({
      ...(changes.username !== undefined ? { username: normalizeUsername(changes.username) } : {}),
      ...(changes.displayName !== undefined
        ? { displayName: changes.displayName?.trim() || undefined }
        : {}),
      ...(changes.role !== undefined ? { role: changes.role } : {}),
      ...(changes.active !== undefined ? { active: changes.active } : {}),
      updatedAt: new Date(),
    })
    .where(eq(AdminUser.id, id));
}

export async function setAdminPassword(id: number, password: string): Promise<void> {
  await db
    .update(AdminUser)
    .set({ passwordHash: hashPassword(password), updatedAt: new Date() })
    .where(eq(AdminUser.id, id));
}

export async function deleteAdminAccount(id: number): Promise<void> {
  await db.delete(AdminUser).where(eq(AdminUser.id, id));
}

export async function markLogin(id: number): Promise<void> {
  await db.update(AdminUser).set({ lastLoginAt: new Date() }).where(eq(AdminUser.id, id));
}

/** ¿Coincide la contraseña de esta cuenta? */
export function checkPassword(passwordHash: string, password: string): boolean {
  return verifyPassword(password, passwordHash);
}

export function toSessionUser(account: AdminAccount): AdminSessionUser {
  return {
    id: account.id,
    username: account.username,
    displayName: account.displayName,
    role: account.role,
  };
}

/** Nombre a mostrar en el panel. */
export function adminDisplayName(admin: { displayName?: string | null; username: string }): string {
  return admin.displayName?.trim() || admin.username;
}
