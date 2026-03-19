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

type ProductAllergen = {
  slug: string;
  name: string;
  iconUrl: string | null;
};

type ProductDetails = {
  product: { id: number; name: string; description: string | null; imageUrl: string | null; priceCents: number };
  variants: Array<{ id: number; name: string; priceDeltaCents: number; sortOrder: number }>;
  modifierGroups: ModifierGroup[];
  productIngredients: ProductIngredient[];
  commonIngredients: Ingredient[];
  allIngredients: Ingredient[];
  allergens: ProductAllergen[];
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

function allergenIconPath(allergen: ProductAllergen) {
  return allergen.iconUrl ?? `/images/allergens/${allergen.slug}.webp`;
}

export default function ProductConfiguratorModal() {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState<number | null>(null);
  const [data, setData] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const [removedIds, setRemovedIds] = useState<number[]>([]);
  const [addedIds, setAddedIds] = useState<number[]>([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent<{ productId: number }>;
      setProductId(customEvent.detail.productId);
      setOpen(true);
    };
    window.addEventListener("arcadia:product:open", handler);
    return () => window.removeEventListener("arcadia:product:open", handler);
  }, []);

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
      .then((response) => setData(response))
      .finally(() => setLoading(false));
  }, [open, productId]);

  const includedSet = useMemo(() => {
    const set = new Set<number>();
    (data?.productIngredients ?? []).forEach((productIngredient) => {
      if (productIngredient.defaultIncluded) set.add(productIngredient.ingredientId);
    });
    return set;
  }, [data]);

  const removable = useMemo(
    () => (data?.productIngredients ?? []).filter((item) => item.defaultIncluded && item.removable),
    [data]
  );

  const commonToAdd = useMemo(() => {
    const commonIngredients = data?.commonIngredients ?? [];
    return commonIngredients.filter((ingredient) => !includedSet.has(ingredient.id));
  }, [data, includedSet]);

  const allToAdd = useMemo(() => {
    const allIngredients = data?.allIngredients ?? [];
    const commonIds = new Set((data?.commonIngredients ?? []).map((item) => item.id));
    return allIngredients
      .filter((ingredient) => !includedSet.has(ingredient.id))
      .filter((ingredient) => !commonIds.has(ingredient.id))
      .filter((ingredient) => ingredient.name.toLowerCase().includes(search.trim().toLowerCase()));
  }, [data, includedSet, search]);

  function toggleRemoved(id: number) {
    setRemovedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  }

  function toggleAdded(id: number) {
    setAddedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]
    );
  }

  function toggleOption(group: ModifierGroup, optionId: number) {
    setSelectedOptionIds((previous) => {
      const groupOptionIds = new Set(group.options.map((option) => option.id));
      const selectedInGroup = previous.filter((id) => groupOptionIds.has(id));
      const isSelected = previous.includes(optionId);

      if (group.maxSelect === 1) {
        if (isSelected) return previous.filter((id) => id !== optionId);
        return [...previous.filter((id) => !groupOptionIds.has(id)), optionId];
      }

      if (isSelected) return previous.filter((id) => id !== optionId);
      if (selectedInGroup.length >= group.maxSelect) return previous;
      return [...previous, optionId];
    });
  }

  const priceExtrasCents = useMemo(() => {
    if (!data) return 0;

    const optionMap = new Map<number, number>();
    data.modifierGroups.forEach((group) =>
      group.options.forEach((option) => optionMap.set(option.id, option.priceDeltaCents))
    );

    const optionCents = selectedOptionIds.reduce(
      (accumulator, id) => accumulator + (optionMap.get(id) ?? 0),
      0
    );

    const ingredientMap = new Map<number, number>();
    data.allIngredients.forEach((ingredient) =>
      ingredientMap.set(ingredient.id, ingredient.addPriceDeltaCents)
    );

    const addedCents = addedIds.reduce(
      (accumulator, id) => accumulator + (ingredientMap.get(id) ?? 0),
      0
    );

    return optionCents + addedCents;
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

    setOpen(false);
    setProductId(null);
  }

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

      <div class="absolute inset-x-0 bottom-0 h-[92dvh] w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:left-1/2 sm:top-1/2 sm:h-[90dvh] sm:w-[95vw] sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl 2xl:max-w-5xl">
        <div class="flex items-center justify-between border-b border-zinc-200 p-3 sm:p-4">
          <div class="min-w-0">
            <div class="text-xs text-zinc-600">Personalizar</div>
            <div class="truncate text-sm font-semibold sm:text-base">
              {loading ? "Cargando..." : data?.product.name ?? "Producto"}
            </div>
          </div>

          <button
            class="shrink-0 text-sm text-zinc-600 hover:underline"
            type="button"
            onClick={() => setOpen(false)}
          >
            Cerrar
          </button>
        </div>

        <div class="h-[calc(100%-8.5rem)] overflow-y-auto p-3 sm:h-[calc(100%-9rem)] sm:p-4 lg:p-5">
          {loading || !data ? (
            <div class="text-sm text-zinc-600">Cargando configuración…</div>
          ) : (
            <>
              <div class="mb-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div class="min-w-0">
                    <div class="text-base font-semibold text-zinc-900">{data.product.name}</div>
                    {data.product.description ? (
                      <div class="mt-1 text-sm text-zinc-600">{data.product.description}</div>
                    ) : null}
                  </div>

                  <div class="shrink-0 text-base font-black text-zinc-900">
                    {money(data.product.priceCents)}
                  </div>
                </div>

                {data.allergens.length > 0 ? (
                  <div class="mt-3 flex flex-wrap gap-2">
                    {data.allergens.map((allergen) => (
                      <img
                        key={allergen.slug}
                        src={allergenIconPath(allergen)}
                        alt={allergen.name}
                        title={allergen.name}
                        class="h-7 w-7 object-contain sm:h-8 sm:w-8"
                        loading="lazy"
                      />
                    ))}
                  </div>
                ) : null}
              </div>

              <div class="mb-4 -mx-1 overflow-x-auto pb-1">
                <div class="flex min-w-max gap-2 px-1 text-xs sm:min-w-0 sm:flex-wrap">
                  {["Quitar", "Añadir comunes", "Añadir otros", "Extras", "Confirmar"].map((title, index) => (
                    <button
                      type="button"
                      class={`shrink-0 rounded-full border px-3 py-1 ${
                        index === step ? "border-zinc-900 text-zinc-900" : "border-zinc-300 text-zinc-600"
                      }`}
                      onClick={() => setStep(index)}
                    >
                      {index + 1}. {title}
                    </button>
                  ))}
                </div>
              </div>

              {step === 0 && (
                <section class="space-y-3">
                  <h2 class="text-base font-semibold sm:text-lg">Quitar ingredientes</h2>
                  {removable.length === 0 ? (
                    <p class="text-sm text-zinc-600">
                      Este producto no tiene ingredientes quitables configurados.
                    </p>
                  ) : (
                    <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {removable.map((productIngredient) => (
                        <label class="flex items-center gap-3 rounded-xl border border-zinc-200 p-3">
                          <input
                            type="checkbox"
                            checked={removedIds.includes(productIngredient.ingredientId)}
                            onChange={() => toggleRemoved(productIngredient.ingredientId)}
                          />
                          <span class="text-sm">Sin {productIngredient.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {step === 1 && (
                <section class="space-y-3">
                  <h2 class="text-base font-semibold sm:text-lg">Añadir ingredientes comunes</h2>
                  {commonToAdd.length === 0 ? (
                    <p class="text-sm text-zinc-600">
                      No hay ingredientes comunes disponibles para añadir.
                    </p>
                  ) : (
                    <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {commonToAdd.map((ingredient) => (
                        <label class="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
                          <span class="text-sm">{ingredient.name}</span>
                          <span class="flex items-center gap-3">
                            <span class="text-xs text-zinc-600">
                              +{money(ingredient.addPriceDeltaCents)}
                            </span>
                            <input
                              type="checkbox"
                              checked={addedIds.includes(ingredient.id)}
                              onChange={() => toggleAdded(ingredient.id)}
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {step === 2 && (
                <section class="space-y-3">
                  <h2 class="text-base font-semibold sm:text-lg">Añadir otros ingredientes</h2>

                  <input
                    class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    placeholder="Buscar ingrediente…"
                    value={search}
                    onInput={(event) => setSearch((event.target as HTMLInputElement).value)}
                  />

                  <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {allToAdd.map((ingredient) => (
                      <label class="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3">
                        <span class="text-sm">{ingredient.name}</span>
                        <span class="flex items-center gap-3">
                          <span class="text-xs text-zinc-600">
                            +{money(ingredient.addPriceDeltaCents)}
                          </span>
                          <input
                            type="checkbox"
                            checked={addedIds.includes(ingredient.id)}
                            onChange={() => toggleAdded(ingredient.id)}
                          />
                        </span>
                      </label>
                    ))}
                  </div>

                  {allToAdd.length === 0 && <p class="text-sm text-zinc-600">No hay resultados.</p>}
                </section>
              )}

              {step === 3 && (
                <section class="space-y-4">
                  <h2 class="text-base font-semibold sm:text-lg">Extras</h2>

                  {data.modifierGroups.length === 0 ? (
                    <p class="text-sm text-zinc-600">
                      Este producto no tiene extras configurados.
                    </p>
                  ) : (
                    data.modifierGroups.map((group) => {
                      const groupOptionIds = new Set(group.options.map((option) => option.id));
                      const selectedInGroup = selectedOptionIds.filter((id) => groupOptionIds.has(id));

                      return (
                        <div key={group.id} class="rounded-2xl border border-zinc-200 p-3 sm:p-4">
                          <div class="flex items-baseline justify-between gap-3">
                            <div class="font-semibold">{group.name}</div>
                            <div class="text-xs text-zinc-600">
                              {group.maxSelect === 1 ? "Elige 1 (opcional)" : `Máx ${group.maxSelect}`}
                            </div>
                          </div>

                          <div class="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                            {group.options.map((option) => {
                              const checked = selectedOptionIds.includes(option.id);
                              const disable =
                                !checked &&
                                group.maxSelect > 1 &&
                                selectedInGroup.length >= group.maxSelect;

                              return (
                                <button
                                  key={option.id}
                                  type="button"
                                  class={`flex items-center justify-between rounded-xl border p-3 text-left text-sm ${
                                    checked ? "border-zinc-900" : "border-zinc-200"
                                  } ${disable ? "opacity-50 pointer-events-none" : ""}`}
                                  onClick={() => toggleOption(group, option.id)}
                                  disabled={disable}
                                >
                                  <span>{option.name}</span>
                                  <span class="text-xs text-zinc-600">
                                    +{money(option.priceDeltaCents)}
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

                    <div class="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3">
                      <span class="text-zinc-600">Total unidad</span>
                      <span class="text-base font-semibold">{money(totalCents)}</span>
                    </div>

                    {removedIds.length > 0 && (
                      <div class="mt-3 text-xs text-zinc-600">
                        <span class="font-semibold">Sin:</span>{" "}
                        {removedIds
                          .map((id) =>
                            data.productIngredients.find((item) => item.ingredientId === id)?.name
                          )
                          .filter(Boolean)
                          .join(", ")}
                      </div>
                    )}

                    {addedIds.length > 0 && (
                      <div class="mt-1 text-xs text-zinc-600">
                        <span class="font-semibold">Extra:</span>{" "}
                        {addedIds
                          .map((id) => data.allIngredients.find((item) => item.id === id))
                          .filter(Boolean)
                          .map((item) => `${item!.name} (+${money(item!.addPriceDeltaCents)})`)
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

        <div class="border-t border-zinc-200 p-3 sm:p-4">
          <div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold sm:w-auto"
              type="button"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              Atrás
            </button>

            <button
              class="w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto"
              type="button"
              onClick={() => setStep((current) => Math.min(4, current + 1))}
              disabled={step === 4 || loading || !data}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}