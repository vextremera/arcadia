/// <reference types="astro/client" />

type AppUser = {
  id: number;
  email: string;
  name?: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
};

type CartItemSession = {
  lineId: string;
  productId: number;
  variantId?: number;
  qty: number;
  modifierOptionIds?: number[];
  addedIngredientIds?: number[];
  removedIngredientIds?: number[];
};

declare namespace App {
  interface Locals {
    user?: AppUser;
  }

  interface SessionData {
    user?: AppUser;
    cart?: CartItemSession[];
    orderNotes?: string;
  }
}
