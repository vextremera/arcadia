import {
    db,
    UserProfile,
    LoyaltyTier,
    LoyaltyLedger,
    eq,
    and,
} from "astro:db";

export function calcPointsFromSubtotal(subtotalCents: number) {
    const POINTS_PER_EURO = 10;
    return Math.max(0, Math.floor((Number(subtotalCents) * POINTS_PER_EURO) / 100));
}

async function getNextLedgerId() {
    const rows = await db.select({ id: LoyaltyLedger.id }).from(LoyaltyLedger);
    return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

export async function getOrCreateProfile(userId: number) {
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
    const nextId = allProfiles.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;

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

export async function recomputeTier(profileId: number, pointsBalance: number) {
    const tiers = await db
        .select({
            id: LoyaltyTier.id,
            name: LoyaltyTier.name,
            minPoints: LoyaltyTier.minPoints,
            active: LoyaltyTier.active,
            sortOrder: LoyaltyTier.sortOrder,
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

    return best
        ? {
            id: best.id,
            name: best.name,
            minPoints: Number(best.minPoints ?? 0),
        }
        : null;
}

async function insertLedgerEntry(input: {
    userId: number;
    orderId?: number | null;
    pointsDelta: number;
    reason: "ORDER_PAID" | "ORDER_REFUND";
    meta?: unknown;
}) {
    const nextLedgerId = await getNextLedgerId();

    await db.insert(LoyaltyLedger).values({
        id: nextLedgerId,
        userId: input.userId,
        orderId: input.orderId ?? undefined,
        pointsDelta: input.pointsDelta,
        reason: input.reason,
        meta: input.meta ?? undefined,
        createdAt: new Date(),
    });

    return nextLedgerId;
}

export async function awardOrderPointsOnce(params: {
    orderId: number;
    userId: number;
    subtotalCents: number;
    paymentMethod?: "CASH" | "CARD" | null;
    meta?: Record<string, unknown>;
}) {
    const { orderId, userId, subtotalCents, paymentMethod } = params;

    const [exists] = await db
        .select({ id: LoyaltyLedger.id })
        .from(LoyaltyLedger)
        .where(
            and(
                eq(LoyaltyLedger.userId, userId),
                eq(LoyaltyLedger.orderId, orderId),
                eq(LoyaltyLedger.reason, "ORDER_PAID"),
            ),
        )
        .limit(1);

    if (exists) {
        const profile = await getOrCreateProfile(userId);
        return {
            awardedPoints: 0,
            alreadyAwarded: true,
            beforePoints: Number(profile?.pointsBalance ?? 0),
            afterPoints: Number(profile?.pointsBalance ?? 0),
            beforeTierId: profile?.tierId ?? null,
            afterTierId: profile?.tierId ?? null,
            afterTierName: null as string | null,
        };
    }

    const points = calcPointsFromSubtotal(subtotalCents);
    const profile = await getOrCreateProfile(userId);

    if (!profile || points <= 0) {
        return {
            awardedPoints: 0,
            alreadyAwarded: false,
            beforePoints: Number(profile?.pointsBalance ?? 0),
            afterPoints: Number(profile?.pointsBalance ?? 0),
            beforeTierId: profile?.tierId ?? null,
            afterTierId: profile?.tierId ?? null,
            afterTierName: null as string | null,
        };
    }

    const beforePoints = Number(profile.pointsBalance ?? 0);
    const beforeTierId = profile.tierId ?? null;
    const afterPoints = beforePoints + points;

    await insertLedgerEntry({
        userId,
        orderId,
        pointsDelta: points,
        reason: "ORDER_PAID",
        meta: {
            source: "checkout-submit",
            paymentMethod: paymentMethod ?? null,
            awardedAt: new Date().toISOString(),
            ...(params.meta ?? {}),
        },
    });

    await db
        .update(UserProfile)
        .set({
            pointsBalance: afterPoints,
            updatedAt: new Date(),
        })
        .where(eq(UserProfile.id, profile.id));

    const afterTier = await recomputeTier(profile.id, afterPoints);

    return {
        awardedPoints: points,
        alreadyAwarded: false,
        beforePoints,
        afterPoints,
        beforeTierId,
        afterTierId: afterTier?.id ?? null,
        afterTierName: afterTier?.name ?? null,
    };
}

export async function reverseRemainingOrderPointsOnce(params: {
    orderId: number;
    userId: number;
    meta?: Record<string, unknown>;
}) {
    const paidEntries = await db
        .select({
            id: LoyaltyLedger.id,
            pointsDelta: LoyaltyLedger.pointsDelta,
        })
        .from(LoyaltyLedger)
        .where(
            and(
                eq(LoyaltyLedger.userId, params.userId),
                eq(LoyaltyLedger.orderId, params.orderId),
                eq(LoyaltyLedger.reason, "ORDER_PAID"),
            ),
        );

    const refundedEntries = await db
        .select({
            id: LoyaltyLedger.id,
            pointsDelta: LoyaltyLedger.pointsDelta,
        })
        .from(LoyaltyLedger)
        .where(
            and(
                eq(LoyaltyLedger.userId, params.userId),
                eq(LoyaltyLedger.orderId, params.orderId),
                eq(LoyaltyLedger.reason, "ORDER_REFUND"),
            ),
        );

    const awardedPoints = paidEntries.reduce(
        (sum, entry) => sum + Math.max(0, Number(entry.pointsDelta ?? 0)),
        0,
    );

    const alreadyRefundedPoints = refundedEntries.reduce(
        (sum, entry) => sum + Math.max(0, -Number(entry.pointsDelta ?? 0)),
        0,
    );

    const remainingPoints = Math.max(0, awardedPoints - alreadyRefundedPoints);
    if (remainingPoints <= 0) {
        return {
            reversedPoints: 0,
            alreadyBalanced: true,
            beforePoints: 0,
            afterPoints: 0,
            afterTierId: null as number | null,
            afterTierName: null as string | null,
        };
    }

    const profile = await getOrCreateProfile(params.userId);
    if (!profile) {
        return {
            reversedPoints: 0,
            alreadyBalanced: false,
            beforePoints: 0,
            afterPoints: 0,
            afterTierId: null as number | null,
            afterTierName: null as string | null,
        };
    }

    const beforePoints = Math.max(0, Number(profile.pointsBalance ?? 0));
    const appliedPoints = Math.min(remainingPoints, beforePoints);
    if (appliedPoints <= 0) {
        return {
            reversedPoints: 0,
            alreadyBalanced: false,
            beforePoints,
            afterPoints: beforePoints,
            afterTierId: profile.tierId ?? null,
            afterTierName: null as string | null,
        };
    }

    const afterPoints = beforePoints - appliedPoints;

    await insertLedgerEntry({
        userId: params.userId,
        orderId: params.orderId,
        pointsDelta: -appliedPoints,
        reason: "ORDER_REFUND",
        meta: {
            source: "order-cancel",
            reversedAt: new Date().toISOString(),
            awardedPoints,
            alreadyRefundedPoints,
            remainingPoints,
            ...(params.meta ?? {}),
        },
    });

    await db
        .update(UserProfile)
        .set({
            pointsBalance: afterPoints,
            updatedAt: new Date(),
        })
        .where(eq(UserProfile.id, profile.id));

    const afterTier = await recomputeTier(profile.id, afterPoints);

    return {
        reversedPoints: appliedPoints,
        alreadyBalanced: false,
        beforePoints,
        afterPoints,
        afterTierId: afterTier?.id ?? null,
        afterTierName: afterTier?.name ?? null,
    };
}