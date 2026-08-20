/**
 * Configuración central de navegación del panel admin.
 *
 * El sidebar (src/components/admin/AdminSidebar.astro) se construye a partir
 * de esta estructura, en lugar de tener las rutas hardcodeadas en el markup.
 *
 * Agrupación acordada con el negocio (estilo TailAdmin):
 * Dashboard · E-commerce · Productos · Users · In-Live · Gestiones · Menú
 *
 * Nota: algunas rutas aún no existen (se irán construyendo por fases). Se
 * marcan con `soon: true` para poder señalizarlas en la UI si se desea.
 */

import type { AdminIconName } from "@/lib/admin/icons";
import { canAccessAdminPath, type AdminRole } from "@/lib/admin/roles";

export type AdminNavItem = {
  label: string;
  href: string;
  /** true si la página todavía no está construida (fase futura). */
  soon?: boolean;
};

/**
 * Color de acento de cada sección del sidebar.
 *
 * El azul (`sky`) es el color de acción del admin (hovers, botones), y se
 * reserva para Dashboard. El resto de secciones llevan un tono propio para
 * que la navegación se reconozca por color además de por icono.
 */
export type AdminNavAccent =
  | "sky"
  | "emerald"
  | "amber"
  | "fuchsia"
  | "rose"
  | "teal"
  | "violet";

export type AdminNavSection = {
  id: string;
  title: string;
  icon: AdminIconName;
  accent: AdminNavAccent;
  /** Ruta de aterrizaje al pulsar la sección en modo rail (colapsado). */
  landing: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "dashboard",
    accent: "sky",
    landing: "/admin",
    items: [
      { label: "Visitantes", href: "/admin/dashboard/visitantes" },
      { label: "Estadísticas y ventas", href: "/admin/estadisticas" },
      { label: "Logística", href: "/admin/dashboard/logistica" },
    ],
  },
  {
    id: "ecommerce",
    title: "E-commerce",
    icon: "cart",
    accent: "emerald",
    landing: "/admin/pedidos",
    items: [
      { label: "Pedidos", href: "/admin/pedidos" },
      { label: "Upsell", href: "/admin/upsell" },
      { label: "Métodos de pago", href: "/admin/ajustes/pagos" },
    ],
  },
  {
    id: "productos",
    title: "Productos",
    icon: "products",
    accent: "amber",
    landing: "/admin/catalogo/productos",
    items: [
      { label: "Familias de productos", href: "/admin/categorias" },
      { label: "Productos", href: "/admin/catalogo/productos" },
      { label: "Ingredientes", href: "/admin/catalogo/ingredientes" },
      { label: "Alérgenos", href: "/admin/catalogo/alergenos" },
      { label: "Modificadores clasificados", href: "/admin/catalogo/modificadores" },
    ],
  },
  {
    id: "users",
    title: "Usuarios",
    icon: "users",
    accent: "fuchsia",
    landing: "/admin/usuarios",
    items: [
      // Clientes de la web. El equipo del bar va aparte, en su propia tabla.
      { label: "Clientes", href: "/admin/usuarios" },
      { label: "Rankings", href: "/admin/usuarios/rankings" },
      { label: "Loyalty tiers", href: "/admin/loyalty" },
      { label: "Equipo", href: "/admin/equipo" },
    ],
  },
  {
    id: "in-live",
    title: "In-Live",
    icon: "live",
    accent: "rose",
    landing: "/admin/cocina",
    items: [
      { label: "Cocina", href: "/admin/cocina" },
      { label: "Operativa", href: "/admin/operativa" },
    ],
  },
  {
    id: "gestiones",
    title: "Gestiones",
    icon: "sliders",
    accent: "teal",
    landing: "/admin/newsletter",
    items: [
      { label: "Newsletter", href: "/admin/newsletter" },
      { label: "Cupones de descuento", href: "/admin/cupones" },
      { label: "Fees de envío", href: "/admin/ajustes/fees" },
      { label: "Impresoras", href: "/admin/impresoras" },
      { label: "Tickets", href: "/admin/tickets" },
    ],
  },
  {
    id: "menu",
    title: "Menú",
    icon: "menu",
    accent: "violet",
    landing: "/admin/menu/diario",
    items: [
      { label: "Diario", href: "/admin/menu/diario" },
      { label: "Festivo", href: "/admin/menu/festivo" },
      { label: "Platos", href: "/admin/menu/platos" },
      { label: "Precios", href: "/admin/menu/precios" },
    ],
  },
];

/** Normaliza un pathname quitando la barra final (salvo raíz). */
function normalize(pathname: string): string {
  if (!pathname) return "/";
  return pathname !== "/" && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

/**
 * El menú que le toca a cada rol.
 *
 * Se filtra con la misma función que usa el middleware, así que lo que se ve y
 * lo que se puede abrir no se pueden separar. Una sección se cae entera si no
 * le queda ningún enlace visible.
 */
export function navForRole(role: AdminRole): AdminNavSection[] {
  if (role === "ADMIN") return ADMIN_NAV;

  return ADMIN_NAV.map((section) => {
    const items = section.items.filter((item) => canAccessAdminPath(role, item.href));

    return {
      ...section,
      items,
      /**
       * `landing` es a donde lleva la sección con el menú plegado, y no tiene
       * por qué ser uno de sus enlaces: "Gestiones" apunta a Newsletter, que un
       * trabajador no puede abrir. Sin recalcularlo, el menú le ofrecía un
       * atajo que el middleware le iba a rebotar.
       */
      landing: canAccessAdminPath(role, section.landing)
        ? section.landing
        : (items[0]?.href ?? section.landing),
    };
  }).filter((section) => section.items.length > 0);
}

/** ¿La ruta `href` está activa para el pathname actual? */
export function isItemActive(href: string, pathname: string): boolean {
  const path = normalize(pathname);
  const target = normalize(href);
  if (target === "/admin") return path === "/admin";
  return path === target || path.startsWith(`${target}/`);
}

/** ¿Alguna ruta de la sección está activa? (para abrir el acordeón). */
export function isSectionActive(
  section: AdminNavSection,
  pathname: string,
): boolean {
  return section.items.some((item) => isItemActive(item.href, pathname));
}
