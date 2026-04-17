export type PaymentMethod = "CASH" | "CARD";

export type PaymentsSettings = {
  delivery: {
    cashEnabled: boolean;
    cardEnabled: boolean;
  };
  pickup: {
    cashEnabled: boolean;
    cardEnabled: boolean;
  };
  anyEnabled: boolean;
};

export const FIXED_PAYMENTS_SETTINGS: PaymentsSettings = {
  delivery: {
    cashEnabled: true,
    cardEnabled: true,
  },
  pickup: {
    cashEnabled: true,
    cardEnabled: true,
  },
  anyEnabled: true,
};

export function getPaymentsSettings(): PaymentsSettings {
  return {
    delivery: {
      cashEnabled: true,
      cardEnabled: true,
    },
    pickup: {
      cashEnabled: true,
      cardEnabled: true,
    },
    anyEnabled: true,
  };
}

export function normalizePaymentMethod(value: unknown): PaymentMethod | null {
  const raw = String(value ?? "").trim().toUpperCase();
  if (raw === "CASH" || raw === "CARD") return raw;
  return null;
}