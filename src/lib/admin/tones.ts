/**
 * Mapa único de tonos de estado para el admin.
 *
 * Sustituye a las funciones `statusTone` / `paymentTone` que estaban
 * duplicadas en varias páginas (admin/index.astro, pedidos, etc.).
 * Cada tono devuelve las clases border/bg/text ya compuestas.
 */

export type ToneName =
  | "primary"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "violet"
  | "cyan"
  | "indigo"
  | "fuchsia"
  | "neutral";

export const TONES: Record<ToneName, string> = {
  primary: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  success: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  warning: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  danger: "border-rose-400/20 bg-rose-400/10 text-rose-300",
  info: "border-sky-400/20 bg-sky-400/10 text-sky-300",
  violet: "border-violet-400/20 bg-violet-400/10 text-violet-300",
  cyan: "border-cyan-400/20 bg-cyan-400/10 text-cyan-300",
  indigo: "border-indigo-400/20 bg-indigo-400/10 text-indigo-300",
  fuchsia: "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300",
  neutral: "border-white/10 bg-white/[0.03] text-slate-300",
};

export function toneClasses(tone: ToneName): string {
  return TONES[tone] ?? TONES.neutral;
}

/** Estados de `Order.status`. */
const ORDER_STATUS_TONES: Record<string, ToneName> = {
  PENDING: "warning",
  PAID: "primary",
  ACCEPTED: "cyan",
  PREPARING: "violet",
  READY: "success",
  OUT_FOR_DELIVERY: "fuchsia",
  DELIVERED: "success",
  CANCELLED: "danger",
};

/** Estados de `Order.paymentStatus`. */
const PAYMENT_STATUS_TONES: Record<string, ToneName> = {
  PAID: "success",
  UNPAID: "warning",
  AUTH: "primary",
  FAILED: "danger",
  REFUNDED: "fuchsia",
  PARTIALLY_REFUNDED: "fuchsia",
};

/** Canal del pedido (DELIVERY / PICKUP). */
const ORDER_TYPE_TONES: Record<string, ToneName> = {
  DELIVERY: "cyan",
  PICKUP: "indigo",
};

export function orderStatusTone(status: string): ToneName {
  return ORDER_STATUS_TONES[status] ?? "neutral";
}

export function paymentStatusTone(status: string): ToneName {
  return PAYMENT_STATUS_TONES[status] ?? "neutral";
}

export function orderTypeTone(type: string): ToneName {
  return ORDER_TYPE_TONES[type] ?? "neutral";
}

/** Rol de `User.role`. */
const USER_ROLE_TONES: Record<string, ToneName> = {
  ADMIN: "violet",
  STAFF: "cyan",
  CUSTOMER: "primary",
};

/** Motivo de `LoyaltyLedger.reason`. */
const LEDGER_REASON_TONES: Record<string, ToneName> = {
  ORDER_PAID: "success",
  PROMO_BONUS: "success",
  ORDER_REFUND: "danger",
  MANUAL_ADJUST: "warning",
};

export function userRoleTone(role: string): ToneName {
  return USER_ROLE_TONES[role] ?? "neutral";
}

export function ledgerReasonTone(reason: string): ToneName {
  return LEDGER_REASON_TONES[reason] ?? "neutral";
}
