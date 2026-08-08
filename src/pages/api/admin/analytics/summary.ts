import type { APIRoute } from "astro";
import { getSummary, getSparkline } from "@/server/analytics/queries";
import { requireAdmin, json, parseRangeParams } from "@/server/analytics/http";

export const GET: APIRoute = async (context) => {
  if (!requireAdmin(context)) return json({ error: "UNAUTHORIZED" }, 401);

  const { kind, anchorISO } = parseRangeParams(new URL(context.request.url));
  const [summary, sparkline] = await Promise.all([
    getSummary(kind, anchorISO),
    getSparkline(14),
  ]);

  return json({ kind, anchorISO, summary, sparkline });
};
