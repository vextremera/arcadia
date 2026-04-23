import {
    db,
    User,
    Category,
    Product,
    Ingredient,
    ProductIngredient,
    CategoryIngredient,
    ModifierGroup,
    ModifierOption,
    ProductModifierGroup,
    UpsellItem,
    Order,
    OrderItem,
    Payment,
    Refund,
    LoyaltyLedger,
    eq,
} from "astro:db";
import { readdir } from "node:fs/promises";
import path from "node:path";

import seedRuntime from "./seed.runtime";
import fullSeed from "./seed";

const NON_CUSTOMIZABLE_CATEGORY_SLUGS = new Set([
    "platos-infantiles",
    "platos-combinados",
    "tapas",
    "croquetas",
    "montaditos",
]);

const SAUCE_OPTION_NAMES = [
    "Ketchup",
    "Mayonesa",
    "Salsa Amarilla",
    "Alioli",
    "Barbacoa",
    "Salsa Cheddar",
    "Salsa César",
    "Salsa Griega",
    "Salsa Sioux",
    "Salsa Zen",
    "Salsa Bhuda",
    "Salsa Cajún",
    "Mayo Vegana",
];

const UPSELL_DEFAULT_PRODUCT_NAMES = [
    "Agua",
    "Coca-Cola",
    "Coca-Cola Zero",
    "Fanta Naranja",
    "Nestea Limón",
    "Patatas Bravas",
    "Patatas Loki",
    "Patatas Teja",
    "Patatas Ninja",
];

function slugify(input: string) {
    return input
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ñ/gi, "n")
        .toLowerCase()
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

function stripExtension(filename: string) {
    return filename.replace(/\.[^.]+$/g, "");
}

function safeImageUrl(filename: string) {
    return `/images/products/${encodeURIComponent(filename)}`;
}

function safeIngredientImageUrl(filename: string) {
    return `/images/ingredients/${encodeURIComponent(filename)}`;
}

function normalizeSlugForMatch(input: string) {
    const stopwords = new Set([
        "de",
        "del",
        "la",
        "las",
        "los",
        "con",
        "y",
        "en",
        "al",
        "a",
    ]);

    return slugify(input)
        .split("-")
        .filter((part) => part && !stopwords.has(part))
        .join("-");
}

function isIngredientCommonForCategory(count: number) {
    return count >= 2;
}

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
        "salsa",
        "salsas",
    ].some((part) => hay.includes(part));
}

async function buildProductImageIndex() {
    const dir = path.join(process.cwd(), "public", "images", "products");

    let files: string[] = [];
    try {
        files = await readdir(dir);
    } catch {
        console.warn(`⚠️ Bootstrap: no se pudo leer ${dir}.`);
        return new Map<string, string>();
    }

    const map = new Map<string, string>();

    const alias: Record<string, string> = {
        "wrap-flashdance": "wrap-flasdance",
        "wrap-forrest-gump": "wrap-forres-gump",
    };

    for (const file of files) {
        if (!/\.(webp|png|jpg|jpeg)$/i.test(file)) continue;

        const base = stripExtension(file);
        const imgSlug = slugify(base);
        const norm = normalizeSlugForMatch(imgSlug);

        if (!map.has(imgSlug)) map.set(imgSlug, file);
        if (!map.has(norm)) map.set(norm, file);

        const aliased = alias[imgSlug];
        if (aliased && !map.has(aliased)) map.set(aliased, file);
    }

    return map;
}

async function buildIngredientImageIndex() {
    const dir = path.join(process.cwd(), "public", "images", "ingredients");

    let files: string[] = [];
    try {
        files = await readdir(dir);
    } catch {
        console.warn(`⚠️ Bootstrap: no se pudo leer ${dir}.`);
        return new Map<string, string>();
    }

    const map = new Map<string, string>();

    for (const file of files) {
        if (!/\.(svg|webp|png|jpg|jpeg)$/i.test(file)) continue;

        const base = stripExtension(file);
        const slug = slugify(base);
        const norm = normalizeSlugForMatch(slug);

        if (!map.has(slug)) map.set(slug, file);
        if (!map.has(norm)) map.set(norm, file);
    }

    return map;
}

function resolveProductImageUrl(productSlug: string, imageIndex: Map<string, string>) {
    const direct = imageIndex.get(productSlug);
    if (direct) return safeImageUrl(direct);

    const norm = normalizeSlugForMatch(productSlug);
    const viaNorm = imageIndex.get(norm);
    if (viaNorm) return safeImageUrl(viaNorm);

    const suffix = `-${norm}`;
    let found: string | null = null;
    let count = 0;

    for (const [imgSlug, filename] of imageIndex.entries()) {
        if (imgSlug.endsWith(suffix)) {
            found = filename;
            count++;
            if (count > 1) break;
        }
    }

    if (count === 1 && found) return safeImageUrl(found);
    return null;
}

function resolveIngredientImageUrl(
    name: string,
    slug: string,
    imageIndex: Map<string, string>,
) {
    const direct = imageIndex.get(slug);
    if (direct) return safeIngredientImageUrl(direct);

    const norm = normalizeSlugForMatch(slug);
    const viaNorm = imageIndex.get(norm);
    if (viaNorm) return safeIngredientImageUrl(viaNorm);

    const hay = `${name} ${slug}`.toLowerCase();

    if (isSauceIngredient({ name, slug })) {
        const file = imageIndex.get("salsas");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("queso")) {
        const file = imageIndex.get("queso");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("cebolla")) {
        const file = imageIndex.get("cebolla");
        if (file) return safeIngredientImageUrl(file);
    }

    if (
        hay.includes("lechuga") ||
        hay.includes("brotes-de-lechuga") ||
        hay.includes("brotes-de-ensalada")
    ) {
        const file = imageIndex.get("lechuga");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("tomate")) {
        const file = imageIndex.get("tomate");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("huevo-duro")) {
        const file = imageIndex.get("huevo-duro");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("huevo")) {
        const file = imageIndex.get("huevo-frito");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("pimiento-rojo") || hay.includes("piquillo")) {
        const file = imageIndex.get("pimiento-rojo");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("pimiento-verde")) {
        const file = imageIndex.get("pimiento-verde");
        if (file) return safeIngredientImageUrl(file);
    }

    if (
        hay.includes("picante") ||
        hay.includes("jalap") ||
        hay.includes("guindilla") ||
        hay.includes("chili")
    ) {
        const file = imageIndex.get("picante");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("pollo")) {
        const file = imageIndex.get("pollo");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("beicon") || hay.includes("bacon")) {
        const file = imageIndex.get("beicon");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("frankfurt")) {
        const file = imageIndex.get("frankfurt");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("jamon") || hay.includes("jamón")) {
        const file = imageIndex.get("jamon-salado");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("pan-de-molde") || hay.includes("pan-molde")) {
        const file = imageIndex.get("pan-molde");
        if (file) return safeIngredientImageUrl(file);
    }

    if (hay.includes("patatas") || hay.includes("patata")) {
        const file = imageIndex.get("patatas-fritas");
        if (file) return safeIngredientImageUrl(file);
    }

    if (
        hay.includes("carne") ||
        hay.includes("hamburguesa") ||
        hay.includes("pulled-pork") ||
        hay.includes("pulled pork") ||
        hay.includes("lomo") ||
        hay.includes("butifarra") ||
        hay.includes("kebab") ||
        hay.includes("pincho") ||
        hay.includes("atun") ||
        hay.includes("atún") ||
        hay.includes("heura") ||
        hay.includes("calamar")
    ) {
        const file = imageIndex.get("carne");
        if (file) return safeIngredientImageUrl(file);
    }

    const placeholder = imageIndex.get("placeholder");
    if (placeholder) return safeIngredientImageUrl(placeholder);

    return "/images/ingredients/placeholder.svg";
}

async function getNextId(table: any, idColumn: any) {
    const rows = await db.select({ id: idColumn }).from(table);
    return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

async function hasAny(table: any, idColumn: any) {
    const rows = await db.select({ id: idColumn }).from(table).limit(1);
    return rows.length > 0;
}

async function shouldRunFreshFullSeed() {
    const [
        hasUsers,
        hasCategories,
        hasProducts,
        hasIngredients,
        hasOrders,
        hasOrderItems,
        hasPayments,
        hasRefunds,
        hasLedger,
    ] = await Promise.all([
        hasAny(User, User.id),
        hasAny(Category, Category.id),
        hasAny(Product, Product.id),
        hasAny(Ingredient, Ingredient.id),
        hasAny(Order, Order.id),
        hasAny(OrderItem, OrderItem.id),
        hasAny(Payment, Payment.id),
        hasAny(Refund, Refund.id),
        hasAny(LoyaltyLedger, LoyaltyLedger.id),
    ]);

    const freshCatalogMissing = !hasCategories && !hasProducts && !hasIngredients;
    const noOperationalData = !hasOrders && !hasOrderItems && !hasPayments && !hasRefunds && !hasLedger;
    const noUsers = !hasUsers;

    return freshCatalogMissing && noOperationalData && noUsers;
}

async function syncProductImages() {
    const imageIndex = await buildProductImageIndex();
    if (imageIndex.size === 0) return 0;

    const products = await db
        .select({
            id: Product.id,
            slug: Product.slug,
            imageUrl: Product.imageUrl,
        })
        .from(Product);

    let updated = 0;

    for (const product of products) {
        const resolved = resolveProductImageUrl(String(product.slug), imageIndex);
        if (!resolved) continue;

        const current = product.imageUrl ? String(product.imageUrl) : null;
        const canOverwrite =
            !current ||
            current.startsWith("/images/products/");

        if (!canOverwrite) continue;
        if (current === resolved) continue;

        await db
            .update(Product)
            .set({ imageUrl: resolved })
            .where(eq(Product.id, product.id));

        updated++;
    }

    return updated;
}

async function syncIngredientImages() {
    const imageIndex = await buildIngredientImageIndex();
    if (imageIndex.size === 0) return 0;

    const ingredients = await db
        .select({
            id: Ingredient.id,
            name: Ingredient.name,
            slug: Ingredient.slug,
            imageUrl: Ingredient.imageUrl,
        })
        .from(Ingredient);

    let updated = 0;

    for (const ingredient of ingredients) {
        const resolved = resolveIngredientImageUrl(
            String(ingredient.name),
            String(ingredient.slug),
            imageIndex,
        );

        const current = ingredient.imageUrl ? String(ingredient.imageUrl) : null;
        const canOverwrite =
            !current ||
            current === "/images/ingredients/placeholder.svg" ||
            current.startsWith("/images/ingredients/");

        if (!canOverwrite) continue;
        if (current === resolved) continue;

        await db
            .update(Ingredient)
            .set({ imageUrl: resolved })
            .where(eq(Ingredient.id, ingredient.id));

        updated++;
    }

    return updated;
}

async function syncCategoryIngredients() {
    const categoryRows = await db
        .select({
            id: Category.id,
            slug: Category.slug,
        })
        .from(Category);

    const categoryIdToSlug = new Map(
        categoryRows.map((row) => [Number(row.id), String(row.slug)]),
    );

    const productRows = await db
        .select({
            id: Product.id,
            categoryId: Product.categoryId,
        })
        .from(Product);

    const productToCategoryId = new Map(
        productRows.map((row) => [Number(row.id), Number(row.categoryId)]),
    );

    const ingredientRows = await db
        .select({
            id: Ingredient.id,
            slug: Ingredient.slug,
            name: Ingredient.name,
        })
        .from(Ingredient);

    const ingredientById = new Map(
        ingredientRows.map((row) => [Number(row.id), row]),
    );

    const productIngredientRows = await db
        .select({
            productId: ProductIngredient.productId,
            ingredientId: ProductIngredient.ingredientId,
        })
        .from(ProductIngredient);

    const categoryIngredientCounts = new Map<string, number>();

    for (const row of productIngredientRows) {
        const categoryId = productToCategoryId.get(Number(row.productId));
        if (!categoryId) continue;

        const categorySlug = categoryIdToSlug.get(categoryId);
        if (!categorySlug) continue;
        if (NON_CUSTOMIZABLE_CATEGORY_SLUGS.has(categorySlug)) continue;

        const ingredient = ingredientById.get(Number(row.ingredientId));
        if (!ingredient) continue;
        if (isSauceIngredient(ingredient)) continue;

        const key = `${categoryId}:${row.ingredientId}`;
        categoryIngredientCounts.set(key, (categoryIngredientCounts.get(key) ?? 0) + 1);
    }

    const existingRows = await db
        .select({
            categoryId: CategoryIngredient.categoryId,
            ingredientId: CategoryIngredient.ingredientId,
        })
        .from(CategoryIngredient);

    const existingKeys = new Set(
        existingRows.map((row) => `${Number(row.categoryId)}:${Number(row.ingredientId)}`),
    );

    const missingRows: Array<{ categoryId: number; ingredientId: number }> = [];

    for (const [key, count] of categoryIngredientCounts.entries()) {
        if (!isIngredientCommonForCategory(count)) continue;
        if (existingKeys.has(key)) continue;

        const [categoryIdRaw, ingredientIdRaw] = key.split(":");
        const categoryId = Number(categoryIdRaw);
        const ingredientId = Number(ingredientIdRaw);

        if (!Number.isFinite(categoryId) || !Number.isFinite(ingredientId)) continue;
        missingRows.push({ categoryId, ingredientId });
    }

    if (missingRows.length > 0) {
        await db.insert(CategoryIngredient).values(missingRows);
    }

    return missingRows.length;
}

async function ensureSauceExtras() {
    const categoryRows = await db
        .select({
            id: Category.id,
            slug: Category.slug,
        })
        .from(Category);

    const categoryIdToSlug = new Map(
        categoryRows.map((row) => [Number(row.id), String(row.slug)]),
    );

    const [existingGroup] = await db
        .select({
            id: ModifierGroup.id,
            name: ModifierGroup.name,
            minSelect: ModifierGroup.minSelect,
            maxSelect: ModifierGroup.maxSelect,
            required: ModifierGroup.required,
            sortOrder: ModifierGroup.sortOrder,
            active: ModifierGroup.active,
        })
        .from(ModifierGroup)
        .where(eq(ModifierGroup.name, "Salsas"))
        .limit(1);

    let sauceGroupId: number;

    if (existingGroup) {
        sauceGroupId = Number(existingGroup.id);

        await db
            .update(ModifierGroup)
            .set({
                minSelect: 0,
                maxSelect: 20,
                required: false,
                sortOrder: 10,
                active: true,
            })
            .where(eq(ModifierGroup.id, sauceGroupId));
    } else {
        sauceGroupId = await getNextId(ModifierGroup, ModifierGroup.id);

        await db.insert(ModifierGroup).values({
            id: sauceGroupId,
            name: "Salsas",
            minSelect: 0,
            maxSelect: 20,
            required: false,
            sortOrder: 10,
            active: true,
        });
    }

    const existingOptions = await db
        .select({
            id: ModifierOption.id,
            groupId: ModifierOption.groupId,
            name: ModifierOption.name,
        })
        .from(ModifierOption);

    const existingOptionsByName = new Map(
        existingOptions
            .filter((row) => Number(row.groupId) === sauceGroupId)
            .map((row) => [String(row.name), Number(row.id)]),
    );

    let nextOptionId = await getNextId(ModifierOption, ModifierOption.id);
    let createdOptions = 0;

    for (let index = 0; index < SAUCE_OPTION_NAMES.length; index++) {
        const name = SAUCE_OPTION_NAMES[index];
        const existingId = existingOptionsByName.get(name);

        if (existingId) {
            await db
                .update(ModifierOption)
                .set({
                    priceDeltaCents: 50,
                    sortOrder: index + 1,
                    active: true,
                })
                .where(eq(ModifierOption.id, existingId));
            continue;
        }

        await db.insert(ModifierOption).values({
            id: nextOptionId++,
            groupId: sauceGroupId,
            name,
            priceDeltaCents: 50,
            sortOrder: index + 1,
            active: true,
        });

        createdOptions++;
    }

    const allProducts = await db
        .select({
            id: Product.id,
            categoryId: Product.categoryId,
        })
        .from(Product);

    const existingLinks = await db
        .select({
            id: ProductModifierGroup.id,
            productId: ProductModifierGroup.productId,
            groupId: ProductModifierGroup.groupId,
        })
        .from(ProductModifierGroup);

    const existingLinkKeys = new Set(
        existingLinks.map((row) => `${Number(row.productId)}:${Number(row.groupId)}`),
    );

    let nextLinkId = await getNextId(ProductModifierGroup, ProductModifierGroup.id);
    const missingLinks: Array<{
        id: number;
        productId: number;
        groupId: number;
        sortOrder: number;
    }> = [];

    for (const product of allProducts) {
        const categorySlug = categoryIdToSlug.get(Number(product.categoryId)) ?? "";
        if (categorySlug === "bebidas") continue;

        const key = `${Number(product.id)}:${sauceGroupId}`;
        if (existingLinkKeys.has(key)) continue;

        missingLinks.push({
            id: nextLinkId++,
            productId: Number(product.id),
            groupId: sauceGroupId,
            sortOrder: 10,
        });
    }

    if (missingLinks.length > 0) {
        await db.insert(ProductModifierGroup).values(missingLinks);
    }

    return {
        groupId: sauceGroupId,
        createdOptions,
        linkedProducts: missingLinks.length,
    };
}

async function ensureUpsellDefaults() {
    const products = await db
        .select({
            id: Product.id,
            name: Product.name,
            active: Product.active,
        })
        .from(Product);

    const existingUpsell = await db
        .select({
            id: UpsellItem.id,
            productId: UpsellItem.productId,
        })
        .from(UpsellItem);

    const existingByProductId = new Map(
        existingUpsell.map((row) => [Number(row.productId), Number(row.id)]),
    );

    let nextUpsellId = await getNextId(UpsellItem, UpsellItem.id);
    let created = 0;
    let updated = 0;

    for (let index = 0; index < UPSELL_DEFAULT_PRODUCT_NAMES.length; index++) {
        const targetName = UPSELL_DEFAULT_PRODUCT_NAMES[index];
        const product = products.find(
            (row) => Boolean(row.active) && String(row.name) === targetName,
        );
        if (!product) continue;

        const existingId = existingByProductId.get(Number(product.id));

        if (existingId) {
            await db
                .update(UpsellItem)
                .set({
                    sortOrder: index + 1,
                    active: true,
                })
                .where(eq(UpsellItem.id, existingId));
            updated++;
            continue;
        }

        await db.insert(UpsellItem).values({
            id: nextUpsellId++,
            productId: Number(product.id),
            sortOrder: index + 1,
            active: true,
            createdAt: new Date(),
        });

        created++;
    }

    return { created, updated };
}

export default async function bootstrap() {
    const runFullSeed = await shouldRunFreshFullSeed();

    if (runFullSeed) {
        console.log("🌱 Bootstrap: base vacía detectada. Ejecutando seed completo una sola vez...");
        await fullSeed();
    } else {
        console.log("🛡️ Bootstrap: base existente detectada. Saltando seed destructivo.");
    }

    await seedRuntime();

    const [productsUpdated, ingredientsUpdated, categoryIngredientsInserted, sauceResult, upsellResult] =
        await Promise.all([
            syncProductImages(),
            syncIngredientImages(),
            syncCategoryIngredients(),
            ensureSauceExtras(),
            ensureUpsellDefaults(),
        ]);

    console.log(
        [
            "✅ Bootstrap remoto listo.",
            `Productos con imagen sincronizada: ${productsUpdated}`,
            `Ingredientes con imagen sincronizada: ${ingredientsUpdated}`,
            `CategoryIngredient insertados: ${categoryIngredientsInserted}`,
            `Grupo salsas: ${sauceResult.groupId}, opciones nuevas: ${sauceResult.createdOptions}, enlaces nuevos: ${sauceResult.linkedProducts}`,
            `Upsell por defecto: creados ${upsellResult.created}, actualizados ${upsellResult.updated}`,
        ].join(" "),
    );
}