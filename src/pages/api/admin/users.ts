import type { APIRoute } from "astro";
import {
  db,
  User,
  UserProfile,
  LoyaltyTier,
  LoyaltyLedger,
  eq,
} from "astro:db";

type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function optionalText(value: FormDataEntryValue | null) {
  const text = safeText(value);
  return text ? text : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isRole(value: string): value is UserRole {
  return value === "ADMIN" || value === "STAFF" || value === "CUSTOMER";
}

function withQuery(path: string, params: Record<string, string | number>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return `${url.pathname}${url.search}`;
}

function redirectToUser(userId: number, params: Record<string, string>) {
  return withQuery("/admin/usuarios", { user: userId, ...params });
}

async function getOrCreateProfile(userId: number) {
  const [existing] = await db
    .select({
      id: UserProfile.id,
      userId: UserProfile.userId,
      pointsBalance: UserProfile.pointsBalance,
      tierId: UserProfile.tierId,
    })
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  if (existing) return existing;

  const allProfiles = await db.select({ id: UserProfile.id }).from(UserProfile);
  const nextId = allProfiles.reduce((max, row) => Math.max(max, row.id), 0) + 1;

  await db.insert(UserProfile).values({
    id: nextId,
    userId,
    phone: undefined,
    birthday: undefined,
    pointsBalance: 0,
    tierId: undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const [created] = await db
    .select({
      id: UserProfile.id,
      userId: UserProfile.userId,
      pointsBalance: UserProfile.pointsBalance,
      tierId: UserProfile.tierId,
    })
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  return created;
}

async function recomputeTier(profileId: number, pointsBalance: number) {
  const tiers = await db
    .select({
      id: LoyaltyTier.id,
      minPoints: LoyaltyTier.minPoints,
      active: LoyaltyTier.active,
    })
    .from(LoyaltyTier);

  const activeTiers = tiers
    .filter((tier) => tier.active)
    .sort((a, b) => Number(b.minPoints) - Number(a.minPoints));

  const best = activeTiers.find((tier) => Number(tier.minPoints) <= pointsBalance) ?? null;

  await db
    .update(UserProfile)
    .set({
      tierId: best?.id ?? undefined,
      updatedAt: new Date(),
    })
    .where(eq(UserProfile.id, profileId));
}

async function insertLedgerEntry(input: {
  userId: number;
  pointsDelta: number;
  reason: "MANUAL_ADJUST" | "PROMO_BONUS";
  meta?: unknown;
}) {
  const allLedger = await db.select({ id: LoyaltyLedger.id }).from(LoyaltyLedger);
  const nextLedgerId = allLedger.reduce((max, row) => Math.max(max, row.id), 0) + 1;

  await db.insert(LoyaltyLedger).values({
    id: nextLedgerId,
    userId: input.userId,
    orderId: undefined,
    pointsDelta: input.pointsDelta,
    reason: input.reason,
    meta: input.meta ?? undefined,
    createdAt: new Date(),
  });
}

export const POST: APIRoute = async (context) => {
  const authUser = context.locals.user;
  if (!authUser || (authUser.role !== "ADMIN" && authUser.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  const userId = parseId(form.get("userId"));

  if (!userId) {
    return context.redirect(withQuery("/admin/usuarios", { error: "invalid-user" }));
  }

  const [user] = await db
    .select({
      id: User.id,
      email: User.email,
      role: User.role,
      active: User.active,
    })
    .from(User)
    .where(eq(User.id, userId))
    .limit(1);

  if (!user) {
    return context.redirect(withQuery("/admin/usuarios", { error: "not-found" }));
  }

  if (intent === "update-user") {
    const email = safeText(form.get("email")).toLowerCase();
    const role = safeText(form.get("role")).toUpperCase();
    const name = optionalText(form.get("name"));
    const phone = optionalText(form.get("phone"));
    const birthday = optionalText(form.get("birthday"));
    const active = form.get("active") === "on";

    if (!email) {
      return context.redirect(redirectToUser(userId, { error: "missing-email" }));
    }

    if (!isValidEmail(email)) {
      return context.redirect(redirectToUser(userId, { error: "invalid-email" }));
    }

    if (!isRole(role)) {
      return context.redirect(redirectToUser(userId, { error: "invalid-role" }));
    }

    if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
      return context.redirect(redirectToUser(userId, { error: "invalid-birthday" }));
    }

    const [duplicateEmail] = await db
      .select({ id: User.id })
      .from(User)
      .where(eq(User.email, email))
      .limit(1);

    if (duplicateEmail && duplicateEmail.id !== userId) {
      return context.redirect(redirectToUser(userId, { error: "duplicate-email" }));
    }

    await db
      .update(User)
      .set({
        email,
        name: name ?? undefined,
        role,
        active,
        updatedAt: new Date(),
      })
      .where(eq(User.id, userId));

    const profile = await getOrCreateProfile(userId);

    await db
      .update(UserProfile)
      .set({
        phone: phone ?? undefined,
        birthday: birthday ?? undefined,
        updatedAt: new Date(),
      })
      .where(eq(UserProfile.id, profile.id));

    return context.redirect(redirectToUser(userId, { saved: "user" }));
  }

  if (intent === "adjust-points") {
    const pointsDeltaRaw = safeText(form.get("pointsDelta"));
    const pointsDelta = Number(pointsDeltaRaw);
    const note = optionalText(form.get("note"));

    if (!pointsDeltaRaw || !Number.isFinite(pointsDelta)) {
      return context.redirect(redirectToUser(userId, { error: "points-required" }));
    }

    if (Math.trunc(pointsDelta) === 0) {
      return context.redirect(redirectToUser(userId, { error: "points-zero" }));
    }

    const profile = await getOrCreateProfile(userId);
    const currentPoints = Number(profile.pointsBalance ?? 0);
    const requestedDelta = Math.trunc(pointsDelta);
    const nextPoints = Math.max(0, currentPoints + requestedDelta);
    const appliedDelta = nextPoints - currentPoints;

    if (appliedDelta === 0) {
      return context.redirect(redirectToUser(userId, { error: "points-zero" }));
    }

    await insertLedgerEntry({
      userId,
      pointsDelta: appliedDelta,
      reason: "MANUAL_ADJUST",
      meta: {
        note: note ?? null,
        adminUserId: authUser.id,
        adminEmail: authUser.email,
        requestedDelta,
        appliedDelta,
      },
    });

    await db
      .update(UserProfile)
      .set({
        pointsBalance: nextPoints,
        updatedAt: new Date(),
      })
      .where(eq(UserProfile.id, profile.id));

    await recomputeTier(profile.id, nextPoints);

    return context.redirect(redirectToUser(userId, { saved: "points" }));
  }

  if (intent === "promo-bonus") {
    const bonusRaw = safeText(form.get("bonusPoints"));
    const bonusPoints = Number(bonusRaw);
    const note = optionalText(form.get("note"));

    if (!bonusRaw || !Number.isFinite(bonusPoints)) {
      return context.redirect(redirectToUser(userId, { error: "bonus-required" }));
    }

    const requestedBonus = Math.trunc(bonusPoints);
    if (requestedBonus <= 0) {
      return context.redirect(redirectToUser(userId, { error: "bonus-negative" }));
    }

    const profile = await getOrCreateProfile(userId);
    const currentPoints = Number(profile.pointsBalance ?? 0);
    const nextPoints = currentPoints + requestedBonus;

    await insertLedgerEntry({
      userId,
      pointsDelta: requestedBonus,
      reason: "PROMO_BONUS",
      meta: {
        note: note ?? null,
        adminUserId: authUser.id,
        adminEmail: authUser.email,
        requestedBonus,
      },
    });

    await db
      .update(UserProfile)
      .set({
        pointsBalance: nextPoints,
        updatedAt: new Date(),
      })
      .where(eq(UserProfile.id, profile.id));

    await recomputeTier(profile.id, nextPoints);

    return context.redirect(redirectToUser(userId, { saved: "bonus" }));
  }

  return context.redirect(redirectToUser(userId, { error: "invalid-intent" }));
};