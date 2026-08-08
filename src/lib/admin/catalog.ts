/**
 * Reglas compartidas del catálogo de admin.
 *
 * La categoría "Menú del día" (`menu-del-dia`) es interna: agrupa los productos
 * que solo consume el menú diario/festivo y que NO forman parte de la carta ni
 * del delivery. La pública ya la excluye filtrando por `Category.active`, pero
 * el admin muestra las inactivas a propósito, así que aquí se filtra por slug.
 *
 * Los platos del menú V2 viven en `MenuDish` (tabla aparte) y se gestionan
 * desde /admin/menu/**; estos productos solo respaldan el menú legacy.
 */

export const MENU_CATEGORY_SLUG = "menu-del-dia";

/** ¿Esta categoría es la interna del menú (fuera de carta y delivery)? */
export function isMenuCategorySlug(slug: string | null | undefined) {
  return String(slug ?? "") === MENU_CATEGORY_SLUG;
}

/** Filtra fuera las categorías internas de menú. */
export function excludeMenuCategories<T extends { slug: string }>(rows: T[]): T[] {
  return rows.filter((row) => !isMenuCategorySlug(row.slug));
}
