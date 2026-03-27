export { renderers } from '../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
async function parseJSON(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
function stableLineId(input) {
  const variant = input.variantId ?? 0;
  const opts = (input.modifierOptionIds ?? []).slice().sort((a, b) => a - b).join(",");
  const added = (input.addedIngredientIds ?? []).slice().sort((a, b) => a - b).join(",");
  const removed = (input.removedIngredientIds ?? []).slice().sort((a, b) => a - b).join(",");
  const raw = `${input.productId}|${variant}|opts:${opts}|add:${added}|rem:${removed}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = h * 33 ^ raw.charCodeAt(i);
  return `${input.productId}-${variant}-${(h >>> 0).toString(16)}`;
}
const POST = async ({
  request,
  session
}) => {
  if (!session) return new Response("Session not available", {
    status: 500
  });
  const body = await parseJSON(request);
  if (!body) return json({
    error: "INVALID_JSON"
  }, 400);
  const productId = Number(body.productId);
  const variantId = body.variantId == null ? void 0 : Number(body.variantId);
  const qty = Math.max(1, Number(body.qty ?? 1));
  const modifierOptionIds = Array.isArray(body.modifierOptionIds) ? body.modifierOptionIds.map(Number).filter(Number.isFinite) : [];
  const addedIngredientIds = Array.isArray(body.addedIngredientIds) ? body.addedIngredientIds.map(Number).filter(Number.isFinite) : [];
  const removedIngredientIds = Array.isArray(body.removedIngredientIds) ? body.removedIngredientIds.map(Number).filter(Number.isFinite) : [];
  if (!Number.isFinite(productId)) return json({
    error: "INVALID_PRODUCT_ID"
  }, 400);
  const base = {
    productId,
    variantId,
    modifierOptionIds,
    addedIngredientIds,
    removedIngredientIds
  };
  const lineId = stableLineId(base);
  const items = await session.get("cart") ?? [];
  const idx = items.findIndex((i) => i.lineId === lineId);
  if (idx >= 0) {
    items[idx] = {
      ...items[idx],
      qty: items[idx].qty + qty
    };
  } else {
    items.push({
      lineId,
      productId,
      variantId,
      qty,
      modifierOptionIds,
      addedIngredientIds,
      removedIngredientIds
    });
  }
  await session.set("cart", items);
  return json({
    ok: true,
    lineId
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
