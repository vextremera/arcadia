/**
 * Normaliza los estados de pedido al flujo de tres pasos.
 *
 * El flujo pasa de ocho estados a tres (Nuevo → En reparto → Entregado) más la
 * cancelación. Los pedidos anteriores pueden tener PAID, ACCEPTED, PREPARING o
 * READY: todos ellos son "aún no ha salido", así que se consolidan en PENDING.
 *
 * OUT_FOR_DELIVERY, DELIVERED y CANCELLED se quedan como están.
 *
 * No hace falta para que la web funcione —normalizeOrderStatus resuelve los
 * valores antiguos al leerlos—, pero deja la base coherente y evita que los
 * filtros por estado del admin dejen pedidos fuera.
 *
 * Es idempotente.
 *
 *   npx astro db execute db/migrate-order-status.ts            # local
 *   npx astro db execute db/migrate-order-status.ts --remote   # producción
 */
import { db, Order, inArray } from "astro:db";

// Se castea porque estos valores ya no existen en el enum de TypeScript,
// pero sí siguen en las filas antiguas de la base de datos.
const OBSOLETOS = ["PAID", "ACCEPTED", "PREPARING", "READY"] as unknown as ("PENDING")[];

export default async function migrateOrderStatus() {
  const afectados = await db
    .select({ id: Order.id, publicId: Order.publicId, status: Order.status })
    .from(Order)
    .where(inArray(Order.status, OBSOLETOS));

  if (!afectados.length) {
    console.log("No hay pedidos con estados obsoletos. Nada que migrar.");
    return;
  }

  const porEstado: Record<string, number> = {};
  for (const row of afectados) {
    porEstado[String(row.status)] = (porEstado[String(row.status)] ?? 0) + 1;
  }

  await db.update(Order).set({ status: "PENDING" }).where(inArray(Order.status, OBSOLETOS));

  console.log(
    JSON.stringify(
      {
        pedidosActualizados: afectados.length,
        desdeEstado: porEstado,
        nuevoEstado: "PENDING (Nuevo)",
      },
      null,
      1,
    ),
  );
}
