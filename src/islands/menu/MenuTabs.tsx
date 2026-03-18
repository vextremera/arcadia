import { useEffect, useMemo, useState } from "preact/hooks";

type MenuKind = "DIARIO" | "FESTIVO";

type Course = "ENTRANTES" | "PRINCIPALES" | "POSTRES";

type MenuData = {
  id: number;
  kind: MenuKind;
  title: string;
  priceText: string | null;
  courses: Record<Course, Array<{ name: string; desc: string | null }>>;
};

export default function MenuTabs(props: { diario: MenuData | null; festivo: MenuData | null }) {
  const hasDiario = !!props.diario;
  const hasFestivo = !!props.festivo;

  const defaultKind: MenuKind = hasDiario ? "DIARIO" : "FESTIVO";
  const [active, setActive] = useState<MenuKind>(defaultKind);

  // Si falta el activo, cambia automáticamente
  useEffect(() => {
    if (active === "DIARIO" && !hasDiario && hasFestivo) setActive("FESTIVO");
    if (active === "FESTIVO" && !hasFestivo && hasDiario) setActive("DIARIO");
  }, [active, hasDiario, hasFestivo]);

  const current = useMemo(() => (active === "DIARIO" ? props.diario : props.festivo), [active, props]);

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      if (hasDiario && hasFestivo) setActive(active === "DIARIO" ? "FESTIVO" : "DIARIO");
    }
  }

  return (
    <div class="space-y-5 sm:space-y-6">
      {/* Selector */}
      <div class="flex justify-center">
        <div
          class="inline-flex rounded-2xl border border-zinc-200 bg-bg p-1 shadow-sm"
          role="tablist"
          aria-label="Seleccionar menú"
          tabIndex={0}
          onKeyDown={onKeyDown as any}
        >
          <button
            type="button"
            role="tab"
            aria-selected={active === "DIARIO"}
            disabled={!hasDiario}
            onClick={() => setActive("DIARIO")}
            class={[
              "rounded-xl px-4 py-2 text-xs font-black tracking-widest sigmar-regular transition sm:px-5 sm:text-sm",
              active === "DIARIO" ? "bg-zinc-900 text-white shadow" : "text-zinc-800 hover:bg-white",
              !hasDiario ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            DIARIO
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={active === "FESTIVO"}
            disabled={!hasFestivo}
            onClick={() => setActive("FESTIVO")}
            class={[
              "rounded-xl px-4 py-2 text-xs font-black tracking-widest sigmar-regular transition sm:px-5 sm:text-sm",
              active === "FESTIVO" ? "bg-zinc-900 text-white shadow" : "text-zinc-800 hover:bg-white",
              !hasFestivo ? "opacity-40 cursor-not-allowed" : "",
            ].join(" ")}
          >
            FESTIVO
          </button>
        </div>
      </div>

      {/* Cabecero del menú seleccionado */}
      {!current ? (
        <div class="rounded-3xl border border-zinc-200 bg-bg p-5 text-center text-sm text-zinc-600 sm:p-6">
          No hay menú publicado todavía.
        </div>
      ) : (
        <div class="rounded-3xl border border-zinc-200 bg-bg p-5 shadow-sm sm:p-6">
          <div class="text-center">
            <div class="text-xl sm:text-3xl font-black tracking-widest sigmar-regular">
              {active === "DIARIO" ? "MENÚ DIARIO" : "MENÚ FESTIVO"}
            </div>
            <div class="mt-1 text-sm text-zinc-700">
              Entrantes + Principales + Bebida + Postre o Café · Pan incluido
            </div>
            {current.priceText ? (
              <div class="mt-2 text-lg tracking-widest font-bold text-zinc-900 sm:text-xl">
                {current.priceText}
              </div>
            ) : null}
          </div>

          {/* Cursos: centrado y línea por línea */}
          <div class="mt-5 space-y-5 sm:mt-6 sm:space-y-6">
            {(["ENTRANTES", "PRINCIPALES", "POSTRES"] as const).map((course) => {
              const list = current.courses[course] ?? [];
              return (
                <div class="rounded-3xl border border-zinc-200 bg-white p-4 sm:p-6">
                  <div class="text-center text-base font-medium tracking-widest sigmar-regular sm:text-lg">
                    {course}
                  </div>

                  {list.length === 0 ? (
                    <div class="mt-4 text-center text-sm text-zinc-500">Pendiente de publicar.</div>
                  ) : (
                    <div class="mt-4 divide-y divide-zinc-200/80">
                      {list.map((it) => (
                        <div class="py-3 text-center">
                          <div class="font-semibold text-zinc-900">{it.name}</div>
                          {it.desc ? (
                            <div class="mt-1 text-sm text-zinc-600">{it.desc}</div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p class="text-sm space-y-6 mt-5 mb-1 text-center text-zinc-500 tracking-widest sm:mt-6 sm:mb-2">
            Menús personalizados disponibles bajo petición.<br />Horario de menú de <strong>13:00 a 15:30</strong>.
          </p>
        </div>
      )}
    </div>
  );
}