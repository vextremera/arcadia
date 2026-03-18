import { useEffect, useState } from "preact/hooks";
import FavoriteButton from "./FavoriteButton";

declare global {
    interface Window {
        __arcadiaFavIds?: Set<number>;
        __arcadiaFavPromise?: Promise<Set<number>>;
    }
}

async function loadFavIds(): Promise<Set<number>> {
    if (typeof window === "undefined") return new Set();

    if (window.__arcadiaFavIds) return window.__arcadiaFavIds;

    if (!window.__arcadiaFavPromise) {
        window.__arcadiaFavPromise = fetch("/api/favorites/ids")
            .then((r) => {
                if (!r.ok) return { ids: [] };
                return r.json().catch(() => ({ ids: [] }));
            })
            .then(
                (data) =>
                    new Set<number>(
                        (data?.ids ?? []).map((n: any) => Number(n)).filter(Number.isFinite),
                    ),
            );
    }

    const set = await window.__arcadiaFavPromise;
    window.__arcadiaFavIds = set;
    return set;
}

type Props = {
    productId: number;
    variant?: "icon" | "button";
    class?: string;
};

export default function FavoriteHoverButton({ productId, variant = "icon", class: className }: Props) {
    const [isFav, setIsFav] = useState<boolean>(() => {
        return !!window.__arcadiaFavIds?.has?.(productId);
    });

    useEffect(() => {
        let alive = true;

        (async () => {
            const ids = await loadFavIds();
            if (!alive) return;
            setIsFav(ids.has(productId));
        })();

        const onUpdated = (e: any) => {
            const d = e?.detail;
            if (!d || d.productId !== productId) return;
            setIsFav(!!d.favorited);
        };

        window.addEventListener("arcadia:favorites:updated", onUpdated);
        return () => {
            alive = false;
            window.removeEventListener("arcadia:favorites:updated", onUpdated);
        };
    }, [productId]);

    // En móvil/touch no existe hover real, así que queda visible.
    // En desktop se mantiene el comportamiento original:
    // - visible siempre si es favorito
    // - si no, aparece con hover del parent `.group`
    const visibility = isFav
        ? "opacity-100 pointer-events-auto"
        : "opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto";

    return (
        <span
            class={[
                "inline-flex shrink-0 items-center justify-center",
                "transition-opacity duration-200 ease-in-out",
                "will-change-[opacity]",
                visibility,
                className ?? "",
            ].join(" ")}
        >
            <FavoriteButton productId={productId} variant={variant} />
        </span>
    );
}