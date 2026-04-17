import type { APIRoute } from "astro";
import { getArcadiaAvailability } from "@/server/time/madrid";
import { buildDeliveryMessage } from "@/server/time/publicMessages";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async () => {
  const rawAvailability = await getArcadiaAvailability();

  return json({
    ...rawAvailability,
    deliveryMessage: buildDeliveryMessage(rawAvailability),
  });
};