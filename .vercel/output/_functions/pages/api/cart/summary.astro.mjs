import { g as getCartSummaryFromSession } from '../../../chunks/cartSummary_tr67fzdw.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async (context) => {
  const summary = await getCartSummaryFromSession(context.session);
  return new Response(JSON.stringify(summary), {
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
