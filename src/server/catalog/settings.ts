/**
 * Ajustes de presentación del catálogo público.
 *
 * Vive aparte de `opsFlags` a propósito: aquello lo lee el motor de
 * disponibilidad (pausar pedidos, forzar recogida) y son decisiones de
 * operativa. Esto sólo decide qué se enseña en la web.
 */
import { db, AppSetting, eq } from "astro:db";

const KEY = "catalogFlags";

export type CatalogFlags = {
  /** Si es false, los alérgenos no se muestran en ninguna parte pública. */
  showAllergens: boolean;
};

/**
 * Por defecto se muestran: es el comportamiento que tenía la web antes de
 * existir el ajuste, y ocultar información de alérgenos sin que nadie lo haya
 * pedido sería la opción arriesgada de las dos.
 */
const DEFAULTS: CatalogFlags = { showAllergens: true };

export async function getCatalogFlags(): Promise<CatalogFlags> {
  const [row] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, KEY))
    .limit(1);

  const value = (row?.value ?? {}) as Partial<CatalogFlags>;

  return {
    showAllergens: typeof value.showAllergens === "boolean" ? value.showAllergens : DEFAULTS.showAllergens,
  };
}

export async function saveCatalogFlags(next: CatalogFlags): Promise<void> {
  const [row] = await db
    .select({ id: AppSetting.id })
    .from(AppSetting)
    .where(eq(AppSetting.key, KEY))
    .limit(1);

  if (row) {
    await db.update(AppSetting).set({ value: next, updatedAt: new Date() }).where(eq(AppSetting.id, row.id));
    return;
  }

  const rows = await db.select({ id: AppSetting.id }).from(AppSetting);
  const nextId = rows.reduce((max, item) => Math.max(max, Number(item.id ?? 0)), 0) + 1;

  await db.insert(AppSetting).values({ id: nextId, key: KEY, value: next, updatedAt: new Date() });
}
