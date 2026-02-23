import { useMemo, useState } from "preact/hooks";

type Props = {
  text: string;
  collapsedChars?: number;
};

export default function ExpandableText({ text, collapsedChars = 260 }: Props) {
  const [open, setOpen] = useState(false);

  const { head, tail } = useMemo(() => {
    const clean = String(text ?? "").trim();
    if (clean.length <= collapsedChars) return { head: clean, tail: "" };
    return { head: clean.slice(0, collapsedChars).trimEnd(), tail: clean.slice(collapsedChars).trimStart() };
  }, [text, collapsedChars]);

  if (!tail) {
    return <p class="text-sm leading-relaxed text-zinc-700 sm:text-base">{head}</p>;
  }

  return (
    <div class="relative">
      <p class="text-sm leading-relaxed text-zinc-700 sm:text-base">
        {open ? head + " " + tail : head}
      </p>

      {!open ? (
        <>
          {/* fade */}
          <div class="pointer-events-none absolute inset-x-0 bottom-10 h-10 bg-gradient-to-t from-[#FBFAF7] to-transparent" />
          <button
            type="button"
            class="mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={() => setOpen(true)}
          >
            Ver más
          </button>
        </>
      ) : (
        <button
          type="button"
          class="mt-3 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          onClick={() => setOpen(false)}
        >
          Ver menos
        </button>
      )}
    </div>
  );
}
