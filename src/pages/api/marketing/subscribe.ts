import type { APIRoute } from "astro";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function isEmail(email: string) {
  // simple y suficiente por ahora
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();

  if (!email || !isEmail(email)) {
    return json({ ok: false, error: "INVALID_EMAIL", message: "Email no válido." }, 400);
  }

  // TODO: guardar en DB (tabla Subscriber) o proveedor de email marketing.
  // Por ahora solo confirmamos.
  return json({ ok: true });
};
