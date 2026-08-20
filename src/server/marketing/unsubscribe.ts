/**
 * Baja del newsletter sin necesidad de cuenta.
 *
 * Toda comunicación comercial debe llevar una forma sencilla y gratuita de
 * dejar de recibirla. El pie de los envíos remitía al perfil del usuario, lo
 * que obliga a tener cuenta e iniciar sesión: justo la barrera que no puede
 * haber. Ahora cada suscriptor tiene una clave propia y el enlace del correo
 * da de baja de un clic.
 *
 * La clave se genera cuando hace falta y se guarda, de modo que los
 * suscriptores que ya existían la reciben en su primer envío.
 */
import { db, NewsletterSubscriber, eq } from "astro:db";
import { randomUUID } from "node:crypto";

/** Devuelve la clave del suscriptor, creándola si aún no tenía. */
export async function ensureUnsubscribeToken(subscriberId: number): Promise<string> {
  const [row] = await db
    .select({ token: NewsletterSubscriber.unsubscribeToken })
    .from(NewsletterSubscriber)
    .where(eq(NewsletterSubscriber.id, subscriberId))
    .limit(1);

  if (row?.token) return row.token;

  const token = randomUUID();

  await db
    .update(NewsletterSubscriber)
    .set({ unsubscribeToken: token, updatedAt: new Date() })
    .where(eq(NewsletterSubscriber.id, subscriberId));

  return token;
}

/** Enlace de baja absoluto para meter en el correo. */
export function unsubscribeUrl(origin: string, token: string): string {
  return `${origin}/baja?t=${encodeURIComponent(token)}`;
}

/**
 * Da de baja a quien tenga esta clave.
 *
 * Devuelve el correo dado de baja, o null si la clave no vale. No distingue
 * entre "no existe" y "ya estaba de baja": para quien pulsa el enlace el
 * resultado es el mismo y no hay por qué confirmar si una dirección está en la
 * lista a quien tenga el enlace.
 */
export async function unsubscribeByToken(token: string): Promise<string | null> {
  const limpio = String(token ?? "").trim();
  if (!limpio) return null;

  const [row] = await db
    .select({ id: NewsletterSubscriber.id, email: NewsletterSubscriber.email })
    .from(NewsletterSubscriber)
    .where(eq(NewsletterSubscriber.unsubscribeToken, limpio))
    .limit(1);

  if (!row) return null;

  await db
    .update(NewsletterSubscriber)
    .set({ active: false, updatedAt: new Date() })
    .where(eq(NewsletterSubscriber.id, row.id));

  return row.email;
}
