function safeNote(value) {
  const note = String(value ?? "").trim();
  return note || null;
}
function channelLabel(channel) {
  switch (String(channel ?? "").trim().toUpperCase()) {
    case "DINE_IN":
      return "Local";
    case "PICKUP":
      return "Pickup";
    case "DELIVERY":
      return "Delivery";
    default:
      return "Canal";
  }
}
function buildDeliveryMessage(availability) {
  const start = availability.windows?.delivery?.start ?? "";
  const end = availability.windows?.delivery?.end ?? "";
  const source = availability.sources?.delivery ?? "APP_SETTING";
  const note = safeNote(availability.sourceNotes?.delivery);
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
function buildOperationalMessage(availability) {
  if (availability.pauseOrders) {
    return "Los pedidos están pausados temporalmente desde operativa. Puedes consultar horarios, pero el canal de pedidos puede no estar disponible en este momento.";
  }
  if (availability.forcePickup) {
    const note = safeNote(availability.sourceNotes?.delivery);
    return note ? `Ahora mismo trabajamos solo recogida. El reparto está temporalmente desactivado desde operativa. ${note}` : "Ahora mismo trabajamos solo recogida. El reparto está temporalmente desactivado desde operativa.";
  }
  const specialNotes = (availability.specialDateNotes ?? []).map((item) => {
    const note = safeNote(item.note);
    if (!note) return null;
    return `${channelLabel(item.channel)}: ${note}`;
  }).filter((item) => Boolean(item));
  return specialNotes.join(" · ");
}

export { buildOperationalMessage as a, buildDeliveryMessage as b };
