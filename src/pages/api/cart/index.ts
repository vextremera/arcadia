import type { APIRoute } from "astro";
import { db, Product, ProductVariant, ModifierOption, inArray } from "astro:db";

type CartItemSession = {
  lineId: string;
  productId: number;
  variantId?: number;
  qty: number;
  modifierOptionIds?: number[];
  notes?: string;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function getCartSession(session: any): Promise<CartItemSession[]> {
  const items = (await session?.get("cart")) as CartItemSession[] | undefined;
  return Array.isArray(items) ? items : [];
}

async function hydrateCart(items: CartItemSession[]) {
  if (items.length === 0) {
    return { currency: "EUR" as const, items: [], subtotalCents: 0, count: 0 };
  }

  const productIds = [...new Set(items.map((i) => i.productId))];
  const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean) as number[])];
  const optionIds = [...new Set(items.flatMap((i) => i.modifierOptionIds ?? []))];

  const products = await db
    .select({ id: Product.id, name: Product.name, imageUrl: Product.imageUrl, priceCents: Product.priceCents, active: Product.active })
    .from(Product)
    .where(inArray(Product.id, productIds));

  const variants = variantIds.length
    ? await db
        .select({ id: ProductVariant.id, name: ProductVariant.name, priceDeltaCents: ProductVariant.priceDeltaCents, active: ProductVariant.active })
        .from(ProductVariant)
        .where(inArray(ProductVariant.id, variantIds))
    : [];

  const options = optionIds.length
    ? await db
        .select({ id: ModifierOption.id, name: ModifierOption.name, priceDeltaCents: ModifierOption.priceDeltaCents, active: ModifierOption.active })
        .from(ModifierOption)
        .where(inArray(ModifierOption.id, optionIds))
    : [];

  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map(variants.map((v) => [v.id, v]));
  const optionById = new Map(options.map((o) => [o.id, o]));

  let subtotalCents = 0;
  let count = 0;

  const hydrated = items
    .filter((i) => i.qty > 0)
    .map((i) => {
      const p = productById.get(i.productId);
      if (!p || !p.active) return null;

      const v = i.variantId ? variantById.get(i.variantId) : null;

      const modifierObjs = (i.modifierOptionIds ?? [])
        .map((id) => optionById.get(id))
        .filter((o): o is NonNullable<typeof o> => !!o && o.active)
        .map((o) => ({ id: o.id, name: o.name, priceDeltaCents: o.priceDeltaCents }));

      const variantDelta = v && v.active ? v.priceDeltaCents : 0;
      const modifiersDelta = modifierObjs.reduce((acc, m) => acc + (m.priceDeltaCents ?? 0), 0);

      const unitPriceCents = p.priceCents + variantDelta + modifiersDelta;
      const lineTotalCents = unitPriceCents * i.qty;

      subtotalCents += lineTotalCents;
      count += i.qty;

      return {
        lineId: i.lineId,
        productId: p.id,
        name: p.name,
        imageUrl: p.imageUrl ?? null,

        variantId: v && v.active ? v.id : undefined,
        variantName: v && v.active ? v.name : null,

        qty: i.qty,
        unitPriceCents,
        lineTotalCents,

        modifiers: modifierObjs,
        notes: i.notes,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return { currency: "EUR" as const, items: hydrated, subtotalCents, count };
}

export const GET: APIRoute = async ({ session }) => {
  const items = await getCartSession(session);
  const cart = await hydrateCart(items);
  return json(cart);
};
