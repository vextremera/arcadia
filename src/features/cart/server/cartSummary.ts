import {
    db,
    Product,
    ProductVariant,
    ModifierOption,
    ModifierGroup,
    Ingredient,
    eq,
    inArray,
} from "astro:db";

type CartItemSession = {
    lineId: string;
    productId: number;
    variantId?: number;
    qty: number;
    modifierOptionIds?: number[];
    addedIngredientIds?: number[];
    removedIngredientIds?: number[];
    notes?: string;
};

type ModifierDetail = { id: number; name: string; deltaCents: number; groupName?: string };
type IngredientDetail = { id: number; name: string; deltaCents: number };

const ADDED_COMMON_INGREDIENT_CENTS = 100;

function money(cents: number) {
    return `${(cents / 100).toFixed(2)} €`;
}

export async function getCartSummaryFromSession(session: any) {
    const raw = (await session?.get?.("cart")) ?? [];
    const cart: CartItemSession[] = Array.isArray(raw) ? raw : [];

    if (cart.length === 0) {
        return {
            items: [],
            subtotalCents: 0,
            currency: "EUR" as const,
        };
    }

    const productIds = [...new Set(cart.map((i) => i.productId))];
    const variantIds = [...new Set(cart.map((i) => i.variantId).filter(Boolean) as number[])];

    const allModifierOptionIds = [...new Set(cart.flatMap((i) => i.modifierOptionIds ?? []))];
    const allAddedIngredientIds = [...new Set(cart.flatMap((i) => i.addedIngredientIds ?? []))];
    const allRemovedIngredientIds = [...new Set(cart.flatMap((i) => i.removedIngredientIds ?? []))];
    const allIngredientIds = [...new Set([...allAddedIngredientIds, ...allRemovedIngredientIds])];

    // Products
    const products = await db
        .select({
            id: Product.id,
            name: Product.name,
            priceCents: Product.priceCents,
            imageUrl: Product.imageUrl,
        })
        .from(Product)
        .where(inArray(Product.id, productIds));

    const productById = new Map(products.map((p) => [p.id, p]));

    // Variants
    const variants = variantIds.length
        ? await db
            .select({
                id: ProductVariant.id,
                name: ProductVariant.name,
                priceDeltaCents: ProductVariant.priceDeltaCents,
            })
            .from(ProductVariant)
            .where(inArray(ProductVariant.id, variantIds))
        : [];

    const variantById = new Map(variants.map((v) => [v.id, v]));

    // Modifier options (with group name)
    const optionRows = allModifierOptionIds.length
        ? await db
            .select({
                id: ModifierOption.id,
                name: ModifierOption.name,
                priceDeltaCents: ModifierOption.priceDeltaCents,
                groupId: ModifierOption.groupId,
                groupName: ModifierGroup.name,
            })
            .from(ModifierOption)
            .innerJoin(ModifierGroup, eq(ModifierOption.groupId, ModifierGroup.id))
            .where(inArray(ModifierOption.id, allModifierOptionIds))
        : [];

    const optById = new Map(optionRows.map((o) => [o.id, o]));

    // Ingredients
    const ingRows = allIngredientIds.length
        ? await db
            .select({
                id: Ingredient.id,
                name: Ingredient.name,
                addPriceDeltaCents: Ingredient.addPriceDeltaCents,
            })
            .from(Ingredient)
            .where(inArray(Ingredient.id, allIngredientIds))
        : [];

    const ingById = new Map(ingRows.map((x) => [x.id, x]));

    let subtotalCents = 0;

    const items = cart.map((ci) => {
        const p = productById.get(ci.productId);
        const v = ci.variantId ? variantById.get(ci.variantId) : null;

        const qty = ci.qty ?? 1;

        // Base (product + variant)
        const baseUnitCents = (p?.priceCents ?? 0) + (v?.priceDeltaCents ?? 0);

        // --- MODIFIERS ---
        let modifiersDelta = 0;
        const modifierDetails: ModifierDetail[] = [];

        for (const optId of ci.modifierOptionIds ?? []) {
            const opt = optById.get(optId);
            if (!opt) continue;

            const d = opt.priceDeltaCents ?? 0;
            modifiersDelta += d;

            modifierDetails.push({
                id: opt.id,
                name: opt.name,
                deltaCents: d,
                groupName: opt.groupName,
            });
        }

        // --- ADDED INGREDIENTS ---
        let addedDelta = 0;
        const addedIngredientDetails: IngredientDetail[] = [];

        for (const ingId of ci.addedIngredientIds ?? []) {
            const ing = ingById.get(ingId);
            if (!ing) continue;

            const d = ADDED_COMMON_INGREDIENT_CENTS;
            addedDelta += d;

            addedIngredientDetails.push({
                id: ing.id,
                name: ing.name,
                deltaCents: d,
            });
        }

        // --- REMOVED INGREDIENTS ---
        const removedIngredientNames: string[] = [];
        for (const ingId of ci.removedIngredientIds ?? []) {
            const ing = ingById.get(ingId);
            if (!ing) continue;
            removedIngredientNames.push(ing.name);
        }

        // Totals
        const unitPriceCents = baseUnitCents + modifiersDelta + addedDelta;
        const lineTotalCents = unitPriceCents * qty;

        const baseLineTotalCents = baseUnitCents * qty;

        subtotalCents += lineTotalCents;

        // Compat (strings)
        const modifierLines = modifierDetails.map(
            (m) => `+ ${m.name}${m.deltaCents ? ` (+${money(m.deltaCents)})` : ""}`
        );
        const addedLines = addedIngredientDetails.map(
            (a) => `+ ${a.name}${a.deltaCents ? ` (+${money(a.deltaCents)})` : ""}`
        );
        const removedLines = removedIngredientNames.map((n) => `- ${n}`);

        return {
            lineId: ci.lineId,
            productId: ci.productId,
            name: p?.name ?? `Producto #${ci.productId}`,
            imageUrl: p?.imageUrl ?? null,
            qty,

            baseUnitCents,
            baseLineTotalCents,

            unitPriceCents,
            lineTotalCents,

            variantLabel: v?.name ?? null,

            modifierDetails,
            addedIngredientDetails,

            modifierLines,
            addedLines,
            removedLines,

            notes: ci.notes ?? null,
        };
    });

    return { items, subtotalCents, currency: "EUR" as const };
}
