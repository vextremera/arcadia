import { useEffect, useMemo, useState } from "preact/hooks";

export type Review = {
  name: string;
  text: string;
  rating: number;
  source: "Google" | "Tripadvisor";
  totalReviews?: number;
  avatarUrl?: string | null;
};

type Props = {
  reviews?: Review[];
  fetchUrl?: string;
  intervalMs?: number;
};

function Stars({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <div class="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <span class={i < r ? "text-yellow-400" : "text-zinc-300"} key={i}>
          ★
        </span>
      ))}
    </div>
  );
}

async function safeFetchReviews(url: string): Promise<Review[] | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    const list = Array.isArray(data?.reviews) ? data.reviews : [];
    return list;
  } catch {
    return null;
  }
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <article class="flex h-full w-[20rem] shrink-0 flex-col rounded-[28px] border border-zinc-300 bg-white p-5 shadow-sm sm:w-[23rem] sm:p-6 lg:w-[25rem]">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 overflow-hidden rounded-full bg-zinc-100 sm:h-11 sm:w-11">
          {r.avatarUrl ? (
            <img
              src={r.avatarUrl}
              alt={r.name}
              class="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div class="grid h-full w-full place-items-center text-zinc-500">👤</div>
          )}
        </div>

        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-zinc-900">{r.name}</div>
          <div class="text-xs text-zinc-600">
            {r.totalReviews ? `${r.totalReviews} valoraciones · ` : ""}
            {r.source}
          </div>
        </div>
      </div>

      <p class="mt-4 line-clamp-6 text-sm leading-7 text-zinc-800 sm:text-[15px]">
        {r.text}
      </p>

      <div class="mt-auto pt-5">
        <div class="flex items-center justify-between gap-3">
          <Stars rating={r.rating} />
          <span class="shrink-0 text-xs font-semibold text-zinc-700">
            {r.rating.toFixed(1)}/5
          </span>
        </div>
      </div>
    </article>
  );
}

export default function ReviewsCarousel({
  reviews = [],
  fetchUrl,
  intervalMs = 4500,
}: Props) {
  const [remote, setRemote] = useState<Review[] | null>(null);

  useEffect(() => {
    if (!fetchUrl) return;
    let alive = true;

    safeFetchReviews(fetchUrl).then((r) => {
      if (!alive) return;
      if (r && r.length) setRemote(r);
    });

    return () => {
      alive = false;
    };
  }, [fetchUrl]);

  const safe = useMemo(() => {
    const base = remote ?? reviews;
    return Array.isArray(base) ? base.filter(Boolean) : [];
  }, [remote, reviews]);

  const marqueeItems = useMemo(() => {
    if (safe.length === 0) return [];
    return [...safe, ...safe];
  }, [safe]);

  const durationSeconds = useMemo(() => {
    const base = safe.length || 1;
    return Math.max(18, base * 6);
  }, [safe.length]);

  if (safe.length === 0) return null;

  if (safe.length === 1) {
    return (
      <div class="mx-auto max-w-[25rem]">
        <ReviewCard r={safe[0]} />
      </div>
    );
  }

  return (
    <div class="reviews-marquee relative overflow-hidden">
      <div
        class="reviews-marquee__track flex w-max gap-4 sm:gap-6"
        style={{ animationDuration: `${durationSeconds}s` }}
      >
        {marqueeItems.map((r, i) => (
          <ReviewCard r={r} key={`${r.name}-${i}`} />
        ))}
      </div>

      <style>{`
        .reviews-marquee {
          mask-image: linear-gradient(
            to right,
            transparent 0,
            black 4rem,
            black calc(100% - 4rem),
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            black 4rem,
            black calc(100% - 4rem),
            transparent 100%
          );
        }

        .reviews-marquee__track {
          animation-name: reviews-marquee-scroll;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          animation-play-state: running;
          will-change: transform;
        }

        .reviews-marquee:hover .reviews-marquee__track {
          animation-play-state: paused;
        }

        @keyframes reviews-marquee-scroll {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(calc(-50% - 0.75rem));
          }
        }

        @media (min-width: 640px) {
          @keyframes reviews-marquee-scroll {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(calc(-50% - 1rem));
            }
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .reviews-marquee__track {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}