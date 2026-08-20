/**
 * Identidad legal del negocio.
 *
 * La ley de servicios de la sociedad de la información obliga a que el titular
 * de una web comercial esté identificado de forma permanente, directa y
 * gratuita: denominación, NIF, domicilio, correo y datos registrales si los
 * hay. Y la normativa de protección de datos exige identificar a quién
 * responde del tratamiento.
 *
 * Hasta ahora el aviso legal decía literalmente que "los datos fiscales
 * deberán completarse", que es exactamente lo que no se puede publicar.
 *
 * Todo sale de aquí: aviso legal, política de privacidad, condiciones de
 * contratación y el pie de los correos. Se rellena una vez.
 *
 * ⚠️ MIENTRAS ESTÉ VACÍO, la web avisa en las páginas legales de que falta.
 * Es feo a propósito: preferible que se vea a que parezca correcto sin serlo.
 */

export type BusinessIdentity = {
  /** Nombre comercial, el que ve el cliente. */
  tradeName: string;
  /** Denominación fiscal: nombre y apellidos del autónomo, o razón social. */
  legalName: string;
  /** NIF, NIE o CIF. */
  taxId: string;
  /** Domicilio completo, tal como figura en Hacienda. */
  address: string;
  /** Correo de contacto legal. Puede ser el mismo que el de atención. */
  email: string;
  phone: string;
  /**
   * Datos registrales, sólo si es sociedad. Un autónomo lo deja vacío: no
   * está inscrito en el Registro Mercantil y no tiene que inventarse nada.
   */
  registry: string;
};

export const BUSINESS: BusinessIdentity = {
  tradeName: "Arcadia",

  // ⚠️ PENDIENTE — rellenar con los datos reales antes de abrir al público.
  legalName: "",
  taxId: "",
  address: "",
  email: "victorarcadia@gmail.com",
  phone: "+34 606 07 78 00",
  registry: "",
};

/** ¿Está la identidad completa para poder publicar? */
export function businessIdentityComplete(): boolean {
  return Boolean(BUSINESS.legalName && BUSINESS.taxId && BUSINESS.address && BUSINESS.email);
}

/** Qué falta, para poder decirlo en pantalla sin que haya que adivinarlo. */
export function missingBusinessFields(): string[] {
  const faltan: string[] = [];
  if (!BUSINESS.legalName) faltan.push("denominación fiscal");
  if (!BUSINESS.taxId) faltan.push("NIF/CIF");
  if (!BUSINESS.address) faltan.push("domicilio");
  if (!BUSINESS.email) faltan.push("correo de contacto");
  return faltan;
}

/** Línea de identificación para el pie de los correos. */
export function businessLegalLine(): string {
  return [BUSINESS.legalName || BUSINESS.tradeName, BUSINESS.taxId, BUSINESS.address]
    .filter(Boolean)
    .join(" · ");
}
