import type { APIRoute } from "astro";
import { resolveRange, getTopProducts } from "@/server/analytics/queries";
import { requireAdmin, json, parseRangeParams } from "@/server/analytics/http";

export const GET: APIRoute = async (context) => {
  if (!requireAdmin(context)) return json({ error: "UNAUTHORIZED" }, 401);

  const url = new URL(context.request.url);
  const { kind, anchorISO } = parseRangeParams(url);
  const limitParam = Number(url.searchParams.get("limit") ?? 6);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 20) : 6;

  const { current } = resolveRange(kind, anchorISO);
  const products = await getTopProducts(current, limit);

  return json({ range: current, products });
};
