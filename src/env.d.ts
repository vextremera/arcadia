type CartItemSession = {
  lineId: string;
  productId: number;
  variantId?: number;
  qty: number;
  modifierOptionIds?: number[];
  notes?: string;
};

declare namespace App {
  interface Locals {
    user?: {
      id: number;
      email: string;
      name?: string | null;
      role: "ADMIN" | "STAFF" | "CUSTOMER";
    };
  }

  interface SessionData {
    user?: {
      id: number;
      email: string;
      name?: string | null;
      role: "ADMIN" | "STAFF" | "CUSTOMER";
    };

    cart?: CartItemSession[];
  }
}
