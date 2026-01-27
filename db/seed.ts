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
  Favorite,
  Order,
  OrderItem,
  Payment,
  Refund,
  MenuItem,
  Ingredient,
  ProductIngredient,
  eq,
  and,
  inArray,
  UpsellItem
} from "astro:db";

import { hashPassword } from "@/server/auth/password";

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

const passwordHash = await hashPassword("P@ssw0rd");

await db.insert(User).values({
  email: "admin@arcadia.local",
  name: "Admin",
  role: "ADMIN",
  passwordHash,
  active: true,
});

function cents(eur: number) {
  return Math.round(eur * 100);
}

type ProductSeed = {
  id: number;
  categorySlug: string;
  name: string;
  priceEur: number;
  description?: string | null;
  ingredients?: string[]; // default included
  panOption?: boolean; // aplica grupo Pan -> sin gluten
};

// --- ADMIN DEFAULT (solo si no existe) ---
const ADMIN_EMAIL = "admin@arcadia.local";
const ADMIN_PASSWORD = "P@ssw0rd";

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

  // Si tienes UserProfile y lo quieres crear también (opcional pero recomendable)
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
    // si no existe UserProfile o falla, lo ignoramos
  }

  console.log(`✅ Seed: creado admin ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
} else {
  console.log(`ℹ️ Seed: admin ya existe (${ADMIN_EMAIL})`);
}

const CATEGORIES = [
  {
    id: 1,
    name: "Platos combinados",
    slug: "platos-combinados",
    sortOrder: 10,
  },
  { id: 2, name: "Tapas", slug: "tapas", sortOrder: 20 },
  { id: 3, name: "Croquetas", slug: "croquetas", sortOrder: 30 },
  { id: 4, name: "Montaditos", slug: "montaditos", sortOrder: 40 },
  { id: 5, name: "Nachos", slug: "nachos", sortOrder: 50 },
  { id: 6, name: "Sandwiches", slug: "sandwiches", sortOrder: 60 },
  { id: 7, name: "Wraps", slug: "wraps", sortOrder: 70 },
  { id: 8, name: "Bocadillos", slug: "bocadillos", sortOrder: 80 },
  {
    id: 9,
    name: "Baguettes de Marca",
    slug: "baguettes-de-marca",
    sortOrder: 90,
  },
  { id: 10, name: "Hamburguesas", slug: "hamburguesas", sortOrder: 100 },
  { id: 11, name: "Frankfurts", slug: "frankfurts", sortOrder: 110 },
  {
    id: 12,
    name: "Platos infantiles",
    slug: "platos-infantiles",
    sortOrder: 120,
  },
  { id: 13, name: "Ensaladas", slug: "ensaladas", sortOrder: 130 },
  { id: 14, name: "Bebidas", slug: "bebidas", sortOrder: 140 },
];

// Precios provisionales para extras (los ajustas luego)
// Nota: algunas claves están con espacios; hacemos fallback slug->espacios
const ING_PRESET: Record<
  string,
  { addPriceDeltaCents: number; isCommon?: boolean }
> = {
  cebolla: { addPriceDeltaCents: 30, isCommon: true },
  "cebolla crujiente": { addPriceDeltaCents: 60, isCommon: true },
  "cebolla caramelizada": { addPriceDeltaCents: 60, isCommon: true },
  lechuga: { addPriceDeltaCents: 30, isCommon: true },
  tomate: { addPriceDeltaCents: 30, isCommon: true },
  queso: { addPriceDeltaCents: 80, isCommon: true },
  "queso cheddar": { addPriceDeltaCents: 80, isCommon: true },
  "queso parmesano": { addPriceDeltaCents: 80, isCommon: true },
  atun: { addPriceDeltaCents: 100, isCommon: true },
  bacon: { addPriceDeltaCents: 120, isCommon: true },
  huevo: { addPriceDeltaCents: 80, isCommon: true },
  "huevo cocido": { addPriceDeltaCents: 80 },
  jalapenos: { addPriceDeltaCents: 60 },
  champiñones: { addPriceDeltaCents: 60, isCommon: true },
  guacamole: { addPriceDeltaCents: 80, isCommon: true },
  "jamon dulce": { addPriceDeltaCents: 120, isCommon: true },
  "jamon serrano": { addPriceDeltaCents: 150, isCommon: true },
  "pulled pork": { addPriceDeltaCents: 150 },
  "carne de kebab": { addPriceDeltaCents: 150 },
  "pimiento frito": { addPriceDeltaCents: 40 },
  "pimiento verde": { addPriceDeltaCents: 40 },
  "pimiento rojo": { addPriceDeltaCents: 40 },
  tabasco: { addPriceDeltaCents: 20 },
  "brotes de lechuga": { addPriceDeltaCents: 30 },
  "brotes de ensalada": { addPriceDeltaCents: 30 },
  "lechugas variadas": { addPriceDeltaCents: 0 },
  picatostes: { addPriceDeltaCents: 40 },
  nueces: { addPriceDeltaCents: 60 },
  "crema de modena": { addPriceDeltaCents: 40 },
  modena: { addPriceDeltaCents: 40 },
  oregano: { addPriceDeltaCents: 10 },

  mahonesa: { addPriceDeltaCents: 0 },
  "mayo veggie": { addPriceDeltaCents: 0 },
  "mayo vegana": { addPriceDeltaCents: 0 },

  "salsa griega": { addPriceDeltaCents: 0 },
  "salsa cesar": { addPriceDeltaCents: 0 },
  "salsa sioux": { addPriceDeltaCents: 0 },
  "salsa zen": { addPriceDeltaCents: 0 },
  "salsa bhuda": { addPriceDeltaCents: 0 },
  "salsa barbacoa": { addPriceDeltaCents: 0 },
  "salsa amarilla": { addPriceDeltaCents: 0 },
  "salsa cheddar": { addPriceDeltaCents: 0 },
  "salsa cheddar caliente": { addPriceDeltaCents: 0 },
  "salsa cajun": { addPriceDeltaCents: 0 },
  "confitura de tomate": { addPriceDeltaCents: 30 },

  "queso de cabra": { addPriceDeltaCents: 120 },
  "queso fresco": { addPriceDeltaCents: 80 },
};

const PRODUCTS: ProductSeed[] = [
  // Platos combinados
  {
    id: 1101,
    categorySlug: "platos-combinados",
    name: "Lomo a la plancha, patatas y huevo frito",
    priceEur: 12.2,
  },
  {
    id: 1102,
    categorySlug: "platos-combinados",
    name: "Pechuga de pollo plancha, patatas y ensalada",
    priceEur: 12.2,
  },
  {
    id: 1103,
    categorySlug: "platos-combinados",
    name: "Escalopa de pollo, ensalada y huevo frito",
    priceEur: 12.2,
  },
  {
    id: 1104,
    categorySlug: "platos-combinados",
    name: "2 hamburguesas, croquetas y patatas fritas",
    priceEur: 11.5,
  },
  {
    id: 1105,
    categorySlug: "platos-combinados",
    name: "Calamares a la andaluza, ensalada y champiñones",
    priceEur: 12.5,
  },
  {
    id: 1106,
    categorySlug: "platos-combinados",
    name: "Hamburguesa, frankfurt, patatas y huevo",
    priceEur: 11.6,
  },
  {
    id: 1107,
    categorySlug: "platos-combinados",
    name: "Butifarra de pagés, ensalada y 2 huevos",
    priceEur: 11.3,
  },
  {
    id: 1108,
    categorySlug: "platos-combinados",
    name: "8 lonchas de bacon, 2 huevos, patatas y croquetas",
    priceEur: 10.9,
  },
  {
    id: 1109,
    categorySlug: "platos-combinados",
    name: "Calamares a la plancha, ensalada y arroz",
    priceEur: 13.5,
  },
  {
    id: 1110,
    categorySlug: "platos-combinados",
    name: "Carne de kebab, arroz, tomate y cebolla",
    priceEur: 12.2,
  },
  {
    id: 1111,
    categorySlug: "platos-combinados",
    name: "Pechuga de pollo a la plancha, arroz y huevo",
    priceEur: 12.5,
  },
  {
    id: 1112,
    categorySlug: "platos-combinados",
    name: "Calamares a la andaluza, patatas y croquetas",
    priceEur: 12.5,
  },
  {
    id: 1113,
    categorySlug: "platos-combinados",
    name: "Escalopa de pollo, huevo y patatas fritas",
    priceEur: 12.2,
  },
  {
    id: 1114,
    categorySlug: "platos-combinados",
    name: "Escalopa de pollo al roquefort, arroz y huevo",
    priceEur: 12.9,
  },
  {
    id: 1115,
    categorySlug: "platos-combinados",
    name: "Arroz a la cubana (2 huevos y tomate)",
    priceEur: 9.9,
  },

  // Tapas
  {
    id: 1201,
    categorySlug: "tapas",
    name: "Patatas bravas (con 4 salsas aparte)",
    priceEur: 6.8,
  },
  {
    id: 1202,
    categorySlug: "tapas",
    name: "Crujiente de boniato",
    priceEur: 4.9,
  },
  {
    id: 1203,
    categorySlug: "tapas",
    name: "Patatas Loki (con salsa cheddar encima)",
    priceEur: 7.4,
  },
  {
    id: 1204,
    categorySlug: "tapas",
    name: "Patatas Teja (con salsa amarilla aparte)",
    priceEur: 7.2,
  },
  {
    id: 1205,
    categorySlug: "tapas",
    name: "Patatas Ninja (con cheddar, bacon y cebolla crujiente)",
    priceEur: 7.9,
  },
  {
    id: 1206,
    categorySlug: "tapas",
    name: "Chipirones a la andaluza",
    priceEur: 10.5,
  },
  {
    id: 1207,
    categorySlug: "tapas",
    name: "Calamares a la andaluza",
    priceEur: 11.9,
  },
  { id: 1208, categorySlug: "tapas", name: "Cazón en adobo", priceEur: 9.5 },
  {
    id: 1209,
    categorySlug: "tapas",
    name: "Sticks mozzarella (6u)",
    priceEur: 6.5,
  },
  {
    id: 1210,
    categorySlug: "tapas",
    name: "Alitas de pollo adobadas en casa (5u)",
    priceEur: 6.9,
  },
  {
    id: 1211,
    categorySlug: "tapas",
    name: "Surtido de quesos variados",
    priceEur: 11.9,
  },
  {
    id: 1212,
    categorySlug: "tapas",
    name: "Alitas de pollo crujientes (5u)",
    priceEur: 8.5,
  },
  {
    id: 1213,
    categorySlug: "tapas",
    name: "Tiras de pollo estilo Kentucky",
    priceEur: 8.9,
  },
  {
    id: 1214,
    categorySlug: "tapas",
    name: "Pincho de tortilla de patata",
    priceEur: 6.9,
  },
  {
    id: 1215,
    categorySlug: "tapas",
    name: "Alitas de pollo fritas (toda la vida)",
    priceEur: 6.9,
  },
  {
    id: 1216,
    categorySlug: "tapas",
    name: "Surtido de embutidos",
    priceEur: 13.9,
  },
  {
    id: 1217,
    categorySlug: "tapas",
    name: "Callos de la casa",
    priceEur: 11.5,
  },
  {
    id: 1218,
    categorySlug: "tapas",
    name: "Jamón del país (cortado máquina + pan tomate)",
    priceEur: 15.9,
  },
  {
    id: 1219,
    categorySlug: "tapas",
    name: "Sartén huevos rotos con jamón y pimientos",
    priceEur: 8.4,
  },
  {
    id: 1220,
    categorySlug: "tapas",
    name: "Sartén huevos rotos con chistorra y queso",
    priceEur: 8.9,
  },
  {
    id: 1221,
    categorySlug: "tapas",
    name: "Sartén huevos rotos con morcilla de Jaén",
    priceEur: 8.8,
  },
  { id: 1222, categorySlug: "tapas", name: "Boquerones fritos", priceEur: 7.4 },
  { id: 1223, categorySlug: "tapas", name: "Patatas fritas", priceEur: 3.9 },

  // Croquetas
  {
    id: 1301,
    categorySlug: "croquetas",
    name: "Croquetas de gamba roja (5u)",
    priceEur: 6.9,
  },
  {
    id: 1302,
    categorySlug: "croquetas",
    name: "Croquetas de jamón ibérico (5u)",
    priceEur: 6.7,
  },
  {
    id: 1303,
    categorySlug: "croquetas",
    name: "Croquetas de pollo (5u)",
    priceEur: 6.4,
  },
  {
    id: 1304,
    categorySlug: "croquetas",
    name: "Croquetas de cocido (5u)",
    priceEur: 6.7,
  },
  {
    id: 1305,
    categorySlug: "croquetas",
    name: "Croquetas de rabo de toro (5u)",
    priceEur: 7.4,
  },
  {
    id: 1306,
    categorySlug: "croquetas",
    name: "Mini croquetas de jamón (20u)",
    priceEur: 8.3,
  },
  {
    id: 1307,
    categorySlug: "croquetas",
    name: "Croquetas de foie y boletus (5u)",
    priceEur: 7.3,
  },
  {
    id: 1308,
    categorySlug: "croquetas",
    name: "Mejillones tigre (6u)",
    priceEur: 7.4,
  },

  // Montaditos
  {
    id: 1401,
    categorySlug: "montaditos",
    name: "6 montaditos flamenquín casero",
    priceEur: 8.9,
  },
  {
    id: 1402,
    categorySlug: "montaditos",
    name: "6 montaditos huevo de codorniz y bacon",
    priceEur: 8.7,
  },
  {
    id: 1403,
    categorySlug: "montaditos",
    name: "6 montaditos lomo a la andaluza",
    priceEur: 8.4,
  },
  {
    id: 1404,
    categorySlug: "montaditos",
    name: "6 montaditos mini hamburguesa",
    priceEur: 8.9,
  },
  {
    id: 1405,
    categorySlug: "montaditos",
    name: "6 montaditos salmón ahumado, queso crema y guacamole",
    priceEur: 9.5,
  },
  {
    id: 1406,
    categorySlug: "montaditos",
    name: "6 montaditos pechuguitas pollo al roquefort",
    priceEur: 8.9,
  },

  // Nachos
  {
    id: 1501,
    categorySlug: "nachos",
    name: "SINALOA",
    priceEur: 8.2,
    description: "Salsa cheddar, bacon, cebolla crujiente y jalapeños",
    ingredients: ["Salsa cheddar", "Bacon", "Cebolla crujiente", "Jalapeños"],
  },
  {
    id: 1502,
    categorySlug: "nachos",
    name: "YUCATAN",
    priceEur: 8.5,
    description: "Salsa cheddar, pulled pork y salsa sioux (pica pero poco)",
    ingredients: ["Salsa cheddar", "Pulled pork", "Salsa sioux"],
  },
  {
    id: 1503,
    categorySlug: "nachos",
    name: "JALISCO",
    priceEur: 8.9,
    description:
      "Salsa cheddar, kebab, pico de gallo (tomate, cebolla, pimientos) y guacamole",
    ingredients: [
      "Salsa cheddar",
      "Carne de kebab",
      "Tomate",
      "Cebolla",
      "Pimiento",
      "Guacamole",
    ],
  },
  {
    id: 1504,
    categorySlug: "nachos",
    name: "VERACRUZ",
    priceEur: 7.9,
    description:
      "Salsa cheddar, pico de gallo (tomate, cebolla, pimientos) y guacamole",
    ingredients: [
      "Salsa cheddar",
      "Tomate",
      "Cebolla",
      "Pimiento",
      "Guacamole",
    ],
  },

  // Sandwiches (pan de molde) + pan sin gluten
  {
    id: 1601,
    categorySlug: "sandwiches",
    name: "POSEIDÓN",
    priceEur: 8.8,
    panOption: true,
    ingredients: [
      "Pechuga plancha",
      "Jamón dulce",
      "Huevo",
      "Lechuga",
      "Tomate",
      "Salsa griega",
    ],
  },
  {
    id: 1602,
    categorySlug: "sandwiches",
    name: "AFRODITA",
    priceEur: 8.9,
    panOption: true,
    ingredients: [
      "Jamón serrano",
      "Queso",
      "Lechuga",
      "Bacon",
      "Huevo",
      "Tomate",
      "Mahonesa",
    ],
  },
  {
    id: 1603,
    categorySlug: "sandwiches",
    name: "NÉMESIS",
    priceEur: 8.4,
    panOption: true,
    ingredients: [
      "Jamón dulce",
      "Queso",
      "Tomate",
      "Lechuga",
      "Huevo",
      "Mahonesa",
    ],
  },
  {
    id: 1604,
    categorySlug: "sandwiches",
    name: "APOLO",
    priceEur: 8.8,
    panOption: true,
    ingredients: [
      "Pechuga plancha",
      "Queso",
      "Lechuga",
      "Tomate",
      "Salsa griega",
    ],
  },
  {
    id: 1605,
    categorySlug: "sandwiches",
    name: "AQUILES",
    priceEur: 8.5,
    panOption: true,
    ingredients: ["Atún", "Huevo cocido", "Lechuga", "Tomate", "Mahonesa"],
  },
  {
    id: 1606,
    categorySlug: "sandwiches",
    name: "VENUS",
    priceEur: 8.9,
    panOption: true,
    ingredients: [
      "Chicken filet de Heura",
      "Lechuga",
      "Tomate",
      "Cebolla frita",
      "Mayo veggie",
    ],
  },
  {
    id: 1607,
    categorySlug: "sandwiches",
    name: "HERCULES",
    priceEur: 9.2,
    panOption: true,
    ingredients: [
      "Pulled pork",
      "Lechuga",
      "Tomate",
      "Queso cheddar",
      "Cebolla frita",
      "Salsa sioux",
    ],
  },
  {
    id: 1608,
    categorySlug: "sandwiches",
    name: "NEPTUNO",
    priceEur: 9.8,
    panOption: true,
    ingredients: [
      "Salmón ahumado",
      "Cebolla",
      "Lechuga",
      "Tomate",
      "Guacamole",
      "Queso fresco",
      "Salsa griega",
    ],
  },

  // Wraps
  {
    id: 1701,
    categorySlug: "wraps",
    name: "FLASHDANCE",
    priceEur: 8.9,
    ingredients: [
      "Carne de kebab",
      "Cebolla",
      "Lechuga",
      "Tomate",
      "Salsa griega",
    ],
  },
  {
    id: 1702,
    categorySlug: "wraps",
    name: "PRETTY WOMAN",
    priceEur: 8.8,
    ingredients: ["Pechuga crujiente", "Lechuga", "Tomate", "Salsa griega"],
  },
  {
    id: 1703,
    categorySlug: "wraps",
    name: "TERMINATOR",
    priceEur: 8.7,
    ingredients: [
      "Pechuga plancha",
      "Cebolla frita",
      "Lechuga",
      "Tomate",
      "Pimiento",
      "Tabasco",
      "Mahonesa",
    ],
  },
  {
    id: 1704,
    categorySlug: "wraps",
    name: "FORREST GUMP",
    priceEur: 8.9,
    ingredients: [
      "Hamburguesa",
      "Huevo",
      "Lechuga",
      "Queso parmesano",
      "Cebolla caramelizada",
      "Salsa zen",
    ],
  },
  {
    id: 1705,
    categorySlug: "wraps",
    name: "JUNGLA DE CRISTAL",
    priceEur: 8.8,
    ingredients: [
      "Pechuga plancha",
      "Jamón dulce",
      "Lechuga",
      "Tomate",
      "Salsa griega",
    ],
  },
  {
    id: 1706,
    categorySlug: "wraps",
    name: "DIRTY DANCING",
    priceEur: 8.4,
    ingredients: [
      "Frankfurt",
      "Queso",
      "Huevo",
      "Cebolla crujiente",
      "Salsa bhuda",
    ],
  },
  {
    id: 1707,
    categorySlug: "wraps",
    name: "TOP GUN",
    priceEur: 8.9,
    ingredients: [
      "Hamburguesa",
      "Queso",
      "Huevo",
      "Cebolla crujiente",
      "Salsa bhuda",
    ],
  },
  {
    id: 1708,
    categorySlug: "wraps",
    name: "AVATAR",
    priceEur: 8.8,
    ingredients: [
      "Pechuga plancha",
      "Champiñones",
      "Huevo cocido",
      "Brotes de lechuga",
      "Salsa cesar",
    ],
  },
  {
    id: 1709,
    categorySlug: "wraps",
    name: "ARMA LETAL",
    priceEur: 9.2,
    ingredients: [
      "Pulled pork",
      "Salsa cheddar caliente",
      "Bacon",
      "Queso",
      "Cebolla crujiente",
      "Salsa sioux",
    ],
  },
  {
    id: 1710,
    categorySlug: "wraps",
    name: "JOAQUIN PHOENIX",
    priceEur: 8.9,
    ingredients: [
      "Hamburguesa de Heura",
      "Lechuga",
      "Tomate",
      "Brotes de lechuga",
      "Cebolla frita",
      "Salsa zen",
    ],
  },
  {
    id: 1711,
    categorySlug: "wraps",
    name: "GLADIATOR",
    priceEur: 9.8,
    ingredients: [
      "Salmón ahumado",
      "Cebolla",
      "Brotes de lechuga",
      "Tomate",
      "Guacamole",
      "Queso fresco",
      "Salsa griega",
      "Orégano",
    ],
  },

  // Bocadillos simples (pan tomate) + pan sin gluten
  {
    id: 1801,
    categorySlug: "bocadillos",
    name: "Lomo con queso",
    priceEur: 4.8,
    panOption: true,
    ingredients: ["Lomo", "Queso"],
  },
  {
    id: 1802,
    categorySlug: "bocadillos",
    name: "Bacon con queso",
    priceEur: 4.8,
    panOption: true,
    ingredients: ["Bacon", "Queso"],
  },
  {
    id: 1803,
    categorySlug: "bocadillos",
    name: "Lomo con bacon",
    priceEur: 5.2,
    panOption: true,
    ingredients: ["Lomo", "Bacon"],
  },
  {
    id: 1804,
    categorySlug: "bocadillos",
    name: "Lomo con bacon y queso",
    priceEur: 5.9,
    panOption: true,
    ingredients: ["Lomo", "Bacon", "Queso"],
  },
  {
    id: 1805,
    categorySlug: "bocadillos",
    name: "Pechuga de pollo plancha",
    priceEur: 5.8,
    panOption: true,
    ingredients: ["Pechuga plancha"],
  },
  {
    id: 1806,
    categorySlug: "bocadillos",
    name: "Jamón dulce y queso",
    priceEur: 4.8,
    panOption: true,
    ingredients: ["Jamón dulce", "Queso"],
  },
  {
    id: 1807,
    categorySlug: "bocadillos",
    name: "Tortilla francesa",
    priceEur: 4.5,
    panOption: true,
    ingredients: ["Huevo"],
  },
  {
    id: 1808,
    categorySlug: "bocadillos",
    name: "Tortilla de patata",
    priceEur: 4.8,
    panOption: true,
    ingredients: ["Patata", "Huevo"],
  },
  {
    id: 1809,
    categorySlug: "bocadillos",
    name: "Tortilla de queso",
    priceEur: 4.8,
    panOption: true,
    ingredients: ["Huevo", "Queso"],
  },
  {
    id: 1810,
    categorySlug: "bocadillos",
    name: "Tortilla jamón dulce",
    priceEur: 5.1,
    panOption: true,
    ingredients: ["Huevo", "Jamón dulce"],
  },
  {
    id: 1811,
    categorySlug: "bocadillos",
    name: "Tortilla de atún",
    priceEur: 5.5,
    panOption: true,
    ingredients: ["Huevo", "Atún"],
  },
  {
    id: 1812,
    categorySlug: "bocadillos",
    name: "Bikini",
    priceEur: 3.4,
    panOption: true,
    ingredients: ["Jamón dulce", "Queso"],
  },
  {
    id: 1813,
    categorySlug: "bocadillos",
    name: "Bikini especial (con huevo)",
    priceEur: 3.9,
    panOption: true,
    ingredients: ["Jamón dulce", "Queso", "Huevo"],
  },
  {
    id: 1814,
    categorySlug: "bocadillos",
    name: "Jamón del país",
    priceEur: 6.3,
    panOption: true,
    ingredients: ["Jamón serrano"],
  },
  {
    id: 1815,
    categorySlug: "bocadillos",
    name: "Chorizo",
    priceEur: 6.2,
    panOption: true,
    ingredients: ["Chorizo"],
  },
  {
    id: 1816,
    categorySlug: "bocadillos",
    name: "Salchichón",
    priceEur: 6.2,
    panOption: true,
    ingredients: ["Salchichón"],
  },
  {
    id: 1817,
    categorySlug: "bocadillos",
    name: "Lomo embuchado",
    priceEur: 6.2,
    panOption: true,
    ingredients: ["Lomo embuchado"],
  },

  // Baguettes de Marca (solo incluimos el tramo que tenías ya en el archivo)
  {
    id: 1903,
    categorySlug: "baguettes-de-marca",
    name: "TROYANO",
    priceEur: 9.8,
    panOption: true,
    ingredients: [
      "Carne de kebab",
      "Cebolla",
      "Lechuga",
      "Tomate",
      "Salsa griega",
    ],
  },
  {
    id: 1904,
    categorySlug: "baguettes-de-marca",
    name: "CHICKEN",
    priceEur: 9.7,
    panOption: true,
    ingredients: [
      "Pechuga plancha",
      "Cebolla frita",
      "Lechuga",
      "Huevo cocido",
      "Tomate",
      "Mahonesa",
    ],
  },
  {
    id: 1905,
    categorySlug: "baguettes-de-marca",
    name: "IBIZA",
    priceEur: 9.9,
    panOption: true,
    ingredients: [
      "Pechuga rebozada",
      "Huevo",
      "Lechuga",
      "Queso",
      "Tomate",
      "Mahonesa",
    ],
  },
  {
    id: 1906,
    categorySlug: "baguettes-de-marca",
    name: "WHATSAPP",
    priceEur: 9.8,
    panOption: true,
    ingredients: [
      "Hamburguesa",
      "Jamón dulce",
      "Lechuga",
      "Huevo",
      "Pimiento frito",
      "Queso",
      "Cebolla frita",
      "Tomate",
      "Mahonesa",
    ],
  },
  {
    id: 1907,
    categorySlug: "baguettes-de-marca",
    name: "SIRI",
    priceEur: 9.7,
    panOption: true,
    ingredients: [
      "Pechuga plancha",
      "Brotes de ensalada",
      "Tomate",
      "Queso parmesano",
      "Salsa cesar",
    ],
  },
  {
    id: 1908,
    categorySlug: "baguettes-de-marca",
    name: "JOMA",
    priceEur: 8.7,
    panOption: true,
    ingredients: ["Pechuga plancha", "Queso", "Tomate", "Mahonesa"],
  },
  {
    id: 1909,
    categorySlug: "baguettes-de-marca",
    name: "REEBOOK",
    priceEur: 8.8,
    panOption: true,
    ingredients: ["Lomo", "Jamón serrano", "Pimiento verde", "Mahonesa"],
  },
  {
    id: 1910,
    categorySlug: "baguettes-de-marca",
    name: "PUMA",
    priceEur: 6.8,
    panOption: true,
    ingredients: ["Lomo", "Bacon", "Queso", "Huevo"],
  },
  {
    id: 1911,
    categorySlug: "baguettes-de-marca",
    name: "SALOMON",
    priceEur: 7.2,
    panOption: true,
    ingredients: ["Lomo", "Queso roquefort"],
  },
  {
    id: 1912,
    categorySlug: "baguettes-de-marca",
    name: "ADIDAS",
    priceEur: 8.8,
    panOption: true,
    ingredients: [
      "Lomo",
      "Bacon",
      "Jamón serrano",
      "Huevo",
      "Queso",
      "Lechuga",
      "Mahonesa",
    ],
  },
  {
    id: 1913,
    categorySlug: "baguettes-de-marca",
    name: "NIKE",
    priceEur: 8.9,
    panOption: true,
    ingredients: [
      "Hamburguesa",
      "Queso",
      "Lechuga",
      "Cebolla frita",
      "Huevo",
      "Tomate",
      "Mahonesa",
    ],
  },
  {
    id: 1914,
    categorySlug: "baguettes-de-marca",
    name: "ASICS",
    priceEur: 8.9,
    panOption: true,
    ingredients: [
      "Pechuga rebozada",
      "Queso",
      "Huevo",
      "Lechuga",
      "Tomate",
      "Mahonesa",
    ],
  },
  {
    id: 1915,
    categorySlug: "baguettes-de-marca",
    name: "KELME",
    priceEur: 8.4,
    panOption: true,
    ingredients: ["Atún", "Lechuga", "Tomate", "Huevo cocido", "Mahonesa"],
  },
  {
    id: 1916,
    categorySlug: "baguettes-de-marca",
    name: "CLARA LAGO",
    priceEur: 8.4,
    panOption: true,
    ingredients: ["Chicken filet de Heura", "Lechuga", "Mayo veggie"],
  },
  {
    id: 1917,
    categorySlug: "baguettes-de-marca",
    name: "MIZUNO",
    priceEur: 8.2,
    panOption: true,
    ingredients: ["Pechuga rebozada", "Queso roquefort"],
  },
  {
    id: 1918,
    categorySlug: "baguettes-de-marca",
    name: "CONVERSE",
    priceEur: 6.9,
    panOption: true,
    ingredients: ["Butifarra de pagés", "Cebolla frita"],
  },
  {
    id: 1919,
    categorySlug: "baguettes-de-marca",
    name: "LISA SIMPSON",
    priceEur: 8.4,
    panOption: true,
    ingredients: [
      "Bocados Heura",
      "Brotes de lechuga",
      "Tomate",
      "Mayo vegana",
    ],
  },
  {
    id: 1920,
    categorySlug: "baguettes-de-marca",
    name: "BROOKS",
    priceEur: 8.8,
    panOption: true,
    ingredients: [
      "Pechuga plancha",
      "Brotes de ensalada",
      "Bacon",
      "Cebolla caramelizada",
      "Salsa amarilla",
    ],
  },
  {
    id: 1921,
    categorySlug: "baguettes-de-marca",
    name: "ALEXA",
    priceEur: 8.7,
    panOption: true,
    ingredients: [
      "Carne de kebab",
      "Cebolla caramelizada",
      "Lechuga",
      "Salsa amarilla",
      "Salsa cheddar",
    ],
  },
  {
    id: 1922,
    categorySlug: "baguettes-de-marca",
    name: "SKECHERS",
    priceEur: 9.4,
    panOption: true,
    ingredients: [
      "Hamburguesa pollo crujiente",
      "Salsa cheddar",
      "Cebolla crujiente",
      "Brotes de lechuga",
      "Tomate",
      "Bacon",
    ],
  },
  {
    id: 1923,
    categorySlug: "baguettes-de-marca",
    name: "NEW BALANCE",
    priceEur: 9.9,
    panOption: true,
    ingredients: ["Calamares a la andaluza", "Mahonesa", "Brotes de lechuga"],
  },

  // Hamburguesas + pan sin gluten
  {
    id: 2001,
    categorySlug: "hamburguesas",
    name: "YANDEX",
    priceEur: 9.4,
    panOption: true,
    ingredients: [
      "Hamburguesa",
      "Huevo",
      "Queso parmesano",
      "Cebolla caramelizada",
      "Salsa zen",
    ],
  },

  // Frankfurts + pan sin gluten
  {
    id: 2101,
    categorySlug: "frankfurts",
    name: "ULISES",
    priceEur: 4.8,
    panOption: true,
    ingredients: ["Frankfurt"],
  },

  // Platos infantiles
  {
    id: 2201,
    categorySlug: "platos-infantiles",
    name: "101 · Hamburguesa al plato con patatas fritas",
    priceEur: 7.4,
  },

  // Ensaladas
  {
    id: 2301,
    categorySlug: "ensaladas",
    name: "CARONTE",
    priceEur: 9.4,
    ingredients: [
      "Lechugas variadas",
      "Tomate",
      "Picatostes",
      "Pechuga crujiente",
      "Queso de cabra",
      "Nueces",
      "Crema de modena",
    ],
  },

  // Bebidas (take away)
  {
    id: 2401,
    categorySlug: "bebidas",
    name: "Coca-Cola lata 330ml",
    priceEur: 2.2,
  },
  { id: 2404, categorySlug: "bebidas", name: "Agua 500ml", priceEur: 1.5 },
];

export default async function seed() {
  // Limpieza mínima para evitar FK/duplicados en desarrollo
  await db.delete(MenuItem);
  await db.delete(Refund);
  await db.delete(Payment);
  await db.delete(OrderItem);
  await db.delete(Order);
  await db.delete(Favorite);

  await db.delete(ProductModifierGroup);
  await db.delete(ModifierOption);
  await db.delete(ModifierGroup);
  await db.delete(ProductVariant);

  await db.delete(ProductIngredient);
  await db.delete(Ingredient);

  await db.delete(Product);
  await db.delete(Category);

  // 1) Categorías
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

  const categoryIdBySlug = new Map(CATEGORIES.map((c) => [c.slug, c.id]));

  // 2) Ingredientes (auto desde los productos)
  const allIng = new Map<
    string,
    {
      name: string;
      slug: string;
      addPriceDeltaCents: number;
      isCommon: boolean;
    }
  >();

  for (const p of PRODUCTS) {
    for (const raw of p.ingredients ?? []) {
      const name = String(raw).trim();
      if (!name) continue;
      const slug = slugify(name);
      const keySpace = slug.replace(/-/g, " ");

      const preset = ING_PRESET[slug] ??
        ING_PRESET[keySpace] ?? { addPriceDeltaCents: 0, isCommon: false };

      allIng.set(slug, {
        name,
        slug,
        addPriceDeltaCents: preset.addPriceDeltaCents ?? 0,
        isCommon: !!preset.isCommon,
      });
    }
  }

  const ingredientIds = new Map<string, number>();
  let ingId = 1;

  const ingredientRows = [...allIng.values()].map((ing) => {
    ingredientIds.set(ing.slug, ingId);
    return {
      id: ingId++,
      name: ing.name,
      slug: ing.slug,
      addPriceDeltaCents: ing.addPriceDeltaCents,
      isCommon: ing.isCommon,
      active: true,
      sortOrder: 0,
    };
  });

  await db.insert(Ingredient).values(ingredientRows);

  // 3) Productos
  await db.insert(Product).values(
    PRODUCTS.map((p) => ({
      id: p.id,
      categoryId: categoryIdBySlug.get(p.categorySlug)!,
      taxRateId: null,

      name: p.name,
      slug: `${slugify(p.name)}-${p.id}`,
      description: p.description ?? null,
      imageUrl: null,
      priceCents: cents(p.priceEur),

      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,

      active: true,
    }))
  );

  // 4) Modificador: Pan -> Pan sin gluten (+1€)
  const PAN_GROUP_ID = 1;
  const PAN_OPT_ID = 101;

  await db.insert(ModifierGroup).values([
    {
      id: PAN_GROUP_ID,
      name: "Pan",
      minSelect: 0,
      maxSelect: 1,
      required: false,
      sortOrder: 1,
      active: true,
    },
  ]);

  await db.insert(ModifierOption).values([
    {
      id: PAN_OPT_ID,
      groupId: PAN_GROUP_ID,
      name: "Pan sin gluten",
      priceDeltaCents: 100,
      sortOrder: 1,
      active: true,
    },
  ]);

  await db.insert(ProductModifierGroup).values(
    PRODUCTS.filter((p) => p.panOption).map((p, idx) => ({
      id: 5000 + idx,
      productId: p.id,
      groupId: PAN_GROUP_ID,
      sortOrder: 1,
    }))
  );

  // 5) Ingredientes por defecto => “quitar…”
  let pid = 1;
  const piRows: any[] = [];

  for (const p of PRODUCTS) {
    const ings = p.ingredients ?? [];
    if (!ings.length) continue;

    let sort = 1;
    for (const ingName of ings) {
      const ingSlug = slugify(ingName);
      const ingDbId = ingredientIds.get(ingSlug);
      if (!ingDbId) continue;

      piRows.push({
        id: pid++,
        productId: p.id,
        ingredientId: ingDbId,
        defaultIncluded: true,
        removable: true,
        sortOrder: sort++,
      });
    }
  }

  if (piRows.length) {
    await db.insert(ProductIngredient).values(piRows);
  }

  // 6) Salsas extra (solo donde quieras)
  const SAUCES_GROUP_ID = 2;
  const SAUCE_PRODUCT_IDS = [1201, 1202, 1203, 1204, 1205, 1223];

  await db.insert(ModifierGroup).values([
    {
      id: SAUCES_GROUP_ID,
      name: "Salsas extra",
      minSelect: 0,
      maxSelect: 3,
      required: false,
      sortOrder: 20,
      active: true,
    },
  ]);

  await db.insert(ModifierOption).values([
    {
      id: 201,
      groupId: SAUCES_GROUP_ID,
      name: "Mayonesa",
      priceDeltaCents: 30,
      sortOrder: 1,
      active: true,
    },
    {
      id: 202,
      groupId: SAUCES_GROUP_ID,
      name: "Ketchup",
      priceDeltaCents: 30,
      sortOrder: 2,
      active: true,
    },
    {
      id: 203,
      groupId: SAUCES_GROUP_ID,
      name: "Barbacoa",
      priceDeltaCents: 50,
      sortOrder: 3,
      active: true,
    },
    {
      id: 204,
      groupId: SAUCES_GROUP_ID,
      name: "Thai agridulce",
      priceDeltaCents: 50,
      sortOrder: 4,
      active: true,
    },
    {
      id: 205,
      groupId: SAUCES_GROUP_ID,
      name: "Salsa amarilla",
      priceDeltaCents: 50,
      sortOrder: 5,
      active: true,
    },
    {
      id: 206,
      groupId: SAUCES_GROUP_ID,
      name: "Salsa brava",
      priceDeltaCents: 50,
      sortOrder: 6,
      active: true,
    },
    {
      id: 207,
      groupId: SAUCES_GROUP_ID,
      name: "Alioli",
      priceDeltaCents: 50,
      sortOrder: 7,
      active: true,
    },
  ]);

  await db.insert(ProductModifierGroup).values(
    SAUCE_PRODUCT_IDS.map((productId, i) => ({
      id: 6000 + i,
      productId,
      groupId: SAUCES_GROUP_ID,
      sortOrder: 3,
    }))
  );

  // 7) Acompañamiento: Patatas fritas (guarnición) (+2,50€)
  // Solo en: sandwiches, wraps, frankfurts, hamburguesas, bocadillos, baguettes-de-marca
  const SIDE_GROUP_ID = 4;
  const SIDE_FRIES_OPT_ID = 401;

  const SIDE_ALLOWED = new Set([
    "sandwiches",
    "wraps",
    "frankfurts",
    "hamburguesas",
    "bocadillos",
    "baguettes-de-marca",
  ]);

  await db.insert(ModifierGroup).values([
    {
      id: SIDE_GROUP_ID,
      name: "Acompañamiento",
      minSelect: 0,
      maxSelect: 1,
      required: false,
      sortOrder: 15,
      active: true,
    },
  ]);

  await db.insert(ModifierOption).values([
    {
      id: SIDE_FRIES_OPT_ID,
      groupId: SIDE_GROUP_ID,
      name: "Patatas fritas (guarnición)",
      priceDeltaCents: 250,
      sortOrder: 1,
      active: true,
    },
  ]);

  const eligibleProductIds = PRODUCTS.filter((p) =>
    SIDE_ALLOWED.has(p.categorySlug)
  ).map((p) => p.id);

  await db.insert(ProductModifierGroup).values(
    eligibleProductIds.map((productId, i) => ({
      id: 8000 + i,
      productId,
      groupId: SIDE_GROUP_ID,
      sortOrder: 2, // después de Pan
    }))
  );

  // --- UPSELL (configurable) ---
  const UPSELL_IDS = [
    1201, // Bravas
    1204, // Teja
    1203, // Loki
    1202, // Boniato
    1302, // Croquetas jamón ibérico
    1207, // Calamares andaluza
    2401, // Coca-Cola lata
    2404, // Agua
  ];

  // limpio para que el seed sea idempotente
  await db.delete(UpsellItem);

  // insertamos solo los que existan (evita FK)
  const existing = await db
    .select({ id: Product.id })
    .from(Product)
    .where(inArray(Product.id, UPSELL_IDS));

  const ok = new Set(existing.map((x) => x.id));

  await db.insert(UpsellItem).values(
    UPSELL_IDS.filter((id) => ok.has(id)).map((productId, i) => ({
      productId,
      sortOrder: i + 1,
      active: true,
    }))
  );
}
