import type { APIRoute } from "astro";
import { db, eq } from "astro:db";
import { User, UserProfile } from "astro:db";

/**
 * /api/account/profile
 * - GET: devuelve { user, profile } (crea UserProfile si no existe)
 * - POST: actualiza User.name y/o UserProfile (phone, birthday)
 *
 * Requiere sesión CUSTOMER (o al menos usuario logueado).
 */
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function requireCustomer(locals: App.Locals) {
  const user = locals.user;
  if (!user) return { ok: false as const, status: 401, error: "UNAUTHORIZED" as const };
  // Permitimos CUSTOMER (y por si reutilizas cuentas STAFF para pruebas, puedes endurecerlo luego)
  if (user.role !== "CUSTOMER") {
    return { ok: false as const, status: 403, error: "FORBIDDEN" as const };
  }
  return { ok: true as const, user };
}

async function getOrCreateProfile(userId: number) {
  const existing = await db
    .select()
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  if (existing.length) return existing[0];

  // Crear perfil vacío (lazy create)
  await db.insert(UserProfile).values({
    userId,
    phone: null,
    birthday: null,
    pointsBalance: 0,
    tierId: null,
  });

  const created = await db
    .select()
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  return created[0];
}

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const userId = auth.user.id;

  const userRows = await db.select().from(User).where(eq(User.id, userId)).limit(1);
  const userRow = userRows[0];
  if (!userRow) return json({ ok: false, error: "USER_NOT_FOUND" }, 404);

  const profile = await getOrCreateProfile(userId);

  return json({
    ok: true,
    user: {
      id: userRow.id,
      email: userRow.email,
      name: userRow.name ?? null,
      role: userRow.role,
    },
    profile: {
      phone: profile.phone ?? null,
      birthday: profile.birthday ?? null,
      pointsBalance: profile.pointsBalance ?? 0,
      tierId: profile.tierId ?? null,
    },
  });
};

export const POST: APIRoute = async ({ request, locals }) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const userId = auth.user.id;

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400);
  }

  const name =
    typeof body?.name === "string" ? body.name.trim() : undefined;

  const phone =
    typeof body?.phone === "string" ? body.phone.trim() : body?.phone === null ? null : undefined;

  const birthday =
    typeof body?.birthday === "string" ? body.birthday.trim() : body?.birthday === null ? null : undefined;

  // Validaciones ligeras (sin bloquear demasiado)
  if (name !== undefined && name.length > 120) {
    return json({ ok: false, error: "NAME_TOO_LONG" }, 400);
  }
  if (phone !== undefined && phone !== null && phone.length > 40) {
    return json({ ok: false, error: "PHONE_TOO_LONG" }, 400);
  }
  if (birthday !== undefined && birthday !== null) {
    // formato simple YYYY-MM-DD
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(birthday);
    if (!ok) return json({ ok: false, error: "BIRTHDAY_INVALID" }, 400);
  }

  // Aseguramos perfil existente
  await getOrCreateProfile(userId);

  // Actualizar User.name si viene
  if (name !== undefined) {
    await db.update(User).set({ name }).where(eq(User.id, userId));
  }

  // Actualizar UserProfile si viene algo
  const profilePatch: Partial<typeof UserProfile.$inferInsert> = {};
  if (phone !== undefined) profilePatch.phone = phone;
  if (birthday !== undefined) profilePatch.birthday = birthday;

  if (Object.keys(profilePatch).length) {
    await db.update(UserProfile).set(profilePatch).where(eq(UserProfile.userId, userId));
  }

  // Devolver estado actual
  const userRows = await db.select().from(User).where(eq(User.id, userId)).limit(1);
  const profileRows = await db
    .select()
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  const userRow = userRows[0];
  const profileRow = profileRows[0];

  return json({
    ok: true,
    user: {
      id: userRow?.id,
      email: userRow?.email,
      name: userRow?.name ?? null,
      role: userRow?.role,
    },
    profile: {
      phone: profileRow?.phone ?? null,
      birthday: profileRow?.birthday ?? null,
      pointsBalance: profileRow?.pointsBalance ?? 0,
      tierId: profileRow?.tierId ?? null,
    },
  });
};