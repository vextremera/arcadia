import type { APIRoute } from "astro";
import { resolveRange, getDailySeries } from "@/server/analytics/queries";
import { requireAdmin, json, parseRangeParams } from "@/server/analytics/http";

export const GET: APIRoute = async (context) => {
  if (!requireAdmin(context)) return json({ error: "UNAUTHORIZED" }, 401);

  const { kind, anchorISO } = parseRangeParams(new URL(context.request.url));
  const { current, previous } = resolveRange(kind, anchorISO);
  const series = await getDailySeries(current);

  return json({ kind, anchorISO, range: current, previous, series });
};
