import { defineMiddleware } from "astro:middleware";

const DISABLE_ORDERS = import.meta.env.DISABLE_ORDERS === "1";
const DISABLE_AUTH = import.meta.env.DISABLE_AUTH === "1";

function isOrdersPage(pathname: string) {
  return pathname === "/pedir" || pathname === "/checkout" || pathname.startsWith("/pedido/");
}

function isOrdersApi(pathname: string) {
  return pathname.startsWith("/api/cart/") || pathname === "/api/cart" || pathname.startsWith("/api/checkout/");
}

function isAuthPage(pathname: string) {
  return pathname === "/login" || pathname === "/registro" || pathname.startsWith("/cuenta");
}

function isAuthApi(pathname: string) {
  return (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/account/") ||
    pathname.startsWith("/api/favorites/")
  );
}

export const onRequest = defineMiddleware(async (context, next) => {
  // Cargar user en locals (si existe)
  const user = await context.session?.get("user");
  if (user) context.locals.user = user;

  const { pathname } = new URL(context.request.url);

  // ✅ Bloqueos públicos (solo si activas flags en producción)
  // Páginas
  if (DISABLE_ORDERS && isOrdersPage(pathname)) return context.redirect("/proximamente", 302);
  if (DISABLE_AUTH && isAuthPage(pathname)) return context.redirect("/proximamente", 302);

  // APIs (mejor 404 para que parezca “no existe”)
  if (DISABLE_ORDERS && isOrdersApi(pathname)) return new Response("Not Found", { status: 404 });
  if (DISABLE_AUTH && isAuthApi(pathname)) return new Response("Not Found", { status: 404 });

  // Admin: protege todo /admin excepto /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const u = context.locals.user;
    const allowed = u && (u.role === "ADMIN" || u.role === "STAFF");
    if (!allowed) return context.redirect("/admin/login");
  }

  // Cuenta: protege /cuenta (cuando auth esté habilitado)
  if (pathname.startsWith("/cuenta")) {
    const u = context.locals.user;
    if (!u) return context.redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  return next();
});