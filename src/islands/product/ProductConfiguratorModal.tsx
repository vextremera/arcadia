import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import { addToCart } from "@/islands/cart/cartClient";

type Ingredient = {
  id: number;
  name: string;
  slug: string;
  addPriceDeltaCents: number;
  isCommon: boolean;
  active: boolean;
};

type ProductIngredient = {
  ingredientId: number;
  name: string;
  slug: string;
  defaultIncluded: boolean;
  removable: boolean;
  sortOrder: number;
};

type ModifierOption = { id: number; name: string; priceDeltaCents: number; sortOrder: number };
type ModifierGroup = {
  id: number;
  name: string;
  minSelect: number;
  maxSelect: number;
  required: boolean;
  sortOrder: number;
  options: ModifierOption[];
};

type ProductDetails = {
  product: { id: number; name: string; description: string | null; imageUrl: string | null; priceCents: number };
  variants: Array<{ id: number; name: string; priceDeltaCents: number; sortOrder: number }>;
  modifierGroups: ModifierGroup[];
  productIngredients: ProductIngredient[];
  commonIngredients: Ingredient[];
  allIngredients: Ingredient[];
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default function ProductConfiguratorModal() {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [data, setData] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  // selections
  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  // listen open event
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ productId: number }>;
      setProductId(ce.detail.productId);
      setOpen(true);
    };
    window.addEventListener("arcadia:product:open", handler);
    return () => window.removeEventListener("arcadia:product:open", handler);
  }, []);

  // load product details
  useEffect(() => {
    if (!open || !productId) return;

    setLoading(true);
    setData(null);
    setStep(0);
    setRemovedIds([]);
    setAddedIds([]);
    setSelectedOptionIds([]);
    setSearch("");

    api<ProductDetails>(`/api/products/${productId}`)
      .then((res) => setData(res))
      .finally(() => setLoading(false));
  }, [open, productId]);

  const includedSet = useMemo(() => {
    const s = new Set<number>();
    (data?.productIngredients ?? []).forEach((pi) => {
      if (pi.defaultIncluded) s.add(pi.ingredientId);
    });
    return s;
  }, [data]);

  const removable = useMemo(
    () => (data?.productIngredients ?? []).filter((x) => x.defaultIncluded && x.removable),
    [data]
  );

  const commonToAdd = useMemo(() => {
    const commons = data?.commonIngredients ?? [];
    return commons.filter((ing) => !includedSet.has(ing.id));
  }, [data, includedSet]);

  const allToAdd = useMemo(() => {
    const all = data?.allIngredients ?? [];
    const commonIds = new Set((data?.commonIngredients ?? []).map((x) => x.id));
    return all
      .filter((ing) => !includedSet.has(ing.id))
      .filter((ing) => !commonIds.has(ing.id))
      .filter((ing) => ing.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [data, includedSet, search]);

  function toggleRemoved(id: number) {
    setRemovedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleAdded(id: number) {
    setAddedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleOption(group: ModifierGroup, optionId: number) {
    setSelectedOptionIds((prev) => {
      const groupOptionIds = new Set(group.options.map((o) => o.id));
      const selectedInGroup = prev.filter((id) => groupOptionIds.has(id));

      const isSelected = prev.includes(optionId);

      // maxSelect === 1 -> radio
      if (group.maxSelect === 1) {
        if (isSelected) return prev.filter((id) => id !== optionId);
        return [...prev.filter((id) => !groupOptionIds.has(id)), optionId];
      }

      // checkbox with maxSelect limit
      if (isSelected) return prev.filter((id) => id !== optionId);
      if (selectedInGroup.length >= group.maxSelect) return prev; // ignore extra
      return [...prev, optionId];
    });
  }

  const priceExtrasCents = useMemo(() => {
    if (!data) return 0;

    const optionMap = new Map<number, number>();
    data.modifierGroups.forEach((g) => g.options.forEach((o) => optionMap.set(o.id, o.priceDeltaCents)));

    const optCents = selectedOptionIds.reduce((acc, id) => acc + (optionMap.get(id) ?? 0), 0);

    const ingMap = new Map<number, number>();
    data.allIngredients.forEach((ing) => ingMap.set(ing.id, ing.addPriceDeltaCents));
    const addCents = addedIds.reduce((acc, id) => acc + (ingMap.get(id) ?? 0), 0);

    return optCents + addCents;
  }, [data, selectedOptionIds, addedIds]);

  const totalCents = useMemo(() => {
    if (!data) return 0;
    return data.product.priceCents + priceExtrasCents;
  }, [data, priceExtrasCents]);

  async function onAdd() {
    if (!data) return;
    await addToCart({
      productId: data.product.id,
      qty: 1,
      modifierOptionIds: selectedOptionIds,
      addedIngredientIds: addedIds,
      removedIngredientIds: removedIds,
    });

    //Llamar a más productos sugeridos
    window.dispatchEvent(new Event("arcadia:upsell:open"));

    // cerrar modal y volver donde estabas
    setOpen(false);
    setProductId(null);
  }

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

      <div class="absolute inset-x-0 bottom-0 h-[92dvh] w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:left-1/2 sm:top-1/2 sm:h-[90dvh] sm:w-[95vw] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl">
        <div class="flex items-center justify-between border-b border-zinc-200 p-3 sm:p-4">
          <div class="min-w-0">
            <div class="text-xs text-zinc-600">Personalizar</div>
            <div class="truncate text-sm font-semibold sm:text-base">
              {loading ? "Cargando..." : data?.product.name ?? "Producto"}
            </div>
          </div>

          <button class="shrink-0 text-sm text-zinc-600 hover:underline" type="button" onClick={() => setOpen(false)}>
            Cerrar
          </button>
        </div>

        <div class="h-[calc(100%-8.5rem)] overflow-y-auto p-3 sm:h-[calc(100%-9rem)] sm:p-4">
          {loading || !data ? (
            <div class="text-sm text-zinc-600">Cargando configuración…</div>
          ) : (
            <>
              {/* Stepper */}
              <div class="mb-4 -mx-1 overflow-x-auto pb-1">
                <div class="flex min-w-max gap-2 px-1 text-xs sm:min-w-0 sm:flex-wrap">
                  {["Quitar", "Añadir comunes", "Añadir otros", "Extras", "Confirmar"].map((t, i) => (
                    <button
                      type="button"
                      class={`shrink-0 rounded-full border px-3 py-1 ${i === step ? "border-zinc-900 text-zinc-900" : "border-zinc-300 text-zinc-600"}`}
                      onClick={() => setStep(i)}
                    >
                      {i + 1}. {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* STEP 0: remove */}
              {step === 0 && (
                <section class="space-y-3">
                  <h2 class="text-base font-semibold sm:text-lg">Quitar ingredientes</h2>
                  {removable.length === 0 ? (
                    <p class="text-sm text-zinc-600">Este producto no tiene ingredientes quitables configurados.</p>
                  ) : (
                    <div class="grid gap-2 sm:grid-cols-2">
                      {removable.map((pi) => (
                        <label class="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
                          <input
                            type="checkbox"
                            checked={removedIds.includes(pi.ingredientId)}
                            onChange={() => toggleRemoved(pi.ingredientId)}
                          />
                          <span class="text-sm">Sin {pi.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* STEP 1: add common */}
              {step === 1 && (
                <section class="space-y-3">
                  <h2 class="text-base font-semibold sm:text-lg">Añadir ingredientes comunes</h2>
                  {commonToAdd.length === 0 ? (
                    <p class="text-sm text-zinc-600">No hay ingredientes comunes disponibles para añadir.</p>
                  ) : (
                    <div class="grid gap-2 sm:grid-cols-2">
                      {commonToAdd.map((ing) => (
                        <label class="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
                          <span class="text-sm">{ing.name}</span>
                          <span class="flex items-center gap-3">
                            <span class="text-xs text-zinc-600">+{money(ing.addPriceDeltaCents)}</span>
                            <input
                              type="checkbox"
                              checked={addedIds.includes(ing.id)}
                              onChange={() => toggleAdded(ing.id)}
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* STEP 2: add all (search) */}
              {step === 2 && (
                <section class="space-y-3">
                  <h2 class="text-base font-semibold sm:text-lg">Añadir otros ingredientes</h2>

                  <input
                    class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="Buscar ingrediente…"
                    value={search}
                    onInput={(e) => setSearch((e.target as HTMLInputElement).value)}
                  />

                  <div class="grid gap-2 sm:grid-cols-2">
                    {allToAdd.map((ing) => (
                      <label class="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
                        <span class="text-sm">{ing.name}</span>
                        <span class="flex items-center gap-3">
                          <span class="text-xs text-zinc-600">+{money(ing.addPriceDeltaCents)}</span>
                          <input
                            type="checkbox"
                            checked={addedIds.includes(ing.id)}
                            onChange={() => toggleAdded(ing.id)}
                          />
                        </span>
                      </label>
                    ))}
                  </div>

                  {allToAdd.length === 0 && (
                    <p class="text-sm text-zinc-600">No hay resultados.</p>
                  )}
                </section>
              )}

              {/* STEP 3: modifier groups */}
              {step === 3 && (
                <section className="space-y-4">
                  <h2 className="text-base font-semibold sm:text-lg">Extras</h2>

                  {data.modifierGroups.length === 0 ? (
                    <p className="text-sm text-zinc-600">
                      Este producto no tiene extras configurados.
                    </p>
                  ) : (
                    data.modifierGroups.map((g) => {
                      const groupOptionIds = new Set(g.options.map((o) => o.id));
                      const selectedInGroup = selectedOptionIds.filter((id) =>
                        groupOptionIds.has(id)
                      );

                      return (
                        <div key={g.id} className="rounded-2xl border border-zinc-200 p-3 sm:p-4">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="font-semibold">{g.name}</div>
                            <div className="text-xs text-zinc-600">
                              {g.maxSelect === 1 ? "Elige 1 (opcional)" : `Máx ${g.maxSelect}`}
                            </div>
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {g.options.map((o) => {
                              const checked = selectedOptionIds.includes(o.id);
                              const disable =
                                !checked && g.maxSelect > 1 && selectedInGroup.length >= g.maxSelect;

                              return (
                                <button
                                  key={o.id}
                                  type="button"
                                  className={`flex items-center justify-between rounded-xl border p-3 text-left text-sm ${checked ? "border-zinc-900" : "border-zinc-200"
                                    } ${disable ? "opacity-50 pointer-events-none" : ""}`}
                                  onClick={() => toggleOption(g, o.id)}
                                  disabled={disable}
                                >
                                  <span>{o.name}</span>
                                  <span className="text-xs text-zinc-600">
                                    +{money(o.priceDeltaCents)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </section>
              )}


              {/* STEP 4: confirm */}
              {step === 4 && (
                <section class="space-y-3">
                  <h2 class="text-base font-semibold sm:text-lg">Confirmar</h2>

                  <div class="rounded-2xl border border-zinc-200 p-3 text-sm sm:p-4">
                    <div class="flex items-center justify-between">
                      <span class="text-zinc-600">Base</span>
                      <span class="font-semibold">{money(data.product.priceCents)}</span>
                    </div>

                    <div class="mt-2 flex items-center justify-between">
                      <span class="text-zinc-600">Extras</span>
                      <span class="font-semibold">{money(priceExtrasCents)}</span>
                    </div>

                    <div class="mt-3 border-t border-zinc-200 pt-3 flex items-center justify-between">
                      <span class="text-zinc-600">Total unidad</span>
                      <span class="text-base font-semibold">{money(totalCents)}</span>
                    </div>

                    {removedIds.length > 0 && (
                      <div class="mt-3 text-xs text-zinc-600">
                        <span class="font-semibold">Sin:</span>{" "}
                        {removedIds
                          .map((id) => data.productIngredients.find((x) => x.ingredientId === id)?.name)
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}

                    {addedIds.length > 0 && (
                      <div class="mt-1 text-xs text-zinc-600">
                        <span class="font-semibold">Extra:</span>{" "}
                        {addedIds
                          .map((id) => data.allIngredients.find((x) => x.id === id))
                          .filter(Boolean)
                          .map((x) => `${x!.name} (+${money(x!.addPriceDeltaCents)})`)
                          .join(", ")}
                      </div>
                    )}
                  </div>

                  <button
                    class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                    type="button"
                    onClick={onAdd}
                  >
                    Añadir al carrito
                  </button>
                </section>
              )}
            </>
          )}
        </div>

        {/* footer nav */}
        <div class="border-t border-zinc-200 p-3 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <button
            class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold sm:w-auto"
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Atrás
          </button>

          <button
            class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
            type="button"
            onClick={() => setStep((s) => Math.min(4, s + 1))}
            disabled={step === 4 || loading || !data}
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}