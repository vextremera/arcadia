/**
 * Estados de un pedido.
 *
 * El flujo tiene tres pasos: Nuevo → En reparto → Entregado. La cancelación no
 * es un paso más, es una salida del flujo, y por eso va aparte: además de
 * cerrar el pedido, excluye sus importes de la analítica y revierte los puntos
 * de fidelidad.
 *
 * Los códigos internos se conservan (`PENDING`, `OUT_FOR_DELIVERY`,
 * `DELIVERED`) a propósito. En SQLite la columna es `text` con
 * `DEFAULT 'PENDING'`: el `enum` de Astro DB sólo existe en TypeScript, así que
 * renombrar los códigos obligaría a cambiar el DEFAULT, y cambiar un DEFAULT
 * implica recrear la tabla Order — cuyo DROP falla por las claves ajenas y
 * tumba el despliegue. Cambiando sólo las etiquetas no se toca el esquema.
 */

export const ORDER_FLOW_STATUSES = ["PENDING", "OUT_FOR_DELIVERY", "DELIVERED"] as const;

export type OrderFlowStatus = (typeof ORDER_FLOW_STATUSES)[number];
export type OrderStatus = OrderFlowStatus | "CANCELLED";

export const ORDER_STATUSES: readonly OrderStatus[] = [...ORDER_FLOW_STATUSES, "CANCELLED"];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Nuevo",
  OUT_FOR_DELIVERY: "En reparto",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

/**
 * Estados antiguos que quedaron en pedidos ya existentes.
 *
 * Se resuelven al leer, no sólo al migrar: un pedido creado antes del cambio
 * seguiría teniendo `PREPARING` en base de datos, y sin esta tabla la interfaz
 * mostraría un hueco en vez de un estado.
 */
const LEGACY_STATUS_MAP: Record<string, OrderStatus> = {
  PAID: "PENDING",
  ACCEPTED: "PENDING",
  PREPARING: "PENDING",
  READY: "PENDING",
};

/** Normaliza cualquier valor guardado a uno de los estados vigentes. */
export function normalizeOrderStatus(value: unknown): OrderStatus {
  const raw = String(value ?? "").toUpperCase();
  if ((ORDER_STATUSES as readonly string[]).includes(raw)) return raw as OrderStatus;
  return LEGACY_STATUS_MAP[raw] ?? "PENDING";
}

export function orderStatusLabel(value: unknown): string {
  return ORDER_STATUS_LABEL[normalizeOrderStatus(value)];
}

/** El pase de cocina sólo trabaja con lo que aún no se ha entregado. */
export const KITCHEN_STATUSES: readonly OrderFlowStatus[] = ["PENDING", "OUT_FOR_DELIVERY"];

export function isKitchenStatus(value: unknown): boolean {
  return (KITCHEN_STATUSES as readonly string[]).includes(normalizeOrderStatus(value));
}

/**
 * Siguiente paso del flujo, o null si no hay.
 * Cancelar no aparece aquí: es una acción aparte, no el paso siguiente.
 */
export function nextOrderStatus(value: unknown): OrderFlowStatus | null {
  const current = normalizeOrderStatus(value);
  if (current === "PENDING") return "OUT_FOR_DELIVERY";
  if (current === "OUT_FOR_DELIVERY") return "DELIVERED";
  return null;
}

export function isFinalOrderStatus(value: unknown): boolean {
  const current = normalizeOrderStatus(value);
  return current === "DELIVERED" || current === "CANCELLED";
}
