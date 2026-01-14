import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const user = await context.session?.get("user");
  if (user) context.locals.user = user;

  const { pathname } = new URL(context.request.url);

  // Protege admin excepto login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const u = context.locals.user;
    const allowed = u && (u.role === "ADMIN" || u.role === "STAFF");
    if (!allowed) return context.redirect("/admin/login");
  }

  return next();
});
