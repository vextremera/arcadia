import type { APIRoute } from "astro";
import { getArcadiaAvailability } from "@/server/time/madrid";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async () => {
  return json(getArcadiaAvailability());
};
