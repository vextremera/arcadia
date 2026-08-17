import type { APIRoute } from "astro";
import { db, NewsletterSubscriber, User, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function normalizeEmail(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function getNextSubscriberId() {
  const rows = await db.select({ id: NewsletterSubscriber.id }).from(NewsletterSubscriber);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

export const POST: APIRoute = async ({ request, locals }) => {
  let body: { email?: string; acceptedTerms?: boolean } | null = null;

  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: "Solicitud inválida." }, 400);
  }

  const email = normalizeEmail(body?.email);
  if (!email || !isValidEmail(email)) {
    return json({ ok: false, message: "Introduce un correo válido." }, 400);
  }

  // El consentimiento se comprueba también aquí: comprobarlo sólo en el
  // navegador no sirve como prueba de nada, y este endpoint es público.
  if (body?.acceptedTerms !== true) {
    return json(
      { ok: false, message: "Debes aceptar los términos y la política de privacidad." },
      400,
    );
  }

  const [linkedUser] = await db
    .select({ id: User.id, email: User.email })
    .from(User)
    .where(eq(User.email, email))
    .limit(1);

  const [existing] = await db
    .select({
      id: NewsletterSubscriber.id,
      active: NewsletterSubscriber.active,
      userId: NewsletterSubscriber.userId,
    })
    .from(NewsletterSubscriber)
    .where(eq(NewsletterSubscriber.email, email))
    .limit(1);

  const sessionUser = locals.user;
  const matchedSessionUserId =
    sessionUser && sessionUser.email.trim().toLowerCase() === email ? sessionUser.id : null;
  const userId = linkedUser?.id ?? matchedSessionUserId ?? undefined;

  if (existing) {
    await db
      .update(NewsletterSubscriber)
      .set({
        active: true,
        userId: userId ?? existing.userId ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(NewsletterSubscriber.id, existing.id));

    return json({
      ok: true,
      reactivated: !existing.active,
      linkedToAccount: !!(userId ?? existing.userId),
      message: "¡Perfecto! Te avisaremos con ofertas y novedades.",
    });
  }

  const nextId = await getNextSubscriberId();

  await db.insert(NewsletterSubscriber).values({
    id: nextId,
    email,
    userId,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return json({
    ok: true,
    reactivated: false,
    linkedToAccount: !!userId,
    message: "¡Perfecto! Te avisaremos con ofertas y novedades.",
  });
};