import type { APIRoute } from "astro";
import { resolveRange, getDailySeries, getTodayDateISO } from "@/server/analytics/queries";
import { requireAdmin, json } from "@/server/analytics/http";

const MONTH_RE = /^\d{4}-\d{2}$/;

export const GET: APIRoute = async (context) => {
  if (!requireAdmin(context)) return json({ error: "UNAUTHORIZED" }, 401);

  const url = new URL(context.request.url);
  const monthParam = url.searchParams.get("month");
  const anchorISO = monthParam && MONTH_RE.test(monthParam) ? `${monthParam}-01` : getTodayDateISO();

  const { current } = resolveRange("month", anchorISO);
  const series = await getDailySeries(current);

  return json({ range: current, series });
};
