/**
 * Derechos de acceso y supresión sobre los propios datos.
 *
 * `GET`  → descarga todo lo que guardamos de esta cuenta, en JSON.
 * `POST` con `intent=delete` → borra la cuenta.
 *
 * Sobre el borrado hay una tensión real que conviene entender antes de tocar
 * nada: el derecho de supresión no es absoluto y cede ante la obligación de
 * conservar la documentación de las ventas durante años. Así que **los pedidos
 * no se borran: se despersonalizan**. Se quitan nombre, teléfono, correo y
 * dirección, y queda el registro contable sin datos de nadie.
 *
 * La fila de `User` tampoco se borra, se vacía. Hay pedidos, puntos y registros
 * de auditoría apuntando a ella, y eliminarla los rompería. Queda inservible
 * para entrar: sin correo real, sin contraseña utilizable y desactivada.
 */
import type { APIRoute } from "astro";
import {
  db,
  User,
  UserProfile,
  Address,
  NewsletterSubscriber,
  Order,
  OrderItem,
  LoyaltyLedger,
  eq,
  inArray,
} from "astro:db";
import { randomUUID } from "node:crypto";
import { hashPassword } from "@/server/auth/password";

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function requireCustomer(locals: App.Locals) {
  const user = locals.user;
  if (!user || user.role !== "CUSTOMER") return null;
  return user;
}

/** Todo lo que guardamos de una cuenta, en un solo objeto. */
async function exportarDatos(userId: number) {
  const [cuenta] = await db
    .select({
      id: User.id,
      email: User.email,
      nombre: User.name,
      alta: User.createdAt,
      activa: User.active,
    })
    .from(User)
    .where(eq(User.id, userId))
    .limit(1);

  const [perfil] = await db
    .select({
      telefono: UserProfile.phone,
      cumpleanos: UserProfile.birthday,
      puntos: UserProfile.pointsBalance,
      nivelId: UserProfile.tierId,
    })
    .from(UserProfile)
    .where(eq(UserProfile.userId, userId))
    .limit(1);

  const direcciones = await db.select().from(Address).where(eq(Address.userId, userId));
  const pedidos = await db.select().from(Order).where(eq(Order.userId, userId));

  const lineas = pedidos.length
    ? await db
      .select()
      .from(OrderItem)
      .where(inArray(OrderItem.orderId, pedidos.map((p) => p.id)))
    : [];

  const puntos = await db.select().from(LoyaltyLedger).where(eq(LoyaltyLedger.userId, userId));

  const [boletin] = await db
    .select({ email: NewsletterSubscriber.email, activo: NewsletterSubscriber.active })
    .from(NewsletterSubscriber)
    .where(eq(NewsletterSubscriber.userId, userId))
    .limit(1);

  return {
    generado: new Date().toISOString(),
    cuenta: cuenta ?? null,
    perfil: perfil ?? null,
    direcciones,
    pedidos: pedidos.map((pedido) => ({
      ...pedido,
      lineas: lineas.filter((linea) => linea.orderId === pedido.id),
    })),
    movimientosDePuntos: puntos,
    newsletter: boletin ?? null,
  };
}

export const GET: APIRoute = async ({ locals }) => {
  const user = requireCustomer(locals);
  if (!user) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  const datos = await exportarDatos(user.id);

  return new Response(JSON.stringify(datos, null, 2), {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Que el navegador lo baje como fichero en vez de mostrarlo.
      "content-disposition": `attachment; filename="arcadia-mis-datos-${user.id}.json"`,
      "cache-control": "no-store",
    },
  });
};

export const POST: APIRoute = async ({ locals, request, session }) => {
  const user = requireCustomer(locals);
  if (!user) return json({ ok: false, error: "UNAUTHORIZED" }, 401);

  const body = (await request.json().catch(() => null)) as { intent?: string; confirm?: string } | null;

  if (body?.intent !== "delete") {
    return json({ ok: false, error: "INVALID_INTENT" }, 400);
  }

  /**
   * Se pide escribir el propio correo. Borrar es irreversible y no puede
   * quedar a un clic de distancia en una pantalla que alguien abrió sin
   * querer.
   */
  if (String(body.confirm ?? "").trim().toLowerCase() !== user.email.trim().toLowerCase()) {
    return json(
      { ok: false, error: "CONFIRM_MISMATCH", message: "Escribe tu correo tal cual para confirmar." },
      400,
    );
  }

  const marca = randomUUID().slice(0, 8);

  // Los pedidos se conservan por obligación contable, pero sin datos de nadie.
  const pedidos = await db.select({ id: Order.id }).from(Order).where(eq(Order.userId, user.id));

  for (const pedido of pedidos) {
    await db
      .update(Order)
      .set({
        userId: null,
        customerName: "Cuenta eliminada",
        customerPhone: "",
        customerEmail: null,
        addressSnapshot: { anonimizado: true, fecha: new Date().toISOString() },
      })
      .where(eq(Order.id, pedido.id));
  }

  await db.delete(Address).where(eq(Address.userId, user.id));
  await db.delete(UserProfile).where(eq(UserProfile.userId, user.id));
  await db.delete(NewsletterSubscriber).where(eq(NewsletterSubscriber.userId, user.id));
  await db.delete(LoyaltyLedger).where(eq(LoyaltyLedger.userId, user.id));

  // La fila se vacía en lugar de borrarse: hay registros apuntando a ella.
  await db
    .update(User)
    .set({
      email: `eliminada-${marca}@arcadia.invalid`,
      name: null,
      googleSub: null,
      passwordHash: hashPassword(randomUUID()),
      active: false,
      updatedAt: new Date(),
    })
    .where(eq(User.id, user.id));

  await session?.delete("user");

  return json({ ok: true, message: "Cuenta eliminada." });
};
