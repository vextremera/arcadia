import type { APIRoute } from "astro";

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
    });
}

export const POST: APIRoute = async ({ session }) => {
    if (!session) return json({ error: "SESSION_NOT_AVAILABLE" }, 500);

    const alreadyShown = Boolean(await session.get("upsellShown"));

    if (alreadyShown) {
        return json({ shouldOpen: false });
    }

    await session.set("upsellShown", true);

    return json({ shouldOpen: true });
};