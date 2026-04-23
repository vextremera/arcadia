import type { APIRoute } from "astro";
import { db, AppSetting, eq } from "astro:db";

function json(data: unknown, status = 200, cacheControl = "public, max-age=300") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": cacheControl,
    },
  });
}

type ReviewItem = {
  name: string;
  rating: number;
  text: string;
  source: "Google";
  totalReviews?: number;
  avatarUrl?: string | null;
};

type Cached = {
  fetchedAt: string;
  placeId?: string;
  reviews: ReviewItem[];
};

function isFresh(iso: string, maxAgeMs: number) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < maxAgeMs;
}

function clampRating(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

export const GET: APIRoute = async ({ url }) => {
  const debug = url.searchParams.get("debug") === "1";
  const forceRefresh = url.searchParams.get("refresh") === "1" || debug;

  const apiKey = import.meta.env.GOOGLE_PLACES_API_KEY;
  const placeId = import.meta.env.GOOGLE_PLACE_ID;

  const cacheRow = await db
    .select({ id: AppSetting.id, value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, "googleReviewsCache"))
    .then((r) => r[0] ?? null);

  const cached = (cacheRow?.value ?? null) as Cached | null;
  const MAX_AGE_MS = 1000 * 60 * 60 * 12;

  if (!forceRefresh && cached?.reviews?.length && cached.fetchedAt && isFresh(cached.fetchedAt, MAX_AGE_MS)) {
    return json(
      debug
        ? {
          reviews: cached.reviews,
          debug: {
            source: "cache",
            hasApiKey: Boolean(apiKey),
            hasPlaceId: Boolean(placeId),
            cachedCount: cached.reviews.length,
            fetchedAt: cached.fetchedAt,
            placeId: cached.placeId ?? null,
          },
        }
        : { reviews: cached.reviews },
      200,
      debug ? "no-store" : "public, max-age=300",
    );
  }

  if (!apiKey || !placeId) {
    const fallback = cached?.reviews?.length ? cached.reviews : [];
    return json(
      debug
        ? {
          reviews: fallback,
          debug: {
            source: fallback.length ? "cache-fallback" : "empty",
            hasApiKey: Boolean(apiKey),
            hasPlaceId: Boolean(placeId),
            reason: "missing-env",
            cachedCount: fallback.length,
          },
        }
        : { reviews: fallback },
      200,
      debug ? "no-store" : "public, max-age=300",
    );
  }

  const googleUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  googleUrl.searchParams.set("place_id", placeId);
  googleUrl.searchParams.set("fields", "rating,user_ratings_total,reviews");
  googleUrl.searchParams.set("language", "es");
  googleUrl.searchParams.set("key", apiKey);

  try {
    const res = await fetch(googleUrl.toString(), { method: "GET" });

    if (!res.ok) {
      const fallback = cached?.reviews?.length ? cached.reviews : [];
      return json(
        debug
          ? {
            reviews: fallback,
            debug: {
              source: fallback.length ? "cache-fallback" : "empty",
              hasApiKey: true,
              hasPlaceId: true,
              reason: "google-http-error",
              httpStatus: res.status,
              httpStatusText: res.statusText,
              cachedCount: fallback.length,
            },
          }
          : { reviews: fallback },
        200,
        debug ? "no-store" : "public, max-age=300",
      );
    }

    const data = (await res.json()) as any;
    const result = data?.result;

    const totalReviews =
      typeof result?.user_ratings_total === "number"
        ? result.user_ratings_total
        : undefined;

    const raw = Array.isArray(result?.reviews) ? result.reviews : [];

    const mapped: ReviewItem[] = raw
      .filter(Boolean)
      .map((r: any): ReviewItem => ({
        name: String(r?.author_name ?? "Cliente"),
        rating: clampRating(r?.rating),
        source: "Google",
        totalReviews,
        text: String(r?.text ?? "").trim(),
        avatarUrl:
          typeof r?.profile_photo_url === "string" && r.profile_photo_url.length > 0
            ? r.profile_photo_url
            : null,
      }));

    const filtered = mapped
      .filter((r) => r.text.length > 0)
      .filter((r) => r.rating >= 4)
      .slice(0, 5);

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

    return json(
      debug
        ? {
          reviews: payload.reviews,
          debug: {
            source: filtered.length ? "google" : payload.reviews.length ? "cache-fallback" : "empty",
            hasApiKey: true,
            hasPlaceId: true,
            googleStatus: data?.status ?? null,
            googleError: data?.error_message ?? null,
            rawCount: raw.length,
            filteredCount: filtered.length,
            totalReviews: totalReviews ?? null,
            rawPreview: raw.slice(0, 5).map((r: any) => ({
              author_name: r?.author_name ?? null,
              rating: r?.rating ?? null,
              hasText: typeof r?.text === "string" && r.text.trim().length > 0,
              hasPhoto:
                typeof r?.profile_photo_url === "string" && r.profile_photo_url.length > 0,
            })),
          },
        }
        : { reviews: payload.reviews },
      200,
      debug ? "no-store" : "public, max-age=300",
    );
  } catch (error) {
    const fallback = cached?.reviews?.length ? cached.reviews : [];
    return json(
      debug
        ? {
          reviews: fallback,
          debug: {
            source: fallback.length ? "cache-fallback" : "empty",
            hasApiKey: true,
            hasPlaceId: true,
            reason: "fetch-exception",
            message: error instanceof Error ? error.message : "unknown-error",
            cachedCount: fallback.length,
          },
        }
        : { reviews: fallback },
      200,
      debug ? "no-store" : "public, max-age=300",
    );
  }
};