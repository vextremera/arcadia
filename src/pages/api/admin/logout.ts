import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ session, redirect }) => {
  if (!session) return new Response("Session not available", { status: 500 });

  // Sólo la sesión del panel: si esta persona además tiene abierta su cuenta de
  // cliente en el mismo navegador, salir del panel no debe cerrársela.
  await session.delete("admin");
  return redirect("/admin/login", 302);
};
