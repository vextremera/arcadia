import { d as db, C as Category } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';
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
  const categories = await db.select({
    id: Category.id,
    name: Category.name,
    slug: Category.slug,
    sortOrder: Category.sortOrder
  }).from(Category).where(eq(Category.active, true)).orderBy(Category.sortOrder);
  return json({
    categories
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
