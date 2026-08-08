/** Helpers compartidos por las rutas src/pages/api/admin/analytics/**. */
import type { APIContext } from "astro";
import { getTodayDateISO, type RangeKind } from "@/server/analytics/queries";

export function requireAdmin(context: APIContext) {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) return null;
  return user;
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseRangeParams(url: URL): { kind: RangeKind; anchorISO: string } {
  const rangeParam = url.searchParams.get("range");
  const kind: RangeKind = rangeParam === "week" || rangeParam === "month" ? rangeParam : "day";

  const anchorParam = url.searchParams.get("anchor");
  const anchorISO = anchorParam && DATE_RE.test(anchorParam) ? anchorParam : getTodayDateISO();

  return { kind, anchorISO };
}
