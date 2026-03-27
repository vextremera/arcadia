import { v as validateCheckoutCoupon } from '../../../chunks/coupons_DiQMMw4o.mjs';
export { renderers } from '../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
const POST = async ({
  request,
  session
}) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return json({
      ok: false,
      error: "INVALID_JSON",
      message: "Body inválido."
    }, 400);
  }
  const user = session ? await session.get("user") : void 0;
  const type = String(body.type ?? "").toUpperCase() === "DELIVERY" ? "DELIVERY" : "PICKUP";
  const subtotalCents = Math.max(0, Number(body.subtotalCents ?? 0) || 0);
  const deliveryFeeCents = Math.max(0, Number(body.deliveryFeeCents ?? 0) || 0);
  const code = String(body.code ?? "");
  const result = await validateCheckoutCoupon({
    code,
    type,
    subtotalCents,
    deliveryFeeCents,
    userId: user?.role === "CUSTOMER" ? user.id : null
  });
  return json(result);
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
