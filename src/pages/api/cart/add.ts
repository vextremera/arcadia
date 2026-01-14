import type { APIRoute } from "astro";

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

async function parseJSON(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function stableLineId(input: Omit<CartItemSession, "lineId" | "qty">) {
  const variant = input.variantId ?? 0;
  const opts = (input.modifierOptionIds ?? []).slice().sort((a, b) => a - b).join(",");
  const notes = (input.notes ?? "").trim();
  const raw = `${input.productId}|${variant}|${opts}|${notes}`;
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = (h * 33) ^ raw.charCodeAt(i);
  return `${input.productId}-${variant}-${(h >>> 0).toString(16)}`;
}

export const POST: APIRoute = async ({ request, session }) => {
  const body = await parseJSON(request);
  if (!body) return json({ error: "INVALID_JSON" }, 400);

  const productId = Number(body.productId);
  const variantId = body.variantId == null ? undefined : Number(body.variantId);
  const qty = Math.max(1, Number(body.qty ?? 1));
  const modifierOptionIds = Array.isArray(body.modifierOptionIds)
    ? body.modifierOptionIds.map(Number).filter(Number.isFinite)
    : [];
  const notes = typeof body.notes === "string" ? body.notes.slice(0, 200) : undefined;

  if (!Number.isFinite(productId)) return json({ error: "INVALID_PRODUCT_ID" }, 400);

  const base = { productId, variantId, modifierOptionIds, notes };
  const lineId = stableLineId(base);

  const items = ((await session?.get("cart")) as CartItemSession[] | undefined) ?? [];
  const idx = items.findIndex((i) => i.lineId === lineId);

  if (idx >= 0) items[idx] = { ...items[idx], qty: items[idx].qty + qty };
  else items.push({ lineId, productId, variantId, qty, modifierOptionIds, notes });

  await session?.set("cart", items);
  return json({ ok: true, lineId });
};
