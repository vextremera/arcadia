import { useEffect, useState } from "preact/hooks";

type Props = {
    awardedPoints: number;
    beforePoints: number;
    afterPoints: number;
    beforeTierName: string | null;
    afterTierName: string | null;
    beforeProgressPercent: number;
    afterProgressPercent: number;
    pointsToNext: number;
};

export default function OrderLoyaltyCelebration(props: Props) {
    const [points, setPoints] = useState(0);
    const [progress, setProgress] = useState(props.beforeProgressPercent);

    useEffect(() => {
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
        props.awardedPoints,
        props.beforeProgressPercent,
        props.afterProgressPercent,
    ]);

    return (
        <section class="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div class="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Loyalty
                    </div>
                    <div class="mt-1 text-lg font-black text-zinc-900">
                        +{points} puntos conseguidos
                    </div>
                    <div class="mt-1 text-sm text-zinc-700">
                        {props.afterTierName ? (
                            <>
                                Nivel actual: <b>{props.afterTierName}</b>
                            </>
                        ) : (
                            <>Tu cuenta ya ha recibido los puntos de este pedido.</>
                        )}
                    </div>
                </div>

                <div class="rounded-xl bg-white px-4 py-3 text-right shadow-sm">
                    <div class="text-xs text-zinc-500">Saldo</div>
                    <div class="text-lg font-black text-zinc-900">{props.afterPoints} pts</div>
                </div>
            </div>

            <div class="mt-4 h-3 overflow-hidden rounded-full bg-white">
                <div
                    class="h-full rounded-full bg-zinc-900 transition-[width] duration-300"
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div class="mt-3 flex flex-col gap-2 text-xs text-zinc-700 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
                <div>
                    Antes: <b>{props.beforePoints} pts</b>
                    {props.beforeTierName ? <> · {props.beforeTierName}</> : null}
                </div>

                <div>
                    Después: <b>{props.afterPoints} pts</b>
                    {props.afterTierName ? <> · {props.afterTierName}</> : null}
                </div>
            </div>

            <div class="mt-2 text-xs text-zinc-700 sm:text-sm">
                {props.beforeTierName !== props.afterTierName && props.afterTierName ? (
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
        </section>
    );
}