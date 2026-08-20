/**
 * Empresas que tratan datos por cuenta del restaurante.
 *
 * La política de privacidad tiene que decir a quién se comunican los datos y si
 * salen de la Unión Europea. No basta con un "podremos ceder datos a
 * proveedores": hay que poder saber quién los toca y para qué.
 *
 * La lista vive aquí y no en los textos por idioma porque son casi todo nombres
 * propios: se traduce el para qué, no el quién. Y así, al cambiar de proveedor,
 * sólo hay un sitio que tocar.
 *
 * ⚠️ Con cada uno de estos hace falta un contrato de encargo del tratamiento.
 * Los grandes lo tienen publicado y se acepta al crear la cuenta, pero es algo
 * que hay que comprobar, no dar por hecho.
 */

export type Processor = {
  name: string;
  /** Para qué se usa, en una línea. */
  purpose: string;
  /** Dónde se tratan los datos y qué implica. */
  location: string;
  /** true si el tratamiento sale del Espacio Económico Europeo. */
  outsideEu: boolean;
};

export const PROCESSORS: Processor[] = [
  {
    name: "Vercel",
    purpose: "Alojamiento de la web y ejecución del servidor.",
    location: "Estados Unidos, con cláusulas contractuales tipo.",
    outsideEu: true,
  },
  {
    name: "Turso (libSQL)",
    purpose: "Base de datos: cuentas, pedidos, direcciones y puntos.",
    location: "Unión Europea.",
    outsideEu: false,
  },
  {
    name: "Upstash",
    purpose: "Sesiones y carrito mientras navegas.",
    location: "Unión Europea.",
    outsideEu: false,
  },
  {
    name: "Google Ireland",
    purpose:
      "Acceso con cuenta de Google, mapa de la portada y comprobación anti-robots del acceso.",
    location: "Irlanda, con posible tratamiento en Estados Unidos.",
    outsideEu: true,
  },
  {
    name: "OpenStreetMap (Nominatim)",
    purpose:
      "Situar la dirección de entrega en el mapa para saber si entra en la zona de reparto.",
    location: "Unión Europea.",
    outsideEu: false,
  },
  {
    name: "Proveedor de correo saliente",
    purpose:
      "Envío de la confirmación de los pedidos, respuestas del formulario de contacto y newsletter.",
    location: "Según el proveedor contratado.",
    outsideEu: false,
  },
];

/** ¿Hay algún tratamiento fuera de la UE? Para poder decirlo sin repetirse. */
export function hasInternationalTransfers(): boolean {
  return PROCESSORS.some((processor) => processor.outsideEu);
}
