import { d as db, r as UpsellItem, c as Product } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq, and } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
const GET = async () => {
  const rows = await db.select({
    id: Product.id,
    name: Product.name,
    description: Product.description,
    imageUrl: Product.imageUrl,
    priceCents: Product.priceCents,
    active: Product.active,
    deliveryEnabled: Product.deliveryEnabled,
    pickupEnabled: Product.pickupEnabled,
    sortOrder: UpsellItem.sortOrder
  }).from(UpsellItem).innerJoin(Product, eq(UpsellItem.productId, Product.id)).where(and(eq(UpsellItem.active, true), eq(Product.active, true))).orderBy(UpsellItem.sortOrder);
  const products = rows.map(({
    sortOrder,
    ...p
  }) => p);
  return json({
    products
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
