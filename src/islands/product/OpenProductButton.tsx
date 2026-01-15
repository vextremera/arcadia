export default function OpenProductButton(props: { productId: number; label?: string }) {
  return (
    <button
      class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("arcadia:product:open", { detail: { productId: props.productId } })
        )
      }
    >
      {props.label ?? "Elegir"}
    </button>
  );
}
