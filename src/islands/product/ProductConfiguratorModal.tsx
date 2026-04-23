import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import { addToCart } from "@/islands/cart/cartClient";

type Ingredient = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  addPriceDeltaCents: number;
  isCommon: boolean;
  active: boolean;
};

type ProductIngredient = {
  ingredientId: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  addPriceDeltaCents: number;
  defaultIncluded: boolean;
  removable: boolean;
  sortOrder: number;
};

type ModifierOption = {
  id: number;
  name: string;
  priceDeltaCents: number;
  sortOrder: number;
};

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
  product: {
    id: number;
    name: string;
    description: string | null;
    imageUrl: string | null;
    priceCents: number;
  };
  variants: Array<{ id: number; name: string; priceDeltaCents: number; sortOrder: number }>;
  modifierGroups: ModifierGroup[];
  productIngredients: ProductIngredient[];
  commonIngredients: Ingredient[];
  allergens: ProductAllergen[];
  ingredientsCustomizationEnabled: boolean;
};

type StepId = "remove" | "add" | "extras" | "confirm";

const ADDED_COMMON_INGREDIENT_CENTS = 100;

function isSauceIngredient(value: { slug?: string | null; name?: string | null }) {
  const hay = `${value.slug ?? ""} ${value.name ?? ""}`.toLowerCase();

  return [
    "ketchup",
    "mayonesa",
    "mahonesa",
    "alioli",
    "barbacoa",
    "salsa-amarilla",
    "amarilla",
    "salsa-cheddar",
    "cheddar",
    "salsa-cesar",
    "cesar",
    "salsa-griega",
    "griega",
    "salsa-sioux",
    "sioux",
    "salsa-zen",
    "zen",
    "salsa-bhuda",
    "bhuda",
    "salsa-cajun",
    "cajun",
    "mayo-vegana",
    "mayo-veggie",
  ].some((part) => hay.includes(part));
}

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

function allergenIconPath(allergen: ProductAllergen) {
  return allergen.iconUrl ?? `/images/allergens/${allergen.slug}.webp`;
}

function placeholderLabel(name: string) {
  const words = name.trim().split(/\s+/).slice(0, 2);
  return words.map((word) => word.slice(0, 1).toUpperCase()).join("");
}

function SmallBanIcon() {
  return (
    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M7 17 17 7" />
    </svg>
  );
}

function SmallCheckIcon() {
  return (
    <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2.4">
      <path d="m5 12 4.2 4.2L19 6.8" />
    </svg>
  );
}

function ProductImageOrPlaceholder(props: {
  imageUrl: string | null | undefined;
  name: string;
  rounded?: string;
  className?: string;
  labelSize?: string;
  fit?: "cover" | "contain";
  padded?: boolean;
}) {
  const rounded = props.rounded ?? "rounded-2xl";
  const className = props.className ?? "h-24 w-full";
  const labelSize = props.labelSize ?? "text-lg";
  const fit = props.fit ?? "cover";
  const padded = props.padded ?? false;

  if (props.imageUrl) {
    return (
      <div class={`${className} ${rounded} overflow-hidden bg-zinc-50`}>
        <img
          src={props.imageUrl}
          alt={props.name}
          class={`h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"} ${padded ? "p-3" : ""
            }`}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      class={`${className} ${rounded} grid place-items-center bg-zinc-100 text-zinc-500`}
      aria-hidden="true"
    >
      <span class={`font-black tracking-[0.18em] ${labelSize}`}>{placeholderLabel(props.name)}</span>
    </div>
  );
}

function IngredientCard(props: {
  name: string;
  imageUrl?: string | null;
  priceDeltaCents?: number;
  selected: boolean;
  mode: "remove" | "add";
  onToggle: () => void;
}) {
  const isRemove = props.mode === "remove";
  const selectedClasses = isRemove
    ? "border-red-500 bg-red-50/80 shadow-[0_10px_30px_rgba(239,68,68,0.10)]"
    : "border-emerald-500 bg-emerald-50/80 shadow-[0_10px_30px_rgba(16,185,129,0.10)]";

  const badgeClasses = isRemove
    ? "bg-red-500 text-white"
    : "bg-emerald-500 text-white";

  return (
    <button
      type="button"
      onClick={props.onToggle}
      class={`group relative overflow-hidden rounded-[24px] border bg-white p-3 text-left transition ${props.selected ? selectedClasses : "border-zinc-200 hover:border-zinc-300"
        }`}
    >
      <ProductImageOrPlaceholder
        imageUrl={props.imageUrl}
        name={props.name}
        className="h-28 w-full"
        rounded="rounded-[18px]"
        labelSize="text-base"
        fit="contain"
        padded
      />

      <div class="mt-3 flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="line-clamp-2 text-sm font-semibold text-zinc-900">{props.name}</div>
          {typeof props.priceDeltaCents === "number" ? (
            <div class="mt-1 text-xs text-zinc-600">
              {props.priceDeltaCents > 0 ? `+${money(props.priceDeltaCents)}` : "Sin coste extra"}
            </div>
          ) : null}
        </div>
      </div>

      {props.selected ? (
        <span
          class={`absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full ${badgeClasses}`}
        >
          {isRemove ? <SmallBanIcon /> : <SmallCheckIcon />}
        </span>
      ) : null}
    </button>
  );
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

    api<ProductDetails>(`/api/products/${productId}`)
      .then((response) => setData(response))
      .finally(() => setLoading(false));
  }, [open, productId]);

  const steps = useMemo(() => {
    const next: Array<{ id: StepId; title: string }> = [];

    if (data?.ingredientsCustomizationEnabled) {
      next.push({ id: "remove", title: "Quitar" });
      next.push({ id: "add", title: "Añadir" });
    }

    next.push({ id: "extras", title: "Extras" });
    next.push({ id: "confirm", title: "Confirmar" });

    return next;
  }, [data?.ingredientsCustomizationEnabled]);

  useEffect(() => {
    if (!open) return;

    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (step > Math.max(0, steps.length - 1)) {
      setStep(Math.max(0, steps.length - 1));
    }
  }, [step, steps.length]);

  const currentStep = steps[step]?.id ?? "confirm";

  const includedSet = useMemo(() => {
    const set = new Set<number>();
    (data?.productIngredients ?? []).forEach((productIngredient) => {
      if (productIngredient.defaultIncluded) set.add(productIngredient.ingredientId);
    });
    return set;
  }, [data]);

  const removable = useMemo(
    () => (data?.productIngredients ?? []).filter((item) => item.defaultIncluded && item.removable),
    [data],
  );

  const commonToAdd = useMemo(() => {
    const commonIngredients = data?.commonIngredients ?? [];
    return commonIngredients
      .filter((ingredient) => !includedSet.has(ingredient.id))
      .filter((ingredient) => !isSauceIngredient(ingredient));
  }, [data, includedSet]);

  const selectedOptions = useMemo(() => {
    if (!data) return [];
    const selected = new Set(selectedOptionIds);
    return data.modifierGroups.flatMap((group) =>
      group.options
        .filter((option) => selected.has(option.id))
        .map((option) => ({
          ...option,
          groupName: group.name,
          groupId: group.id,
        })),
    );
  }, [data, selectedOptionIds]);

  function toggleRemoved(id: number) {
    setRemovedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
    );
  }

  function toggleAdded(id: number) {
    setAddedIds((previous) =>
      previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id],
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

  const ingredientMap = useMemo(() => {
    const map = new Map<number, { name: string; addPriceDeltaCents: number }>();

    (data?.productIngredients ?? []).forEach((ingredient) => {
      map.set(ingredient.ingredientId, {
        name: ingredient.name,
        addPriceDeltaCents: ingredient.addPriceDeltaCents ?? 0,
      });
    });

    (data?.commonIngredients ?? []).forEach((ingredient) => {
      map.set(ingredient.id, {
        name: ingredient.name,
        addPriceDeltaCents: ingredient.addPriceDeltaCents ?? 0,
      });
    });

    return map;
  }, [data]);

  const priceExtrasCents = useMemo(() => {
    if (!data) return 0;

    const optionMap = new Map<number, number>();
    data.modifierGroups.forEach((group) =>
      group.options.forEach((option) => optionMap.set(option.id, option.priceDeltaCents)),
    );

    const optionCents = selectedOptionIds.reduce(
      (accumulator, id) => accumulator + (optionMap.get(id) ?? 0),
      0,
    );

    const addedCents = addedIds.length * ADDED_COMMON_INGREDIENT_CENTS;

    return optionCents + addedCents;
  }, [data, selectedOptionIds, addedIds, ingredientMap]);

  const totalCents = useMemo(() => {
    if (!data) return 0;
    return data.product.priceCents + priceExtrasCents;
  }, [data, priceExtrasCents]);

  const requiredGroupsMissing = useMemo(() => {
    if (!data) return false;

    return data.modifierGroups.some((group) => {
      if (!group.required && group.minSelect <= 0) return false;
      const groupOptionIds = new Set(group.options.map((option) => option.id));
      const selectedInGroup = selectedOptionIds.filter((id) => groupOptionIds.has(id));
      const minRequired = Math.max(group.required ? 1 : 0, group.minSelect ?? 0);
      return selectedInGroup.length < minRequired;
    });
  }, [data, selectedOptionIds]);

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

  function nextStep() {
    setStep((current) => Math.min(steps.length - 1, current + 1));
  }

  function prevStep() {
    setStep((current) => Math.max(0, current - 1));
  }

  if (!open) return null;

  return (
    <div class="fixed inset-0 z-50">
      <div class="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />

      <div class="absolute inset-x-0 bottom-0 h-[92dvh] w-full overflow-hidden rounded-t-3xl bg-white shadow-xl sm:left-1/2 sm:top-1/2 sm:h-[90dvh] sm:w-[95vw] sm:max-w-4xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[30px] 2xl:max-w-6xl">
        <div class="flex items-center justify-between border-b border-zinc-200 p-3 sm:p-4">
          <div class="min-w-0">
            <div class="text-xs uppercase tracking-[0.18em] text-zinc-500">Personalizar</div>
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
                <div class="grid gap-5 lg:h-full lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)]">
                  <aside class="lg:h-full lg:self-stretch">
                    <div class="overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-50">
                      <div class="p-4">
                        <ProductImageOrPlaceholder
                          imageUrl={data.product.imageUrl}
                          name={data.product.name}
                          className="aspect-square w-full"
                          rounded="rounded-[22px]"
                          labelSize="text-2xl"
                        />

                        <div class="mt-4">
                          <div class="text-xl font-black text-zinc-900">{data.product.name}</div>

                          {data.product.description ? (
                            <div class="mt-1 text-sm leading-6 text-zinc-600">
                              {data.product.description}
                            </div>
                          ) : null}

                          <div class="mt-4 flex items-center justify-between gap-3">
                            <div class="text-xs uppercase tracking-[0.18em] text-zinc-500">
                              Precio base
                            </div>
                            <div class="text-2xl font-black text-zinc-900">
                              {money(data.product.priceCents)}
                            </div>
                          </div>

                          {data.allergens.length > 0 ? (
                            <div class="mt-4 flex flex-wrap gap-2">
                              {data.allergens.map((allergen) => (
                                <img
                                  key={allergen.slug}
                                  src={allergenIconPath(allergen)}
                                  alt={allergen.name}
                                  title={allergen.name}
                                  class="h-8 w-8 object-contain"
                                  loading="lazy"
                                />
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </aside>

                  <section class="min-w-0 space-y-4 lg:h-full lg:overflow-y-auto lg:pr-2">
                    <div class="sticky top-0 z-10 bg-white pb-4">
                      <div class="rounded-[24px] border border-zinc-200 bg-white p-4 shadow-sm">
                        <div class="overflow-x-auto">
                          <div class="flex min-w-max gap-2 text-xs sm:flex-wrap">
                            {steps.map((item, index) => (
                              <button
                                type="button"
                                class={`shrink-0 rounded-full border px-3 py-1.5 transition ${index === step
                                    ? "border-zinc-900 bg-zinc-900 text-white"
                                    : "border-zinc-300 text-zinc-600 hover:border-zinc-400"
                                  }`}
                                onClick={() => setStep(index)}
                              >
                                {index + 1}. {item.title}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="rounded-[28px] border border-zinc-200 bg-white p-4 sm:p-5">
                      {currentStep === "remove" && (
                        <section class="space-y-4">
                          <div>
                            <h2 class="text-base font-semibold sm:text-lg">Quitar ingredientes</h2>
                            <p class="mt-1 text-sm text-zinc-600">
                              Selecciona lo que no quieras y lo marcaremos con retirada.
                            </p>
                          </div>

                          {removable.length === 0 ? (
                            <p class="text-sm text-zinc-600">
                              Este producto no tiene ingredientes quitables configurados.
                            </p>
                          ) : (
                            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {removable.map((productIngredient) => (
                                <IngredientCard
                                  key={productIngredient.ingredientId}
                                  name={productIngredient.name}
                                  imageUrl={productIngredient.imageUrl}
                                  selected={removedIds.includes(productIngredient.ingredientId)}
                                  mode="remove"
                                  onToggle={() => toggleRemoved(productIngredient.ingredientId)}
                                />
                              ))}
                            </div>
                          )}
                        </section>
                      )}

                      {currentStep === "add" && (
                        <section class="space-y-4">
                          <div>
                            <h2 class="text-base font-semibold sm:text-lg">Añadir ingredientes comunes</h2>
                            <p class="mt-1 text-sm text-zinc-600">
                              Ingredientes habituales de otros productos de la misma categoría.
                            </p>
                          </div>

                          {commonToAdd.length === 0 ? (
                            <p class="text-sm text-zinc-600">
                              No hay ingredientes comunes disponibles para añadir.
                            </p>
                          ) : (
                            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                              {commonToAdd.map((ingredient) => (
                                <IngredientCard
                                  key={ingredient.id}
                                  name={ingredient.name}
                                  imageUrl={ingredient.imageUrl}
                                  priceDeltaCents={ADDED_COMMON_INGREDIENT_CENTS}
                                  selected={addedIds.includes(ingredient.id)}
                                  mode="add"
                                  onToggle={() => toggleAdded(ingredient.id)}
                                />
                              ))}
                            </div>
                          )}
                        </section>
                      )}

                      {currentStep === "extras" && (
                        <section class="space-y-4">
                          <div>
                            <h2 class="text-base font-semibold sm:text-lg">Extras</h2>
                            <p class="mt-1 text-sm text-zinc-600">
                              Aquí entran salsas y extras configurados para este producto.
                            </p>
                          </div>

                          {data.modifierGroups.length === 0 ? (
                            <p class="text-sm text-zinc-600">
                              Este producto no tiene extras configurados.
                            </p>
                          ) : (
                            data.modifierGroups.map((group) => {
                              const groupOptionIds = new Set(group.options.map((option) => option.id));
                              const selectedInGroup = selectedOptionIds.filter((id) =>
                                groupOptionIds.has(id),
                              );

                              return (
                                <div key={group.id} class="rounded-[24px] border border-zinc-200 p-3 sm:p-4">
                                  <div class="flex flex-wrap items-baseline justify-between gap-3">
                                    <div class="font-semibold text-zinc-900">{group.name}</div>
                                    <div class="text-xs text-zinc-600">
                                      {group.maxSelect === 1
                                        ? group.required || group.minSelect > 0
                                          ? "Elige 1"
                                          : "Elige 1 (opcional)"
                                        : group.required || group.minSelect > 0
                                          ? `Elige al menos ${Math.max(group.minSelect, 1)}`
                                          : `Máx ${group.maxSelect}`}
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
                                          class={`relative rounded-[20px] border p-3 text-left transition ${checked
                                              ? "border-emerald-500 bg-emerald-50/80"
                                              : "border-zinc-200 bg-white hover:border-zinc-300"
                                            } ${disable ? "pointer-events-none opacity-50" : ""}`}
                                          onClick={() => toggleOption(group, option.id)}
                                          disabled={disable}
                                        >
                                          <div class="pr-8">
                                            <div class="text-sm font-semibold text-zinc-900">
                                              {option.name}
                                            </div>
                                            <div class="mt-1 text-xs text-zinc-600">
                                              +{money(option.priceDeltaCents)}
                                            </div>
                                          </div>

                                          {checked ? (
                                            <span class="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-emerald-500 text-white">
                                              <SmallCheckIcon />
                                            </span>
                                          ) : null}
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

                      {currentStep === "confirm" && (
                        <section class="space-y-4">
                          <div>
                            <h2 class="text-base font-semibold sm:text-lg">Resumen del producto</h2>
                            <p class="mt-1 text-sm text-zinc-600">
                              Revisa todo antes de añadirlo al carrito.
                            </p>
                          </div>

                          <div class="rounded-[24px] border border-zinc-200 p-4">
                            <div class="flex items-center justify-between">
                              <span class="text-zinc-600">Base</span>
                              <span class="font-semibold">{money(data.product.priceCents)}</span>
                            </div>

                            <div class="mt-2 flex items-center justify-between">
                              <span class="text-zinc-600">Extras y añadidos</span>
                              <span class="font-semibold">{money(priceExtrasCents)}</span>
                            </div>

                            <div class="mt-3 border-t border-zinc-200 pt-3">
                              <div class="flex items-center justify-between">
                                <span class="text-zinc-600">Total unidad</span>
                                <span class="text-lg font-black text-zinc-900">{money(totalCents)}</span>
                              </div>
                            </div>
                          </div>

                          <div class="grid gap-3 xl:grid-cols-3">
                            <div class="rounded-[24px] border border-zinc-200 p-4">
                              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Quitas
                              </div>
                              {removedIds.length > 0 ? (
                                <ul class="mt-3 space-y-2 text-sm text-zinc-800">
                                  {removedIds.map((id) => (
                                    <li class="flex items-start gap-2">
                                      <span class="mt-0.5 text-red-500">
                                        <SmallBanIcon />
                                      </span>
                                      <span>{ingredientMap.get(id)?.name ?? "Ingrediente"}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p class="mt-3 text-sm text-zinc-600">No has quitado nada.</p>
                              )}
                            </div>

                            <div class="rounded-[24px] border border-zinc-200 p-4">
                              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Añades
                              </div>
                              {addedIds.length > 0 ? (
                                <ul class="mt-3 space-y-2 text-sm text-zinc-800">
                                  {addedIds.map((id) => (
                                    <li class="flex items-start justify-between gap-3">
                                      <span class="flex items-start gap-2">
                                        <span class="mt-0.5 text-emerald-500">
                                          <SmallCheckIcon />
                                        </span>
                                        <span>{ingredientMap.get(id)?.name ?? "Ingrediente"}</span>
                                      </span>
                                      <span class="shrink-0 text-zinc-500">
                                        +{money(ADDED_COMMON_INGREDIENT_CENTS)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p class="mt-3 text-sm text-zinc-600">No has añadido ingredientes.</p>
                              )}
                            </div>

                            <div class="rounded-[24px] border border-zinc-200 p-4">
                              <div class="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Extras
                              </div>
                              {selectedOptions.length > 0 ? (
                                <ul class="mt-3 space-y-2 text-sm text-zinc-800">
                                  {selectedOptions.map((option) => (
                                    <li class="flex items-start justify-between gap-3">
                                      <span>
                                        <span class="font-medium">{option.groupName}:</span> {option.name}
                                      </span>
                                      <span class="shrink-0 text-zinc-500">
                                        +{money(option.priceDeltaCents)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p class="mt-3 text-sm text-zinc-600">No has añadido extras.</p>
                              )}
                            </div>
                          </div>
                        </section>
                      )}
                    </div>
                  </section>
                </div>
              </>
          )}
        </div>

        <div class="border-t border-zinc-200 p-3 sm:p-4">
          <div class="flex items-center gap-3">
            <button
              class="shrink-0 rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={prevStep}
              disabled={step === 0}
            >
              Atrás
            </button>

            <button
              class="min-w-0 flex-1 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={currentStep === "confirm" ? onAdd : nextStep}
              disabled={
                loading ||
                !data ||
                (currentStep === "extras" && requiredGroupsMissing) ||
                (currentStep === "confirm" && requiredGroupsMissing)
              }
            >
              {currentStep === "confirm"
                ? `Añadir al carrito · ${money(totalCents)}`
                : "Siguiente"}
            </button>
          </div>

          {currentStep === "confirm" && requiredGroupsMissing ? (
            <p class="mt-2 text-sm text-red-600">
              Completa los extras obligatorios antes de continuar.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}