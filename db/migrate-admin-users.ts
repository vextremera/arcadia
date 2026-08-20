/**
 * Lleva las cuentas de panel de `User` a `AdminUser`.
 *
 * Hasta ahora, quien entraba al panel lo hacía con un registro de `User` cuyo
 * `role` era ADMIN o STAFF. Al separar las tablas, esas personas se quedarían
 * fuera del panel en el primer despliegue si nadie las trae. Eso incluye la
 * única cuenta con la que se administra el negocio, así que esto tiene que
 * correr **antes** de que alguien intente entrar.
 *
 * El nombre de usuario sale de la parte del correo anterior a la arroba, que es
 * como se llama a cada uno en el bar. La contraseña se conserva tal cual: se
 * copia el hash, no se toca ni se regenera, así que todo el mundo entra con la
 * misma que ya usaba.
 *
 * Corre en cada despliegue (`db:migrate:remote`), así que **tiene que poder
 * repetirse sin efecto**. La marca de que una cuenta ya se trajo es
 * `AdminUser.legacyUserId`, no el nombre de usuario: los choques de nombre se
 * resuelven con sufijo ("marta", "marta2"…), de modo que mirar el nombre hacía
 * que cada pasada creara un juego nuevo de administradores en vez de nada.
 */
import { db, User, AdminUser, eq, or } from "astro:db";

/** `victor.ruiz@arcadia.local` → `victor.ruiz` */
function usernameFromEmail(email: string): string {
  const local = String(email ?? "").split("@")[0] ?? "";

  const cleaned = local
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "");

  return cleaned.slice(0, 32);
}

export default async function migrateAdminUsers() {
  const legacy = await db
    .select({
      id: User.id,
      email: User.email,
      name: User.name,
      passwordHash: User.passwordHash,
      role: User.role,
      active: User.active,
    })
    .from(User)
    .where(or(eq(User.role, "ADMIN"), eq(User.role, "STAFF")));

  if (legacy.length === 0) {
    console.log("[migrate-admin-users] No hay cuentas ADMIN/STAFF que traer.");
    return;
  }

  const existing = await db
    .select({ id: AdminUser.id, username: AdminUser.username, legacyUserId: AdminUser.legacyUserId })
    .from(AdminUser);

  const taken = new Set(existing.map((row) => row.username));
  const yaTraidos = new Set(
    existing.map((row) => row.legacyUserId).filter((id): id is number => typeof id === "number"),
  );

  let nextId = existing.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;

  let creadas = 0;
  let omitidas = 0;

  for (const row of legacy) {
    if (yaTraidos.has(row.id)) {
      omitidas += 1;
      continue;
    }

    let username = usernameFromEmail(row.email);
    if (!username || username.length < 3) username = `admin${row.id}`;

    // Dos correos distintos pueden dar el mismo usuario (marta@a.com y
    // marta@b.com). El primero se queda el nombre limpio; el resto llevan
    // sufijo en vez de pisarse.
    if (taken.has(username)) {
      let suffix = 2;
      while (taken.has(`${username}${suffix}`)) suffix += 1;
      username = `${username}${suffix}`;
    }

    await db.insert(AdminUser).values({
      id: nextId,
      username,
      displayName: row.name ?? undefined,
      // El hash se copia intacto: la contraseña de siempre sigue valiendo.
      passwordHash: row.passwordHash,
      // STAFF era "puede entrar al panel entero"; ahora eso es ADMIN. Bajar a
      // nadie de golpe dejaría al bar sin poder trabajar el día del despliegue,
      // así que el reparto fino se hace después desde /admin/equipo.
      role: "ADMIN",
      active: Boolean(row.active),
      legacyUserId: row.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    taken.add(username);
    yaTraidos.add(row.id);
    nextId += 1;
    creadas += 1;

    console.log(`[migrate-admin-users] ${row.email} → usuario "${username}"`);
  }

  if (creadas === 0) {
    console.log(`[migrate-admin-users] Nada que hacer: las ${omitidas} cuenta(s) ya estaban traídas.`);
    return;
  }

  console.log(`[migrate-admin-users] Listo: ${creadas} cuenta(s) de panel creadas, ${omitidas} ya estaban.`);
  console.log("[migrate-admin-users] Revisa /admin/equipo para bajar a Trabajador a quien corresponda.");
}
