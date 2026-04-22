import { defineMiddleware } from "astro:middleware";

type RouteAccess = "public" | "account" | "admin";

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  return pathname !== "/" && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function isAdminRole(user: App.Locals["user"]) {
  return user?.role === "ADMIN" || user?.role === "STAFF";
}

function resolveRouteAccess(pathname: string): RouteAccess {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return pathname === "/admin/login" ? "public" : "admin";
  }

  if (pathname === "/cuenta" || pathname.startsWith("/cuenta/")) {
    return "account";
  }

  return "public";
}

function buildLoginRedirect(pathname: string, search: string) {
  const next = `${pathname}${search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = normalizePathname(url.pathname);

  const sessionUser = await context.session?.get("user");
  if (sessionUser) {
    context.locals.user = sessionUser;
  }

  const user = context.locals.user;
  const access = resolveRouteAccess(pathname);

  // Cuenta: solo usuarios autenticados
  if (access === "account" && !user) {
    return context.redirect(buildLoginRedirect(pathname, url.search), 302);
  }

  // Admin: solo ADMIN / STAFF
  if (access === "admin" && !isAdminRole(user)) {
    return context.redirect("/admin/login", 302);
  }

  // Si ya hay sesión, evitamos mostrar pantallas de login/registro sin sentido
  if (user) {
    if (pathname === "/admin/login" && isAdminRole(user)) {
      return context.redirect("/admin", 302);
    }

    if (pathname === "/login" || pathname === "/registro") {
      return context.redirect(isAdminRole(user) ? "/admin" : "/cuenta", 302);
    }
  }

  return next();
});