import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}

type Cached = {
  fetchedAt: string;
  placeId?: string;
  reviews: Array<{
    name: string;
    rating: number;
    text: string;
    source: "Google";
    totalReviews?: number;
    avatarUrl?: string | null;
  }>;
};

function empty() {
  return json({ reviews: [] });
}

function isFresh(iso: string, maxAgeMs: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < maxAgeMs;
}

export const GET: APIRoute = async () => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  const cacheRow = await db
    .select({ id: AppSetting.id, value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, "googleReviewsCache"))
    .then((r) => r[0] ?? null);

  const cached = (cacheRow?.value ?? null) as Cached | null;
  const MAX_AGE_MS = 1000 * 60 * 60 * 12;

  if (cached?.reviews?.length && cached.fetchedAt && isFresh(cached.fetchedAt, MAX_AGE_MS)) {
    return json({ reviews: cached.reviews });
  }

  if (!apiKey || !placeId) {
    if (cached?.reviews?.length) return json({ reviews: cached.reviews });
    return empty();
  }

  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,reviews");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString(), { method: "GET" });
    if (!res.ok) {
      if (cached?.reviews?.length) return json({ reviews: cached.reviews });
      return empty();
    }

    const data = (await res.json()) as any;
    const result = data?.result;

    const totalReviews =
      typeof result?.user_ratings_total === "number"
        ? result.user_ratings_total
        : undefined;

    const raw = Array.isArray(result?.reviews) ? result.reviews : [];

    const filtered = raw
      .filter((r: any) => r && r.rating === 5)
      .filter(
        (r: any) =>
          typeof r.profile_photo_url === "string" &&
          r.profile_photo_url.length > 0
      )
      .map((r: any) => ({
        name: String(r.author_name ?? "Cliente"),
        rating: 5,
        source: "Google" as const,
        totalReviews,
        text: String(r.text ?? ""),
        avatarUrl: r.profile_photo_url ?? null,
      }))
      .filter((r: any) => r.text && r.text.trim().length > 0)
      .slice(0, 10);

    const payload: Cached = {
      fetchedAt: new Date().toISOString(),
      placeId,
      reviews: filtered.length ? filtered : cached?.reviews?.length ? cached.reviews : [],
    };

    if (cacheRow?.id) {
      await db
        .update(AppSetting)
        .set({ value: payload, updatedAt: new Date() })
        .where(eq(AppSetting.id, cacheRow.id));
    } else {
      await db.insert(AppSetting).values({
        key: "googleReviewsCache",
        value: payload,
      });
    }

    if (payload.reviews.length) return json({ reviews: payload.reviews });
    return empty();
  } catch {
    if (cached?.reviews?.length) return json({ reviews: cached.reviews });
    return empty();
  }
};