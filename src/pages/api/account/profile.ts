import type { APIRoute } from "astro";
import { db, eq } from "astro:db";
import { NewsletterSubscriber, User, UserProfile } from "astro:db";

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

async function getOrCreateProfile(userId: number) {
  const existing = await db
    .select()
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  if (existing.length) return existing[0];

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

async function getNextSubscriberId() {
  const rows = await db.select({ id: NewsletterSubscriber.id }).from(NewsletterSubscriber);
  return rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
}

async function getOrLinkNewsletterSubscriber(userId: number, email: string) {
  const byUser = await db
    .select()
    .from(NewsletterSubscriber)
    .where(eq(NewsletterSubscriber.userId, userId))
    .limit(1);

  if (byUser.length) return byUser[0];

  const byEmail = await db
    .select()
    .from(NewsletterSubscriber)
    .where(eq(NewsletterSubscriber.email, email))
    .limit(1);

  if (byEmail.length) {
    const row = byEmail[0];
    await db
      .update(NewsletterSubscriber)
      .set({ userId, updatedAt: new Date() })
      .where(eq(NewsletterSubscriber.id, row.id));

    const linked = await db
      .select()
      .from(NewsletterSubscriber)
      .where(eq(NewsletterSubscriber.id, row.id))
      .limit(1);

    return linked[0];
  }

  return null;
}

async function getNewsletterState(userId: number, email: string) {
  const row = await getOrLinkNewsletterSubscriber(userId, email);
  return { active: !!row?.active };
}

async function setNewsletterState(userId: number, email: string, active: boolean) {
  const existing = await getOrLinkNewsletterSubscriber(userId, email);

  if (existing) {
    await db
      .update(NewsletterSubscriber)
      .set({
        email,
        userId,
        active,
        updatedAt: new Date(),
      })
      .where(eq(NewsletterSubscriber.id, existing.id));

    return { active };
  }

  if (!active) return { active: false };

  const nextId = await getNextSubscriberId();

  await db.insert(NewsletterSubscriber).values({
    id: nextId,
    email,
    userId,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return { active: true };
}

export const GET: APIRoute = async ({ locals }) => {
  const auth = requireCustomer(locals);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);

  const userId = auth.user.id;

  const userRows = await db.select().from(User).where(eq(User.id, userId)).limit(1);
  const userRow = userRows[0];
  if (!userRow) return json({ ok: false, error: "USER_NOT_FOUND" }, 404);

  const profile = await getOrCreateProfile(userId);
  const newsletter = await getNewsletterState(userId, userRow.email);

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
    newsletter,
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

  const name = typeof body?.name === "string" ? body.name.trim() : undefined;
  const phone =
    typeof body?.phone === "string" ? body.phone.trim() : body?.phone === null ? null : undefined;
  const birthday =
    typeof body?.birthday === "string"
      ? body.birthday.trim()
      : body?.birthday === null
        ? null
        : undefined;
  const newsletterActive =
    typeof body?.newsletterActive === "boolean" ? body.newsletterActive : undefined;

  if (name !== undefined && name.length > 120) {
    return json({ ok: false, error: "NAME_TOO_LONG" }, 400);
  }
  if (phone !== undefined && phone !== null && phone.length > 40) {
    return json({ ok: false, error: "PHONE_TOO_LONG" }, 400);
  }
  if (birthday !== undefined && birthday !== null) {
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(birthday);
    if (!ok) return json({ ok: false, error: "BIRTHDAY_INVALID" }, 400);
  }

  await getOrCreateProfile(userId);

  if (name !== undefined) {
    await db.update(User).set({ name }).where(eq(User.id, userId));
  }

  const profilePatch: Partial<typeof UserProfile.$inferInsert> = {};
  if (phone !== undefined) profilePatch.phone = phone;
  if (birthday !== undefined) profilePatch.birthday = birthday;

  if (Object.keys(profilePatch).length) {
    await db.update(UserProfile).set(profilePatch).where(eq(UserProfile.userId, userId));
  }

  const userRows = await db.select().from(User).where(eq(User.id, userId)).limit(1);
  const profileRows = await db
    .select()
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  const userRow = userRows[0];
  const profileRow = profileRows[0];

  let newsletter = await getNewsletterState(userId, userRow?.email ?? auth.user.email);

  if (newsletterActive !== undefined && userRow?.email) {
    newsletter = await setNewsletterState(userId, userRow.email, newsletterActive);
  }

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
    newsletter,
  });
};