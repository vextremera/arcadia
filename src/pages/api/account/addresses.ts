import type { APIRoute } from "astro";
import { db, and, desc, eq } from "astro:db";
import { Address } from "astro:db";

/**
 * /api/account/addresses
 * - GET: lista direcciones del usuario (default primero)
 * - POST:
 *    - create: requiere campos mínimos
 *    - update completo: requiere campos mínimos (si mandas line1/city/postalCode/contactName/phone)
 *    - ✅ set default rápido: { id, isDefault: true } sin reenviar campos
 * - DELETE: elimina por body.id
 *
 * Requiere sesión CUSTOMER.
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
  if (user.role !== "CUSTOMER") {
    return { ok: false as const, status: 403, error: "FORBIDDEN" as const };
  }
  return { ok: true as const, user };
}

// Para columnas optional en Astro DB: usamos undefined para “vacío”
function toOptionalString(v: unknown, maxLen: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  if (!t) return undefined;
  if (t.length > maxLen) return undefined;
  return t;
}

function toOptionalNumber(v: unknown): number | undefined {
  if (typeof v !== "number" || Number.isNaN(v)) return undefined;
  return v;
}

async function setDefaultAddress(userId: number, keepId: number) {
  await db.update(Address).set({ isDefault: false }).where(eq(Address.userId, userId));
  await db
    .update(Address)
    .set({ isDefault: true })
    .where(and(eq(Address.userId, userId), eq(Address.id, keepId)));
}

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const userId = auth.user.id;

  const addresses = await db
    .select()
    .from(Address)
    .where(eq(Address.userId, userId))
    .orderBy(desc(Address.isDefault), desc(Address.id));

  return json({
    ok: true,
    addresses: addresses.map((a) => ({
      id: a.id,
      label: a.label ?? null,
      contactName: a.contactName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      postalCode: a.postalCode,
      notes: a.notes ?? null,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      isDefault: !!a.isDefault,
    })),
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

  const id = typeof body?.id === "number" ? body.id : undefined;
  const isDefault = typeof body?.isDefault === "boolean" ? body.isDefault : false;

  // ✅ NUEVO: modo “set default” rápido: { id, isDefault: true } sin reenviar campos
  // Lo detectamos si NO vienen los requeridos (line1/city/postalCode/contactName/phone)
  const hasAnyRequired =
    typeof body?.contactName === "string" ||
    typeof body?.phone === "string" ||
    typeof body?.line1 === "string" ||
    typeof body?.city === "string" ||
    typeof body?.postalCode === "string";

  if (id !== undefined && isDefault === true && !hasAnyRequired) {
    const existing = await db
      .select({ id: Address.id })
      .from(Address)
      .where(and(eq(Address.id, id), eq(Address.userId, userId)))
      .limit(1);

    if (!existing.length) return json({ ok: false, error: "NOT_FOUND" }, 404);

    await setDefaultAddress(userId, id);

    const [a] = await db
      .select()
      .from(Address)
      .where(and(eq(Address.id, id), eq(Address.userId, userId)))
      .limit(1);

    return json({
      ok: true,
      address: {
        id: a.id,
        label: a.label ?? null,
        contactName: a.contactName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? null,
        city: a.city,
        postalCode: a.postalCode,
        notes: a.notes ?? null,
        lat: a.lat ?? null,
        lng: a.lng ?? null,
        isDefault: !!a.isDefault,
      },
    });
  }

  // Requeridos (create/update completo)
  const contactName = typeof body?.contactName === "string" ? body.contactName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const line1 = typeof body?.line1 === "string" ? body.line1.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const postalCode = typeof body?.postalCode === "string" ? body.postalCode.trim() : "";

  if (!contactName || !phone || !line1 || !city || !postalCode) {
    return json({ ok: false, error: "MISSING_REQUIRED_FIELDS" }, 400);
  }
  if (
    contactName.length > 80 ||
    phone.length > 40 ||
    line1.length > 160 ||
    city.length > 80 ||
    postalCode.length > 20
  ) {
    return json({ ok: false, error: "FIELD_TOO_LONG" }, 400);
  }

  // Optional (undefined = omit)
  const label = toOptionalString(body?.label, 60);
  const line2 = toOptionalString(body?.line2, 160);
  const notes = toOptionalString(body?.notes, 240);
  const lat = toOptionalNumber(body?.lat);
  const lng = toOptionalNumber(body?.lng);

  // Update completo
  if (id !== undefined) {
    const existing = await db
      .select()
      .from(Address)
      .where(and(eq(Address.id, id), eq(Address.userId, userId)))
      .limit(1);

    if (!existing.length) return json({ ok: false, error: "NOT_FOUND" }, 404);

    await db
      .update(Address)
      .set({
        label,
        contactName,
        phone,
        line1,
        line2,
        city,
        postalCode,
        notes,
        lat,
        lng,
      })
      .where(and(eq(Address.id, id), eq(Address.userId, userId)));

    if (isDefault) {
      await setDefaultAddress(userId, id);
    }

    const updated = await db
      .select()
      .from(Address)
      .where(and(eq(Address.id, id), eq(Address.userId, userId)))
      .limit(1);

    const a = updated[0];
    return json({
      ok: true,
      address: {
        id: a.id,
        label: a.label ?? null,
        contactName: a.contactName,
        phone: a.phone,
        line1: a.line1,
        line2: a.line2 ?? null,
        city: a.city,
        postalCode: a.postalCode,
        notes: a.notes ?? null,
        lat: a.lat ?? null,
        lng: a.lng ?? null,
        isDefault: !!a.isDefault,
      },
    });
  }

  // Create
  const inserted = await db
    .insert(Address)
    .values({
      userId,
      label,
      contactName,
      phone,
      line1,
      line2,
      city,
      postalCode,
      notes,
      lat,
      lng,
      isDefault: false,
    })
    .returning();

  const created = inserted[0];
  if (!created) return json({ ok: false, error: "CREATE_FAILED" }, 500);

  if (isDefault) {
    await setDefaultAddress(userId, created.id);
  } else {
    const any = await db.select({ id: Address.id }).from(Address).where(eq(Address.userId, userId)).limit(1);
    if (any.length === 1) {
      await setDefaultAddress(userId, created.id);
    }
  }

  const final = await db
    .select()
    .from(Address)
    .where(and(eq(Address.id, created.id), eq(Address.userId, userId)))
    .limit(1);

  const a = final[0];
  return json({
    ok: true,
    address: {
      id: a.id,
      label: a.label ?? null,
      contactName: a.contactName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? null,
      city: a.city,
      postalCode: a.postalCode,
      notes: a.notes ?? null,
      lat: a.lat ?? null,
      lng: a.lng ?? null,
      isDefault: !!a.isDefault,
    },
  });
};

export const DELETE: APIRoute = async ({ request, locals }) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const userId = auth.user.id;

  let body: any = null;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, 400);
  }

  const id = typeof body?.id === "number" ? body.id : undefined;
  if (id === undefined) return json({ ok: false, error: "MISSING_ID" }, 400);

  const existing = await db
    .select()
    .from(Address)
    .where(and(eq(Address.id, id), eq(Address.userId, userId)))
    .limit(1);

  if (!existing.length) return json({ ok: false, error: "NOT_FOUND" }, 404);

  const wasDefault = !!existing[0].isDefault;

  await db.delete(Address).where(and(eq(Address.id, id), eq(Address.userId, userId)));

  if (wasDefault) {
    const remaining = await db
      .select()
      .from(Address)
      .where(eq(Address.userId, userId))
      .orderBy(desc(Address.id))
      .limit(1);

    if (remaining.length) {
      await setDefaultAddress(userId, remaining[0].id);
    }
  }

  return json({ ok: true });
};