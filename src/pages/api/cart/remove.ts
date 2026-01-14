import type { APIRoute } from "astro";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function parseJSON(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const POST: APIRoute = async ({ request, session }) => {
  const body = await parseJSON(request);
  if (!body) return json({ error: "INVALID_JSON" }, 400);

  const lineId = String(body.lineId ?? "");
  if (!lineId) return json({ error: "MISSING_LINE_ID" }, 400);

  const items = ((await session?.get("cart")) as any[] | undefined) ?? [];
  const next = items.filter((i) => i.lineId !== lineId);

  await session?.set("cart", next);
  return json({ ok: true });
};
