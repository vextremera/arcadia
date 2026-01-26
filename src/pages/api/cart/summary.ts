import type { APIRoute } from "astro";
import { getCartSummaryFromSession } from "@/features/cart/server/cartSummary";

export const GET: APIRoute = async (context) => {
  const summary = await getCartSummaryFromSession(context.session);
  return new Response(JSON.stringify(summary), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
