import { useEffect, useMemo, useState } from "preact/hooks";

type Props = {
    publicId: string;
    awardedPoints: number;
    beforePoints: number;
    afterPoints: number;
    beforeTierName: string | null;
    afterTierName: string | null;
    beforeProgressPercent: number;
    afterProgressPercent: number;
    pointsToNext: number;
};

export default function OrderLoyaltyModal(props: Props) {
    const [open, setOpen] = useState(false);
    const [points, setPoints] = useState(0);
    const [progress, setProgress] = useState(props.beforeProgressPercent);

    const storageKey = useMemo(
        () => `arcadia:loyalty-modal:${props.publicId}`,
        [props.publicId],
    );

    useEffect(() => {
        if (props.awardedPoints <= 0) return;

        try {
            const seen = sessionStorage.getItem(storageKey);
            if (!seen) {
                setOpen(true);
                sessionStorage.setItem(storageKey, "1");
            }
        } catch {
            setOpen(true);
        }
    }, [props.awardedPoints, storageKey]);

    useEffect(() => {
        if (!open) return;

        const previousHtmlOverflow = document.documentElement.style.overflow;
        const previousBodyOverflow = document.body.style.overflow;

        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";

        return () => {
            document.documentElement.style.overflow = previousHtmlOverflow;
            document.body.style.overflow = previousBodyOverflow;
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;

        const duration = 1100;
        const start = performance.now();
        let raf = 0;

        const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);

            setPoints(Math.round(props.awardedPoints * eased));
            setProgress(
                props.beforeProgressPercent +
                (props.afterProgressPercent - props.beforeProgressPercent) * eased,
            );

            if (t < 1) raf = requestAnimationFrame(tick);
        };

        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [
        open,
        props.awardedPoints,
        props.beforeProgressPercent,
        props.afterProgressPercent,
    ]);

    if (!open || props.awardedPoints <= 0) return null;

    const levelUp =
        props.beforeTierName !== props.afterTierName && Boolean(props.afterTierName);

    return (
        <div class="fixed inset-0 z-[80]">
            <button
                type="button"
                aria-label="Cerrar"
                class="absolute inset-0 bg-black/45"
                onClick={() => setOpen(false)}
            />

            <div class="absolute left-1/2 top-1/2 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[30px] border border-amber-200 bg-[#fbfaf2] shadow-2xl">
                <div class="flex items-start justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
                    <div class="min-w-0">
                        <div class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
                            Loyalty
                        </div>
                        <div class="mt-1 text-2xl font-black text-zinc-900 sm:text-3xl">
                            +{points} puntos conseguidos
                        </div>
                        <div class="mt-2 text-sm text-zinc-700 sm:text-base">
                            Nivel actual: <b>{props.afterTierName ?? "Sin nivel"}</b>
                        </div>
                    </div>

                    <div class="flex shrink-0 items-start gap-3">
                        <div class="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm sm:px-5">
                            <div class="text-sm text-zinc-500">Saldo</div>
                            <div class="mt-1 text-2xl font-black text-zinc-900">
                                {props.afterPoints} pts
                            </div>
                        </div>

                        <button
                            type="button"
                            class="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700"
                            onClick={() => setOpen(false)}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>

                <div class="px-5 pb-5 sm:px-6 sm:pb-6">

                    <div class="rounded-[24px] border border-amber-200 bg-white/70 p-4 sm:p-5">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                                    Progreso
                                </div>
                                <div class="mt-1 text-sm text-zinc-700 sm:text-base">
                                    Camino al siguiente nivel
                                </div>
                            </div>

                            <div class="text-right">
                                <div class="text-2xl font-black leading-none text-zinc-900">
                                    {Math.round(progress)}%
                                </div>
                            </div>
                        </div>

                        <div class="mt-4 h-5 overflow-hidden rounded-full bg-zinc-100 shadow-inner">
                            <div
                                class="relative h-full rounded-full bg-zinc-900 transition-[width] duration-500"
                                style={{ width: `${progress}%` }}
                            >
                                <div class="absolute inset-y-0 right-0 w-16 rounded-full bg-white/20 blur-sm" />
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 rounded-[22px] border border-zinc-200 bg-white px-5 py-4 text-sm text-zinc-800 sm:text-base">
                        {levelUp ? (
                            <span>
                                ¡Has subido a <b>{props.afterTierName}</b>!
                            </span>
                        ) : props.pointsToNext > 0 ? (
                            <span>
                                Te faltan <b>{props.pointsToNext} pts</b> para el siguiente nivel.
                            </span>
                        ) : (
                            <span>Ya estás en el nivel más alto.</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}