import { d as db, U as User, N as NewsletterSubscriber } from './_astro_db_Bcz5lWRF.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
async function getNextSubscriberId() {
  const rows = await db.select({
    id: NewsletterSubscriber.id
  }).from(NewsletterSubscriber);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}
const POST = async ({
  request,
  locals
}) => {
  let body = null;
  try {
    body = await request.json();
  } catch {
    return json({
      ok: false,
      message: "Solicitud inválida."
    }, 400);
  }
  const email = normalizeEmail(body?.email);
  if (!email || !isValidEmail(email)) {
    return json({
      ok: false,
      message: "Introduce un correo válido."
    }, 400);
  }
  const [linkedUser] = await db.select({
    id: User.id,
    email: User.email
  }).from(User).where(eq(User.email, email)).limit(1);
  const [existing] = await db.select({
    id: NewsletterSubscriber.id,
    active: NewsletterSubscriber.active,
    userId: NewsletterSubscriber.userId
  }).from(NewsletterSubscriber).where(eq(NewsletterSubscriber.email, email)).limit(1);
  const sessionUser = locals.user;
  const matchedSessionUserId = sessionUser && sessionUser.email.trim().toLowerCase() === email ? sessionUser.id : null;
  const userId = linkedUser?.id ?? matchedSessionUserId ?? void 0;
  if (existing) {
    await db.update(NewsletterSubscriber).set({
      active: true,
      userId: userId ?? existing.userId ?? void 0,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(NewsletterSubscriber.id, existing.id));
    return json({
      ok: true,
      reactivated: !existing.active,
      linkedToAccount: !!(userId ?? existing.userId),
      message: "¡Perfecto! Te avisaremos con ofertas y novedades."
    });
  }
  const nextId = await getNextSubscriberId();
  await db.insert(NewsletterSubscriber).values({
    id: nextId,
    email,
    userId,
    active: true,
    createdAt: /* @__PURE__ */ new Date(),
    updatedAt: /* @__PURE__ */ new Date()
  });
  return json({
    ok: true,
    reactivated: false,
    linkedToAccount: !!userId,
    message: "¡Perfecto! Te avisaremos con ofertas y novedades."
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
