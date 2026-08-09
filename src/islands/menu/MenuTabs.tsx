import { useEffect, useMemo, useState } from "preact/hooks";

/**
 * Menú del día.
 *
 * Es la oferta de mayor margen y la más perecedera (se sirve en una franja
 * concreta), y estaba presentada tan plana como el resto de la web. De ahí el
 * precio como pieza principal, el aviso de si se está sirviendo ahora mismo, y
 * los platos en columnas por pase en vez de una lista centrada larga.
 *
 * Todo el contenido —precio, horario y nota incluidos— viene del admin. Antes
 * el horario estaba escrito aquí dentro y no se podía cambiar sin tocar código.
 */

type MenuKind = "DIARIO" | "FESTIVO";
type Course = "ENTRANTES" | "PRINCIPALES" | "POSTRES";

type MenuData = {
  id: number;
  kind: MenuKind;
  title: string;
  priceText: string | null;
  priceCents: number;
  serviceFrom: string | null;
  serviceTo: string | null;
  servingNow: boolean;
  note: string | null;
  courses: Record<Course, Array<{ name: string; desc: string | null }>>;
};

const COURSE_LABEL: Record<Course, string> = {
  ENTRANTES: "Entrantes",
  PRINCIPALES: "Principales",
  POSTRES: "Postres",
};

export default function MenuTabs(props: { diario: MenuData | null; festivo: MenuData | null }) {
  const hasDiario = !!props.diario;
  const hasFestivo = !!props.festivo;

  const [active, setActive] = useState<MenuKind>(hasDiario ? "DIARIO" : "FESTIVO");

  useEffect(() => {
    if (active === "DIARIO" && !hasDiario && hasFestivo) setActive("FESTIVO");
    if (active === "FESTIVO" && !hasFestivo && hasDiario) setActive("DIARIO");
  }, [active, hasDiario, hasFestivo]);

  const current = useMemo(
    () => (active === "DIARIO" ? props.diario : props.festivo),
    [active, props.diario, props.festivo],
  );

  // Con un solo menú publicado el selector no aporta nada y quita protagonismo
  // al contenido, que es justo lo que se quería corregir.
  const showTabs = hasDiario && hasFestivo;

  function onKeyDown(event: KeyboardEvent) {
    if (!showTabs) return;
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      setActive(active === "DIARIO" ? "FESTIVO" : "DIARIO");
    }
  }

  if (!current) {
    return (
      <div class="mx-auto max-w-xl rounded-3xl border border-zinc-200 bg-white px-6 py-14 text-center">
        <p class="font-semibold text-zinc-900">No hay menú publicado ahora mismo</p>
        <p class="mt-1 text-sm text-zinc-600">
          Consulta nuestra <a class="font-semibold underline" href="/carta">carta completa</a> mientras tanto.
        </p>
      </div>
    );
  }

  const schedule =
    current.serviceFrom && current.serviceTo ? `${current.serviceFrom} – ${current.serviceTo}` : null;

  return (
    <div class="space-y-6">
      {showTabs ? (
        <div class="flex justify-center">
          <div
            class="inline-flex rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm"
            role="tablist"
            aria-label="Seleccionar menú"
            tabIndex={0}
            onKeyDown={onKeyDown as unknown as (event: Event) => void}
          >
            {(["DIARIO", "FESTIVO"] as MenuKind[]).map((kind) => (
              <button
                key={kind}
                type="button"
                role="tab"
                aria-selected={active === kind}
                onClick={() => setActive(kind)}
                class={`sigmar-regular rounded-xl px-5 py-2 text-xs font-black tracking-widest transition sm:px-7 sm:text-sm ${
                  active === kind ? "bg-zinc-900 text-white shadow" : "text-zinc-800 hover:bg-zinc-100"
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Cabecera: el precio es la pieza principal, no una línea más. */}
      <div class="overflow-hidden rounded-[2rem] border border-zinc-200 bg-zinc-900 text-white shadow-lg">
        <div class="px-6 py-8 text-center sm:px-10 sm:py-10">
          <div class="sigmar-regular text-2xl font-black tracking-widest sm:text-4xl">
            {current.title.toUpperCase()}
          </div>
          <p class="mx-auto mt-2 max-w-md text-sm text-white/70">
            Entrantes + Principales + Bebida + Postre o Café · Pan incluido
          </p>

          {current.priceText ? (
            <div class="mt-6 inline-flex items-baseline gap-2 rounded-2xl bg-white px-6 py-3 text-zinc-900">
              <span class="sigmar-regular text-3xl font-black tracking-wide sm:text-4xl">
                {current.priceText}
              </span>
              <span class="text-xs font-semibold uppercase tracking-widest text-zinc-500">por persona</span>
            </div>
          ) : null}

          {schedule ? (
            <div class="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
              {current.servingNow ? (
                <span class="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3.5 py-1.5 font-semibold text-emerald-300">
                  <span class="h-2 w-2 rounded-full bg-emerald-400" aria-hidden="true" />
                  Sirviéndose ahora
                </span>
              ) : null}
              <span class="rounded-full bg-white/10 px-3.5 py-1.5 font-semibold text-white/80">
                {schedule}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Vertical y a ancho de lectura, como una carta impresa. En tres
          columnas cada pase se quedaba en 285px: los nombres largos se partían
          en tres líneas y las descripciones no había quien las leyera. */}
      <div class="rounded-[2rem] border border-zinc-200 bg-white px-5 py-8 sm:px-10 sm:py-12">
        <div class="mx-auto max-w-2xl space-y-10 sm:space-y-12">
          {(["ENTRANTES", "PRINCIPALES", "POSTRES"] as Course[]).map((course) => {
            const list = current.courses[course] ?? [];

            return (
              <section key={course}>
                {/* Rótulo centrado entre filetes, que es como se separan los
                    pases en una carta de verdad. */}
                <h2 class="flex items-center gap-4 text-center">
                  <span class="h-px flex-1 bg-zinc-200" aria-hidden="true" />
                  <span class="sigmar-regular shrink-0 text-sm font-medium uppercase tracking-[0.25em] text-zinc-500 sm:text-base">
                    {COURSE_LABEL[course]}
                  </span>
                  <span class="h-px flex-1 bg-zinc-200" aria-hidden="true" />
                </h2>

                {list.length === 0 ? (
                  <p class="mt-6 text-center text-sm text-zinc-500">Pendiente de publicar.</p>
                ) : (
                  <ul class="mt-6 space-y-5 sm:space-y-6">
                    {list.map((dish, index) => (
                      <li key={`${dish.name}-${index}`} class="text-center">
                        <p class="text-lg font-semibold leading-snug text-zinc-900 sm:text-xl">
                          {dish.name}
                        </p>
                        {dish.desc ? (
                          <p class="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-zinc-600">
                            {dish.desc}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {current.note ? (
        <p class="text-center text-sm tracking-wide text-zinc-500">{current.note}</p>
      ) : null}
    </div>
  );
}
