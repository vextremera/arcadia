/**
 * Roles del panel y qué alcanza cada uno.
 *
 * Este fichero es la única fuente: de aquí salen tanto el filtro del menú
 * lateral como el cierre de puertas del middleware. Tenerlo en un sitio evita
 * lo de siempre — que una sección desaparezca del menú pero su URL siga
 * abierta a quien la escriba a mano.
 */

export type AdminRole = "ADMIN" | "WORKER";

export const ADMIN_ROLES: AdminRole[] = ["ADMIN", "WORKER"];

export const ADMIN_ROLE_LABEL: Record<AdminRole, string> = {
  ADMIN: "Admin total",
  WORKER: "Trabajador",
};

export const ADMIN_ROLE_DESCRIPTION: Record<AdminRole, string> = {
  ADMIN: "Acceso a todo el panel, incluidos ventas, catálogo y cuentas del equipo.",
  WORKER: "Solo lo del turno: pedidos, pase de cocina, impresoras y tickets.",
};

export function isAdminRole(value: unknown): value is AdminRole {
  return value === "ADMIN" || value === "WORKER";
}

/**
 * Lo que puede tocar un trabajador.
 *
 * Es una lista corta y explícita en vez de una de prohibiciones: si mañana se
 * añade una pantalla nueva, queda fuera por omisión. Al revés, una sección
 * sensible recién creada estaría abierta hasta que alguien se acordara de
 * vetarla.
 *
 * Cada entrada cubre la ruta y todo lo que cuelgue de ella, así que
 * "/admin/pedidos" incluye el detalle de un pedido y su ticket.
 */
const WORKER_PATHS: string[] = [
  // Historial de pedidos, con su detalle y su ticket imprimible.
  "/admin/pedidos",
  // Pase de cocina.
  "/admin/cocina",
  // Impresoras y las plantillas que imprimen: van juntas.
  "/admin/impresoras",
  "/admin/tickets",
  // Su propia cuenta: cambiar la contraseña.
  "/admin/cuenta",
];

/** Rutas de la API que necesita un trabajador para que esas pantallas sirvan. */
const WORKER_API_PATHS: string[] = [
  "/api/admin/kitchen",
  "/api/admin/orders",
  "/api/admin/printers",
  "/api/admin/tickets",
  "/api/admin/cuenta",
  "/api/admin/logout",
];

/** Dónde aterriza cada rol al entrar. */
export const ADMIN_ROLE_HOME: Record<AdminRole, string> = {
  ADMIN: "/admin",
  // El panel de inicio son cifras de negocio, que no es cosa de un turno.
  WORKER: "/admin/pedidos",
};

function normalize(pathname: string): string {
  if (!pathname) return "/";
  return pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}

function matches(pathname: string, allowed: string[]): boolean {
  const path = normalize(pathname);
  return allowed.some((base) => path === base || path.startsWith(`${base}/`));
}

/** ¿Este rol puede abrir esta ruta del panel o de su API? */
export function canAccessAdminPath(role: AdminRole, pathname: string): boolean {
  if (role === "ADMIN") return true;

  const path = normalize(pathname);

  // La raíz del panel no se le niega: se le redirige a su propia portada.
  if (path === "/admin") return false;

  return matches(path, WORKER_PATHS) || matches(path, WORKER_API_PATHS);
}
