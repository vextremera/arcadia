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

  // La denominación social completa incluye la forma jurídica. El CIF empieza
  // por B, que es precisamente la letra de una sociedad limitada.
  legalName: "EUROHOGAR2005, S.L.",
  taxId: "B17876327",
  address: "Maria Aurelia Capmany i Farnés, 2, 17310, Lloret de Mar",
  email: "victorarcadia@gmail.com",
  phone: "+34 606 07 78 00",
  // ⚠️ PENDIENTE — está en la escritura de constitución. Formato:
  // "Registro Mercantil de Girona, tomo 1234, folio 56, hoja GI-7890".
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
   * dónde. Un autónomo no, y por eso el campo sólo se le exige a la primera.
   *
   * Si hay sociedad o no se decide por **la letra inicial del CIF**, no por
   * cómo esté escrito el nombre. Antes se miraba la denominación, y quitarle
   * el "S.L." bastaba para que el requisito desapareciera — cosa que puede
   * pasar sin mala intención, simplemente al acortar el nombre. La letra del
   * CIF no se puede cambiar: A es anónima, B limitada, y así.
   */
  const inicial = BUSINESS.taxId.trim().toUpperCase()[0] ?? "";
  const esSociedad = "ABCDEFGHJPQRSUVN".includes(inicial) && inicial !== "";

  if (esSociedad && !pareceInscripcionRegistral(BUSINESS.registry)) {
    faltan.push("datos registrales");
  }

  return faltan;
}

/**
 * ¿Los datos registrales parecen de verdad?
 *
 * Una inscripción real dice registro, tomo, folio y hoja, así que lleva
 * números sí o sí. Sin esta comprobación, un "pendiente" o un "registro de
 * prueba" pasaba por bueno y acababa publicado en el aviso legal.
 */
function pareceInscripcionRegistral(valor: string): boolean {
  const limpio = valor.trim();

  return limpio.length >= 15 && /\d/.test(limpio) && /registro|tomo|folio|hoja/i.test(limpio);
}

/** Línea de identificación para el pie de los correos. */
export function businessLegalLine(): string {
  return [BUSINESS.legalName || BUSINESS.tradeName, BUSINESS.taxId, BUSINESS.address]
    .filter(Boolean)
    .join(" · ");
}
