import { useMemo, useState } from "preact/hooks";

export default function AboutMore(props: { paragraphs: string[] }) {
  const [open, setOpen] = useState(false);
  const first = props.paragraphs?.[0] ?? "";
  const rest = useMemo(() => (props.paragraphs ?? []).slice(1), [props.paragraphs]);

  return (
    <div class="relative">
      <p class="text-base leading-relaxed text-zinc-800">{first}</p>

      {rest.length > 0 ? (
        <div class={`mt-5 space-y-6 ${open ? "" : "max-h-[180px] overflow-hidden"}`}>
          {rest.map((t, idx) => (
            <p class="text-base leading-relaxed text-zinc-800" key={idx}>
              {t}
            </p>
          ))}
        </div>
      ) : null}

      {!open && rest.length > 0 ? (
        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#FBF8F1] to-transparent" />
      ) : null}

      {rest.length > 0 ? (
        <div class="mt-6">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            class="rounded-full border border-zinc-300 bg-white px-5 py-2 text-sm font-semibold hover:bg-zinc-50"
          >
            {open ? "Ver menos" : "Ver más"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
