import { g as getArcadiaAvailability } from '../../../chunks/madrid_Co69_PDc.mjs';
export { renderers } from '../../../renderers.mjs';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8"
    }
  });
}
function buildDeliveryMessage(availability) {
  const start = availability.windows?.delivery?.start ?? "";
  const end = availability.windows?.delivery?.end ?? "";
  const source = availability.sources?.delivery ?? "APP_SETTING";
  const note = availability.sourceNotes?.delivery?.trim() || null;
  if (availability.forcePickup) {
    return note ? `Delivery desactivado temporalmente desde operativa. ${note}` : "Delivery desactivado temporalmente desde operativa.";
  }
  if (source === "SPECIAL_DATE_CLOSED") {
    return note ? `Delivery no disponible hoy por una excepción operativa. ${note}` : "Delivery no disponible hoy por una excepción operativa.";
  }
  if (source === "SPECIAL_DATE") {
    return note ? `Fuera de la franja especial de reparto de hoy (${start}–${end}). ${note}` : `Fuera de la franja especial de reparto de hoy (${start}–${end}).`;
  }
  if (source === "OPENING_HOUR_CLOSED") {
    return "Delivery no disponible hoy según el horario semanal.";
  }
  if (source === "OPENING_HOUR") {
    return `Fuera de la franja semanal de reparto (${start}–${end}).`;
  }
  return `Fuera de horario de reparto (${start}–${end}).`;
}
const GET = async () => {
  const rawAvailability = await getArcadiaAvailability();
  const availability = rawAvailability;
  return json({
    ...rawAvailability,
    deliveryMessage: buildDeliveryMessage(availability)
  });
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
