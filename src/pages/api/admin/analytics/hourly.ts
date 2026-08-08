import type { APIRoute } from "astro";
import { getHourlyToday } from "@/server/analytics/queries";
import { requireAdmin, json } from "@/server/analytics/http";

export const GET: APIRoute = async (context) => {
  if (!requireAdmin(context)) return json({ error: "UNAUTHORIZED" }, 401);

  const data = await getHourlyToday();
  return json(data);
};
