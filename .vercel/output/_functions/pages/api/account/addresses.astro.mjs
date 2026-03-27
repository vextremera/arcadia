import { d as db, s as Address } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
import { and, eq, desc } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
function requireCustomer(locals) {
  const user = locals.user;
  if (!user) return {
    ok: false,
    status: 401,
    error: "UNAUTHORIZED"
  };
  if (user.role !== "CUSTOMER") {
    return {
      ok: false,
      status: 403,
      error: "FORBIDDEN"
    };
  }
  return {
    ok: true,
    user
  };
}
function toOptionalString(v, maxLen) {
  if (typeof v !== "string") return void 0;
  const t = v.trim();
  if (!t) return void 0;
  if (t.length > maxLen) return void 0;
  return t;
}
function toOptionalNumber(v) {
  if (typeof v !== "number" || Number.isNaN(v)) return void 0;
  return v;
}
async function setDefaultAddress(userId, keepId) {
  await db.update(Address).set({
    isDefault: false
  }).where(eq(Address.userId, userId));
  await db.update(Address).set({
    isDefault: true
  }).where(and(eq(Address.userId, userId), eq(Address.id, keepId)));
}
const GET = async ({
  locals
}) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({
    ok: false,
    error: auth.error
  }, auth.status);
  const userId = auth.user.id;
  const addresses = await db.select().from(Address).where(eq(Address.userId, userId)).orderBy(desc(Address.isDefault), desc(Address.id));
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
      isDefault: !!a.isDefault
    }))
  });
};
const POST = async ({
  request,
  locals
}) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({
    ok: false,
    error: auth.error
  }, auth.status);
  const userId = auth.user.id;
  let body = null;
  try {
    body = await request.json();
  } catch {
    return json({
      ok: false,
      error: "INVALID_JSON"
    }, 400);
  }
  const id = typeof body?.id === "number" ? body.id : void 0;
  const isDefault = typeof body?.isDefault === "boolean" ? body.isDefault : false;
  const hasAnyRequired = typeof body?.contactName === "string" || typeof body?.phone === "string" || typeof body?.line1 === "string" || typeof body?.city === "string" || typeof body?.postalCode === "string";
  if (id !== void 0 && isDefault === true && !hasAnyRequired) {
    const existing = await db.select({
      id: Address.id
    }).from(Address).where(and(eq(Address.id, id), eq(Address.userId, userId))).limit(1);
    if (!existing.length) return json({
      ok: false,
      error: "NOT_FOUND"
    }, 404);
    await setDefaultAddress(userId, id);
    const [a2] = await db.select().from(Address).where(and(eq(Address.id, id), eq(Address.userId, userId))).limit(1);
    return json({
      ok: true,
      address: {
        id: a2.id,
        label: a2.label ?? null,
        contactName: a2.contactName,
        phone: a2.phone,
        line1: a2.line1,
        line2: a2.line2 ?? null,
        city: a2.city,
        postalCode: a2.postalCode,
        notes: a2.notes ?? null,
        lat: a2.lat ?? null,
        lng: a2.lng ?? null,
        isDefault: !!a2.isDefault
      }
    });
  }
  const contactName = typeof body?.contactName === "string" ? body.contactName.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const line1 = typeof body?.line1 === "string" ? body.line1.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const postalCode = typeof body?.postalCode === "string" ? body.postalCode.trim() : "";
  if (!contactName || !phone || !line1 || !city || !postalCode) {
    return json({
      ok: false,
      error: "MISSING_REQUIRED_FIELDS"
    }, 400);
  }
  if (contactName.length > 80 || phone.length > 40 || line1.length > 160 || city.length > 80 || postalCode.length > 20) {
    return json({
      ok: false,
      error: "FIELD_TOO_LONG"
    }, 400);
  }
  const label = toOptionalString(body?.label, 60);
  const line2 = toOptionalString(body?.line2, 160);
  const notes = toOptionalString(body?.notes, 240);
  const lat = toOptionalNumber(body?.lat);
  const lng = toOptionalNumber(body?.lng);
  if (id !== void 0) {
    const existing = await db.select().from(Address).where(and(eq(Address.id, id), eq(Address.userId, userId))).limit(1);
    if (!existing.length) return json({
      ok: false,
      error: "NOT_FOUND"
    }, 404);
    await db.update(Address).set({
      label,
      contactName,
      phone,
      line1,
      line2,
      city,
      postalCode,
      notes,
      lat,
      lng
    }).where(and(eq(Address.id, id), eq(Address.userId, userId)));
    if (isDefault) {
      await setDefaultAddress(userId, id);
    }
    const updated = await db.select().from(Address).where(and(eq(Address.id, id), eq(Address.userId, userId))).limit(1);
    const a2 = updated[0];
    return json({
      ok: true,
      address: {
        id: a2.id,
        label: a2.label ?? null,
        contactName: a2.contactName,
        phone: a2.phone,
        line1: a2.line1,
        line2: a2.line2 ?? null,
        city: a2.city,
        postalCode: a2.postalCode,
        notes: a2.notes ?? null,
        lat: a2.lat ?? null,
        lng: a2.lng ?? null,
        isDefault: !!a2.isDefault
      }
    });
  }
  const inserted = await db.insert(Address).values({
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
    isDefault: false
  }).returning();
  const created = inserted[0];
  if (!created) return json({
    ok: false,
    error: "CREATE_FAILED"
  }, 500);
  if (isDefault) {
    await setDefaultAddress(userId, created.id);
  } else {
    const any = await db.select({
      id: Address.id
    }).from(Address).where(eq(Address.userId, userId)).limit(1);
    if (any.length === 1) {
      await setDefaultAddress(userId, created.id);
    }
  }
  const final = await db.select().from(Address).where(and(eq(Address.id, created.id), eq(Address.userId, userId))).limit(1);
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
      isDefault: !!a.isDefault
    }
  });
};
const DELETE = async ({
  request,
  locals
}) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({
    ok: false,
    error: auth.error
  }, auth.status);
  const userId = auth.user.id;
  let body = null;
  try {
    body = await request.json();
  } catch {
    return json({
      ok: false,
      error: "INVALID_JSON"
    }, 400);
  }
  const id = typeof body?.id === "number" ? body.id : void 0;
  if (id === void 0) return json({
    ok: false,
    error: "MISSING_ID"
  }, 400);
  const existing = await db.select().from(Address).where(and(eq(Address.id, id), eq(Address.userId, userId))).limit(1);
  if (!existing.length) return json({
    ok: false,
    error: "NOT_FOUND"
  }, 404);
  const wasDefault = !!existing[0].isDefault;
  await db.delete(Address).where(and(eq(Address.id, id), eq(Address.userId, userId)));
  if (wasDefault) {
    const remaining = await db.select().from(Address).where(eq(Address.userId, userId)).orderBy(desc(Address.id)).limit(1);
    if (remaining.length) {
      await setDefaultAddress(userId, remaining[0].id);
    }
  }
  return json({
    ok: true
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
