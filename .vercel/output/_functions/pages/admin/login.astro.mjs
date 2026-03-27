import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../../chunks/SiteLayout_Qpsqvz8u.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Login = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Login;
  const error = Astro2.url.searchParams.get("error");
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Admin Login \xB7 Arcadia" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="text-2xl font-semibold tracking-tight">Acceso administración</h1> ${error === "invalid" && renderTemplate`<div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
Email o contraseña incorrectos.
</div>`}<form class="mt-6 max-w-md rounded-2xl border border-zinc-200 p-5" method="post" action="/api/admin/login"> <div class="grid gap-3"> <div> <label class="text-sm font-medium">Email</label> <input class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm" name="email" type="email" required> </div> <div> <label class="text-sm font-medium">Contraseña</label> <input class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm" name="password" type="password" required> </div> <button class="mt-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white" type="submit">
Entrar
</button> </div> </form> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/login.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/login.astro";
const $$url = "/admin/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
