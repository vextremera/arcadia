function getPaymentsSettings() {
  return {
    delivery: {
      cashEnabled: true,
      cardEnabled: true
    },
    pickup: {
      cashEnabled: true,
      cardEnabled: true
    },
    anyEnabled: true
  };
}
function normalizePaymentMethod(value) {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "CASH" || raw === "CARD") return raw;
  return null;
}

export { getPaymentsSettings as g, normalizePaymentMethod as n };
