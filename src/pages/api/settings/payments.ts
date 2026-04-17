import type { APIRoute } from "astro";
import { getPaymentsSettings } from "@/server/payments/settings";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const GET: APIRoute = async () => {
  const payments = await getPaymentsSettings();
  return json(payments);
};