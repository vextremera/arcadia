import { defineMiddleware } from "astro:middleware";
import { DEFAULT_LANG, resolveSiteLang } from "@/lib/i18n";
import { applySecurityHeaders, isPrivatePath } from "@/server/security/headers";
import { canAccessAdminPath, ADMIN_ROLE_HOME } from "@/lib/admin/roles";

type RouteAccess = "public" | "account" | "admin";

function normalizePathname(pathname: string) {
  if (!pathname) return "/";
  return pathname !== "/" && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function resolveRouteAccess(pathname: string): RouteAccess {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return pathname === "/admin/login" ? "public" : "admin";
  }

  /**
   * Las rutas de la API del panel viven en /api/admin/**, que no empieza por
   * /admin/ y por tanto no entraba en ninguna de las reglas de arriba: la única
   * defensa eran las 37 copias del mismo `if` repartidas por los ficheros.
   * Basta con que una ruta nueva se olvide de copiarlo para dejar el catálogo,
   * los pedidos o los usuarios abiertos a cualquiera.
   *
   * Se comprueba también aquí para que la puerta esté cerrada por defecto. Las
   * comprobaciones de cada ruta se mantienen: son las que devuelven un 401 con
   * forma de JSON, y sobrevivirían a un cambio en este fichero.
   */
  if (pathname === "/api/admin" || pathname.startsWith("/api/admin/")) {
    // El propio login y el logout no pueden exigir estar dentro.
    return pathname === "/api/admin/login" || pathname === "/api/admin/logout"
      ? "public"
      : "admin";
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

function isApiPath(pathname: string) {
  return pathname === "/api" || pathname.startsWith("/api/");
}

function json(data: unknown, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export const onRequest = defineMiddleware(async (context, next) => {
  const url = new URL(context.request.url);
  const pathname = normalizePathname(url.pathname);

  const cookieLang = context.cookies.get("arcadia_lang")?.value;
  context.locals.lang = resolveSiteLang(cookieLang ?? DEFAULT_LANG);

  const sessionUser = await context.session?.get("user");
  if (sessionUser) {
    context.locals.user = sessionUser;
  }

  const sessionAdmin = await context.session?.get("admin");
  if (sessionAdmin) {
    context.locals.admin = sessionAdmin;
  }

  const user = context.locals.user;
  const admin = context.locals.admin;
  const access = resolveRouteAccess(pathname);

  if (access === "account" && !user) {
    // Una llamada de la API no puede seguir una redirección a una pantalla de
    // login: la isla que la hizo espera JSON y se quedaría analizando HTML.
    if (isApiPath(pathname)) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
    return context.redirect(buildLoginRedirect(pathname, url.search), 302);
  }

  if (access === "admin") {
    if (!admin) {
      if (isApiPath(pathname)) return json({ ok: false, error: "UNAUTHORIZED" }, 401);
      return context.redirect("/admin/login", 302);
    }

    /**
     * El rol también se comprueba aquí, no sólo al pintar el menú.
     * Esconder un enlace no cierra nada: la URL se puede escribir a mano.
     */
    if (!canAccessAdminPath(admin.role, pathname)) {
      if (isApiPath(pathname)) return json({ ok: false, error: "FORBIDDEN" }, 403);
      // A su portada, no a una pantalla de error: para un trabajador esto no
      // es un fallo suyo, es que esa sección no es cosa de su turno.
      return context.redirect(ADMIN_ROLE_HOME[admin.role], 302);
    }
  }

  if (admin && pathname === "/admin/login") {
    return context.redirect(ADMIN_ROLE_HOME[admin.role], 302);
  }

  if (user && (pathname === "/login" || pathname === "/registro")) {
    return context.redirect("/cuenta", 302);
  }

  const response = await next();

  applySecurityHeaders(response, url.protocol === "https:");

  if (isPrivatePath(pathname) && !response.headers.has("cache-control")) {
    response.headers.set("cache-control", "no-store");
  }

  return response;
});
