import { useEffect, useMemo, useRef, useState } from "preact/hooks";

export type Review = {
  name: string;
  text: string;
  rating: number;
  source: "Google";
  totalReviews?: number;
  avatarUrl?: string | null;
};

type Props = {
  reviews?: Review[];
  fetchUrl?: string;
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
    <article class="flex h-[350px] w-[20rem] shrink-0 self-center flex-col rounded-[28px] border border-zinc-300 bg-white p-5 shadow-sm sm:w-[23rem] sm:p-6 lg:w-[25rem]">
      <div class="flex items-center gap-3">
        <div class="h-10 w-10 overflow-hidden rounded-full bg-zinc-100 sm:h-11 sm:w-11">
          {r.avatarUrl ? (
            <>
              <img
                src={r.avatarUrl}
                alt={r.name}
                class="h-full w-full object-cover"
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.style.display = "none";
                  const fallback = img.nextElementSibling as HTMLElement | null;
                  if (fallback) fallback.classList.remove("hidden");
                  fallback?.classList.add("grid");
                }}
              />
              <div class="hidden h-full w-full place-items-center text-xs font-semibold text-zinc-600">
                {r.name.slice(0, 2).toUpperCase()}
              </div>
            </>
          ) : (
            <div class="grid h-full w-full place-items-center text-xs font-semibold text-zinc-600">
              {r.name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-zinc-900">{r.name}</div>
          <div class="text-xs text-zinc-600">{r.source}</div>
        </div>
      </div>

      <p class="mt-4 line-clamp-7 text-sm leading-7 text-zinc-800 sm:text-[15px]">
        {r.text}
      </p>

      <div class="mt-5 flex items-center justify-between gap-3">
        <Stars rating={r.rating} />
        <span class="shrink-0 text-xs font-semibold text-zinc-700">
          {r.rating.toFixed(1)}/5
        </span>
      </div>
    </article>
  );
}

export default function ReviewsCarousel({ reviews = [], fetchUrl }: Props) {
  const [remote, setRemote] = useState<Review[] | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState(0);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const halfWidthRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dragRef = useRef({
    startX: 0,
    startOffset: 0,
  });

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

  useEffect(() => {
    const measure = () => {
      if (!trackRef.current) return;
      halfWidthRef.current = trackRef.current.scrollWidth / 2;
    };

    measure();

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;

    if (ro && trackRef.current) {
      ro.observe(trackRef.current);
    }

    window.addEventListener("resize", measure);

    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [marqueeItems.length]);

  useEffect(() => {
    setOffset(0);
    lastTimeRef.current = null;
  }, [safe.length]);

  useEffect(() => {
    const speedPxPerSecond = 25;

    const step = (now: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
      }

      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      if (!(isHovered || isDragging) && halfWidthRef.current > 0) {
        setOffset((prev) => {
          let next = prev - speedPxPerSecond * dt;
          const half = halfWidthRef.current;

          while (next <= -half) next += half;
          while (next > 0) next -= half;

          return next;
        });
      }

      rafRef.current = window.requestAnimationFrame(step);
    };

    rafRef.current = window.requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [isHovered, isDragging]);

  const normalizeOffset = (value: number) => {
    const half = halfWidthRef.current || 1;
    let next = value;

    while (next <= -half) next += half;
    while (next > 0) next -= half;

    return next;
  };

  if (safe.length === 0) return null;

  if (safe.length === 1) {
    return (
      <div class="mx-auto max-w-[25rem]">
        <ReviewCard r={safe[0]} />
      </div>
    );
  }

  return (
    <div class="reviews-marquee relative overflow-hidden select-none py-2">
      <div
        ref={trackRef}
        class={`flex w-max items-center gap-4 sm:gap-6 ${isDragging ? "cursor-grabbing" : isHovered ? "cursor-grab" : ""
          }`}
        style={{
          transform: `translate3d(${offset}px, 0, 0)`,
          willChange: "transform",
          touchAction: "pan-y",
          userSelect: "none",
          WebkitUserSelect: "none",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isDragging) setIsHovered(false);
        }}
        onPointerDown={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.setPointerCapture?.(e.pointerId);

          dragRef.current = {
            startX: e.clientX,
            startOffset: offset,
          };

          setIsDragging(true);
          setIsHovered(true);
        }}
        onPointerMove={(e) => {
          if (!isDragging) return;
          const deltaX = e.clientX - dragRef.current.startX;
          setOffset(normalizeOffset(dragRef.current.startOffset + deltaX));
        }}
        onPointerUp={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.releasePointerCapture?.(e.pointerId);
          setIsDragging(false);
        }}
        onPointerCancel={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.releasePointerCapture?.(e.pointerId);
          setIsDragging(false);
        }}
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
            black 3.5rem,
            black calc(100% - 3.5rem),
            transparent 100%
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent 0,
            black 3.5rem,
            black calc(100% - 3.5rem),
            transparent 100%
          );
        }

        @media (prefers-reduced-motion: reduce) {
          .reviews-marquee > div {
            transform: translate3d(0, 0, 0) !important;
          }
        }
      `}</style>
    </div>
  );
}