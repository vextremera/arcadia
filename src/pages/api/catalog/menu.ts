import type { APIRoute } from "astro";
import {
    db,
    Category,
    Product,
    ProductIngredient,
    Ingredient,
    ProductVariant,
    ProductModifierGroup,
    and,
    asc,
    eq,
    inArray,
} from "astro:db";

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

/**
 * Devuelve el menú completo (categorías activas + productos activos) en una sola llamada.
 * Pensado para /pedir (UX tipo app) evitando N requests por categoría.
 */
export const GET: APIRoute = async () => {
    const categories = await db
        .select({
            id: Category.id,
            name: Category.name,
            slug: Category.slug,
            sortOrder: Category.sortOrder,
        })
        .from(Category)
        .where(eq(Category.active, true))
        .orderBy(asc(Category.sortOrder));

    if (categories.length === 0) return json({ categories: [] });

    const categoryIds = categories.map((c) => c.id);

    const products = await db
        .select({
            id: Product.id,
            categoryId: Product.categoryId,
            name: Product.name,
            description: Product.description,
            imageUrl: Product.imageUrl,
            priceCents: Product.priceCents,
            deliveryEnabled: Product.deliveryEnabled,
            pickupEnabled: Product.pickupEnabled,
        })
        .from(Product)
        .where(and(inArray(Product.categoryId, categoryIds), eq(Product.active, true)))
        .orderBy(asc(Product.categoryId), asc(Product.name));

    if (products.length === 0) {
        return json({
            categories: categories.map((c) => ({ ...c, products: [] })),
        });
    }

    const productIds = products.map((p) => p.id);

    // Ingredientes por defecto (solo para texto en tarjeta)
    const ingRows = await db
        .select({
            productId: ProductIngredient.productId,
            name: Ingredient.name,
            sortOrder: ProductIngredient.sortOrder,
        })
        .from(ProductIngredient)
        .innerJoin(Ingredient, eq(ProductIngredient.ingredientId, Ingredient.id))
        .where(
            and(
                inArray(ProductIngredient.productId, productIds),
                eq(ProductIngredient.defaultIncluded, true),
                eq(Ingredient.active, true)
            )
        )
        .orderBy(asc(ProductIngredient.productId), asc(ProductIngredient.sortOrder), asc(Ingredient.name));

    const ingByProduct = new Map<number, string[]>();
    for (const r of ingRows) {
        const arr = ingByProduct.get(r.productId) ?? [];
        arr.push(r.name);
        ingByProduct.set(r.productId, arr);
    }

    // Flags de configurabilidad para comportamiento del botón "+"
    const variantRows = await db
        .select({ productId: ProductVariant.productId })
        .from(ProductVariant)
        .where(and(inArray(ProductVariant.productId, productIds), eq(ProductVariant.active, true)));
    const hasVariants = new Set<number>(variantRows.map((r) => r.productId));

    const pmgRows = await db
        .select({ productId: ProductModifierGroup.productId })
        .from(ProductModifierGroup)
        .where(inArray(ProductModifierGroup.productId, productIds));
    const hasModifierGroups = new Set<number>(pmgRows.map((r) => r.productId));

    const removableRows = await db
        .select({ productId: ProductIngredient.productId })
        .from(ProductIngredient)
        .where(
            and(
                inArray(ProductIngredient.productId, productIds),
                eq(ProductIngredient.defaultIncluded, true),
                eq(ProductIngredient.removable, true)
            )
        );
    const hasRemovable = new Set<number>(removableRows.map((r) => r.productId));

    const productsOut = products.map((p) => ({
        ...p,
        ingredients: ingByProduct.get(p.id) ?? [],
        isConfigurable: hasVariants.has(p.id) || hasModifierGroups.has(p.id) || hasRemovable.has(p.id),
    }));

    const byCategory = new Map<number, typeof productsOut>();
    for (const p of productsOut) {
        const arr = byCategory.get(p.categoryId) ?? [];
        arr.push(p);
        byCategory.set(p.categoryId, arr);
    }

    return json({
        categories: categories.map((c) => ({
            ...c,
            products: byCategory.get(c.id) ?? [],
        })),
    });
};