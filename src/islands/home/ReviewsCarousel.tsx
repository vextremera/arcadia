import { useEffect, useMemo, useState } from "preact/hooks";

export type Review = {
  name: string;
  text: string;
  rating: number; // 0..5
  source: "Google" | "Tripadvisor";
  totalReviews?: number;
  avatarUrl?: string | null;
};

type Props = {
  reviews: Review[];
  intervalMs?: number;
};

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div class="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span class={`${i < r ? "text-yellow-400" : "text-zinc-300"}`} key={i}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ReviewsCarousel({ reviews, intervalMs = 4500 }: Props) {
  const safe = useMemo(() => (Array.isArray(reviews) ? reviews.filter(Boolean) : []), [reviews]);
  const [idx, setIdx] = useState(0);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    if (safe.length <= 1) return;

    const t = window.setInterval(() => {
      setFade(true);
      window.setTimeout(() => {
        setIdx((v) => (v + 1) % safe.length);
        setFade(false);
      }, 220);
    }, intervalMs);

    return () => window.clearInterval(t);
  }, [safe.length, intervalMs]);

  if (safe.length === 0) return null;
  const r = safe[idx];

  return (
    <div class="grid items-stretch gap-6 md:grid-cols-3">
      {/* placeholder left */}
      <div class="hidden md:block rounded-2xl border border-zinc-200 bg-white/50 p-6 opacity-70" />

      {/* main card */}
      <article
        class={`rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-opacity duration-200 ${
          fade ? "opacity-0" : "opacity-100"
        }`}
      >
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 overflow-hidden rounded-full bg-zinc-100">
            {r.avatarUrl ? (
              <img src={r.avatarUrl} alt={r.name} class="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div class="grid h-full w-full place-items-center text-zinc-500">👤</div>
            )}
          </div>

          <div class="min-w-0">
            <div class="truncate text-sm font-semibold">{r.name}</div>
            <div class="text-xs text-zinc-600">
              {r.totalReviews ? `${r.totalReviews} valoraciones · ` : ""}
              {r.source}
            </div>
          </div>
        </div>

        <p class="mt-4 text-sm leading-relaxed text-zinc-800">{r.text}</p>

        <div class="mt-4 flex items-center justify-between">
          <Stars rating={r.rating} />
          <span class="text-xs font-semibold text-zinc-700">{r.rating.toFixed(1)}/5</span>
        </div>
      </article>

      {/* placeholder right */}
      <div class="hidden md:block rounded-2xl border border-zinc-200 bg-white/50 p-6 opacity-70" />
    </div>
  );
}
