import { e as createComponent, k as renderComponent, r as renderTemplate, m as maybeRenderHead, g as addAttribute } from '../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../chunks/SiteLayout_Qpsqvz8u.mjs';
export { renderers } from '../renderers.mjs';

const $$Proximamente = createComponent(($$result, $$props, $$slots) => {
  const heroStyle = {
    backgroundImage: "linear-gradient(90deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.15) 100%), url('/images/general/domicilio-header.jpg')",
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Pr\xF3ximamente \xB7 Arcadia", "fullWidth": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="w-full" id="top"> <section class="relative w-full overflow-hidden bg-zinc-900 rounded-t-4xl sm:rounded-t-[50px]"${addAttribute(heroStyle, "style")}> <div class="h-56 sm:h-150"></div> <div class="absolute inset-0"> <div class="absolute inset-x-0 bottom-0 h-6 bg-bg z-20 rounded-t-3xl sm:h-8 sm:rounded-t-[40px]"></div> <div class="flex h-full w-full items-end px-4 pb-12 sm:px-10 sm:pb-18"> <div class="text-white"> <div class="text-3xl sm:text-4xl font-black tracking-widest sigmar-regular">
PRÓXIMAMENTE
</div> <div class="mt-1 text-sm sm:text-base text-white/80">
Estamos preparando pedidos online y cuentas de usuario.
</div> </div> </div> </div> </section> <div class="w-full px-4 py-8 sm:px-10 sm:py-10"> <div class="mx-auto w-full max-w-3xl space-y-6 2xl:max-w-5xl"> <div class="rounded-3xl border border-zinc-200 bg-bg p-5 shadow-sm sm:p-6 2xl:p-8"> <div class="text-lg font-semibold text-zinc-900">Funciones en preparación</div> <p class="mt-2 text-sm text-zinc-700">
Ahora mismo la web está en modo informativo mientras terminamos:
</p> <ul class="mt-4 list-disc space-y-2 pl-5 text-sm text-zinc-700"> <li>Pedidos a domicilio / recogida (flujo completo, pagos y horarios)</li> <li>Cuentas de usuario (perfil, direcciones, favoritos y niveles)</li> </ul> <div class="mt-6 grid gap-3 sm:grid-cols-3"> <a href="/carta" class="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
Ver carta
</a> <a href="/menu" class="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
Ver menú
</a> <a href="/" class="inline-flex items-center justify-center rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 hover:bg-zinc-50">
Inicio
</a> </div> <div class="mt-5 text-xs text-zinc-500">
Gracias por la paciencia — estamos puliendo todo para que la experiencia sea como una app.
</div> </div> </div> </div> </div> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/proximamente.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/proximamente.astro";
const $$url = "/proximamente";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Proximamente,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
