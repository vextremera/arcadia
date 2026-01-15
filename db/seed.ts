import {
  db,
  User,
  Category,
  Product,
  Ingredient,
  ProductIngredient,
  ModifierGroup,
  ModifierOption,
  ProductModifierGroup,
} from "astro:db";

function devHash(pw: string) {
  return `dev:${pw}`;
}

export default async function seed() {
  // 1) Admin
  await db.insert(User).values([
    {
      id: 1,
      email: "admin@arcadia.local",
      name: "Admin",
      passwordHash: devHash("P@ssw0rd"),
      role: "ADMIN",
      active: true,
    },
  ]);

  // 2) Categorías reales de Arcadia
  await db.insert(Category).values([
    { id: 1, name: "Platos combinados", slug: "platos-combinados", sortOrder: 1, active: true },
    { id: 2, name: "Tapas", slug: "tapas", sortOrder: 2, active: true },
    { id: 3, name: "Croquetas", slug: "croquetas", sortOrder: 3, active: true },
    { id: 4, name: "Montaditos", slug: "montaditos", sortOrder: 4, active: true },
    { id: 5, name: "Nachos", slug: "nachos", sortOrder: 5, active: true },
    { id: 6, name: "Sandwiches", slug: "sandwiches", sortOrder: 6, active: true },
    { id: 7, name: "Wraps (Enrollados)", slug: "wraps", sortOrder: 7, active: true },
    { id: 8, name: "Bocadillos", slug: "bocadillos", sortOrder: 8, active: true },
    { id: 9, name: "Minis", slug: "minis", sortOrder: 9, active: true },
    { id: 10, name: "Pan de Coca", slug: "pan-de-coca", sortOrder: 10, active: true },
    { id: 11, name: "Hamburguesas", slug: "hamburguesas", sortOrder: 11, active: true },
    { id: 12, name: "Baguettes de Marca", slug: "baguettes-de-marca", sortOrder: 12, active: true },
    { id: 13, name: "Ensaladas", slug: "ensaladas", sortOrder: 13, active: true },
    { id: 14, name: "Platos infantiles", slug: "platos-infantiles", sortOrder: 14, active: true },
  ]);

  // 3) Modifier groups base (Pan sin gluten, Salsas extra)
  await db.insert(ModifierGroup).values([
    { id: 1, name: "Pan", minSelect: 0, maxSelect: 1, required: false, sortOrder: 1, active: true },
    { id: 2, name: "Salsas extra", minSelect: 0, maxSelect: 3, required: false, sortOrder: 2, active: true },
  ]);

  await db.insert(ModifierOption).values([
    // Pan
    { id: 101, groupId: 1, name: "Pan sin gluten", priceDeltaCents: 100, sortOrder: 1, active: true },

    // Salsas (extra)
    { id: 201, groupId: 2, name: "Mayonesa", priceDeltaCents: 50, sortOrder: 1, active: true },
    { id: 202, groupId: 2, name: "Ketchup", priceDeltaCents: 50, sortOrder: 2, active: true },
    { id: 203, groupId: 2, name: "Barbacoa", priceDeltaCents: 50, sortOrder: 3, active: true },
    { id: 204, groupId: 2, name: "Thai agridulce", priceDeltaCents: 60, sortOrder: 4, active: true },
    { id: 205, groupId: 2, name: "Salsa amarilla", priceDeltaCents: 60, sortOrder: 5, active: true },
    { id: 206, groupId: 2, name: "Salsa brava", priceDeltaCents: 50, sortOrder: 6, active: true },
    { id: 207, groupId: 2, name: "Alioli", priceDeltaCents: 60, sortOrder: 7, active: true },
  ]);

  // 4) Ingredientes (catálogo global) - precios provisionales
  await db.insert(Ingredient).values([
    { id: 1, name: "Lechuga", slug: "lechuga", addPriceDeltaCents: 30, isCommon: true, active: true },
    { id: 2, name: "Tomate", slug: "tomate", addPriceDeltaCents: 30, isCommon: true, active: true },
    { id: 3, name: "Queso", slug: "queso", addPriceDeltaCents: 80, isCommon: true, active: true },
    { id: 4, name: "Cebolla", slug: "cebolla", addPriceDeltaCents: 30, isCommon: true, active: true },
    { id: 5, name: "Atún", slug: "atun", addPriceDeltaCents: 100, isCommon: true, active: true },
    { id: 6, name: "Bacon", slug: "bacon", addPriceDeltaCents: 120, isCommon: true, active: true },
    { id: 7, name: "Huevo", slug: "huevo", addPriceDeltaCents: 80, isCommon: true, active: true },
    { id: 8, name: "Pepinillo", slug: "pepinillo", addPriceDeltaCents: 40, isCommon: false, active: true },
    { id: 9, name: "Jalapeños", slug: "jalapenos", addPriceDeltaCents: 60, isCommon: false, active: true },
    { id: 10, name: "Picatostes", slug: "picatostes", addPriceDeltaCents: 40, isCommon: false, active: true },
    { id: 11, name: "Pollo", slug: "pollo", addPriceDeltaCents: 150, isCommon: false, active: true },
    { id: 12, name: "Ternera", slug: "ternera", addPriceDeltaCents: 180, isCommon: false, active: true },
    { id: 13, name: "Jamón", slug: "jamon", addPriceDeltaCents: 120, isCommon: false, active: true },
    { id: 14, name: "Salchicha Frankfurt", slug: "frankfurt", addPriceDeltaCents: 130, isCommon: false, active: true },
  ]);

  // 5) Productos demo (10)
  await db.insert(Product).values([
    // Bocadillos
    {
      id: 1001,
      categoryId: 8,
      name: "Bocadillo de pollo",
      slug: "bocadillo-pollo",
      priceCents: 750,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },
    {
      id: 1002,
      categoryId: 8,
      name: "Bocadillo de atún",
      slug: "bocadillo-atun",
      priceCents: 690,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },

    // Hamburguesas
    {
      id: 1101,
      categoryId: 11,
      name: "Hamburguesa clásica",
      slug: "hamburguesa-clasica",
      priceCents: 950,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },
    {
      id: 1102,
      categoryId: 11,
      name: "Hamburguesa bacon & queso",
      slug: "hamburguesa-bacon-queso",
      priceCents: 1090,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },

    // Sandwich
    {
      id: 6001,
      categoryId: 6,
      name: "Sándwich mixto",
      slug: "sandwich-mixto",
      priceCents: 550,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },

    // Wrap
    {
      id: 7001,
      categoryId: 7,
      name: "Wrap de pollo",
      slug: "wrap-pollo",
      priceCents: 890,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },

    // Tapas
    {
      id: 2001,
      categoryId: 2,
      name: "Patatas bravas",
      slug: "patatas-bravas",
      priceCents: 520,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },

    // Nachos
    {
      id: 5001,
      categoryId: 5,
      name: "Nachos con queso",
      slug: "nachos-queso",
      priceCents: 850,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },

    // Ensaladas
    {
      id: 13001,
      categoryId: 13,
      name: "Ensalada mixta",
      slug: "ensalada-mixta",
      priceCents: 790,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },

    // Infantil
    {
      id: 14001,
      categoryId: 14,
      name: "Nuggets con patatas",
      slug: "nuggets-patatas",
      priceCents: 650,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },
  ]);

  // 6) Vincular grupos de modificadores a productos (Pan para bocatas/hamburguesas/sándwich/wrap)
  await db.insert(ProductModifierGroup).values([
    { id: 1, productId: 1001, groupId: 1, sortOrder: 1 },
    { id: 2, productId: 1002, groupId: 1, sortOrder: 1 },
    { id: 3, productId: 1101, groupId: 1, sortOrder: 1 },
    { id: 4, productId: 1102, groupId: 1, sortOrder: 1 },
    { id: 5, productId: 6001, groupId: 1, sortOrder: 1 },
    { id: 6, productId: 7001, groupId: 1, sortOrder: 1 },

    // Salsas extra para patatas/nuggets/nachos (ejemplo)
    { id: 7, productId: 2001, groupId: 2, sortOrder: 1 },
    { id: 8, productId: 14001, groupId: 2, sortOrder: 1 },
    { id: 9, productId: 5001, groupId: 2, sortOrder: 1 },
  ]);

  // 7) Ingredientes por producto (defaultIncluded / removable)
  await db.insert(ProductIngredient).values([
    // Bocadillo pollo: lechuga, tomate, queso (removibles)
    { id: 1, productId: 1001, ingredientId: 1, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 2, productId: 1001, ingredientId: 2, defaultIncluded: true, removable: true, sortOrder: 2 },
    { id: 3, productId: 1001, ingredientId: 3, defaultIncluded: true, removable: true, sortOrder: 3 },

    // Bocadillo atún: lechuga, tomate, cebolla, atún
    { id: 4, productId: 1002, ingredientId: 1, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 5, productId: 1002, ingredientId: 2, defaultIncluded: true, removable: true, sortOrder: 2 },
    { id: 6, productId: 1002, ingredientId: 4, defaultIncluded: true, removable: true, sortOrder: 3 },
    { id: 7, productId: 1002, ingredientId: 5, defaultIncluded: true, removable: true, sortOrder: 4 },

    // Hamburguesa clásica: lechuga, tomate, cebolla, pepinillo, queso
    { id: 8, productId: 1101, ingredientId: 1, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 9, productId: 1101, ingredientId: 2, defaultIncluded: true, removable: true, sortOrder: 2 },
    { id: 10, productId: 1101, ingredientId: 4, defaultIncluded: true, removable: true, sortOrder: 3 },
    { id: 11, productId: 1101, ingredientId: 8, defaultIncluded: true, removable: true, sortOrder: 4 },
    { id: 12, productId: 1101, ingredientId: 3, defaultIncluded: true, removable: true, sortOrder: 5 },

    // Hamburguesa bacon&queso: lechuga, tomate, queso, bacon
    { id: 13, productId: 1102, ingredientId: 1, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 14, productId: 1102, ingredientId: 2, defaultIncluded: true, removable: true, sortOrder: 2 },
    { id: 15, productId: 1102, ingredientId: 3, defaultIncluded: true, removable: true, sortOrder: 3 },
    { id: 16, productId: 1102, ingredientId: 6, defaultIncluded: true, removable: true, sortOrder: 4 },

    // Sándwich mixto: jamón, queso (no “removable” si quieres; aquí sí)
    { id: 17, productId: 6001, ingredientId: 13, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 18, productId: 6001, ingredientId: 3, defaultIncluded: true, removable: true, sortOrder: 2 },

    // Wrap pollo: pollo, lechuga, tomate, cebolla
    { id: 19, productId: 7001, ingredientId: 11, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 20, productId: 7001, ingredientId: 1, defaultIncluded: true, removable: true, sortOrder: 2 },
    { id: 21, productId: 7001, ingredientId: 2, defaultIncluded: true, removable: true, sortOrder: 3 },
    { id: 22, productId: 7001, ingredientId: 4, defaultIncluded: true, removable: true, sortOrder: 4 },

    // Patatas bravas: (sin ingredientes por defecto; se gestionan por salsas extra)
    // Nachos queso: queso + jalapeños
    { id: 23, productId: 5001, ingredientId: 3, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 24, productId: 5001, ingredientId: 9, defaultIncluded: true, removable: true, sortOrder: 2 },

    // Ensalada mixta: lechuga, tomate, cebolla, picatostes (removable para picatostes)
    { id: 25, productId: 13001, ingredientId: 1, defaultIncluded: true, removable: true, sortOrder: 1 },
    { id: 26, productId: 13001, ingredientId: 2, defaultIncluded: true, removable: true, sortOrder: 2 },
    { id: 27, productId: 13001, ingredientId: 4, defaultIncluded: true, removable: true, sortOrder: 3 },
    { id: 28, productId: 13001, ingredientId: 10, defaultIncluded: true, removable: true, sortOrder: 4 },

    // Nuggets: sin ingredientes
  ]);
}
