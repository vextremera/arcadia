// src/features/catalog/data/products.ts
import { db, Product, and, eq } from "astro:db";

export async function getProductsByCategoryId(categoryId: number) {
  return db
    .select({
      id: Product.id,
      name: Product.name,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      deliveryEnabled: Product.deliveryEnabled,
      pickupEnabled: Product.pickupEnabled,
    })
    .from(Product)
    .where(and(eq(Product.categoryId, categoryId), eq(Product.active, true)))
    .orderBy(Product.name);
}
