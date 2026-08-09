/**
 * Menú del día público.
 *
 * **El admin es la única fuente.** Lo que se ve en la web sale exclusivamente de
 * MenuDish/MenuDishAssignment y de la configuración `menuConfigV2`, que es lo
 * que editan las pantallas de `/admin/menu/*`.
 *
 * Antes había dos capas de respaldo —las tablas legacy Menu/MenuItem y unos
 * precios por defecto en el código— y el resultado era que la web mostraba algo
 * distinto de lo configurado: las tablas V2 estaban vacías, así que se publicaba
 * el contenido legacy y un precio constante. Se eliminaron a propósito: un menú
 * mal configurado tiene que *no salir*, no salir con datos inventados. El
 * contenido legacy se migró con db/migrate-menu-v2.ts.
 *
 * Reglas: un menú se publica sólo si está activo, tiene precio y tiene platos.
 * Si falta cualquiera de las tres cosas, devuelve null y la página muestra su
 * estado vacío.
 */
import { db, AppSetting, MenuDish, MenuDishAssignment, eq } from "astro:db";
import { getMadridClock } from "@/server/time/madrid";

export type MenuKind = "DIARIO" | "FESTIVO";
type DbCourse = "PRIMERO" | "SEGUNDO" | "POSTRE";
type Course = "ENTRANTES" | "PRINCIPALES" | "POSTRES";

export type PublicMenuDish = {
  name: string;
  desc: string | null;
};

export type PublicMenuData = {
  id: number;
  kind: MenuKind;
  title: string;
  priceText: string | null;
  priceCents: number;
  /** Horario de servicio "13:00"–"15:30", o null si no se ha configurado. */
  serviceFrom: string | null;
  serviceTo: string | null;
  /** true si ahora mismo se está dentro de ese horario (hora de Madrid). */
  servingNow: boolean;
  note: string | null;
  courses: Record<Course, PublicMenuDish[]>;
};

type MenuConfigEntry = {
  active: boolean;
  priceCents: number;
  serviceFrom: string | null;
  serviceTo: string | null;
  note: string | null;
};
type MenuConfig = Record<MenuKind, MenuConfigEntry>;

export type PublicMenuState = {
  diarioData: PublicMenuData | null;
  festivoData: PublicMenuData | null;
  /** true si hay algo configurado pero incompleto, para avisar en el admin. */
  hasIncompleteConfig: boolean;
};

const COURSE_ORDER: Record<DbCourse, number> = { PRIMERO: 1, SEGUNDO: 2, POSTRE: 3 };

const TITLES: Record<MenuKind, string> = {
  DIARIO: "Menú diario",
  FESTIVO: "Menú festivo",
};

function centsToPriceText(cents: number): string {
  return `${(Number(cents ?? 0) / 100).toFixed(2).replace(".", ",")}€`;
}

/**
 * Lee la configuración del admin. Sin fila configurada no se asume nada:
 * el menú queda inactivo y a precio 0, que es lo mismo que "no publicar".
 */
async function getMenuConfig(): Promise<MenuConfig> {
  const [row] = await db
    .select({ value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, "menuConfigV2"))
    .limit(1);

  const value = (row?.value ?? {}) as Partial<Record<MenuKind, Partial<MenuConfigEntry>>>;

  const read = (kind: MenuKind): MenuConfigEntry => ({
    active: value[kind]?.active === true,
    priceCents:
      typeof value[kind]?.priceCents === "number" && value[kind]!.priceCents! > 0
        ? value[kind]!.priceCents!
        : 0,
    serviceFrom: readTime(value[kind]?.serviceFrom),
    serviceTo: readTime(value[kind]?.serviceTo),
    note: typeof value[kind]?.note === "string" && value[kind]!.note!.trim() ? value[kind]!.note!.trim() : null,
  });

  return { DIARIO: read("DIARIO"), FESTIVO: read("FESTIVO") };
}

/** Acepta sólo "H:MM"/"HH:MM"; cualquier otra cosa se trata como no configurado. */
function readTime(value: unknown): string | null {
  const match = String(value ?? "").trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

function timeToMinutes(value: string): number {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function buildMenuData(
  kind: MenuKind,
  config: MenuConfig,
  rows: Array<{ kind: MenuKind; course: DbCourse; dishName: string; dishDescription: string | null }>,
  nowMinutes: number,
): { data: PublicMenuData | null; incomplete: boolean } {
  const entry = config[kind];
  const dishes = rows.filter((row) => row.kind === kind);

  if (!entry.active) return { data: null, incomplete: false };

  // Activo pero sin precio o sin platos: es una configuración a medias. No se
  // publica, y se señala para poder avisarlo en el admin.
  if (!entry.priceCents || !dishes.length) return { data: null, incomplete: true };

  const grouped: Record<DbCourse, PublicMenuDish[]> = { PRIMERO: [], SEGUNDO: [], POSTRE: [] };
  for (const row of dishes) {
    grouped[row.course].push({ name: row.dishName, desc: row.dishDescription });
  }

  // El horario no condiciona la publicación: fuera de hora el menú se sigue
  // enseñando (la gente lo consulta antes de venir), sólo cambia el aviso.
  const servingNow =
    entry.serviceFrom !== null &&
    entry.serviceTo !== null &&
    nowMinutes >= timeToMinutes(entry.serviceFrom) &&
    nowMinutes <= timeToMinutes(entry.serviceTo);

  return {
    data: {
      id: kind === "DIARIO" ? 1 : 2,
      kind,
      title: TITLES[kind],
      priceText: centsToPriceText(entry.priceCents),
      priceCents: entry.priceCents,
      serviceFrom: entry.serviceFrom,
      serviceTo: entry.serviceTo,
      servingNow,
      note: entry.note,
      courses: {
        ENTRANTES: grouped.PRIMERO,
        PRINCIPALES: grouped.SEGUNDO,
        POSTRES: grouped.POSTRE,
      },
    },
    incomplete: false,
  };
}

export async function getPublicMenuState(): Promise<PublicMenuState> {
  const [config, rows] = await Promise.all([
    getMenuConfig(),
    db
      .select({
        assignmentId: MenuDishAssignment.id,
        kind: MenuDishAssignment.kind,
        course: MenuDishAssignment.course,
        sortOrder: MenuDishAssignment.sortOrder,
        dishName: MenuDish.name,
        dishDescription: MenuDish.description,
      })
      .from(MenuDishAssignment)
      .innerJoin(MenuDish, eq(MenuDishAssignment.dishId, MenuDish.id)),
  ]);

  const sorted = [...rows].sort((a, b) => {
    const byCourse = COURSE_ORDER[a.course as DbCourse] - COURSE_ORDER[b.course as DbCourse];
    if (byCourse !== 0) return byCourse;

    const bySort = Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0);
    if (bySort !== 0) return bySort;

    return Number(a.assignmentId) - Number(b.assignmentId);
  }) as Array<{ kind: MenuKind; course: DbCourse; dishName: string; dishDescription: string | null }>;

  const nowMinutes = getMadridClock().mins;

  const diario = buildMenuData("DIARIO", config, sorted, nowMinutes);
  const festivo = buildMenuData("FESTIVO", config, sorted, nowMinutes);

  return {
    diarioData: diario.data,
    festivoData: festivo.data,
    hasIncompleteConfig: diario.incomplete || festivo.incomplete,
  };
}
