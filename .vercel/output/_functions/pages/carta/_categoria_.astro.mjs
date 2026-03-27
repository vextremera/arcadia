import { e as createComponent, h as createAstro } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import 'clsx';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$categoria = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$categoria;
  const slug = Astro2.params.categoria;
  return Astro2.redirect(`/carta#cat-${slug}`, 302);
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/carta/[categoria].astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/carta/[categoria].astro";
const $$url = "/carta/[categoria]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$categoria,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
