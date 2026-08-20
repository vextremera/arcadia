/**
 * Carta de bebidas del local.
 *
 * Se ejecuta a mano, no en cada despliegue:
 *
 *   npm run db:bebidas          (base local)
 *   npm run db:bebidas:remote   (producción)
 *
 * Es idempotente: si un producto ya existe por su slug, se actualiza en lugar
 * de duplicarse. Se puede repetir sin miedo, y sirve igual para corregir
 * precios en bloque más adelante.
 *
 * ── Canales ──
 * Todas las bebidas van a la CARTA. A DOMICILIO sólo refrescos y agua: las
 * bebidas alcohólicas no se reparten, y cafés e infusiones no aguantan el
 * trayecto. Zumos, Cacaolat y Colacao se quedan también en carta.
 *
 * ── Precios ──
 * ⚠️ Son orientativos, puestos por familia tomando como referencia los que ya
 * había en la base (agua 2,00 · refresco 2,50). Hay que repasarlos en
 * /admin/catalogo/productos antes de publicar: aquí nadie sabe lo que cuesta
 * realmente una caña en Lloret.
 */
import { db, Category, Product, eq } from "astro:db";

type Familia = {
  /** Se reutiliza la categoría existente si el slug coincide. */
  slug: string;
  name: string;
  sortOrder: number;
  /** ¿Los productos de esta familia se reparten a domicilio? */
  delivery: boolean;
  items: Array<{ name: string; priceCents: number }>;
};

/** "Coca-Cola Zero Zero" → "coca-cola-zero-zero" */
function slugify(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Clave para reconocer un producto que ya está dado de alta.
 *
 * Se compara por **nombre normalizado y no por slug**. Los seis refrescos que
 * ya existían llevaban slugs con prefijo (`bebida-coca-cola`), así que buscar
 * por slug no los encontraba y los duplicaba: acababa habiendo dos Coca-Cola
 * en la carta.
 */
function claveDeNombre(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Nombres antiguos que ahora se llaman de otra forma.
 *
 * "Agua" pasa a ser "Agua 0,5 L" porque ahora hay dos tamaños y a secas ya no
 * distingue. Sin esta tabla se crearía una segunda agua en vez de renombrar la
 * que hay.
 */
const RENOMBRADOS: Record<string, string> = {
  agua: "Agua 0,5 L",
  // Sólo hay un cava en el local y es brut nature: mejor decirlo que dejar
  // "Cava" a secas, que no le dice nada a quien lo está eligiendo.
  cavabotella: "Cava Brut Nature (botella)",
};

const FAMILIAS: Familia[] = [
  {
    // La categoría "Bebidas" que ya existía se reaprovecha aquí: sus seis
    // productos eran justamente refrescos y aguas.
    slug: "bebidas",
    name: "Refrescos y aguas",
    sortOrder: 150,
    delivery: true,
    items: [
      { name: "Coca-Cola", priceCents: 250 },
      { name: "Coca-Cola Zero", priceCents: 250 },
      { name: "Coca-Cola Zero Zero", priceCents: 250 },
      { name: "Fanta Naranja", priceCents: 250 },
      { name: "Fanta Limón", priceCents: 250 },
      { name: "Sprite", priceCents: 250 },
      { name: "Trina", priceCents: 250 },
      { name: "Aquarius Limón", priceCents: 250 },
      { name: "Aquarius Naranja", priceCents: 250 },
      { name: "Aquarius Melocotón Rojo", priceCents: 250 },
      { name: "Nestea Limón", priceCents: 250 },
      { name: "Nestea Maracuyá", priceCents: 250 },
      { name: "Red Bull", priceCents: 350 },
      { name: "Gaseosa", priceCents: 200 },
      { name: "Gaseosa 0,5 L", priceCents: 250 },
      { name: "Agua 0,5 L", priceCents: 200 },
      { name: "Agua 1,5 L", priceCents: 300 },
      { name: "Agua con gas", priceCents: 220 },
    ],
  },
  {
    slug: "zumos-y-batidos",
    name: "Zumos y batidos",
    sortOrder: 160,
    delivery: false,
    items: [
      { name: "Zumo de piña", priceCents: 250 },
      { name: "Zumo de naranja", priceCents: 250 },
      { name: "Zumo de melocotón", priceCents: 250 },
      { name: "Zumo de manzana", priceCents: 250 },
      { name: "Cacaolat", priceCents: 250 },
      { name: "Colacao", priceCents: 250 },
    ],
  },
  {
    slug: "cervezas",
    name: "Cervezas",
    sortOrder: 170,
    delivery: false,
    items: [
      { name: "Mediana Amstel", priceCents: 300 },
      { name: "Mediana Águila", priceCents: 300 },
      { name: "Mediana Radler", priceCents: 300 },
      { name: "Mediana Estrella Damm", priceCents: 300 },
      { name: "Mediana Voll-Damm", priceCents: 320 },
      { name: "Mediana Estrella Galicia", priceCents: 320 },
      { name: "Mediana Alhambra Verde", priceCents: 320 },
      { name: "Mediana Amstel 0,0", priceCents: 300 },
      { name: "Mediana Amstel 0,0 Tostada", priceCents: 300 },
      { name: "Mediana Radler 0,0", priceCents: 300 },
      { name: "Quinto Águila", priceCents: 220 },
      // Sidra, pero se sirve y se pide con las cervezas.
      { name: "Ladrón de Manzanas", priceCents: 350 },
    ],
  },
  {
    slug: "vinos-y-sangria",
    name: "Vinos y sangría",
    sortOrder: 180,
    delivery: false,
    items: [
      { name: "Vino de la casa tinto", priceCents: 200 },
      { name: "Vino de la casa rosado", priceCents: 200 },
      { name: "Vino de la casa blanco", priceCents: 200 },
      { name: "Prios Ribera tinto", priceCents: 1500 },
      { name: "Ramón Bilbao Rioja tinto", priceCents: 1500 },
      { name: "Ramón Bilbao Verdejo", priceCents: 1400 },
      { name: "Ramón Bilbao rosado", priceCents: 1400 },
      { name: "Amantiño Albariño", priceCents: 1600 },
      // Sólo botella entera, tal como se sirve en el local.
      { name: "Cava Brut Nature (botella)", priceCents: 1600 },
      { name: "Sangría de vino tinto 1 L", priceCents: 1000 },
      { name: "Tinto de verano", priceCents: 300 },
    ],
  },
  {
    slug: "cafes-e-infusiones",
    name: "Cafés e infusiones",
    sortOrder: 190,
    delivery: false,
    items: [
      { name: "Café solo", priceCents: 150 },
      { name: "Cortado", priceCents: 160 },
      { name: "Café con leche", priceCents: 180 },
      { name: "Americano", priceCents: 180 },
      { name: "Café bombón", priceCents: 200 },
      { name: "Capuchino", priceCents: 220 },
      { name: "Carajillo", priceCents: 250 },
      { name: "Infusiones", priceCents: 180 },
    ],
  },
];

async function siguienteId(tabla: "Category" | "Product"): Promise<number> {
  const filas =
    tabla === "Category"
      ? await db.select({ id: Category.id }).from(Category)
      : await db.select({ id: Product.id }).from(Product);

  return filas.reduce((max, fila) => Math.max(max, Number(fila.id ?? 0)), 0) + 1;
}

export default async function seedBebidas() {
  let categoriasCreadas = 0;
  let creados = 0;
  let actualizados = 0;

  /**
   * Índice de lo que ya hay, por nombre normalizado.
   *
   * Se construye una sola vez y sobre **todo** el catálogo, no sólo sobre las
   * categorías de bebidas: si una bebida estuviera archivada en otra
   * categoría, hay que encontrarla igual y moverla, no crear una copia.
   */
  const existentes = new Map<string, number>();

  for (const fila of await db.select({ id: Product.id, name: Product.name }).from(Product)) {
    const nombre = String(fila.name ?? "");
    const clave = claveDeNombre(RENOMBRADOS[claveDeNombre(nombre)] ?? nombre);
    if (!existentes.has(clave)) existentes.set(clave, fila.id);
  }

  for (const familia of FAMILIAS) {
    const [existente] = await db
      .select({ id: Category.id, name: Category.name })
      .from(Category)
      .where(eq(Category.slug, familia.slug))
      .limit(1);

    let categoryId: number;

    if (existente) {
      categoryId = existente.id;

      // Renombra si hace falta: así "Bebidas" pasa a "Refrescos y aguas"
      // conservando sus productos y su historial.
      if (existente.name !== familia.name) {
        await db
          .update(Category)
          .set({ name: familia.name, sortOrder: familia.sortOrder })
          .where(eq(Category.id, categoryId));

        console.log(`[bebidas] categoría "${existente.name}" → "${familia.name}"`);
      }
    } else {
      categoryId = await siguienteId("Category");

      await db.insert(Category).values({
        id: categoryId,
        name: familia.name,
        slug: familia.slug,
        sortOrder: familia.sortOrder,
        active: true,
      });

      categoriasCreadas += 1;
      console.log(`[bebidas] categoría nueva: ${familia.name}`);
    }

    for (const item of familia.items) {
      const clave = claveDeNombre(item.name);
      const yaEsta = existentes.get(clave);

      if (yaEsta) {
        // Se respeta el precio que hubiera: si alguien ya lo ajustó desde el
        // panel, este script no debe pisárselo. Sólo se corrigen el nombre, la
        // categoría y los canales, que es lo que este alta viene a poner en su
        // sitio. El slug tampoco se toca: puede estar enlazado desde fuera.
        await db
          .update(Product)
          .set({
            name: item.name,
            categoryId,
            dineInEnabled: true,
            deliveryEnabled: familia.delivery,
            active: true,
            updatedAt: new Date(),
          })
          .where(eq(Product.id, yaEsta));

        actualizados += 1;
        continue;
      }

      const slug = slugify(item.name);

      await db.insert(Product).values({
        id: await siguienteId("Product"),
        categoryId,
        name: item.name,
        slug,
        priceCents: item.priceCents,
        // Todas a la carta; a domicilio sólo refrescos y agua.
        dineInEnabled: true,
        deliveryEnabled: familia.delivery,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      creados += 1;
    }
  }

  const total = FAMILIAS.reduce((suma, familia) => suma + familia.items.length, 0);

  console.log(
    `[bebidas] Listo: ${categoriasCreadas} categoría(s) nueva(s), ` +
    `${creados} bebida(s) creada(s) y ${actualizados} actualizada(s), de ${total}.`,
  );
  console.log(
    "[bebidas] ⚠️ Los precios son orientativos por familia. Repásalos en /admin/catalogo/productos.",
  );
}
