import { d as defineMiddleware, s as sequence } from './chunks/index_EmZSUk3Z.mjs';
import 'es-module-lexer';
import './chunks/astro-designed-error-pages_DRvrk2DX.mjs';
import 'piccolore';
import './chunks/astro/server_CA5VZefa.mjs';
import 'clsx';

const onRequest$1 = defineMiddleware(async (context, next) => {
  const user = await context.session?.get("user");
  if (user) context.locals.user = user;
  const {
    pathname
  } = new URL(context.request.url);
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const u = context.locals.user;
    const allowed = u && (u.role === "ADMIN" || u.role === "STAFF");
    if (!allowed) return context.redirect("/admin/login");
  }
  if (pathname.startsWith("/cuenta")) {
    const u = context.locals.user;
    if (!u) return context.redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }
  return next();
});

const onRequest = sequence(
	
	onRequest$1
	
);

export { onRequest };
