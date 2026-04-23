// db/seed.ts
// =======================
// PART 1 — Base DB: limpieza + admin + categorías + alérgenos + helpers (slugs/imágenes)
// =======================

import {
  db,
  User,
  UserProfile,
  Category,
  Product,
  ProductVariant,
  ModifierGroup,
  ModifierOption,
  ProductModifierGroup,
  Order,
  OrderItem,
  Payment,
  Refund,
  Menu,
  MenuItem,
  Ingredient,
  ProductIngredient,
  Allergen,
  ProductAllergen,
  UpsellItem,
  CategoryIngredient,
  LoyaltyLedger,
  MenuDish,
  MenuDishAssignment,
  eq,
} from "astro:db";

import { hashPassword } from "@/server/auth/password";

import { readdir } from "node:fs/promises";
import path from "node:path";

const NON_CUSTOMIZABLE_CATEGORY_SLUGS = new Set([
  "platos-infantiles",
  "platos-combinados",
  "tapas",
  "croquetas",
  "montaditos",
]);

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

/** Helpers */
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

function cents(eur: number) {
  return Math.round(eur * 100);
}

function stripExtension(filename: string) {
  return filename.replace(/\.[^.]+$/g, "");
}

function safeImageUrl(filename: string) {
  // encode para espacios/paréntesis/+, etc.
  return `/images/products/${encodeURIComponent(filename)}`;
}

/**
 * Normalización “para matching” (imágenes vs slugs)
 * - quita stopwords como "con", "de", "la"...
 * - mantiene "y" porque a veces aparece en nombres/archivos
 */
function normalizeSlugForMatch(slug: string) {
  const STOP = new Set(["con", "de", "del", "la", "el", "los", "las", "a", "al"]);
  const parts = slug.split("-").filter(Boolean);
  return parts.filter((p) => !STOP.has(p)).join("-");
}

/** Construye un índice slug-imagen desde /public/images/products */
async function buildProductImageIndex() {
  const dir = path.join(process.cwd(), "public", "images", "products");

  let files: string[] = [];
  try {
    files = await readdir(dir);
  } catch {
    console.warn(`⚠️ Seed: no se pudo leer ${dir}. ¿Existe public/images/products?`);
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

const CATEGORY_PREFIX: Record<string, string> = {
  "menu-del-dia": "menu",
  "platos-combinados": "plato-combinado",
  tapas: "", // sin prefijo, normalmente no hay imágenes con "tapa-"
  croquetas: "croquetas",
  montaditos: "6-montaditos",
  nachos: "nachos",
  sandwiches: "sandwich",
  wraps: "wrap",
  baguettes: "baguette",
  "pan-de-coca": "pan-coca",
  "baguettes-de-marca": "baguette-marca",
  hamburguesas: "hamburguesa",
  frankfurts: "frankfurt",
  "platos-infantiles": "plato-infantil",
  ensaladas: "ensalada",
  bebidas: "bebida",
};

function makeUniqueProductSlug(
  args: { name: string; categorySlug: string },
  used: Set<string>
) {
  const base = slugify(args.name);
  const prefix = CATEGORY_PREFIX[args.categorySlug] ?? "";
  let slug = base;

  if (prefix) {
    // evita duplicar si el nombre ya empieza por el prefijo
    if (!base.startsWith(prefix + "-") && base !== prefix) {
      slug = `${prefix}-${base}`;
    }
  }

  if (!slug) slug = "producto";

  if (!used.has(slug)) {
    used.add(slug);
    return slug;
  }

  // resolver colisiones de forma estable
  const withCat = `${slug}-${slugify(args.categorySlug)}`;
  if (!used.has(withCat)) {
    used.add(withCat);
    return withCat;
  }

  let i = 2;
  while (used.has(`${slug}-${i}`)) i++;
  const finalSlug = `${slug}-${i}`;
  used.add(finalSlug);
  return finalSlug;
}

function resolveProductImageUrl(productSlug: string, imageIndex: Map<string, string>) {
  // 1) match directo
  const direct = imageIndex.get(productSlug);
  if (direct) return safeImageUrl(direct);

  // 2) match con normalización (sin stopwords)
  const norm = normalizeSlugForMatch(productSlug);
  const viaNorm = imageIndex.get(norm);
  if (viaNorm) return safeImageUrl(viaNorm);

  // 3) fallback por sufijo (por si el archivo incluye prefijo extra)
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

function isIngredientCommonForCategory(count: number) {
  return count >= 2;
}

/** Seed types */
type ProductSeed = {
  categorySlug: string;
  name: string;
  priceEur: number;

  // Texto corto para card/listado
  description?: string | null;

  // Texto largo para modal/SEO (nuevo campo Product.details)
  details?: string | null;

  // Ingredientes “por defecto” (ProductIngredient.defaultIncluded=true)
  ingredients?: string[];

  // Para el futuro: pan sin gluten, etc.
  panOption?: boolean;
};

/** Admin */
const ADMIN_EMAIL = "admin@arcadia.local";
const ADMIN_PASSWORD = "P@ssw0rd";

/** Categorías */
const CATEGORIES = [
  { id: 1, name: "Platos combinados", slug: "platos-combinados", sortOrder: 10 },
  { id: 2, name: "Tapas", slug: "tapas", sortOrder: 20 },
  { id: 3, name: "Croquetas", slug: "croquetas", sortOrder: 30 },
  { id: 4, name: "Montaditos", slug: "montaditos", sortOrder: 40 },
  { id: 5, name: "Nachos", slug: "nachos", sortOrder: 50 },
  { id: 6, name: "Sandwiches", slug: "sandwiches", sortOrder: 60 },
  { id: 7, name: "Wraps", slug: "wraps", sortOrder: 70 },
  { id: 8, name: "Baguettes", slug: "baguettes", sortOrder: 80 },
  { id: 9, name: "Pan de coca", slug: "pan-de-coca", sortOrder: 90 },
  { id: 10, name: "Baguettes de marca", slug: "baguettes-de-marca", sortOrder: 100 },

  { id: 11, name: "Hamburguesas", slug: "hamburguesas", sortOrder: 110 },
  { id: 12, name: "Frankfurts", slug: "frankfurts", sortOrder: 120 },
  { id: 13, name: "Platos infantiles", slug: "platos-infantiles", sortOrder: 130 },
  { id: 14, name: "Ensaladas", slug: "ensaladas", sortOrder: 140 },

  // Bebidas estándar
  { id: 15, name: "Bebidas", slug: "bebidas", sortOrder: 150 },
] as const;

/** 14 alérgenos (slugs alineados con /public/images/allergens/*.webp) */
const ALLERGENS = [
  { slug: "gluten", name: "Gluten", iconUrl: "/images/allergens/gluten.webp", sortOrder: 10 },
  { slug: "crustaceans", name: "Crustáceos", iconUrl: "/images/allergens/crustaceans.webp", sortOrder: 20 },
  { slug: "egg", name: "Huevo", iconUrl: "/images/allergens/egg.webp", sortOrder: 30 },
  { slug: "fish", name: "Pescado", iconUrl: "/images/allergens/fish.webp", sortOrder: 40 },
  { slug: "peanuts", name: "Cacahuetes", iconUrl: "/images/allergens/peanuts.webp", sortOrder: 50 },
  { slug: "soyabeans", name: "Soja", iconUrl: "/images/allergens/soyabeans.webp", sortOrder: 60 },
  { slug: "milk", name: "Lácteos", iconUrl: "/images/allergens/milk.webp", sortOrder: 70 },
  { slug: "treenuts", name: "Frutos de cáscara", iconUrl: "/images/allergens/treenuts.webp", sortOrder: 80 },
  { slug: "celery", name: "Apio", iconUrl: "/images/allergens/celery.webp", sortOrder: 90 },
  { slug: "mustard", name: "Mostaza", iconUrl: "/images/allergens/mustard.webp", sortOrder: 100 },
  { slug: "sesame", name: "Sésamo", iconUrl: "/images/allergens/sesame.webp", sortOrder: 110 },
  { slug: "so2", name: "Sulfitos", iconUrl: "/images/allergens/so2.webp", sortOrder: 120 },
  { slug: "lupin", name: "Altramuces", iconUrl: "/images/allergens/lupin.webp", sortOrder: 130 },
  { slug: "molluscs", name: "Moluscos", iconUrl: "/images/allergens/molluscs.webp", sortOrder: 140 },
] as const;

/**
 * PART 1
 * - limpia tablas (incluye nuevas)
 * - crea/asegura admin
 * - inserta categorías
 * - inserta alérgenos (14)
 *
 * PART 2
 * - catálogo completo (151 productos PDF + bebidas estándar)
 * - ingredientes + ProductIngredient
 * - Product.details + description
 * - slugs estables + imageUrl por matching
 * - ProductAllergen inferido
 * - (mantendremos compatibilidad con configurador)
 */
export default async function seed() {
  // -----------------------
  // Limpieza mínima idempotente (orden FK real)
  // -----------------------
  await db.delete(MenuDishAssignment);
  await db.delete(MenuDish);

  await db.delete(MenuItem);
  await db.delete(Menu);

  await db.delete(Refund);
  await db.delete(Payment);

  await db.delete(OrderItem);
  await db.delete(LoyaltyLedger);
  await db.delete(Order);

  await db.delete(UpsellItem);
  await db.delete(ProductAllergen);
  await db.delete(ProductModifierGroup);
  await db.delete(ProductIngredient);
  await db.delete(CategoryIngredient);
  await db.delete(ProductVariant);

  await db.delete(ModifierOption);
  await db.delete(ModifierGroup);

  await db.delete(Product);

  await db.delete(Allergen);
  await db.delete(Ingredient);

  await db.delete(Category);

  // -----------------------
  // Admin default (solo si no existe)
  // -----------------------
  const existingAdmin = await db
    .select({ id: User.id })
    .from(User)
    .where(eq(User.email, ADMIN_EMAIL))
    .limit(1);

  if (!existingAdmin.length) {
    const passwordHash = await hashPassword(ADMIN_PASSWORD);

    await db.insert(User).values({
      email: ADMIN_EMAIL,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      active: true,
    });

    try {
      const [adminRow] = await db
        .select({ id: User.id })
        .from(User)
        .where(eq(User.email, ADMIN_EMAIL))
        .limit(1);

      if (adminRow?.id) {
        await db.insert(UserProfile).values({
          userId: adminRow.id,
          pointsBalance: 0,
        });
      }
    } catch {
      // best-effort
    }

    console.log(`✅ Seed: creado admin ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    // console.log(`ℹ️ Seed: admin ya existe (${ADMIN_EMAIL})`);
  }

  // -----------------------
  // Categorías
  // -----------------------
  await db.insert(Category).values(
    CATEGORIES.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      active: true,
      imageUrl: null,
    }))
  );

  // ✅ Categoría interna para productos de menú (NO aparece en /carta ni /pedir)
  const MENU_CATEGORY_ID = 16;

  await db.insert(Category).values({
    id: MENU_CATEGORY_ID,
    name: "Menú del día",
    slug: "menu-del-dia",
    sortOrder: 9999,
    active: false,
    imageUrl: null,
  });

  // -----------------------
  // Alérgenos (14)
  // -----------------------
  await db.insert(Allergen).values(
    ALLERGENS.map((a, idx) => ({
      id: idx + 1,
      slug: a.slug,
      name: a.name,
      iconUrl: a.iconUrl,
      sortOrder: a.sortOrder,
      active: true,
    }))
  );

  // ==========================================================
  // PART 2/?? — Productos + ingredientes + alérgenos por producto + imágenes por slug
  // ==========================================================

  // Lookups
  const categoryRows = await db.select({ id: Category.id, slug: Category.slug }).from(Category);
  const categoryIdBySlug = new Map<string, number>(categoryRows.map((r) => [r.slug, r.id]));

  const allergenRows = await db.select({ id: Allergen.id, slug: Allergen.slug }).from(Allergen);
  const allergenIdBySlug = new Map<string, number>(allergenRows.map((r) => [r.slug, r.id]));

  const imageIndex = await buildProductImageIndex();

  function inferAllergenSlugs(p: ProductSeed) {
    const set = new Set<string>();
    const hay = `${p.name} ${(p.details ?? "")} ${(p.ingredients ?? []).join(", ")}`.toLowerCase();

    // Pan/tortilla por categorías (gluten)
    const breadCats = new Set([
      "baguettes",
      "baguettes-de-marca",
      "pan-de-coca",
      "sandwiches",
      "wraps",
      "hamburguesas",
      "frankfurts",
      "montaditos",
    ]);
    if (breadCats.has(p.categorySlug)) set.add("gluten");

    // Lácteos
    if (/(queso|cheddar|roquefort|parmesano|cab(a|á)ra|fresco)/i.test(hay)) set.add("milk");

    // Huevo
    if (/(huevo|mahonesa|mayonesa|mayo)/i.test(hay)) set.add("egg");

    // Pescado
    if (/(at(u|ú)n|salmon|salm(o|ó)n|boqueron|boquer(o|ó)n)/i.test(hay)) set.add("fish");

    // Moluscos
    if (/(calamar|chipiron|chipir(o|ó)n|mejillon|mejill(o|ó)n|sepia|pulpo)/i.test(hay)) set.add("molluscs");

    // Crustáceos
    if (/(gamba|langost)/i.test(hay)) set.add("crustaceans");

    // Soja (Heura)
    if (/(heura|soja)/i.test(hay)) set.add("soyabeans");

    // Frutos secos
    if (/(nuez|nueces|almendra|avellana)/i.test(hay)) set.add("treenuts");

    // Sulfitos (Módena suele llevar sulfitos)
    if (/(modena|m(o|ó)dena|sulfito|sulfitos)/i.test(hay)) set.add("so2");

    return [...set];
  }

  function isRemovableByCategory(categorySlug: string) {
    // Queremos quick-add para nachos + platos combinados (por ahora)
    if (categorySlug === "platos-combinados") return false;
    if (categorySlug === "nachos") return false;

    // En pan: normalmente sí se puede quitar ingredientes
    if (categorySlug === "pan-de-coca") return true;
    if (categorySlug === "baguettes-de-marca") return true;

    return true;
  }

  // ----------------------------------------------------------
  // Productos (subset inicial: 42)
  // ----------------------------------------------------------
  const PRODUCTS: ProductSeed[] = [
    // Platos combinados (15) — del PDF
    { categorySlug: "platos-combinados", name: "1.- Lomo a la Plancha, Patatas y Huevo Frito", priceEur: 12.20, description: "Plato combinado nº1.", details: "Lomo a la Plancha, Patatas y Huevo Frito", ingredients: ["Lomo a la Plancha", "Patatas", "Huevo Frito"] },
    { categorySlug: "platos-combinados", name: "2.- Pechuga de Pollo Plancha, Patatas y Ensalada", priceEur: 12.20, description: "Plato combinado nº2.", details: "Pechuga de Pollo Plancha, Patatas y Ensalada", ingredients: ["Pechuga de Pollo Plancha", "Patatas", "Ensalada"] },
    { categorySlug: "platos-combinados", name: "3.- Escalopa de Pollo, Ensalada y Huevo Frito", priceEur: 12.20, description: "Plato combinado nº3.", details: "Escalopa de Pollo, Ensalada y Huevo Frito", ingredients: ["Escalopa de Pollo", "Ensalada", "Huevo Frito"] },
    { categorySlug: "platos-combinados", name: "4.- 2 Hamburguesas, Croquetas y Patatas Fritas", priceEur: 11.50, description: "Plato combinado nº4.", details: "2 Hamburguesas, Croquetas y Patatas Fritas", ingredients: ["2 Hamburguesas", "Croquetas", "Patatas Fritas"] },
    { categorySlug: "platos-combinados", name: "5.- Calamares a la Andaluza, Ensalada y Champiñones", priceEur: 12.50, description: "Plato combinado nº5.", details: "Calamares a la Andaluza, Ensalada y Champiñones", ingredients: ["Calamares a la Andaluza", "Ensalada", "Champiñones"] },
    { categorySlug: "platos-combinados", name: "6.- Hamburguesa, Frankfurt, Patatas y Huevo", priceEur: 11.60, description: "Plato combinado nº6.", details: "Hamburguesa, Frankfurt, Patatas y Huevo", ingredients: ["Hamburguesa", "Frankfurt", "Patatas", "Huevo"] },
    { categorySlug: "platos-combinados", name: "7.- Butifarra de Pagés, Ensalada y 2 Huevos", priceEur: 11.30, description: "Plato combinado nº7.", details: "Butifarra de Pagés, Ensalada y 2 Huevos", ingredients: ["Butifarra de Pagés", "Ensalada", "2 Huevos"] },
    { categorySlug: "platos-combinados", name: "8.- 8 Lonchas Bacon, 2 Huevos, Patatas y Croquetas", priceEur: 10.90, description: "Plato combinado nº8.", details: "8 Lonchas Bacon, 2 Huevos, Patatas y Croquetas", ingredients: ["8 Lonchas Bacon", "2 Huevos", "Patatas", "Croquetas"] },
    { categorySlug: "platos-combinados", name: "9.- Calamares a la Plancha, Ensalada y Arroz", priceEur: 13.50, description: "Plato combinado nº9.", details: "Calamares a la Plancha, Ensalada y Arroz", ingredients: ["Calamares a la Plancha", "Ensalada", "Arroz"] },
    { categorySlug: "platos-combinados", name: "10.- Carne Kebab, Arroz, Tomate y Cebolla", priceEur: 12.20, description: "Plato combinado nº10.", details: "Carne Kebab, Arroz, Tomate y Cebolla", ingredients: ["Carne Kebab", "Arroz", "Tomate", "Cebolla"] },
    { categorySlug: "platos-combinados", name: "11.- Pechuga de Pollo a la Plancha, Arroz y Huevo", priceEur: 12.50, description: "Plato combinado nº11.", details: "Pechuga de Pollo a la Plancha, Arroz y Huevo", ingredients: ["Pechuga de Pollo a la Plancha", "Arroz", "Huevo"] },
    { categorySlug: "platos-combinados", name: "12.- Calamares a la Andaluza, Patatas y Croquetas", priceEur: 12.50, description: "Plato combinado nº12.", details: "Calamares a la Andaluza, Patatas y Croquetas", ingredients: ["Calamares a la Andaluza", "Patatas", "Croquetas"] },
    { categorySlug: "platos-combinados", name: "13.- Escalopa de Pollo, Huevo y Patatas Fritas", priceEur: 12.20, description: "Plato combinado nº13.", details: "Escalopa de Pollo, Huevo y Patatas Fritas", ingredients: ["Escalopa de Pollo", "Huevo", "Patatas Fritas"] },
    { categorySlug: "platos-combinados", name: "14.- Escalopa de Pollo al Roquefort, Arroz y Huevo", priceEur: 12.90, description: "Plato combinado nº14.", details: "Escalopa de Pollo al Roquefort, Arroz y Huevo", ingredients: ["Escalopa de Pollo al Roquefort", "Arroz", "Huevo"] },
    { categorySlug: "platos-combinados", name: "15.- Arroz a la cubana (2 Huevos y Tomate)", priceEur: 9.90, description: "Plato combinado nº15.", details: "Arroz a la cubana (2 Huevos y Tomate)", ingredients: ["Arroz a la cubana (2 Huevos", "Tomate)"] },

    // Nachos (4) — del PDF (ingredientes interpretados del texto del bloque)
    { categorySlug: "nachos", name: "Sinaloa", priceEur: 8.20, description: "Nachos con cheddar, bacon, cebolla crujiente y jalapeños.", details: "Salsa Cheddar, Bacon, Cebolla Crujiente, Jalapeños", ingredients: ["Salsa Cheddar", "Bacon", "Cebolla Crujiente", "Jalapeños"] },
    { categorySlug: "nachos", name: "Yucatan", priceEur: 8.50, description: "Nachos con cheddar, pulled pork y salsa Sioux (pica pero poco).", details: "Salsa Cheddar, Pulled Pork, Salsa Sioux (Pica pero poco)", ingredients: ["Salsa Cheddar", "Pulled Pork", "Salsa Sioux"] },
    { categorySlug: "nachos", name: "Jalisco", priceEur: 8.90, description: "Nachos con cheddar, kebab, pico de gallo y guacamole.", details: "Salsa Cheddar, Carne de Kebab, Pico de Gallo, Mahonesa, Guacamole", ingredients: ["Salsa Cheddar", "Carne de Kebab", "Pico de Gallo", "Mahonesa", "Guacamole"] },
    { categorySlug: "nachos", name: "Veracruz", priceEur: 7.90, description: "Nachos con cheddar, pico de gallo, guacamole y salsa griega.", details: "Salsa Cheddar, Pico de Gallo, Guacamole, Salsa Griega", ingredients: ["Salsa Cheddar", "Pico de Gallo", "Guacamole", "Salsa Griega"] },

    // Pan de coca (7) — del PDF
    { categorySlug: "pan-de-coca", name: "Arcadia", priceEur: 8.20, description: "Pan de coca planchado (con tomate).", details: "Lomo, Bacon, Jamón Serrano, Huevo, Queso, Lechuga, Tomate, Mahonesa", ingredients: ["Lomo", "Bacon", "Jamón Serrano", "Huevo", "Queso", "Lechuga", "Tomate", "Mahonesa"] },
    { categorySlug: "pan-de-coca", name: "Serranito", priceEur: 8.50, description: "Pan de coca planchado (con tomate).", details: "Lomo, Jamón Serrano, Queso, Pimiento Frito, Mahonesa", ingredients: ["Lomo", "Jamón Serrano", "Queso", "Pimiento Frito", "Mahonesa"] },
    { categorySlug: "pan-de-coca", name: "Troyano", priceEur: 8.90, description: "Pan de coca planchado (con tomate).", details: "Carne Kebab, Cebolla Cruda, Lechuga, Tomate, Salsa Griega", ingredients: ["Carne Kebab", "Cebolla Cruda", "Lechuga", "Tomate", "Salsa Griega"] },
    { categorySlug: "pan-de-coca", name: "Chicken", priceEur: 7.90, description: "Pan de coca planchado (con tomate).", details: "Pechuga a la Plancha, Cebolla Frita, Lechuga, Huevo Cocido, Tomate, Mahonesa", ingredients: ["Pechuga a la Plancha", "Cebolla Frita", "Lechuga", "Huevo Cocido", "Tomate", "Mahonesa"] },
    { categorySlug: "pan-de-coca", name: "Ibiza", priceEur: 8.80, description: "Pan de coca planchado (con tomate).", details: "Pechuga Pollo Rebozada, Huevo, Lechuga, Queso, Tomate, Mahonesa", ingredients: ["Pechuga Pollo Rebozada", "Huevo", "Lechuga", "Queso", "Tomate", "Mahonesa"] },
    { categorySlug: "pan-de-coca", name: "Whatsapp", priceEur: 8.90, description: "Pan de coca planchado (con tomate).", details: "Hamburguesa, Jamón Dulce, Lechuga, Huevo, Pimiento Frito, Queso, Cebolla Frita, Tomate, Mahonesa", ingredients: ["Hamburguesa", "Jamón Dulce", "Lechuga", "Huevo", "Pimiento Frito", "Queso", "Cebolla Frita", "Tomate", "Mahonesa"] },
    { categorySlug: "pan-de-coca", name: "Siri", priceEur: 8.40, description: "Pan de coca planchado (con tomate).", details: "Pechuga a la Plancha, Brotes de Ensalada, Tomate, Queso Parmesano, Salsa Cesar", ingredients: ["Pechuga a la Plancha", "Brotes de Ensalada", "Tomate", "Queso Parmesano", "Salsa Cesar"] },

    // Baguettes de marca (16) — del PDF (sin tomate)
    { categorySlug: "baguettes-de-marca", name: "Joma", priceEur: 8.70, description: "Baguette de marca (sin tomate).", details: "Pechuga Pollo Plancha, Queso, Tomate, Mahonesa", ingredients: ["Pechuga Pollo Plancha", "Queso", "Tomate", "Mahonesa"] },
    { categorySlug: "baguettes-de-marca", name: "Reebook", priceEur: 8.80, description: "Baguette de marca (sin tomate).", details: "Lomo, Jamón Serrano, Pimiento Verde, Mahonesa", ingredients: ["Lomo", "Jamón Serrano", "Pimiento Verde", "Mahonesa"] },
    { categorySlug: "baguettes-de-marca", name: "Puma", priceEur: 6.80, description: "Baguette de marca (sin tomate).", details: "Lomo, Bacon, Queso, Huevo", ingredients: ["Lomo", "Bacon", "Queso", "Huevo"] },
    { categorySlug: "baguettes-de-marca", name: "Salomon", priceEur: 7.20, description: "Baguette de marca (sin tomate).", details: "Lomo, Queso Roquefort", ingredients: ["Lomo", "Queso Roquefort"] },
    { categorySlug: "baguettes-de-marca", name: "Adidas", priceEur: 8.80, description: "Baguette de marca (sin tomate).", details: "Lomo, Bacon, Jamón Serrano, Huevo, Queso, Lechuga, Mahonesa", ingredients: ["Lomo", "Bacon", "Jamón Serrano", "Huevo", "Queso", "Lechuga", "Mahonesa"] },
    { categorySlug: "baguettes-de-marca", name: "Nike", priceEur: 8.90, description: "Baguette de marca (sin tomate).", details: "Hamburguesa, Queso, Lechuga, Cebolla Frita", ingredients: ["Hamburguesa", "Queso", "Lechuga", "Cebolla Frita"] },
    { categorySlug: "baguettes-de-marca", name: "Asics", priceEur: 8.90, description: "Baguette de marca (sin tomate).", details: "Pechuga Pollo Rebozada, Queso, Huevo, Lechuga, Tomate, Mahonesa", ingredients: ["Pechuga Pollo Rebozada", "Queso", "Huevo", "Lechuga", "Tomate", "Mahonesa"] },
    { categorySlug: "baguettes-de-marca", name: "Kelme", priceEur: 8.40, description: "Baguette de marca (sin tomate).", details: "Atún, Lechuga, Tomate, Huevo Cocido, Mahonesa", ingredients: ["Atún", "Lechuga", "Tomate", "Huevo Cocido", "Mahonesa"] },
    { categorySlug: "baguettes-de-marca", name: "Clara Lago", priceEur: 8.40, description: "Baguette de marca (sin tomate).", details: "Chicken Filet de Heura, Lechuga, Mayo Veggie", ingredients: ["Chicken Filet de Heura", "Lechuga", "Mayo Veggie"] },
    { categorySlug: "baguettes-de-marca", name: "Mizuno", priceEur: 8.20, description: "Baguette de marca (sin tomate).", details: "Pechuga Rebozada, Queso Roquefort", ingredients: ["Pechuga Rebozada", "Queso Roquefort"] },
    { categorySlug: "baguettes-de-marca", name: "Converse", priceEur: 6.90, description: "Baguette de marca (sin tomate).", details: "Butifarra de Pagés, Cebolla Frita", ingredients: ["Butifarra de Pagés", "Cebolla Frita"] },
    { categorySlug: "baguettes-de-marca", name: "Lisa Simpson", priceEur: 8.40, description: "Baguette de marca (sin tomate).", details: "Bocados Heura, Brotes de Lechugas, Tomate, Mayo Vegana", ingredients: ["Bocados Heura", "Brotes de Lechugas", "Tomate", "Mayo Vegana"] },
    { categorySlug: "baguettes-de-marca", name: "Brooks", priceEur: 8.80, description: "Baguette de marca (sin tomate).", details: "Pechuga Pollo Plancha, Brotes de Ensalada, Bacon, Cebolla Caramelizada, Salsa Amarilla", ingredients: ["Pechuga Pollo Plancha", "Brotes de Ensalada", "Bacon", "Cebolla Caramelizada", "Salsa Amarilla"] },
    { categorySlug: "baguettes-de-marca", name: "Alexa", priceEur: 9.40, description: "Baguette de marca (sin tomate).", details: "Carne de Kebab, Cebolla Caramelizada, Lechuga, Salsa Amarilla, Salsa Cheddar", ingredients: ["Carne de Kebab", "Cebolla Caramelizada", "Lechuga", "Salsa Amarilla", "Salsa Cheddar"] },
    { categorySlug: "baguettes-de-marca", name: "Skechers", priceEur: 9.40, description: "Baguette de marca (sin tomate).", details: "Hamburguesa Pollo Crujiente, Salsa Cheddar, Cebolla Crujiente, Brotes de Lechuga, Tomate, Bacon", ingredients: ["Hamburguesa Pollo Crujiente", "Salsa Cheddar", "Cebolla Crujiente", "Brotes de Lechuga", "Tomate", "Bacon"] },
    { categorySlug: "baguettes-de-marca", name: "New Balance", priceEur: 9.90, description: "Baguette de marca (sin tomate).", details: "Calamares a la Andaluza, Mahonesa, Brotes de Lechuga", ingredients: ["Calamares a la Andaluza", "Mahonesa", "Brotes de Lechuga"] },
  ];

  // ----------------------------------------------------------
  // Ingredientes (dedupe por slug)
  // ----------------------------------------------------------
  const ingredientSlugToName = new Map<string, string>();

  for (const p of PRODUCTS) {
    for (const ing of p.ingredients ?? []) {
      const name = String(ing).trim();
      if (!name) continue;
      const s = slugify(name);
      if (!s) continue;
      if (!ingredientSlugToName.has(s)) ingredientSlugToName.set(s, name);
    }
  }

  let nextIngredientId2 = 1;
  const ingredientRows = [...ingredientSlugToName.entries()].map(([slug, name]) => ({
    id: nextIngredientId2++,
    name,
    slug,
    imageUrl: null,
    addPriceDeltaCents: 0,
    isCommon: false,
    active: true,
    sortOrder: 0,
  }));

  await db.insert(Ingredient).values(ingredientRows);

  const ingredientIdBySlug2 = new Map<string, number>(ingredientRows.map((r) => [r.slug, r.id]));

  // ----------------------------------------------------------
  // Productos
  // ----------------------------------------------------------
  const usedProductSlugs = new Set<string>();
  let nextProductId2 = 1;

  const productRows = PRODUCTS.map((p) => {
    const id = nextProductId2++;

    const slug = makeUniqueProductSlug(
      { name: p.name, categorySlug: p.categorySlug },
      usedProductSlugs
    );

    const imageUrl = resolveProductImageUrl(slug, imageIndex);

    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) {
      throw new Error(`Seed: categorySlug no existe: ${p.categorySlug}`);
    }

    return {
      id,
      categoryId,
      taxRateId: null,

      name: p.name,
      slug,
      description: p.description ?? null,
      details: p.details ?? null,
      imageUrl,

      priceCents: cents(p.priceEur),

      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,

      active: true,
    };
  });

  await db.insert(Product).values(productRows);

  const withImg = productRows.filter((x) => !!x.imageUrl).length;
  // console.log(`🖼️ Seed (parte2): imágenes asignadas: ${withImg}/${productRows.length}`);

  // ----------------------------------------------------------
  // ProductIngredient
  // ----------------------------------------------------------
  const piRows: any[] = [];

  for (let i = 0; i < productRows.length; i++) {
    const prod = productRows[i];
    const seed = PRODUCTS[i];
    const removable = isRemovableByCategory(seed.categorySlug);

    let sortOrder = 1;
    for (const ingName of seed.ingredients ?? []) {
      const s = slugify(String(ingName).trim());
      const ingId = ingredientIdBySlug2.get(s);
      if (!ingId) continue;

      piRows.push({
        productId: prod.id,
        ingredientId: ingId,
        defaultIncluded: true,
        removable,
        sortOrder: sortOrder++,
      });
    }
  }

  if (piRows.length) {
    await db.insert(ProductIngredient).values(piRows);
  }

  // ----------------------------------------------------------
  // ProductAllergen (inferido)
  // ----------------------------------------------------------
  const paRows: any[] = [];

  for (let i = 0; i < productRows.length; i++) {
    const prod = productRows[i];
    const seed = PRODUCTS[i];

    const allergenSlugs = inferAllergenSlugs(seed);
    for (const aSlug of allergenSlugs) {
      const aId = allergenIdBySlug.get(aSlug);
      if (!aId) continue;

      paRows.push({
        productId: prod.id,
        allergenId: aId,
      });
    }
  }

  if (paRows.length) {
    await db.insert(ProductAllergen).values(paRows);
  }

  // console.log(`✅ Seed (parte2): productos insertados: ${productRows.length}`);
  // console.log(`✅ Seed (parte2): ingredientes insertados: ${ingredientRows.length}`);
  // console.log(`✅ Seed (parte2): relaciones producto-alérgeno: ${paRows.length}`);

  // ==========================================================
  // PART 3/?? — Tapas + Croquetas + Montaditos
  // ==========================================================

  // IDs actuales (continuamos después de lo ya insertado en Parte 2)
  const existingProducts = await db.select({ id: Product.id, slug: Product.slug }).from(Product);
  const usedSlugs = new Set(existingProducts.map((p) => p.slug));
  let nextProductId = existingProducts.reduce((m, p) => Math.max(m, p.id), 0) + 1;

  const existingIngredients = await db.select({ id: Ingredient.id, slug: Ingredient.slug }).from(Ingredient);
  const ingredientIdBySlug = new Map<string, number>(existingIngredients.map((r) => [r.slug, r.id]));
  let nextIngredientId = existingIngredients.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  // Para estas categorías NO queremos personalización por defecto
  const removableForThisBatch = false;

  const PRODUCTS_3: ProductSeed[] = [
    // -----------------------
    // Tapas (22)
    // -----------------------
    {
      categorySlug: "tapas",
      name: "Patatas Bravas",
      priceEur: 6.80,
      description: "Patatas bravas con 4 salsas aparte.",
      details: "Patatas bravas (4 salsas aparte).",
      ingredients: ["Patatas", "Salsas"],
    },
    {
      categorySlug: "tapas",
      name: "Crujiente de Boniato",
      priceEur: 4.90,
      description: "Crujiente de boniato.",
      details: "Crujiente de boniato.",
      ingredients: ["Boniato"],
    },
    {
      categorySlug: "tapas",
      name: "Patatas Loki",
      priceEur: 7.40,
      description: "Patatas con salsa cheddar encima.",
      details: "Patatas (salsa cheddar encima).",
      ingredients: ["Patatas", "Salsa Cheddar"],
    },
    {
      categorySlug: "tapas",
      name: "Patatas Teja",
      priceEur: 7.20,
      description: "Patatas con salsa amarilla aparte.",
      details: "Patatas (salsa amarilla aparte).",
      ingredients: ["Patatas", "Salsa Amarilla"],
    },
    {
      categorySlug: "tapas",
      name: "Patatas Ninja",
      priceEur: 7.90,
      description: "Patatas con cheddar, bacon y cebolla crujiente.",
      details: "Patatas con cheddar, bacon y cebolla crujiente.",
      ingredients: ["Patatas", "Salsa Cheddar", "Bacon", "Cebolla Crujiente"],
    },
    {
      categorySlug: "tapas",
      name: "Chipirones a la Andaluza",
      priceEur: 10.50,
      description: "Chipirones rebozados estilo andaluz.",
      details: "Chipirones a la andaluza.",
      ingredients: ["Chipirones"],
    },
    {
      categorySlug: "tapas",
      name: "Calamares a la Andaluza",
      priceEur: 11.90,
      description: "Calamares rebozados estilo andaluz.",
      details: "Calamares a la andaluza.",
      ingredients: ["Calamares"],
    },
    {
      categorySlug: "tapas",
      name: "Cazón en Adobo",
      priceEur: 9.50,
      description: "Cazón adobado y frito.",
      details: "Cazón en adobo.",
      ingredients: ["Cazón"],
    },
    {
      categorySlug: "tapas",
      name: "Sticks Mozzarella",
      priceEur: 6.50,
      description: "Sticks de mozzarella (6 unidades).",
      details: "Sticks mozzarella (6u).",
      ingredients: ["Mozzarella"],
    },
    {
      categorySlug: "tapas",
      name: "Alitas de Pollo Adobadas",
      priceEur: 6.90,
      description: "Alitas adobadas en casa (5 unidades).",
      details: "Alitas de pollo adobadas en casa (5u).",
      ingredients: ["Alitas de Pollo"],
    },
    {
      categorySlug: "tapas",
      name: "Surtido de Quesos Variados",
      priceEur: 11.90,
      description: "Selección de quesos variados.",
      details: "Surtido de quesos variados.",
      ingredients: ["Quesos Variados"],
    },
    {
      categorySlug: "tapas",
      name: "Alitas de Pollo Crujientes",
      priceEur: 8.50,
      description: "Alitas crujientes (5 unidades).",
      details: "Alitas de pollo crujientes (5u).",
      ingredients: ["Alitas de Pollo"],
    },
    {
      categorySlug: "tapas",
      name: "Tiras de Pollo estilo Kentucky",
      priceEur: 8.90,
      description: "Tiras de pollo crujientes estilo Kentucky.",
      details: "Tiras de pollo al estilo Kentucky.",
      ingredients: ["Pollo"],
    },
    {
      categorySlug: "tapas",
      name: "Pincho de Tortilla de Patata",
      priceEur: 6.90,
      description: "Pincho de tortilla de patata.",
      details: "Pincho de tortilla de patata.",
      ingredients: ["Huevo", "Patata"],
    },
    {
      categorySlug: "tapas",
      name: "Alitas de Pollo Fritas",
      priceEur: 6.90,
      description: "Alitas fritas de toda la vida (5 unidades).",
      details: "Alitas de pollo fritas de toda la vida (5u).",
      ingredients: ["Alitas de Pollo"],
    },
    {
      categorySlug: "tapas",
      name: "Surtido de Embutidos",
      priceEur: 13.90,
      description: "Tabla surtida de embutidos.",
      details: "Surtido de embutidos.",
      ingredients: ["Embutidos"],
    },
    {
      categorySlug: "tapas",
      name: "Callos de la Casa",
      priceEur: 11.50,
      description: "Callos caseros.",
      details: "Callos de la casa.",
      ingredients: ["Callos"],
    },
    {
      categorySlug: "tapas",
      name: "Jamón del País con Pan Tomate",
      priceEur: 15.90,
      description: "Jamón del país + pan con tomate.",
      details: "Jamón del país (cortado a máquina) + pan tomate.",
      ingredients: ["Jamón del País", "Pan", "Tomate"],
    },
    {
      categorySlug: "tapas",
      name: "Sartén Huevos Rotos con Jamón y Pimientos",
      priceEur: 8.40,
      description: "Huevos rotos con jamón y pimientos.",
      details: "Sartén de huevos rotos con jamón y pimientos.",
      ingredients: ["Huevo", "Jamón", "Pimientos", "Patatas"],
    },
    {
      categorySlug: "tapas",
      name: "Sartén Huevos Rotos con Chistorra y Queso",
      priceEur: 8.90,
      description: "Huevos rotos con chistorra y queso.",
      details: "Sartén de huevos rotos con chistorra y queso.",
      ingredients: ["Huevo", "Chistorra", "Queso", "Patatas"],
    },
    {
      categorySlug: "tapas",
      name: "Sartén Huevos Rotos con Morcilla de Jaén",
      priceEur: 8.80,
      description: "Huevos rotos con morcilla de Jaén.",
      details: "Sartén de huevos rotos con morcilla de Jaén.",
      ingredients: ["Huevo", "Morcilla", "Patatas"],
    },
    {
      categorySlug: "tapas",
      name: "Boquerones Fritos",
      priceEur: 7.40,
      description: "Boquerones fritos.",
      details: "Boquerones fritos.",
      ingredients: ["Boquerones"],
    },

    // -----------------------
    // Croquetas (8)
    // -----------------------
    {
      categorySlug: "croquetas",
      name: "Croquetas de Gamba Roja",
      priceEur: 6.90,
      description: "Croquetas (5 unidades).",
      details: "Croquetas de gamba roja (5u).",
      ingredients: ["Gamba"],
    },
    {
      categorySlug: "croquetas",
      name: "Croquetas de Jamón Ibérico",
      priceEur: 6.70,
      description: "Croquetas (5 unidades).",
      details: "Croquetas de jamón ibérico (5u).",
      ingredients: ["Jamón"],
    },
    {
      categorySlug: "croquetas",
      name: "Croquetas de Pollo",
      priceEur: 6.40,
      description: "Croquetas (5 unidades).",
      details: "Croquetas de pollo (5u).",
      ingredients: ["Pollo"],
    },
    {
      categorySlug: "croquetas",
      name: "Croquetas de Cocido",
      priceEur: 6.70,
      description: "Croquetas (5 unidades).",
      details: "Croquetas de cocido (5u).",
      ingredients: ["Cocido"],
    },
    {
      categorySlug: "croquetas",
      name: "Croquetas de Rabo de Toro",
      priceEur: 7.40,
      description: "Croquetas (5 unidades).",
      details: "Croquetas de rabo de toro (5u).",
      ingredients: ["Rabo de Toro"],
    },
    {
      categorySlug: "croquetas",
      name: "Mini Croquetas de Jamón",
      priceEur: 8.30,
      description: "Mini croquetas (20 unidades).",
      details: "Mini croquetas de jamón (20u).",
      ingredients: ["Jamón"],
    },
    {
      categorySlug: "croquetas",
      name: "Croquetas de Foie y Boletus",
      priceEur: 7.30,
      description: "Croquetas (5 unidades).",
      details: "Croquetas de foie y boletus (5u).",
      ingredients: ["Foie", "Boletus"],
    },
    {
      categorySlug: "croquetas",
      name: "Mejillones Tigre",
      priceEur: 7.40,
      description: "Mejillones tigre (6 unidades).",
      details: "Mejillones tigre (6u).",
      ingredients: ["Mejillones"],
    },

    // -----------------------
    // Montaditos (6)
    // -----------------------
    {
      categorySlug: "montaditos",
      name: "6 Montaditos Flamenquín Casero",
      priceEur: 8.90,
      description: "Bandeja de 6 montaditos.",
      details: "6 montaditos de flamenquín casero.",
      ingredients: ["Pan", "Flamenquín"],
    },
    {
      categorySlug: "montaditos",
      name: "6 Montaditos Huevo Codorniz y Bacon",
      priceEur: 8.70,
      description: "Bandeja de 6 montaditos.",
      details: "6 montaditos de huevo de codorniz y bacon.",
      ingredients: ["Pan", "Huevo de Codorniz", "Bacon"],
    },
    {
      categorySlug: "montaditos",
      name: "6 Montaditos Lomo a la Andaluza",
      priceEur: 8.40,
      description: "Bandeja de 6 montaditos.",
      details: "6 montaditos de lomo a la andaluza.",
      ingredients: ["Pan", "Lomo"],
    },
    {
      categorySlug: "montaditos",
      name: "6 Montaditos Mini Hamburguesa",
      priceEur: 8.90,
      description: "Bandeja de 6 montaditos.",
      details: "6 montaditos de mini hamburguesa.",
      ingredients: ["Pan", "Hamburguesa"],
    },
    {
      categorySlug: "montaditos",
      name: "6 Montaditos Salmón Ahumado, Queso Crema y Guacamole",
      priceEur: 9.50,
      description: "Bandeja de 6 montaditos.",
      details: "6 montaditos de salmón ahumado, queso crema y guacamole.",
      ingredients: ["Pan", "Salmón Ahumado", "Queso Crema", "Guacamole"],
    },
    {
      categorySlug: "montaditos",
      name: "6 Montaditos Pechuguitas Pollo al Roquefort",
      priceEur: 8.90,
      description: "Bandeja de 6 montaditos.",
      details: "6 montaditos de pechuguitas de pollo al roquefort.",
      ingredients: ["Pan", "Pollo", "Queso Roquefort"],
    },
  ];

  // ----------------------------------------------------------
  // 1) Insert ingredientes que falten
  // ----------------------------------------------------------
  const newIngredientSlugToName = new Map<string, string>();
  for (const p of PRODUCTS_3) {
    for (const ing of p.ingredients ?? []) {
      const name = String(ing).trim();
      if (!name) continue;
      const s = slugify(name);
      if (!s) continue;
      if (!ingredientIdBySlug.has(s)) newIngredientSlugToName.set(s, name);
    }
  }

  const newIngredientRows = [...newIngredientSlugToName.entries()].map(([slug, name]) => ({
    id: nextIngredientId++,
    name,
    slug,
    imageUrl: null,
    addPriceDeltaCents: 0,
    isCommon: false,
    active: true,
    sortOrder: 0,
  }));

  if (newIngredientRows.length) {
    await db.insert(Ingredient).values(newIngredientRows);
    for (const r of newIngredientRows) ingredientIdBySlug.set(r.slug, r.id);
  }

  // ----------------------------------------------------------
  // 2) Insert productos
  // ----------------------------------------------------------
  const productRows3 = PRODUCTS_3.map((p) => {
    const id = nextProductId++;
    const slug = makeUniqueProductSlug({ name: p.name, categorySlug: p.categorySlug }, usedSlugs);
    const imageUrl = resolveProductImageUrl(slug, imageIndex);

    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Seed: categorySlug no existe: ${p.categorySlug}`);

    return {
      id,
      categoryId,
      taxRateId: null,

      name: p.name,
      slug,
      description: p.description ?? null,
      details: p.details ?? null,
      imageUrl,

      priceCents: cents(p.priceEur),

      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,

      active: true,
    };
  });

  await db.insert(Product).values(productRows3);

  const withImg3 = productRows3.filter((x) => !!x.imageUrl).length;
  // console.log(`🖼️ Seed (parte3): imágenes asignadas: ${withImg3}/${productRows3.length}`);

  // ----------------------------------------------------------
  // 3) ProductIngredient (sin personalización: removable=false)
  // ----------------------------------------------------------
  const piRows3: any[] = [];
  for (let i = 0; i < productRows3.length; i++) {
    const prod = productRows3[i];
    const seed = PRODUCTS_3[i];

    let sortOrder = 1;
    for (const ingName of seed.ingredients ?? []) {
      const s = slugify(String(ingName).trim());
      const ingId = ingredientIdBySlug.get(s);
      if (!ingId) continue;

      piRows3.push({
        productId: prod.id,
        ingredientId: ingId,
        defaultIncluded: true,
        removable: removableForThisBatch,
        sortOrder: sortOrder++,
      });
    }
  }

  if (piRows3.length) await db.insert(ProductIngredient).values(piRows3);

  // ----------------------------------------------------------
  // 4) ProductAllergen (inferido)
  // ----------------------------------------------------------
  const paRows3: any[] = [];
  for (let i = 0; i < productRows3.length; i++) {
    const prod = productRows3[i];
    const seed = PRODUCTS_3[i];

    const allergenSlugs = inferAllergenSlugs(seed);
    for (const aSlug of allergenSlugs) {
      const aId = allergenIdBySlug.get(aSlug);
      if (!aId) continue;

      paRows3.push({
        productId: prod.id,
        allergenId: aId,
      });
    }
  }

  if (paRows3.length) await db.insert(ProductAllergen).values(paRows3);

  // console.log(`✅ Seed (parte3): productos insertados: ${productRows3.length}`);
  // console.log(`✅ Seed (parte3): nuevos ingredientes: ${newIngredientRows.length}`);
  // console.log(`✅ Seed (parte3): relaciones producto-alérgeno: ${paRows3.length}`);

  // ==========================================================
  // PART 4/?? — Sandwiches + Wraps (ingredientes y precios del PDF)
  // ==========================================================

  // IDs actuales (continuamos desde lo ya insertado)
  const existingProducts4 = await db.select({ id: Product.id, slug: Product.slug }).from(Product);
  const usedSlugs4 = new Set(existingProducts4.map((p) => p.slug));
  let nextProductId4 = existingProducts4.reduce((m, p) => Math.max(m, p.id), 0) + 1;

  const existingIngredients4 = await db.select({ id: Ingredient.id, slug: Ingredient.slug }).from(Ingredient);
  const ingredientIdBySlug4 = new Map<string, number>(existingIngredients4.map((r) => [r.slug, r.id]));
  let nextIngredientId4 = existingIngredients4.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  const PRODUCTS_4: ProductSeed[] = [
    // -----------------------
    // Sandwiches (8) — PDF
    // -----------------------
    {
      categorySlug: "sandwiches",
      name: "Poseidón",
      priceEur: 8.80,
      description: "Sándwich en pan de molde.",
      details: "Pechuga plancha, jamón dulce, huevo, lechuga, tomate y salsa griega.",
      ingredients: ["Pechuga Plancha", "Jamón Dulce", "Huevo", "Lechuga", "Tomate", "Salsa Griega"],
    },
    {
      categorySlug: "sandwiches",
      name: "Afrodita",
      priceEur: 8.90,
      description: "Sándwich en pan de molde.",
      details: "Jamón serrano, queso, lechuga, bacon, huevo, tomate y mahonesa.",
      ingredients: ["Jamón Serrano", "Queso", "Lechuga", "Bacon", "Huevo", "Tomate", "Mahonesa"],
    },
    {
      categorySlug: "sandwiches",
      name: "Némesis",
      priceEur: 8.40,
      description: "Sándwich en pan de molde.",
      details: "Jamón dulce, queso, tomate, lechuga, huevo y mahonesa.",
      ingredients: ["Jamón Dulce", "Queso", "Tomate", "Lechuga", "Huevo", "Mahonesa"],
    },
    {
      categorySlug: "sandwiches",
      name: "Apolo",
      priceEur: 8.80,
      description: "Sándwich en pan de molde.",
      details: "Pechuga plancha, queso, lechuga, tomate y salsa griega.",
      ingredients: ["Pechuga Plancha", "Queso", "Lechuga", "Tomate", "Salsa Griega"],
    },
    {
      categorySlug: "sandwiches",
      name: "Aquiles",
      priceEur: 8.50,
      description: "Sándwich en pan de molde.",
      details: "Atún, huevo cocido, lechuga, tomate y mahonesa.",
      ingredients: ["Atún", "Huevo Cocido", "Lechuga", "Tomate", "Mahonesa"],
    },
    {
      categorySlug: "sandwiches",
      name: "Venus",
      priceEur: 8.90,
      description: "Sándwich en pan de molde (veggie).",
      details: "Chicken filet de Heura, lechuga, tomate, cebolla frita y mayo veggie.",
      ingredients: ["Chicken Filet de Heura", "Lechuga", "Tomate", "Cebolla Frita", "Mayo Veggie"],
    },
    {
      categorySlug: "sandwiches",
      name: "Hercules",
      priceEur: 9.20,
      description: "Sándwich en pan de molde.",
      details: "Pulled pork, lechuga, tomate, cheddar, cebolla frita y salsa Sioux (pica pero poco).",
      ingredients: ["Pulled Pork", "Lechuga", "Tomate", "Cheddar", "Cebolla Frita", "Salsa Sioux"],
    },
    {
      categorySlug: "sandwiches",
      name: "Neptuno",
      priceEur: 9.80,
      description: "Sándwich en pan de molde.",
      details: "Salmón ahumado, cebolla, lechuga, tomate, guacamole, queso fresco y salsa griega.",
      ingredients: ["Salmón Ahumado", "Cebolla", "Lechuga", "Tomate", "Guacamole", "Queso Fresco", "Salsa Griega"],
    },

    // -----------------------
    // Wraps (11) — PDF
    // -----------------------
    {
      categorySlug: "wraps",
      name: "Flashdance",
      priceEur: 8.90,
      description: "Wrap en tortita de trigo.",
      details: "Carne kebab, cebolla cruda, lechuga, tomate y salsa griega.",
      ingredients: ["Carne Kebab", "Cebolla Cruda", "Lechuga", "Tomate", "Salsa Griega"],
    },
    {
      categorySlug: "wraps",
      name: "Pretty Woman",
      priceEur: 8.80,
      description: "Wrap en tortita de trigo.",
      details: "Pechuga crujiente, lechuga, tomate y salsa griega.",
      ingredients: ["Pechuga Crujiente", "Lechuga", "Tomate", "Salsa Griega"],
    },
    {
      categorySlug: "wraps",
      name: "Terminator",
      priceEur: 8.70,
      description: "Wrap en tortita de trigo.",
      details: "Pechuga plancha, cebolla frita, lechuga, tomate, pimiento, tabasco y mahonesa.",
      ingredients: ["Pechuga Plancha", "Cebolla Frita", "Lechuga", "Tomate", "Pimiento", "Tabasco", "Mahonesa"],
    },
    {
      categorySlug: "wraps",
      name: "Forrest Gump",
      priceEur: 8.90,
      description: "Wrap en tortita de trigo.",
      details:
        "Hamburguesa troceada, huevo, lechuga, queso parmesano, cebolla caramelizada y nuestra salsa Zen (dulce).",
      ingredients: [
        "Hamburguesa Troceada",
        "Huevo",
        "Lechuga",
        "Queso Parmesano",
        "Cebolla Caramelizada",
        "Salsa Zen",
      ],
    },
    {
      categorySlug: "wraps",
      name: "Jungla de Cristal",
      priceEur: 8.80,
      description: "Wrap en tortita de trigo.",
      details: "Pechuga plancha, jamón dulce, lechuga, tomate y salsa griega.",
      ingredients: ["Pechuga Plancha", "Jamón Dulce", "Lechuga", "Tomate", "Salsa Griega"],
    },
    {
      categorySlug: "wraps",
      name: "Dirty Dancing",
      priceEur: 8.40,
      description: "Wrap en tortita de trigo.",
      details: "Frankfurt troceado, queso, huevo, cebolla crujiente y nuestra salsa Bhuda (no pica).",
      ingredients: ["Frankfurt Troceado", "Queso", "Huevo", "Cebolla Crujiente", "Salsa Bhuda"],
    },
    {
      categorySlug: "wraps",
      name: "Top Gun",
      priceEur: 8.90,
      description: "Wrap en tortita de trigo.",
      details: "Hamburguesa troceada, queso, huevo, cebolla crujiente y nuestra salsa Bhuda (no pica).",
      ingredients: ["Hamburguesa Troceada", "Queso", "Huevo", "Cebolla Crujiente", "Salsa Bhuda"],
    },
    {
      categorySlug: "wraps",
      name: "Avatar",
      priceEur: 8.80,
      description: "Wrap en tortita de trigo.",
      details: "Pechuga plancha, champiñones, huevo cocido, brotes de lechuga y nuestra salsa César.",
      ingredients: ["Pechuga Plancha", "Champiñones", "Huevo Cocido", "Brotes de Lechuga", "Salsa Cesar"],
    },
    {
      categorySlug: "wraps",
      name: "Arma Letal",
      priceEur: 9.20,
      description: "Wrap en tortita de trigo.",
      details: "Pulled pork, salsa cheddar caliente, bacon, queso, cebolla frita y salsa Sioux (pica pero poco).",
      ingredients: ["Pulled Pork", "Salsa Cheddar", "Bacon", "Queso", "Cebolla Frita", "Salsa Sioux"],
    },
    {
      categorySlug: "wraps",
      name: "Joaquin Phoenix",
      priceEur: 8.90,
      description: "Wrap en tortita de trigo (veggie).",
      details:
        "Hamburguesa de Heura troceada, lechuga, tomate, brotes de lechugas, cebolla frita y nuestra salsa Zen (dulce).",
      ingredients: [
        "Hamburguesa de Heura",
        "Lechuga",
        "Tomate",
        "Brotes de Lechugas",
        "Cebolla Frita",
        "Salsa Zen",
      ],
    },
    {
      categorySlug: "wraps",
      name: "Gladiator",
      priceEur: 9.80,
      description: "Wrap en tortita de trigo.",
      details:
        "Salmón ahumado, cebolla, brotes de lechuga, tomate, guacamole, queso fresco, salsa griega y orégano.",
      ingredients: [
        "Salmón Ahumado",
        "Cebolla",
        "Brotes de Lechuga",
        "Tomate",
        "Guacamole",
        "Queso Fresco",
        "Salsa Griega",
        "Orégano",
      ],
    },
  ];

  // ----------------------------------------------------------
  // 1) Insert ingredientes que falten
  // ----------------------------------------------------------
  const newIngSlugToName4 = new Map<string, string>();
  for (const p of PRODUCTS_4) {
    for (const ing of p.ingredients ?? []) {
      const name = String(ing).trim();
      if (!name) continue;
      const s = slugify(name);
      if (!s) continue;
      if (!ingredientIdBySlug4.has(s)) newIngSlugToName4.set(s, name);
    }
  }

  const newIngRows4 = [...newIngSlugToName4.entries()].map(([slug, name]) => ({
    id: nextIngredientId4++,
    name,
    slug,
    imageUrl: null,
    addPriceDeltaCents: 0,
    isCommon: false,
    active: true,
    sortOrder: 0,
  }));

  if (newIngRows4.length) {
    await db.insert(Ingredient).values(newIngRows4);
    for (const r of newIngRows4) ingredientIdBySlug4.set(r.slug, r.id);
  }

  // ----------------------------------------------------------
  // 2) Insert productos
  // ----------------------------------------------------------
  const productRows4 = PRODUCTS_4.map((p) => {
    const id = nextProductId4++;
    const slug = makeUniqueProductSlug({ name: p.name, categorySlug: p.categorySlug }, usedSlugs4);
    const imageUrl = resolveProductImageUrl(slug, imageIndex);

    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Seed: categorySlug no existe: ${p.categorySlug}`);

    return {
      id,
      categoryId,
      taxRateId: null,

      name: p.name,
      slug,
      description: p.description ?? null,
      details: p.details ?? null,
      imageUrl,

      priceCents: cents(p.priceEur),

      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,

      active: true,
    };
  });

  await db.insert(Product).values(productRows4);

  const withImg4 = productRows4.filter((x) => !!x.imageUrl).length;
  // console.log(`🖼️ Seed (parte4): imágenes asignadas: ${withImg4}/${productRows4.length}`);

  // ----------------------------------------------------------
  // 3) ProductIngredient (sandwiches/wraps: removable según isRemovableByCategory)
  // ----------------------------------------------------------
  const piRows4: any[] = [];

  for (let i = 0; i < productRows4.length; i++) {
    const prod = productRows4[i];
    const seed = PRODUCTS_4[i];
    const removable = isRemovableByCategory(seed.categorySlug);

    let sortOrder = 1;
    for (const ingName of seed.ingredients ?? []) {
      const s = slugify(String(ingName).trim());
      const ingId = ingredientIdBySlug4.get(s);
      if (!ingId) continue;

      piRows4.push({
        productId: prod.id,
        ingredientId: ingId,
        defaultIncluded: true,
        removable,
        sortOrder: sortOrder++,
      });
    }
  }

  if (piRows4.length) await db.insert(ProductIngredient).values(piRows4);

  // ----------------------------------------------------------
  // 4) ProductAllergen (inferido)
  // ----------------------------------------------------------
  const paRows4: any[] = [];

  for (let i = 0; i < productRows4.length; i++) {
    const prod = productRows4[i];
    const seed = PRODUCTS_4[i];

    const allergenSlugs = inferAllergenSlugs(seed);
    for (const aSlug of allergenSlugs) {
      const aId = allergenIdBySlug.get(aSlug);
      if (!aId) continue;

      paRows4.push({
        productId: prod.id,
        allergenId: aId,
      });
    }
  }

  if (paRows4.length) await db.insert(ProductAllergen).values(paRows4);

  // console.log(`✅ Seed (parte4): productos insertados: ${productRows4.length}`);
  // console.log(`✅ Seed (parte4): nuevos ingredientes: ${newIngRows4.length}`);
  // console.log(`✅ Seed (parte4): relaciones producto-alérgeno: ${paRows4.length}`);

  // ==========================================================
  // PART 5/?? — Hamburguesas + Frankfurts + Platos infantiles + Ensaladas + Bebidas (simple)
  // ==========================================================

  const existingProducts5 = await db.select({ id: Product.id, slug: Product.slug }).from(Product);
  const usedSlugs5 = new Set(existingProducts5.map((p) => p.slug));
  let nextProductId5 = existingProducts5.reduce((m, p) => Math.max(m, p.id), 0) + 1;

  const existingIngredients5 = await db.select({ id: Ingredient.id, slug: Ingredient.slug }).from(Ingredient);
  const ingredientIdBySlug5 = new Map<string, number>(existingIngredients5.map((r) => [r.slug, r.id]));
  let nextIngredientId5 = existingIngredients5.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  // Ajuste local de inferencia: "picatostes"/"pan de molde" => gluten (porque ensaladas/infantiles no están en breadCats)
  function inferAllergenSlugs5(p: ProductSeed) {
    const set = new Set(inferAllergenSlugs(p));
    const hay = `${p.name} ${(p.details ?? "")} ${(p.ingredients ?? []).join(", ")}`.toLowerCase();

    if (/(picatostes|pan|pan-de-molde|bikini)/i.test(hay)) set.add("gluten");
    return [...set];
  }

  const PRODUCTS_5: ProductSeed[] = [
    // -----------------------
    // Hamburguesas (15) — PDF
    // -----------------------
    {
      categorySlug: "hamburguesas",
      name: "Yandex",
      priceEur: 9.40,
      description: "Hamburguesa con huevo, parmesano y cebolla caramelizada.",
      details: "Hamburguesa, Huevo, Parmesano, Cebolla Caramelizada.",
      ingredients: ["Hamburguesa", "Huevo", "Parmesano", "Cebolla Caramelizada"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Pokemon",
      priceEur: 9.90,
      description: "Hamburguesa rellena de queso de cabra con huevo y verduras.",
      details: "Hamburguesa rellena de Queso de Cabra, Huevo, Cebolla Caramelizada, Lechuga y Tomate.",
      ingredients: ["Hamburguesa", "Queso de Cabra", "Huevo", "Cebolla Caramelizada", "Lechuga", "Tomate"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Spotify",
      priceEur: 9.70,
      description: "Hamburguesa de pollo con cheddar, bacon y salsa cajún (no pica).",
      details:
        "Hamburguesa de Pollo, Cheddar, Bacon, Tomate, Brotes de Lechuga, Cebolla Caramelizada y Salsa Cajún (no pica).",
      ingredients: [
        "Hamburguesa de Pollo",
        "Cheddar",
        "Bacon",
        "Tomate",
        "Brotes de Lechuga",
        "Cebolla Caramelizada",
        "Salsa Cajún",
      ],
    },
    {
      categorySlug: "hamburguesas",
      name: "Ópera",
      priceEur: 9.70,
      description: "Hamburguesa con pimiento rojo, queso de cabra y confitura de tomate.",
      details: "Hamburguesa, Pimiento Rojo, Queso de Cabra, Cebolla Caramelizada y Confitura de Tomate.",
      ingredients: ["Hamburguesa", "Pimiento Rojo", "Queso de Cabra", "Cebolla Caramelizada", "Confitura de Tomate"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Yahoo",
      priceEur: 9.90,
      description: "Hamburguesa completa con bacon, queso, huevo y pimiento frito.",
      details: "Hamburguesa, Bacon, Queso, Lechuga, Cebolla Frita, Huevo, Tomate y Pimiento Frito.",
      ingredients: ["Hamburguesa", "Bacon", "Queso", "Lechuga", "Cebolla Frita", "Huevo", "Tomate", "Pimiento Frito"],
    },
    {
      categorySlug: "hamburguesas",
      name: "HBO",
      priceEur: 9.80,
      description: "Hamburguesa de ternera con cheddar, cebolla crujiente y champiñones.",
      details: "Hamburguesa de Ternera, Queso Cheddar, Cebolla Crujiente, Champiñones y Brotes de Lechuga.",
      ingredients: ["Hamburguesa de Ternera", "Queso Cheddar", "Cebolla Crujiente", "Champiñones", "Brotes de Lechuga"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Apple",
      priceEur: 9.80,
      description: "Hamburguesa de pollo crujiente con bacon y barbacoa.",
      details: "Hamburguesa Pollo Crujiente, Bacon, Lechuga, Cebolla Crujiente, Tomate, Mahonesa y Salsa Barbacoa.",
      ingredients: [
        "Hamburguesa Pollo Crujiente",
        "Bacon",
        "Lechuga",
        "Cebolla Crujiente",
        "Tomate",
        "Mahonesa",
        "Salsa Barbacoa",
      ],
    },
    {
      categorySlug: "hamburguesas",
      name: "Google",
      priceEur: 6.90,
      description: "Hamburguesa con queso.",
      details: "Hamburguesa y Queso.",
      ingredients: ["Hamburguesa", "Queso"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Facebook",
      priceEur: 9.30,
      description: "Hamburguesa con cebolla frita, bacon y huevo.",
      details: "Hamburguesa, Cebolla Frita, Bacon y Huevo.",
      ingredients: ["Hamburguesa", "Cebolla Frita", "Bacon", "Huevo"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Twiter",
      priceEur: 9.40,
      description: "Hamburguesa con huevo, queso, lechuga y tomate.",
      details: "Hamburguesa, Huevo, Queso, Lechuga y Tomate.",
      ingredients: ["Hamburguesa", "Huevo", "Queso", "Lechuga", "Tomate"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Instagram",
      priceEur: 8.90,
      description: "Hamburguesa con queso y bacon.",
      details: "Hamburguesa, Queso y Bacon.",
      ingredients: ["Hamburguesa", "Queso", "Bacon"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Netflix",
      priceEur: 9.40,
      description: "Pulled pork con cheddar, cebolla crujiente y salsa Sioux (pica pero poco).",
      details: "Pulled Pork, Cheddar, Cebolla Crujiente y Salsa Sioux (pica pero poco).",
      ingredients: ["Pulled Pork", "Cheddar", "Cebolla Crujiente", "Salsa Sioux"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Brad Pitt",
      priceEur: 9.30,
      description: "Hamburguesa de Heura con brotes, tomate y champiñones.",
      details: "Hamburguesa de Heura, Brotes de Lechugas, Tomate, Cebolla Frita y Champiñones.",
      ingredients: ["Hamburguesa de Heura", "Brotes de Lechugas", "Tomate", "Cebolla Frita", "Champiñones"],
    },
    {
      categorySlug: "hamburguesas",
      name: "Tik Tok",
      priceEur: 9.20,
      description: "Hamburguesa de pollo crujiente con lechuga y mahonesa.",
      details: "Hamburguesa Pollo Crujiente, Lechuga y Mahonesa.",
      ingredients: ["Hamburguesa Pollo Crujiente", "Lechuga", "Mahonesa"],
    },
    {
      categorySlug: "hamburguesas",
      name: "ChatGPT",
      priceEur: 9.90,
      description: "Pulled pork con cheddar caliente, bacon y salsa Sioux (pica pero poco).",
      details: "Pulled Pork, Salsa Cheddar Caliente, Bacon, Cebolla Crujiente y Salsa Sioux (pica pero poco).",
      ingredients: ["Pulled Pork", "Salsa Cheddar Caliente", "Bacon", "Cebolla Crujiente", "Salsa Sioux"],
    },

    // -----------------------
    // Frankfurts (7) — PDF
    // -----------------------
    {
      categorySlug: "frankfurts",
      name: "Ulises",
      priceEur: 4.80,
      description: "Frankfurt solo con el pan.",
      details: "Frankfurt solo con el pan.",
      ingredients: ["Frankfurt", "Pan"],
    },
    {
      categorySlug: "frankfurts",
      name: "Orión",
      priceEur: 6.20,
      description: "Frankfurt con bacon y queso.",
      details: "Frankfurt, Bacon y Queso.",
      ingredients: ["Frankfurt", "Bacon", "Queso"],
    },
    {
      categorySlug: "frankfurts",
      name: "Atlas",
      priceEur: 6.10,
      description: "Frankfurt con queso y cebolla crujiente.",
      details: "Frankfurt, Queso y Cebolla Crujiente.",
      ingredients: ["Frankfurt", "Queso", "Cebolla Crujiente"],
    },
    {
      categorySlug: "frankfurts",
      name: "Cronos",
      priceEur: 6.60,
      description: "Frankfurt con bacon, queso y cebolla crujiente.",
      details: "Frankfurt, Bacon, Queso y Cebolla Crujiente.",
      ingredients: ["Frankfurt", "Bacon", "Queso", "Cebolla Crujiente"],
    },
    {
      categorySlug: "frankfurts",
      name: "Calipso",
      priceEur: 6.70,
      description: "Frankfurt con cebolla caramelizada, huevo y parmesano.",
      details: "Frankfurt, Cebolla Caramelizada, Huevo y Queso Parmesano.",
      ingredients: ["Frankfurt", "Cebolla Caramelizada", "Huevo", "Queso Parmesano"],
    },
    {
      categorySlug: "frankfurts",
      name: "Perseo",
      priceEur: 6.80,
      description: "Frankfurt con bacon, huevo, tabasco y queso.",
      details: "Frankfurt, Cebolla Crujiente, Bacon, Huevo, Tabasco y Queso.",
      ingredients: ["Frankfurt", "Cebolla Crujiente", "Bacon", "Huevo", "Tabasco", "Queso"],
    },
    {
      categorySlug: "frankfurts",
      name: "Zeus",
      priceEur: 6.90,
      description: "Frankfurt con cebolla caramelizada y salsa Zen (dulce).",
      details: "Frankfurt, Cebolla Caramelizada, Huevo, Queso Parmesano y Nuestra Salsa Zen (dulce).",
      ingredients: ["Frankfurt", "Cebolla Caramelizada", "Huevo", "Queso Parmesano", "Salsa Zen"],
    },

    // -----------------------
    // Platos infantiles (10) — PDF
    // -----------------------
    {
      categorySlug: "platos-infantiles",
      name: "101: Hamburguesa al Plato con Patatas Fritas",
      priceEur: 7.40,
      description: "Plato infantil (hasta 10 años).",
      details: "Hamburguesa al plato con patatas fritas.",
      ingredients: ["Hamburguesa", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "102: Croquetas de Pollo con Patatas Fritas",
      priceEur: 7.90,
      description: "Plato infantil (hasta 10 años).",
      details: "Croquetas de pollo con patatas fritas.",
      ingredients: ["Croquetas de Pollo", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "103: Tortilla Francesa con Patatas Fritas",
      priceEur: 5.90,
      description: "Plato infantil (hasta 10 años).",
      details: "Tortilla francesa con patatas fritas.",
      ingredients: ["Tortilla Francesa", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "104: Nuggets de Pollo con Patatas Fritas",
      priceEur: 8.90,
      description: "Plato infantil (hasta 10 años).",
      details: "Nuggets de pollo con patatas fritas.",
      ingredients: ["Nuggets de Pollo", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "105: Frankfurt al Plato con Patatas Fritas",
      priceEur: 5.90,
      description: "Plato infantil (hasta 10 años).",
      details: "Frankfurt al plato con patatas fritas.",
      ingredients: ["Frankfurt", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "106: 2 Huevos Fritos con Patatas Fritas",
      priceEur: 5.30,
      description: "Plato infantil (hasta 10 años).",
      details: "2 huevos fritos con patatas fritas.",
      ingredients: ["Huevos Fritos", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "107: Pechuga Pollo Rebozada con Patatas Fritas",
      priceEur: 8.90,
      description: "Plato infantil (hasta 10 años).",
      details: "Pechuga de pollo rebozada con patatas fritas.",
      ingredients: ["Pechuga Pollo Rebozada", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "108: Bikini (Jamón Dulce y Queso) con Patatas Fritas",
      priceEur: 6.30,
      description: "Plato infantil (hasta 10 años).",
      details: "Bikini de jamón dulce y queso con patatas fritas.",
      ingredients: ["Pan de Molde", "Jamón Dulce", "Queso", "Patatas Fritas"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "109: Arroz a la Cubana",
      priceEur: 9.40,
      description: "Plato infantil (hasta 10 años).",
      details: "Arroz a la cubana.",
      ingredients: ["Arroz a la Cubana"],
    },
    {
      categorySlug: "platos-infantiles",
      name: "110: Carne de Kebab con Arroz Blanco",
      priceEur: 9.50,
      description: "Plato infantil (hasta 10 años).",
      details: "Carne de kebab con arroz blanco.",
      ingredients: ["Carne de Kebab", "Arroz Blanco"],
    },

    // -----------------------
    // Ensaladas (5) — PDF
    // -----------------------
    {
      categorySlug: "ensaladas",
      name: "Caronte",
      priceEur: 9.40,
      description: "Ensalada completa con pollo crujiente, queso de cabra y módena.",
      details: "Lechugas variadas, tomate, picatostes, pechuga pollo crujiente, queso de cabra, nueces y crema de módena.",
      ingredients: ["Lechugas Variadas", "Tomate", "Picatostes", "Pechuga de Pollo Crujiente", "Queso de Cabra", "Nueces", "Crema de Módena"],
    },
    {
      categorySlug: "ensaladas",
      name: "Cesar",
      priceEur: 9.40,
      description: "Ensalada César con pollo a la plancha y salsa César.",
      details: "Lechugas variadas, tomate, picatostes, pechuga pollo a la plancha, parmesano en polvo y nuestra salsa César.",
      ingredients: ["Lechugas Variadas", "Tomate", "Picatostes", "Pechuga de Pollo a la Plancha", "Parmesano en Polvo", "Salsa Cesar"],
    },
    {
      categorySlug: "ensaladas",
      name: "Marte",
      priceEur: 8.90,
      description: "Ensalada con atún y huevo cocido.",
      details: "Lechugas variadas, tomate, huevo cocido y atún.",
      ingredients: ["Lechugas Variadas", "Tomate", "Huevo Cocido", "Atún"],
    },
    {
      categorySlug: "ensaladas",
      name: "Jupiter",
      priceEur: 9.40,
      description: "Ensalada completa con atún, pollo y parmesano.",
      details: "Lechugas variadas, tomate, atún, pechuga de pollo a la plancha, huevo cocido, picatostes y parmesano en polvo.",
      ingredients: ["Lechugas Variadas", "Tomate", "Atún", "Pechuga de Pollo a la Plancha", "Huevo Cocido", "Picatostes", "Parmesano en Polvo"],
    },
    {
      categorySlug: "ensaladas",
      name: "Dani Rovira",
      priceEur: 8.90,
      description: "Ensalada veggie con Heura, nueces y módena.",
      details: "Lechugas variadas, bocados Heura, tomate, cebolla cruda, picatostes, nueces y módena.",
      ingredients: ["Lechugas Variadas", "Bocados Heura", "Tomate", "Cebolla Cruda", "Picatostes", "Nueces", "Módena"],
    },

    // -----------------------
    // Bebidas (estándar simple, placeholder)
    // -----------------------
    { categorySlug: "bebidas", name: "Agua", priceEur: 2.00, description: "Bebida fría.", details: "Agua.", ingredients: [] },
    { categorySlug: "bebidas", name: "Agua con gas", priceEur: 2.20, description: "Bebida fría.", details: "Agua con gas.", ingredients: [] },
    { categorySlug: "bebidas", name: "Coca-Cola", priceEur: 2.50, description: "Bebida fría.", details: "Refresco.", ingredients: [] },
    { categorySlug: "bebidas", name: "Coca-Cola Zero", priceEur: 2.50, description: "Bebida fría.", details: "Refresco.", ingredients: [] },
    { categorySlug: "bebidas", name: "Fanta Naranja", priceEur: 2.50, description: "Bebida fría.", details: "Refresco.", ingredients: [] },
    { categorySlug: "bebidas", name: "Nestea Limón", priceEur: 2.50, description: "Bebida fría.", details: "Refresco.", ingredients: [] },
  ];

  // ----------------------------------------------------------
  // 1) Insert ingredientes que falten
  // ----------------------------------------------------------
  const newIngSlugToName5 = new Map<string, string>();
  for (const p of PRODUCTS_5) {
    for (const ing of p.ingredients ?? []) {
      const name = String(ing).trim();
      if (!name) continue;
      const s = slugify(name);
      if (!s) continue;
      if (!ingredientIdBySlug5.has(s)) newIngSlugToName5.set(s, name);
    }
  }

  const newIngRows5 = [...newIngSlugToName5.entries()].map(([slug, name]) => ({
    id: nextIngredientId5++,
    name,
    slug,
    imageUrl: null,
    addPriceDeltaCents: 0,
    isCommon: false,
    active: true,
    sortOrder: 0,
  }));

  if (newIngRows5.length) {
    await db.insert(Ingredient).values(newIngRows5);
    for (const r of newIngRows5) ingredientIdBySlug5.set(r.slug, r.id);
  }

  // ----------------------------------------------------------
  // 2) Insert productos
  // ----------------------------------------------------------
  const productRows5 = PRODUCTS_5.map((p) => {
    const id = nextProductId5++;
    const slug = makeUniqueProductSlug({ name: p.name, categorySlug: p.categorySlug }, usedSlugs5);
    const imageUrl = resolveProductImageUrl(slug, imageIndex);

    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Seed: categorySlug no existe: ${p.categorySlug}`);

    return {
      id,
      categoryId,
      taxRateId: null,

      name: p.name,
      slug,
      description: p.description ?? null,
      details: p.details ?? null,
      imageUrl,

      priceCents: cents(p.priceEur),

      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,

      active: true,
    };
  });

  await db.insert(Product).values(productRows5);

  const withImg5 = productRows5.filter((x) => !!x.imageUrl).length;
  // console.log(`🖼️ Seed (parte5): imágenes asignadas: ${withImg5}/${productRows5.length}`);

  // ----------------------------------------------------------
  // 3) ProductIngredient
  // - infantiles y bebidas: sin personalización (removable=false)
  // ----------------------------------------------------------
  const piRows5: any[] = [];

  for (let i = 0; i < productRows5.length; i++) {
    const prod = productRows5[i];
    const seed = PRODUCTS_5[i];

    const removable =
      seed.categorySlug === "platos-infantiles" || seed.categorySlug === "bebidas"
        ? false
        : isRemovableByCategory(seed.categorySlug);

    let sortOrder = 1;
    for (const ingName of seed.ingredients ?? []) {
      const s = slugify(String(ingName).trim());
      const ingId = ingredientIdBySlug5.get(s);
      if (!ingId) continue;

      piRows5.push({
        productId: prod.id,
        ingredientId: ingId,
        defaultIncluded: true,
        removable,
        sortOrder: sortOrder++,
      });
    }
  }

  if (piRows5.length) await db.insert(ProductIngredient).values(piRows5);

  // ----------------------------------------------------------
  // 4) ProductAllergen (inferido)
  // ----------------------------------------------------------
  const paRows5: any[] = [];

  for (let i = 0; i < productRows5.length; i++) {
    const prod = productRows5[i];
    const seed = PRODUCTS_5[i];

    const allergenSlugs = inferAllergenSlugs5(seed);
    for (const aSlug of allergenSlugs) {
      const aId = allergenIdBySlug.get(aSlug);
      if (!aId) continue;

      paRows5.push({
        productId: prod.id,
        allergenId: aId,
      });
    }
  }

  if (paRows5.length) await db.insert(ProductAllergen).values(paRows5);

  // console.log(`✅ Seed (parte5): productos insertados: ${productRows5.length}`);
  // console.log(`✅ Seed (parte5): nuevos ingredientes: ${newIngRows5.length}`);
  // console.log(`✅ Seed (parte5): relaciones producto-alérgeno: ${paRows5.length}`);

  // ==========================================================
  // PART 6/?? — Baguettes normales (de siempre) — 17 items
  // ==========================================================

  const existingProducts6 = await db.select({ id: Product.id, slug: Product.slug }).from(Product);
  const usedSlugs6 = new Set(existingProducts6.map((p) => p.slug));
  let nextProductId6 = existingProducts6.reduce((m, p) => Math.max(m, p.id), 0) + 1;

  const existingIngredients6 = await db.select({ id: Ingredient.id, slug: Ingredient.slug }).from(Ingredient);
  const ingredientIdBySlug6 = new Map<string, number>(existingIngredients6.map((r) => [r.slug, r.id]));
  let nextIngredientId6 = existingIngredients6.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  // Baguettes de siempre (Pan Tomate) — 17 items (incluye tortillas/bikinis dentro del mismo bloque del PDF)
  const PRODUCTS_6: ProductSeed[] = [
    // Columna izquierda del bloque
    {
      categorySlug: "baguettes",
      name: "Lomo con Queso",
      priceEur: 4.80,
      description: "Baguette (pan tomate) con lomo y queso.",
      details: "Pan de baguette con tomate, lomo y queso.",
      ingredients: ["Pan", "Tomate", "Lomo", "Queso"],
    },
    {
      categorySlug: "baguettes",
      name: "Bacon con Queso",
      priceEur: 4.80,
      description: "Baguette (pan tomate) con bacon y queso.",
      details: "Pan de baguette con tomate, bacon y queso.",
      ingredients: ["Pan", "Tomate", "Bacon", "Queso"],
    },
    {
      categorySlug: "baguettes",
      name: "Lomo con Bacon",
      priceEur: 5.20,
      description: "Baguette (pan tomate) con lomo y bacon.",
      details: "Pan de baguette con tomate, lomo y bacon.",
      ingredients: ["Pan", "Tomate", "Lomo", "Bacon"],
    },
    {
      categorySlug: "baguettes",
      name: "Lomo con Bacon y Queso",
      priceEur: 5.90,
      description: "Baguette (pan tomate) con lomo, bacon y queso.",
      details: "Pan de baguette con tomate, lomo, bacon y queso.",
      ingredients: ["Pan", "Tomate", "Lomo", "Bacon", "Queso"],
    },
    {
      categorySlug: "baguettes",
      name: "Pechuga de Pollo Plancha",
      priceEur: 5.80,
      description: "Baguette (pan tomate) con pechuga a la plancha.",
      details: "Pan de baguette con tomate y pechuga de pollo a la plancha.",
      ingredients: ["Pan", "Tomate", "Pechuga de Pollo a la Plancha"],
    },
    {
      categorySlug: "baguettes",
      name: "Jamón Dulce y Queso",
      priceEur: 4.80,
      description: "Baguette (pan tomate) con jamón dulce y queso.",
      details: "Pan de baguette con tomate, jamón dulce y queso.",
      ingredients: ["Pan", "Tomate", "Jamón Dulce", "Queso"],
    },
    {
      categorySlug: "baguettes",
      name: "Tortilla Francesa",
      priceEur: 4.50,
      description: "Baguette (pan tomate) con tortilla francesa.",
      details: "Pan de baguette con tomate y tortilla francesa.",
      ingredients: ["Pan", "Tomate", "Huevo"],
    },
    {
      categorySlug: "baguettes",
      name: "Tortilla de Patata",
      priceEur: 4.80,
      description: "Baguette (pan tomate) con tortilla de patata.",
      details: "Pan de baguette con tomate y tortilla de patata.",
      ingredients: ["Pan", "Tomate", "Patata", "Huevo"],
    },
    {
      categorySlug: "baguettes",
      name: "Tortilla de Queso",
      priceEur: 4.80,
      description: "Baguette (pan tomate) con tortilla de queso.",
      details: "Pan de baguette con tomate y tortilla de queso.",
      ingredients: ["Pan", "Tomate", "Huevo", "Queso"],
    },

    // Columna derecha del bloque
    {
      categorySlug: "baguettes",
      name: "Tortilla Jamón Dulce",
      priceEur: 5.10,
      description: "Baguette (pan tomate) con tortilla y jamón dulce.",
      details: "Pan de baguette con tomate, tortilla (huevo) y jamón dulce.",
      ingredients: ["Pan", "Tomate", "Huevo", "Jamón Dulce"],
    },
    {
      categorySlug: "baguettes",
      name: "Tortilla de Atún",
      priceEur: 5.50,
      description: "Baguette (pan tomate) con tortilla y atún.",
      details: "Pan de baguette con tomate, tortilla (huevo) y atún.",
      ingredients: ["Pan", "Tomate", "Huevo", "Atún"],
    },
    {
      categorySlug: "baguettes",
      name: "Bikini",
      priceEur: 3.40,
      description: "Bikini clásico (jamón dulce y queso).",
      details: "Sándwich tipo bikini con jamón dulce y queso.",
      ingredients: ["Pan de Molde", "Jamón Dulce", "Queso"],
    },
    {
      categorySlug: "baguettes",
      name: "Bikini Especial (con Huevo)",
      priceEur: 3.90,
      description: "Bikini con huevo (jamón dulce y queso).",
      details: "Sándwich tipo bikini con jamón dulce, queso y huevo.",
      ingredients: ["Pan de Molde", "Jamón Dulce", "Queso", "Huevo"],
    },
    {
      categorySlug: "baguettes",
      name: "Jamón del País",
      priceEur: 6.30,
      description: "Baguette (pan tomate) con jamón del país.",
      details: "Pan de baguette con tomate y jamón del país.",
      ingredients: ["Pan", "Tomate", "Jamón del País"],
    },
    {
      categorySlug: "baguettes",
      name: "Chorizo",
      priceEur: 6.20,
      description: "Baguette (pan tomate) con chorizo.",
      details: "Pan de baguette con tomate y chorizo.",
      ingredients: ["Pan", "Tomate", "Chorizo"],
    },
    {
      categorySlug: "baguettes",
      name: "Salchichón",
      priceEur: 6.20,
      description: "Baguette (pan tomate) con salchichón.",
      details: "Pan de baguette con tomate y salchichón.",
      ingredients: ["Pan", "Tomate", "Salchichón"],
    },
    {
      categorySlug: "baguettes",
      name: "Lomo Embuchado",
      priceEur: 6.20,
      description: "Baguette (pan tomate) con lomo embuchado.",
      details: "Pan de baguette con tomate y lomo embuchado.",
      ingredients: ["Pan", "Tomate", "Lomo Embuchado"],
    },
  ];

  // ----------------------------------------------------------
  // 1) Insert ingredientes que falten
  // ----------------------------------------------------------
  const newIngSlugToName6 = new Map<string, string>();
  for (const p of PRODUCTS_6) {
    for (const ing of p.ingredients ?? []) {
      const name = String(ing).trim();
      if (!name) continue;
      const s = slugify(name);
      if (!s) continue;
      if (!ingredientIdBySlug6.has(s)) newIngSlugToName6.set(s, name);
    }
  }

  const newIngRows6 = [...newIngSlugToName6.entries()].map(([slug, name]) => ({
    id: nextIngredientId6++,
    name,
    slug,
    imageUrl: null,
    addPriceDeltaCents: 0,
    isCommon: false,
    active: true,
    sortOrder: 0,
  }));

  if (newIngRows6.length) {
    await db.insert(Ingredient).values(newIngRows6);
    for (const r of newIngRows6) ingredientIdBySlug6.set(r.slug, r.id);
  }

  // ----------------------------------------------------------
  // 2) Insert productos
  // ----------------------------------------------------------
  const productRows6 = PRODUCTS_6.map((p) => {
    const id = nextProductId6++;
    const slug = makeUniqueProductSlug({ name: p.name, categorySlug: p.categorySlug }, usedSlugs6);
    const imageUrl = resolveProductImageUrl(slug, imageIndex);

    const categoryId = categoryIdBySlug.get(p.categorySlug);
    if (!categoryId) throw new Error(`Seed: categorySlug no existe: ${p.categorySlug}`);

    return {
      id,
      categoryId,
      taxRateId: null,

      name: p.name,
      slug,
      description: p.description ?? null,
      details: p.details ?? null,
      imageUrl,

      priceCents: cents(p.priceEur),

      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,

      active: true,
    };
  });

  await db.insert(Product).values(productRows6);

  const withImg6 = productRows6.filter((x) => !!x.imageUrl).length;
  // console.log(`🖼️ Seed (parte6): imágenes asignadas: ${withImg6}/${productRows6.length}`);

  // ----------------------------------------------------------
  // 3) ProductIngredient (baguettes: removable según isRemovableByCategory)
  // ----------------------------------------------------------
  const piRows6: any[] = [];
  for (let i = 0; i < productRows6.length; i++) {
    const prod = productRows6[i];
    const seed = PRODUCTS_6[i];
    const removable = isRemovableByCategory(seed.categorySlug);

    let sortOrder = 1;
    for (const ingName of seed.ingredients ?? []) {
      const s = slugify(String(ingName).trim());
      const ingId = ingredientIdBySlug6.get(s);
      if (!ingId) continue;

      piRows6.push({
        productId: prod.id,
        ingredientId: ingId,
        defaultIncluded: true,
        removable,
        sortOrder: sortOrder++,
      });
    }
  }

  if (piRows6.length) await db.insert(ProductIngredient).values(piRows6);

  // ----------------------------------------------------------
  // 4) ProductAllergen (inferido)
  // ----------------------------------------------------------
  const paRows6: any[] = [];
  for (let i = 0; i < productRows6.length; i++) {
    const prod = productRows6[i];
    const seed = PRODUCTS_6[i];

    const allergenSlugs = inferAllergenSlugs(seed);
    for (const aSlug of allergenSlugs) {
      const aId = allergenIdBySlug.get(aSlug);
      if (!aId) continue;

      paRows6.push({
        productId: prod.id,
        allergenId: aId,
      });
    }
  }

  if (paRows6.length) await db.insert(ProductAllergen).values(paRows6);

  // console.log(`✅ Seed (parte6): productos insertados: ${productRows6.length}`);
  // console.log(`✅ Seed (parte6): nuevos ingredientes: ${newIngRows6.length}`);
  // console.log(`✅ Seed (parte6): relaciones producto-alérgeno: ${paRows6.length}`);

  // ----------------------------------------------------------
  // MENÚ (DIARIO / FESTIVO) — independiente de la carta
  // - Productos en categoría INACTIVA + Product.active=false => no aparecen en /pedir ni /carta
  // - /menu los mostrará igualmente (tu página no debería filtrar por active)
  // ----------------------------------------------------------

  const menuCategoryId = categoryIdBySlug.get("menu-del-dia");
  if (!menuCategoryId) throw new Error("Seed: falta la categoría menu-del-dia");

  // ids para productos de menú (a partir del máximo actual)
  const existingProductsMenu = await db.select({ id: Product.id, slug: Product.slug }).from(Product);
  const usedMenuSlugs = new Set(existingProductsMenu.map((p) => p.slug));
  let nextMenuProductId = existingProductsMenu.reduce((m, p) => Math.max(m, p.id), 0) + 1;

  type MenuProdSeed = {
    kind: "DIARIO" | "FESTIVO";
    course: "PRIMERO" | "SEGUNDO" | "POSTRE";
    name: string;
    description: string;
    details: string;
  };

  const MENU_PRODUCTS: MenuProdSeed[] = [
    // ======================
    // DIARIO — 6 primeros ligeros
    // ======================
    { kind: "DIARIO", course: "PRIMERO", name: "Ensalada verde con vinagreta", description: "Lechugas, tomate y vinagreta suave.", details: "Ensalada ligera con lechugas de temporada, tomate y vinagreta suave." },
    { kind: "DIARIO", course: "PRIMERO", name: "Gazpacho andaluz", description: "Gazpacho fresquito del día.", details: "Gazpacho andaluz tradicional, servido frío. Ideal para empezar ligero." },
    { kind: "DIARIO", course: "PRIMERO", name: "Salmorejo suave con picatostes", description: "Cremoso y suave, con picatostes.", details: "Salmorejo suave acompañado de picatostes. (Guarnición puede variar)." },
    { kind: "DIARIO", course: "PRIMERO", name: "Crema de verduras de temporada", description: "Crema casera, cambia según mercado.", details: "Crema de verduras casera elaborada con producto de temporada." },
    { kind: "DIARIO", course: "PRIMERO", name: "Pasta del día (consultar)", description: "Pasta con salsa suave del día.", details: "Pasta del día con salsa suave. Pregunta al personal por la preparación de hoy." },
    { kind: "DIARIO", course: "PRIMERO", name: "Verduras a la plancha", description: "Verduras de temporada a la plancha.", details: "Verduras a la plancha con aceite de oliva y sal. Guarnición ligera y sana." },

    // ======================
    // DIARIO — 6 segundos carne/pescado
    // ======================
    { kind: "DIARIO", course: "SEGUNDO", name: "Pechuga de pollo a la plancha", description: "Pollo a la plancha con guarnición.", details: "Pechuga de pollo a la plancha con guarnición del día (patata/ensalada/verdura)." },
    { kind: "DIARIO", course: "SEGUNDO", name: "Lomo adobado con patatas", description: "Lomo adobado a la plancha.", details: "Lomo adobado a la plancha con patatas." },
    { kind: "DIARIO", course: "SEGUNDO", name: "Albóndigas caseras en salsa", description: "Albóndigas de la casa.", details: "Albóndigas caseras en salsa tradicional con guarnición del día." },
    { kind: "DIARIO", course: "SEGUNDO", name: "Merluza a la plancha al limón", description: "Merluza a la plancha.", details: "Merluza a la plancha con limón y guarnición ligera." },
    { kind: "DIARIO", course: "SEGUNDO", name: "Salmón a la plancha con verduras", description: "Salmón con verduras.", details: "Salmón a la plancha acompañado de verduras de temporada." },
    { kind: "DIARIO", course: "SEGUNDO", name: "Filete de ternera a la plancha", description: "Ternera a la plancha.", details: "Filete de ternera a la plancha con guarnición del día." },

    // ======================
    // DIARIO — 4-5 postres caseros + “postre del día o helado”
    // ======================
    { kind: "DIARIO", course: "POSTRE", name: "Flan casero", description: "Flan de la casa.", details: "Flan casero tradicional." },
    { kind: "DIARIO", course: "POSTRE", name: "Arroz con leche casero", description: "Cremoso y suave.", details: "Arroz con leche casero, cremoso y suave." },
    { kind: "DIARIO", course: "POSTRE", name: "Crema catalana", description: "Crema catalana casera.", details: "Crema catalana con su capa crujiente." },
    { kind: "DIARIO", course: "POSTRE", name: "Tarta de queso casera", description: "Tarta de queso de la casa.", details: "Tarta de queso casera, suave y cremosa." },
    { kind: "DIARIO", course: "POSTRE", name: "Postre del día o helado (consultar)", description: "Preguntar al personal.", details: "Postre del día o helado. Preguntar al personal por disponibilidad." },

    // ======================
    // FESTIVO — 6 primeros con más cache
    // ======================
    { kind: "FESTIVO", course: "PRIMERO", name: "Ensalada de burrata, tomate y pesto", description: "Burrata, tomate y pesto suave.", details: "Ensalada de burrata con tomate y pesto suave. Plato más especial." },
    { kind: "FESTIVO", course: "PRIMERO", name: "Canelones de carne gratinados", description: "Canelones gratinados al horno.", details: "Canelones de carne gratinados al horno, más elaborados para festivo." },
    { kind: "FESTIVO", course: "PRIMERO", name: "Risotto de setas y parmesano", description: "Cremoso con setas.", details: "Risotto cremoso de setas con parmesano. Plato de más nivel." },
    { kind: "FESTIVO", course: "PRIMERO", name: "Pulpo a la gallega (ración)", description: "Pulpo con aceite y pimentón.", details: "Pulpo a la gallega, ración. Un primero con más cache." },
    { kind: "FESTIVO", course: "PRIMERO", name: "Fideuà de marisco (consultar)", description: "Fideuà del día.", details: "Fideuà de marisco. Preguntar al personal por la preparación de hoy." },
    { kind: "FESTIVO", course: "PRIMERO", name: "Timbal de verduras asadas y queso de cabra", description: "Verduras asadas y queso de cabra.", details: "Timbal de verduras asadas con queso de cabra, más elaborado." },

    // ======================
    // FESTIVO — 6 segundos más elaborados (carne/pescado)
    // ======================
    { kind: "FESTIVO", course: "SEGUNDO", name: "Entrecot de ternera con patatas", description: "Entrecot a la plancha.", details: "Entrecot de ternera a la plancha con patatas. Segundo estrella de festivo." },
    { kind: "FESTIVO", course: "SEGUNDO", name: "Carrillera ibérica al vino tinto", description: "Carrillera melosa.", details: "Carrillera ibérica cocinada lenta al vino tinto, muy melosa." },
    { kind: "FESTIVO", course: "SEGUNDO", name: "Bacalao confitado con samfaina", description: "Bacalao suave y verduras.", details: "Bacalao confitado con samfaina (verduras guisadas). Plato más elaborado." },
    { kind: "FESTIVO", course: "SEGUNDO", name: "Dorada al horno con patata panadera", description: "Dorada al horno.", details: "Dorada al horno con patata panadera. Muy de festivo." },
    { kind: "FESTIVO", course: "SEGUNDO", name: "Solomillo de cerdo con salsa roquefort", description: "Solomillo con roquefort.", details: "Solomillo de cerdo con salsa roquefort y guarnición." },
    { kind: "FESTIVO", course: "SEGUNDO", name: "Sepia a la plancha con ajo y perejil", description: "Sepia a la plancha.", details: "Sepia a la plancha con ajo y perejil. Segundo más especial." },

    // ======================
    // FESTIVO — postres (4-5 caseros + “consultar”)
    // ======================
    { kind: "FESTIVO", course: "POSTRE", name: "Coulant de chocolate", description: "Corazón fundente.", details: "Coulant de chocolate con interior fundente." },
    { kind: "FESTIVO", course: "POSTRE", name: "Tiramisú casero", description: "Tiramisú de la casa.", details: "Tiramisú casero, cremoso y clásico." },
    { kind: "FESTIVO", course: "POSTRE", name: "Tarta de queso al horno", description: "Tarta de queso al horno.", details: "Tarta de queso al horno, más intensa." },
    { kind: "FESTIVO", course: "POSTRE", name: "Brownie casero (consultar)", description: "Puede llevar frutos secos.", details: "Brownie casero. Preguntar al personal por ingredientes/alérgenos exactos." },
    { kind: "FESTIVO", course: "POSTRE", name: "Postre del día o helado (consultar)", description: "Preguntar al personal.", details: "Postre del día o helado. Preguntar al personal por disponibilidad." },
  ];

  // Insert de productos menú (batch)
  const menuProductRows = MENU_PRODUCTS.map((mp) => {
    const id = nextMenuProductId++;
    const slug = makeUniqueProductSlug({ name: mp.name, categorySlug: "menu-del-dia" }, usedMenuSlugs);

    return {
      id,
      categoryId: menuCategoryId,
      taxRateId: null,
      name: mp.name,
      slug,
      description: mp.description,
      details: mp.details,
      imageUrl: null,
      priceCents: 0,

      deliveryEnabled: false,
      pickupEnabled: false,
      dineInEnabled: true,

      active: false, // ✅ no salen en carta/pedir
    };
  });

  await db.insert(Product).values(menuProductRows);

  // ids menú
  const existingMenus = await db.select({ id: Menu.id }).from(Menu);
  let nextMenuId = existingMenus.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  const diarioId = nextMenuId++;
  const festivoId = nextMenuId++;

  await db.insert(Menu).values([
    { id: diarioId, title: "Menú diario · 13,50€", kind: "DIARIO", active: true, validFrom: undefined, validTo: undefined },
    { id: festivoId, title: "Menú festivo · 15,90€", kind: "FESTIVO", active: true, validFrom: undefined, validTo: undefined },
  ]);

  // ids menuItem
  const existingMenuItems = await db.select({ id: MenuItem.id }).from(MenuItem);
  let nextMenuItemId = existingMenuItems.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  // construir MenuItem rows
  const rows: any[] = [];

  function pushMenuItems(kind: "DIARIO" | "FESTIVO", menuId: number) {
    const courses: Array<["PRIMERO" | "SEGUNDO" | "POSTRE", number]> = [
      ["PRIMERO", 1],
      ["SEGUNDO", 2],
      ["POSTRE", 3],
    ];

    for (const [course] of courses) {
      const list = MENU_PRODUCTS
        .map((mp, idx) => ({ mp, idx }))
        .filter((x) => x.mp.kind === kind && x.mp.course === course);

      for (let i = 0; i < list.length; i++) {
        const productRow = menuProductRows[list[i].idx];

        rows.push({
          id: nextMenuItemId++,
          menuId,
          productId: productRow.id,
          course,
          printOrder: 1,
          sortOrder: i + 1,
        });
      }
    }
  }

  pushMenuItems("DIARIO", diarioId);
  pushMenuItems("FESTIVO", festivoId);

  await db.insert(MenuItem).values(rows);

  // console.log("✅ Seed menú: DIARIO/FESTIVO creados (6 primeros, 6 segundos, 5 postres).");
  // ----------------------------------------------------------
  // FIN seed
  // ----------------------------------------------------------
  const totalProducts = await db.select({ id: Product.id }).from(Product);
  const totalIngredients = await db.select({ id: Ingredient.id }).from(Ingredient);
  const totalLinks = await db.select({ id: ProductAllergen.id }).from(ProductAllergen);

  console.log(
    `✅ Seed completo: productos=${totalProducts.length}, ingredientes=${totalIngredients.length}, producto-alérgeno=${totalLinks.length}`
  );

  // ----------------------------------------------------------
  // CategoryIngredient automático
  // Ingredientes comunes por categoría = ingredientes repetidos
  // en al menos 2 productos de esa misma categoría
  // ----------------------------------------------------------
  const categoryRowsForCommon = await db
    .select({
      id: Category.id,
      slug: Category.slug,
    })
    .from(Category);

  const categoryIdToSlug = new Map(
    categoryRowsForCommon.map((row) => [row.id, row.slug]),
  );

  const productCategoryRows = await db
    .select({
      productId: Product.id,
      categoryId: Product.categoryId,
    })
    .from(Product);

  const productToCategoryId = new Map(
    productCategoryRows.map((row) => [row.productId, row.categoryId]),
  );

  const ingredientRowsForCommon = await db
    .select({
      id: Ingredient.id,
      slug: Ingredient.slug,
      name: Ingredient.name,
    })
    .from(Ingredient);

  const ingredientById = new Map(
    ingredientRowsForCommon.map((row) => [row.id, row]),
  );

  const productIngredientRows = await db
    .select({
      productId: ProductIngredient.productId,
      ingredientId: ProductIngredient.ingredientId,
    })
    .from(ProductIngredient);

  const categoryIngredientCounts = new Map<string, number>();

  for (const row of productIngredientRows) {
    const categoryId = productToCategoryId.get(row.productId);
    if (!categoryId) continue;

    const categorySlug = categoryIdToSlug.get(categoryId);
    if (!categorySlug) continue;
    if (NON_CUSTOMIZABLE_CATEGORY_SLUGS.has(categorySlug)) continue;

    const ingredient = ingredientById.get(row.ingredientId);
    if (!ingredient) continue;
    if (isSauceIngredient(ingredient)) continue;

    const key = `${categoryId}:${row.ingredientId}`;
    categoryIngredientCounts.set(key, (categoryIngredientCounts.get(key) ?? 0) + 1);
  }

  const categoryIngredientRows: Array<{ categoryId: number; ingredientId: number }> = [];

  for (const [key, count] of categoryIngredientCounts.entries()) {
    if (!isIngredientCommonForCategory(count)) continue;

    const [categoryIdRaw, ingredientIdRaw] = key.split(":");
    const categoryId = Number(categoryIdRaw);
    const ingredientId = Number(ingredientIdRaw);

    if (!Number.isFinite(categoryId) || !Number.isFinite(ingredientId)) continue;

    categoryIngredientRows.push({ categoryId, ingredientId });
  }

  if (categoryIngredientRows.length) {
    await db.insert(CategoryIngredient).values(categoryIngredientRows);
  }

  const existingGroups = await db
    .select({ id: ModifierGroup.id, name: ModifierGroup.name })
    .from(ModifierGroup);

  let nextGroupId = existingGroups.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  const existingOptions = await db
    .select({ id: ModifierOption.id })
    .from(ModifierOption);

  let nextOptionId = existingOptions.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  const existingProductModifierGroups = await db
    .select({ id: ProductModifierGroup.id })
    .from(ProductModifierGroup);

  let nextProductModifierGroupId =
    existingProductModifierGroups.reduce((m, r) => Math.max(m, r.id), 0) + 1;

  // Crear grupo Salsas
  const sauceGroupId = nextGroupId++;

  await db.insert(ModifierGroup).values({
    id: sauceGroupId,
    name: "Salsas",
    minSelect: 0,
    maxSelect: 20,
    required: false,
    sortOrder: 10,
    active: true,
  });

  // Crear opciones
  const sauceOptionsSeed = [
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

  await db.insert(ModifierOption).values(
    sauceOptionsSeed.map((name, index) => ({
      id: nextOptionId++,
      groupId: sauceGroupId,
      name,
      priceDeltaCents: 50,
      sortOrder: index + 1,
      active: true,
    })),
  );

  // Enlazar a todos los productos excepto bebidas
  const allProducts = await db
    .select({
      id: Product.id,
      categoryId: Product.categoryId,
    })
    .from(Product);

  const sauceGroupLinks = allProducts
    .filter((product) => {
      const categorySlug = categoryIdToSlug.get(product.categoryId) ?? "";
      return categorySlug !== "bebidas";
    })
    .map((product) => ({
      id: nextProductModifierGroupId++,
      productId: product.id,
      groupId: sauceGroupId,
      sortOrder: 10,
    }));

  if (sauceGroupLinks.length > 0) {
    await db.insert(ProductModifierGroup).values(sauceGroupLinks);
  }

  console.log(
    `✅ Seed salsas: grupo=${sauceGroupId}, opciones=${sauceOptionsSeed.length}, enlaces=${sauceGroupLinks.length}`
  );
}