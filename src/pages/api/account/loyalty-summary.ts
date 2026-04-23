import type { APIRoute } from "astro";
import { db, UserProfile, eq } from "astro:db";
import { calcPointsFromSubtotal } from "@/server/loyalty/engine";
import { buildLoyaltyProgress, getActiveLoyaltyTiers } from "@/server/loyalty/progress";

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

async function getOrCreateProfile(userId: number) {
    const existing = await db
        .select({
            id: UserProfile.id,
            userId: UserProfile.userId,
            pointsBalance: UserProfile.pointsBalance,
            tierId: UserProfile.tierId,
        })
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
        .select({
            id: UserProfile.id,
            userId: UserProfile.userId,
            pointsBalance: UserProfile.pointsBalance,
            tierId: UserProfile.tierId,
        })
        .from(UserProfile)
        .where(eq(UserProfile.userId, userId))
        .limit(1);

    return created[0];
}

export const GET: APIRoute = async ({ locals, url }) => {
    const user = locals.user;
    if (!user || user.role !== "CUSTOMER") {
        return json({ ok: false, error: "UNAUTHORIZED" }, 401);
    }

    const subtotalCents = Math.max(
        0,
        Number(url.searchParams.get("subtotalCents") ?? "0") || 0,
    );

    const profile = await getOrCreateProfile(user.id);
    const tiers = await getActiveLoyaltyTiers();

    const current = buildLoyaltyProgress(Number(profile?.pointsBalance ?? 0), tiers);
    const projectedGain = calcPointsFromSubtotal(subtotalCents);
    const projected = buildLoyaltyProgress(current.pointsBalance + projectedGain, tiers);

    return json({
        ok: true,
        current: {
            pointsBalance: current.pointsBalance,
            currentTier: current.currentTier,
            nextTier: current.nextTier,
            pointsToNext: current.pointsToNext,
            progressPercent: current.progressPercent,
        },
        projected: {
            gainPoints: projectedGain,
            pointsBalance: projected.pointsBalance,
            currentTier: projected.currentTier,
            nextTier: projected.nextTier,
            pointsToNext: projected.pointsToNext,
            progressPercent: projected.progressPercent,
            levelUp:
                current.currentTier?.id !== projected.currentTier?.id &&
                Boolean(projected.currentTier),
        },
    });
};