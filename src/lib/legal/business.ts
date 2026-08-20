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

  legalName: "EUROHOGAR2005, S.L.",
  // ⚠️ PENDIENTE — el CIF real de la sociedad (letra + 8 caracteres).
  taxId: "",
  address: "Maria Aurelia Capmany i Farnés, 2, 17310, Lloret de Mar",
  email: "victorarcadia@gmail.com",
  phone: "+34 606 07 78 00",
  // ⚠️ PENDIENTE — al ser S.L. hace falta: Registro Mercantil de Girona,
  // tomo, folio y hoja. Está en la escritura de constitución.
  registry: "",
};

/**
 * ¿Tiene forma de NIF, NIE o CIF español?
 *
 * Se comprueba la forma y no sólo que haya algo escrito. Un campo relleno con
 * "x" pasaría cualquier comprobación de "no está vacío", y entonces el aviso
 * legal publicaría un NIF inventado — que es bastante peor que decir que falta,
 * porque parece correcto.
 *
 * No se valida el dígito de control a propósito: el objetivo es cazar un
 * relleno provisional, no hacer de Hacienda.
 */
function pareceIdentificacionFiscal(valor: string): boolean {
  const limpio = valor.replace(/[\s.-]/g, "").toUpperCase();

  // CIF de sociedad: letra + 8 caracteres. NIF: 8 dígitos + letra.
  // NIE: X/Y/Z + 7 dígitos + letra.
  return /^[A-HJNPQRSUVW]\d{7}[0-9A-J]$/.test(limpio)
    || /^\d{8}[A-Z]$/.test(limpio)
    || /^[XYZ]\d{7}[A-Z]$/.test(limpio);
}

/** ¿Está la identidad completa y con datos de verdad? */
export function businessIdentityComplete(): boolean {
  return missingBusinessFields().length === 0;
}

/** Qué falta, para poder decirlo en pantalla sin que haya que adivinarlo. */
export function missingBusinessFields(): string[] {
  const faltan: string[] = [];

  if (BUSINESS.legalName.trim().length < 3) faltan.push("denominación fiscal");
  if (!pareceIdentificacionFiscal(BUSINESS.taxId)) faltan.push("NIF/CIF");
  if (BUSINESS.address.trim().length < 10) faltan.push("domicilio");
  if (!BUSINESS.email.includes("@")) faltan.push("correo de contacto");

  /**
   * Una sociedad está inscrita en el Registro Mercantil y tiene que decir
   * dónde. Un autónomo no, y por eso el campo sólo se exige cuando la
   * denominación delata que hay sociedad detrás.
   */
  const esSociedad = /\b(s\.?l\.?|s\.?a\.?|s\.?l\.?u\.?|sociedad)\b/i.test(BUSINESS.legalName);
  if (esSociedad && BUSINESS.registry.trim().length < 10) faltan.push("datos registrales");

  return faltan;
}

/** Línea de identificación para el pie de los correos. */
export function businessLegalLine(): string {
  return [BUSINESS.legalName || BUSINESS.tradeName, BUSINESS.taxId, BUSINESS.address]
    .filter(Boolean)
    .join(" · ");
}
