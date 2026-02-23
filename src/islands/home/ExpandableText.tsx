import { useMemo, useState } from "preact/hooks";

type Props = {
  text: string;
  collapsedChars?: number;
};

function splitParagraphs(text: string) {
  const clean = String(text ?? "").replace(/\r\n/g, "\n").trim();
  const parts = clean.split(/\n\s*\n+/g).map((p) => p.trim()).filter(Boolean);
  return parts;
}

export default function ExpandableText({ text, collapsedChars = 260 }: Props) {
  const [open, setOpen] = useState(false);

  const { head, tail } = useMemo(() => {
    const paras = splitParagraphs(text);

    // Si hay 2+ párrafos, mostramos el 1º y el resto con toggle
    if (paras.length >= 2) {
      return { head: paras[0], tail: paras.slice(1).join("\n\n") };
    }

    // fallback: modo por caracteres
    const clean = String(text ?? "").trim();
    if (clean.length <= collapsedChars) return { head: clean, tail: "" };
    return {
      head: clean.slice(0, collapsedChars).trimEnd(),
      tail: clean.slice(collapsedChars).trimStart(),
    };
  }, [text, collapsedChars]);

  if (!tail) {
    return <p class="text-sm leading-relaxed text-zinc-700 sm:text-base">{head}</p>;
  }

  return (
    <div class="relative">
      <p class="text-sm leading-relaxed text-zinc-700 sm:text-base whitespace-pre-line">
        {open ? `${head}\n\n${tail}` : head}
      </p>

      {!open ? (
        <>
          <div class="pointer-events-none absolute inset-x-0 bottom-10 h-10 bg-linear-to-t from-[#fbfaf7] to-transparent" />
          <button
            type="button"
            class="mt-4 rounded-full border border-zinc-300 bg-white px-6 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            onClick={() => setOpen(true)}
          >
            Ver más
          </button>
        </>
      ) : (
        <button
          type="button"
          class="mt-4 rounded-full border border-zinc-300 bg-white px-6 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
          onClick={() => setOpen(false)}
        >
          Ver menos
        </button>
      )}
    </div>
  );
}