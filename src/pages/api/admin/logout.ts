import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ session, redirect }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  await session.delete("user");
  return redirect("/admin/login", 302);
};
