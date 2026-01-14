export type CartLine = {
  lineId: string;
  productId: number;
  name: string;
  imageUrl?: string | null;

  variantId?: number;
  variantName?: string | null;

  qty: number;

  unitPriceCents: number;
  lineTotalCents: number;

  modifiers: Array<{ id: number; name: string; priceDeltaCents: number }>;
  notes?: string;
};

export type CartResponse = {
  currency: "EUR";
  items: CartLine[];
  subtotalCents: number;
  count: number;
};
