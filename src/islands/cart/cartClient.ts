import { api } from "@/islands/_shared/http";
import type { CartResponse } from "./types";

let snapshot: CartResponse | null = null;

const EVENT = "arcadia:cart";

function emit() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getCartSnapshot() {
  return snapshot;
}

export function subscribeCart(cb: () => void) {
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

export async function refreshCart() {
  snapshot = await api<CartResponse>("/api/cart");
  emit();
  return snapshot;
}

export async function addToCart(payload: {
  productId: number;
  qty?: number;
  variantId?: number;
  modifierOptionIds?: number[];
  addedIngredientIds?: number[];
  removedIngredientIds?: number[];
  notes?: string;
}) {
  await api("/api/cart/add", { method: "POST", body: JSON.stringify(payload) });
  return refreshCart();
}

export async function setQty(lineId: string, qty: number) {
  await api("/api/cart/set-qty", { method: "POST", body: JSON.stringify({ lineId, qty }) });
  return refreshCart();
}

export async function removeLine(lineId: string) {
  await api("/api/cart/remove", { method: "POST", body: JSON.stringify({ lineId }) });
  return refreshCart();
}

export async function clearCart() {
  await api("/api/cart/clear", { method: "POST", body: JSON.stringify({}) });
  return refreshCart();
}
