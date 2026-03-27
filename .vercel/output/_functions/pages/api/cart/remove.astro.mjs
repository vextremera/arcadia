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
const POST = async ({
  request,
  session
}) => {
  const body = await parseJSON(request);
  if (!body) return json({
    error: "INVALID_JSON"
  }, 400);
  const lineId = String(body.lineId ?? "");
  if (!lineId) return json({
    error: "MISSING_LINE_ID"
  }, 400);
  const items = await session?.get("cart") ?? [];
  const next = items.filter((i) => i.lineId !== lineId);
  await session?.set("cart", next);
  return json({
    ok: true
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
