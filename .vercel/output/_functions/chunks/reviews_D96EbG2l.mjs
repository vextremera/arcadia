import { d as db, A as AppSetting } from './_astro_db_Bcz5lWRF.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300"
    }
  });
}
function empty() {
  return json({
    reviews: []
  });
}
function isFresh(iso, maxAgeMs) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return false;
  return Date.now() - t < maxAgeMs;
}
const GET = async () => {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  const cacheRow = await db.select({
    id: AppSetting.id,
    value: AppSetting.value
  }).from(AppSetting).where(eq(AppSetting.key, "googleReviewsCache")).then((r) => r[0] ?? null);
  const cached = cacheRow?.value ?? null;
  const MAX_AGE_MS = 1e3 * 60 * 60 * 12;
  if (cached?.reviews?.length && cached.fetchedAt && isFresh(cached.fetchedAt, MAX_AGE_MS)) {
    return json({
      reviews: cached.reviews
    });
  }
  if (!apiKey || !placeId) {
    if (cached?.reviews?.length) return json({
      reviews: cached.reviews
    });
    return empty();
  }
  const url = new URL("https://maps.googleapis.com/maps/api/place/details/json");
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "rating,user_ratings_total,reviews");
  url.searchParams.set("language", "es");
  url.searchParams.set("key", apiKey);
  try {
    const res = await fetch(url.toString(), {
      method: "GET"
    });
    if (!res.ok) {
      if (cached?.reviews?.length) return json({
        reviews: cached.reviews
      });
      return empty();
    }
    const data = await res.json();
    const result = data?.result;
    const totalReviews = typeof result?.user_ratings_total === "number" ? result.user_ratings_total : void 0;
    const raw = Array.isArray(result?.reviews) ? result.reviews : [];
    const filtered = raw.filter((r) => r && r.rating === 5).filter((r) => typeof r.profile_photo_url === "string" && r.profile_photo_url.length > 0).map((r) => ({
      name: String(r.author_name ?? "Cliente"),
      rating: 5,
      source: "Google",
      totalReviews,
      text: String(r.text ?? ""),
      avatarUrl: r.profile_photo_url ?? null
    })).filter((r) => r.text && r.text.trim().length > 0).slice(0, 10);
    const payload = {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      placeId,
      reviews: filtered.length ? filtered : cached?.reviews?.length ? cached.reviews : []
    };
    if (cacheRow?.id) {
      await db.update(AppSetting).set({
        value: payload,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(AppSetting.id, cacheRow.id));
    } else {
      await db.insert(AppSetting).values({
        key: "googleReviewsCache",
        value: payload
      });
    }
    if (payload.reviews.length) return json({
      reviews: payload.reviews
    });
    return empty();
  } catch {
    if (cached?.reviews?.length) return json({
      reviews: cached.reviews
    });
    return empty();
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
