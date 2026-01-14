import { db, User, Category, Product } from "astro:db";

// Hash ultra simple SOLO para dev seed (luego haremos auth real).
// Si quieres auth ya, lo cambiamos por scrypt con crypto.
function devHash(pw: string) {
  return `dev:${pw}`;
}

export default async function seed() {
  // Admin
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

  // Categorías
  await db.insert(Category).values([
    { id: 1, name: "Pizzas", slug: "pizzas", sortOrder: 1, active: true },
    { id: 2, name: "Bocatas", slug: "bocatas", sortOrder: 2, active: true },
    { id: 3, name: "Postres", slug: "postres", sortOrder: 3, active: true },
  ]);

  // Productos
  await db.insert(Product).values([
    {
      id: 101,
      categoryId: 1,
      name: "Pizza Margarita",
      slug: "pizza-margarita",
      priceCents: 950,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },
    {
      id: 102,
      categoryId: 1,
      name: "Pizza Pepperoni",
      slug: "pizza-pepperoni",
      priceCents: 1150,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },
    {
      id: 201,
      categoryId: 2,
      name: "Bocata de pollo",
      slug: "bocata-pollo",
      priceCents: 750,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },
    {
      id: 301,
      categoryId: 3,
      name: "Tiramisú",
      slug: "tiramisu",
      priceCents: 520,
      deliveryEnabled: true,
      pickupEnabled: true,
      dineInEnabled: true,
      active: true,
    },
  ]);
}
