import { a8 as defineMiddleware, ah as sequence } from './chunks/sequence_BvZ5THv7.mjs';
import 'piccolore';
import 'clsx';

function normalizePathname(pathname) {
  if (!pathname) return "/";
  return pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
}
function isAdminRole(user) {
  return user?.role === "ADMIN" || user?.role === "STAFF";
}
function resolveRouteAccess(pathname) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return pathname === "/admin/login" ? "public" : "admin";
  }
  if (pathname === "/cuenta" || pathname.startsWith("/cuenta/")) {
    return "account";
  }
  return "public";
}
function buildLoginRedirect(pathname, search) {
  const next = `${pathname}${search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}
const onRequest$1 = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = normalizePathname(url.pathname);
  const sessionUser = await context.session?.get("user");
  if (sessionUser) {
    context.locals.user = sessionUser;
  }
  const user = context.locals.user;
  const access = resolveRouteAccess(pathname);
  if (access === "account" && !user) {
    return context.redirect(buildLoginRedirect(pathname, url.search), 302);
  }
  if (access === "admin" && !isAdminRole(user)) {
    return context.redirect("/admin/login", 302);
  }
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

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
