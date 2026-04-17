import type { APIRoute } from "astro";

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  const allowed = user && (user.role === "ADMIN" || user.role === "STAFF");
  if (!allowed) {
    return context.redirect("/admin/login");
  }

  return context.redirect(
    withQuery("/admin/ajustes/pagos", { info: "fixed-methods" })
  );
};