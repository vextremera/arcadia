import type { APIRoute } from "astro";
import { db, Product, inArray } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

// IDs de tu seed (ajusta si cambiaste alguno)
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

export const GET: APIRoute = async () => {
  const rows = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      active: Product.active,
      deliveryEnabled: Product.deliveryEnabled,
      pickupEnabled: Product.pickupEnabled,
    })
    .from(Product)
    .where(inArray(Product.id, UPSELL_IDS));

  // mantener orden del array
  const map = new Map(rows.map((r) => [r.id, r]));
  const products = UPSELL_IDS.map((id) => map.get(id)).filter(Boolean);

  return json({ products });
};
