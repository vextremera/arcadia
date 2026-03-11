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
      `<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#1f1f1f"><path d="M240-80q-33 0-56.5-23.5T160-160v-480q0-33 23.5-56.5T240-720h80q0-66 47-113t113-47q66 0 113 47t47 113h80q33 0 56.5 23.5T800-640v480q0 33-23.5 56.5T720-80H240Zm0-80h480v-480h-80v80q0 17-11.5 28.5T600-520q-17 0-28.5-11.5T560-560v-80H400v80q0 17-11.5 28.5T360-520q-17 0-28.5-11.5T320-560v-80h-80v480Zm160-560h160q0-33-23.5-56.5T480-800q-33 0-56.5 23.5T400-720ZM240-160v-480 480Z"/></svg>`
    );
  }, [iconSvg]);

  return (
    <button
      class="relative grid h-10 w-10 place-items-center rounded-full cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-transform"
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