import type { APIRoute } from "astro";
import { getCartSummaryFromSession } from "@/features/cart/server/cartSummary";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async ({ request, session }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  const body = await request.json().catch(() => null);
  if (!body) return json({ error: "INVALID_JSON" }, 400);

  const lineId = String(body.lineId ?? "").trim();
  const qtyRaw = Number(body.qty);

  if (!lineId) return json({ error: "MISSING_LINE_ID" }, 400);
  if (!Number.isFinite(qtyRaw)) return json({ error: "INVALID_QTY" }, 400);

  const qty = Math.floor(qtyRaw);

  const raw = (await session.get("cart")) as any[] | undefined;
  const cart = Array.isArray(raw) ? raw : [];

  let next = cart;

  if (qty <= 0) {
    next = cart.filter((i) => i.lineId !== lineId);
  } else {
    next = cart.map((i) =>
      i.lineId === lineId ? { ...i, qty: Math.max(1, qty) } : i
    );
  }

  await session.set("cart", next);

  // devolvemos el summary para que el front se refresque fácil
  const summary = await getCartSummaryFromSession(session);
  return json(summary);
};
