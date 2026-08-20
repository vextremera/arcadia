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

/**
 * Sesión del panel, aparte de la del cliente.
 *
 * Son dos cosas distintas guardadas con claves distintas: alguien del bar puede
 * estar a la vez con su cuenta de cliente y con la del panel en el mismo
 * navegador, y cerrar una no debe cerrar la otra.
 */
type AdminSessionUser = import("@/server/auth/adminUsers").AdminSessionUser;

declare namespace App {
  interface Locals {
    user?: AppUser;
    admin?: AdminSessionUser;
    lang?: import("@/lib/i18n").SiteLang;
  }

  interface SessionData {
    user?: AppUser;
    admin?: AdminSessionUser;
    cart?: CartItemSession[];
    orderNotes?: string;
  }
}