import { d as db, L as LoyaltyTier, U as UserProfile } from '../../../chunks/_astro_db_ChTDrd2j.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

function parseId(value) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
function safeText(value) {
  return String(value ?? "").trim();
}
function parseNonNegativeInt(value) {
  const raw = safeText(value);
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}
function parseOptionalJson(value) {
  const raw = safeText(value);
  if (!raw) return {
    ok: true,
    value: null
  };
  try {
    return {
      ok: true,
      value: JSON.parse(raw)
    };
  } catch {
    return {
      ok: false,
      value: null
    };
  }
}
function withQuery(path, params) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }
  return `${url.pathname}${url.search}`;
}
async function recomputeAllUserProfileTiers() {
  const tiers = await db.select({
    id: LoyaltyTier.id,
    minPoints: LoyaltyTier.minPoints,
    active: LoyaltyTier.active
  }).from(LoyaltyTier);
  const activeTiers = tiers.filter((tier) => tier.active).sort((a, b) => Number(b.minPoints) - Number(a.minPoints));
  const profiles = await db.select({
    id: UserProfile.id,
    pointsBalance: UserProfile.pointsBalance,
    tierId: UserProfile.tierId
  }).from(UserProfile);
  for (const profile of profiles) {
    const points = Number(profile.pointsBalance ?? 0);
    const bestTier = activeTiers.find((tier) => Number(tier.minPoints) <= points) ?? null;
    const nextTierId = bestTier?.id ?? null;
    const currentTierId = typeof profile.tierId === "number" ? profile.tierId : null;
    if (currentTierId !== nextTierId) {
      await db.update(UserProfile).set({
        tierId: nextTierId ?? void 0,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(UserProfile.id, profile.id));
    }
  }
}
const REDIRECT_PATH = "/admin/loyalty";
const POST = async (context) => {
  const user = context.locals.user;
  if (!user || user.role !== "ADMIN" && user.role !== "STAFF") {
    return context.redirect("/admin/login");
  }
  const form = await context.request.formData();
  const intent = safeText(form.get("intent"));
  if (intent === "create") {
    const name = safeText(form.get("name"));
    const minPoints = parseNonNegativeInt(form.get("minPoints"));
    const sortOrder = parseNonNegativeInt(form.get("sortOrder"));
    const perks = parseOptionalJson(form.get("perks"));
    const active = form.get("active") === "on";
    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "missing-name"
      }));
    }
    if (minPoints === null) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-min-points"
      }));
    }
    if (sortOrder === null) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-sort-order"
      }));
    }
    if (!perks.ok) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-perks-json"
      }));
    }
    const existing = await db.select({
      id: LoyaltyTier.id
    }).from(LoyaltyTier);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;
    await db.insert(LoyaltyTier).values({
      id: nextId,
      name,
      minPoints,
      perks: perks.value ?? void 0,
      active,
      sortOrder
    });
    await recomputeAllUserProfileTiers();
    return context.redirect(withQuery(REDIRECT_PATH, {
      saved: "tier"
    }));
  }
  const tierId = parseId(form.get("tierId"));
  if (!tierId) {
    return context.redirect(withQuery(REDIRECT_PATH, {
      error: "invalid-tier"
    }));
  }
  const [existingTier] = await db.select({
    id: LoyaltyTier.id
  }).from(LoyaltyTier).where(eq(LoyaltyTier.id, tierId)).limit(1);
  if (!existingTier) {
    return context.redirect(withQuery(REDIRECT_PATH, {
      error: "not-found"
    }));
  }
  if (intent === "update") {
    const name = safeText(form.get("name"));
    const minPoints = parseNonNegativeInt(form.get("minPoints"));
    const sortOrder = parseNonNegativeInt(form.get("sortOrder"));
    const perks = parseOptionalJson(form.get("perks"));
    const active = form.get("active") === "on";
    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "missing-name"
      }));
    }
    if (minPoints === null) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-min-points"
      }));
    }
    if (sortOrder === null) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-sort-order"
      }));
    }
    if (!perks.ok) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "invalid-perks-json"
      }));
    }
    await db.update(LoyaltyTier).set({
      name,
      minPoints,
      perks: perks.value ?? void 0,
      active,
      sortOrder
    }).where(eq(LoyaltyTier.id, tierId));
    await recomputeAllUserProfileTiers();
    return context.redirect(withQuery(REDIRECT_PATH, {
      saved: "tier"
    }));
  }
  if (intent === "delete") {
    const linkedProfiles = await db.select({
      id: UserProfile.id
    }).from(UserProfile).where(eq(UserProfile.tierId, tierId));
    if (linkedProfiles.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, {
        error: "tier-in-use"
      }));
    }
    await db.delete(LoyaltyTier).where(eq(LoyaltyTier.id, tierId));
    await recomputeAllUserProfileTiers();
    return context.redirect(withQuery(REDIRECT_PATH, {
      saved: "delete"
    }));
  }
  return context.redirect(withQuery(REDIRECT_PATH, {
    error: "invalid-intent"
  }));
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
