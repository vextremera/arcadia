import type { APIRoute } from "astro";
import { db, Product, ProductVariant, ModifierGroup, ModifierOption, ProductModifierGroup, eq, inArray } from "astro:db";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async ({ params, locals }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return json({ error: "INVALID_ID" }, 400);

  const [product] = await db
    .select({
      id: Product.id,
      name: Product.name,
      description: Product.description,
      imageUrl: Product.imageUrl,
      priceCents: Product.priceCents,
      active: Product.active,
    })
    .from(Product)
    .where(eq(Product.id, id))
    .limit(1);

  if (!product || !product.active) return json({ error: "NOT_FOUND" }, 404);

  const variants = await db
    .select({
      id: ProductVariant.id,
      name: ProductVariant.name,
      priceDeltaCents: ProductVariant.priceDeltaCents,
      sortOrder: ProductVariant.sortOrder,
      active: ProductVariant.active,
    })
    .from(ProductVariant)
    .where(eq(ProductVariant.productId, id));

  const pmg = await db
    .select({ groupId: ProductModifierGroup.groupId, sortOrder: ProductModifierGroup.sortOrder })
    .from(ProductModifierGroup)
    .where(eq(ProductModifierGroup.productId, id));

  const groupIds = pmg.map((x) => x.groupId);

  const groups = groupIds.length
    ? await db
        .select({
          id: ModifierGroup.id,
          name: ModifierGroup.name,
          minSelect: ModifierGroup.minSelect,
          maxSelect: ModifierGroup.maxSelect,
          required: ModifierGroup.required,
          sortOrder: ModifierGroup.sortOrder,
          active: ModifierGroup.active,
        })
        .from(ModifierGroup)
        .where(inArray(ModifierGroup.id, groupIds))
    : [];

  const options = groupIds.length
    ? await db
        .select({
          id: ModifierOption.id,
          groupId: ModifierOption.groupId,
          name: ModifierOption.name,
          priceDeltaCents: ModifierOption.priceDeltaCents,
          sortOrder: ModifierOption.sortOrder,
          active: ModifierOption.active,
        })
        .from(ModifierOption)
        .where(inArray(ModifierOption.groupId, groupIds))
    : [];

  const favorited = locals.user ? false : null;

  return json({
    product,
    variants: variants.filter((v) => v.active).sort((a, b) => a.sortOrder - b.sortOrder),
    modifierGroups: groups
      .filter((g) => g.active)
      .map((g) => ({
        ...g,
        options: options
          .filter((o) => o.active && o.groupId === g.id)
          .sort((a, b) => a.sortOrder - b.sortOrder),
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder),
    favorited,
  });
};
