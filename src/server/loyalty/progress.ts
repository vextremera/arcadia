import { db, LoyaltyTier } from "astro:db";

export type LoyaltyTierLite = {
    id: number;
    name: string;
    minPoints: number;
    active: boolean;
    sortOrder: number;
};

export async function getActiveLoyaltyTiers() {
    const rows = await db
        .select({
            id: LoyaltyTier.id,
            name: LoyaltyTier.name,
            minPoints: LoyaltyTier.minPoints,
            active: LoyaltyTier.active,
            sortOrder: LoyaltyTier.sortOrder,
        })
        .from(LoyaltyTier);

    return rows
        .filter((tier) => tier.active)
        .sort((a, b) => {
            if (Number(a.sortOrder ?? 0) !== Number(b.sortOrder ?? 0)) {
                return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0);
            }
            return Number(a.minPoints ?? 0) - Number(b.minPoints ?? 0);
        })
        .map((tier) => ({
            id: Number(tier.id),
            name: String(tier.name),
            minPoints: Number(tier.minPoints ?? 0),
            active: Boolean(tier.active),
            sortOrder: Number(tier.sortOrder ?? 0),
        })) satisfies LoyaltyTierLite[];
}

export function buildLoyaltyProgress(pointsBalance: number, tiers: LoyaltyTierLite[]) {
    const safePoints = Math.max(0, Number(pointsBalance ?? 0));
    const ordered = [...tiers].sort((a, b) => a.minPoints - b.minPoints);

    const currentTier =
        [...ordered].reverse().find((tier) => safePoints >= tier.minPoints) ?? null;

    const nextTier = ordered.find((tier) => safePoints < tier.minPoints) ?? null;

    const currentFloor = currentTier?.minPoints ?? 0;
    const nextThreshold = nextTier?.minPoints ?? currentFloor;

    const progressPercent = nextTier
        ? Math.max(
            0,
            Math.min(
                100,
                ((safePoints - currentFloor) / Math.max(1, nextThreshold - currentFloor)) * 100,
            ),
        )
        : 100;

    return {
        pointsBalance: safePoints,
        currentTier,
        nextTier,
        currentFloor,
        nextThreshold,
        pointsToNext: nextTier ? Math.max(0, nextTier.minPoints - safePoints) : 0,
        progressPercent,
        tiers: ordered,
    };
}