import { g as getArcadiaAvailability } from './madrid_57G2TjB3.mjs';
import { b as buildDeliveryMessage } from './publicMessages_CJF1J5-O.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
const GET = async () => {
  const rawAvailability = await getArcadiaAvailability();
  return json({
    ...rawAvailability,
    deliveryMessage: buildDeliveryMessage(rawAvailability)
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
