import { d as db, A as AppSetting } from '../../../chunks/_astro_db_BPgDZzX3.mjs';
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
const DEFAULTS = {
  delivery: {
    cashEnabled: true,
    cardEnabled: true
  },
  pickup: {
    cashEnabled: true,
    cardEnabled: true
  }
};
const GET = async () => {
  const [row] = await db.select({
    value: AppSetting.value
  }).from(AppSetting).where(eq(AppSetting.key, "payments")).limit(1);
  return json(row?.value ?? DEFAULTS);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
