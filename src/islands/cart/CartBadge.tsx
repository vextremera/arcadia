import { useEffect, useMemo, useState } from "preact/hooks";
import { getCartSnapshot, refreshCart, subscribeCart } from "./cartClient";

type Props = {
  iconSvg?: string;
};

export default function CartBadge({ iconSvg }: Props) {
  const [count, setCount] = useState<number>(getCartSnapshot()?.count ?? 0);

  useEffect(() => {
    refreshCart().catch(() => { });
    return subscribeCart(() => setCount(getCartSnapshot()?.count ?? 0));
  }, []);

  const showBadge = count > 0;

  const svg = useMemo(() => {
    return (
      iconSvg ||
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1f1f1f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`
    );
  }, [iconSvg]);

  return (
    <button
      class="relative grid h-10 w-10 place-items-center rounded-full border border-zinc-300 bg-white hover:bg-zinc-50"
      onClick={() => window.dispatchEvent(new CustomEvent("arcadia:cart:open"))}
      type="button"
      aria-label="Carrito"
      title="Carrito"
    >
      <span class="pointer-events-none" dangerouslySetInnerHTML={{ __html: svg }} />

      {showBadge ? (
        <span class="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#7b1f1f] px-1 text-[11px] font-bold leading-none text-white">
          {count}
        </span>
      ) : null}
    </button>
  );
}