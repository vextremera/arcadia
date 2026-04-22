import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, C as Category } from './_astro_db_Bcz5lWRF.mjs';

const $$Nuevo = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Nuevo;
  const url = new URL(Astro2.request.url);
  const error = url.searchParams.get("error") ?? "";
  const categories = await db.select({
    id: Category.id,
    name: Category.name,
    active: Category.active,
    sortOrder: Category.sortOrder
  }).from(Category).orderBy(Category.sortOrder);
  const activeCategories = categories.filter((category) => category.active);
  const errorMessage = error === "missing-name" ? "El nombre es obligatorio." : error === "invalid-slug" ? "El slug no es válido." : error === "invalid-category" ? "La categoría seleccionada no es válida." : error === "invalid-price" ? "El precio no es válido." : error === "duplicate-slug" ? "Ya existe otro producto con ese slug." : error === "image-upload-disabled" ? "La subida de imágenes no está configurada todavía en el entorno." : error === "invalid-image" ? "La imagen no es válida. Solo se permiten JPG, PNG o WEBP." : error === "image-too-large" ? "La imagen supera el tamaño máximo permitido." : error === "image-upload-failed" ? "No se ha podido subir la imagen del producto." : "";
  const canCreate = activeCategories.length > 0;
  const summaryCards = [
    {
      label: "Categorías activas",
      value: activeCategories.length,
      note: "Disponibles para alta",
      tone: "border-sky-400/20 bg-sky-400/10"
    },
    {
      label: "Imagen",
      value: "Opcional",
      note: "JPG, PNG o WEBP",
      tone: "border-cyan-400/20 bg-cyan-400/10"
    },
    {
      label: "Siguiente paso",
      value: "Ficha completa",
      note: "Variantes, ingredientes y groups",
      tone: "border-violet-400/20 bg-violet-400/10"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Nuevo producto · Admin · Arcadia", "heading": "Nuevo producto", "description": "Alta base de producto sobre el schema real del proyecto. Después podrás completar variantes, ingredientes, modifier groups y alérgenos desde su ficha.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/catalogo/productos" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Volver al listado
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}${!canCreate ? renderTemplate`<section class="mb-6 rounded-[26px] border border-amber-400/20 bg-amber-400/10 px-5 py-4 text-sm text-amber-100/85">
No hay categorías activas donde crear el producto. Antes de dar de alta
        uno nuevo, activa al menos una categoría desde el admin.
</section>` : null}<section class="grid gap-4 md:grid-cols-3"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-6 shadow-[0_18px_60px_rgba(2,6,23,0.28)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${card.label} </div> <div class="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white"> ${card.value} </div> <p class="mt-3 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"> <form method="post" action="/api/admin/products/new" enctype="multipart/form-data" class="rounded-[32px] border border-white/10 bg-[#111827]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7"> <div class="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Alta base
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Datos principales
</h2> <p class="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
Este formulario solo crea la base del producto. El resto del trabajo
            fino se hace después en la ficha individual.
</p> </div> </div> <div class="mt-6 grid gap-6 xl:grid-cols-[240px_minmax(0,1fr)]"> <div> <div class="flex h-60 w-full items-center justify-center rounded-[28px] border border-white/10 bg-slate-950/50 text-center"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
Preview
</div> <div class="mt-3 text-sm font-semibold text-white">
Imagen opcional
</div> <p class="mt-2 px-6 text-sm leading-6 text-slate-500">
Si no la subes ahora, podrás añadirla más tarde desde la ficha
                del producto.
</p> </div> </div> </div> <div class="grid gap-5"> <div class="grid gap-4 md:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" type="text" name="name" placeholder="Hamburguesa Arcadia" required${addAttribute(!canCreate, "disabled")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Slug
</span> <input class="w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" type="text" name="slug" placeholder="Opcional · se genera desde el nombre"${addAttribute(!canCreate, "disabled")}> </label> </div> <div class="grid gap-4 md:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Categoría
</span> <select class="w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="categoryId" required${addAttribute(!canCreate, "disabled")}> ${activeCategories.length === 0 ? renderTemplate`<option value="">Sin categorías activas</option>` : activeCategories.map((category) => renderTemplate`<option${addAttribute(category.id, "value")}>${category.name}</option>`)} </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Precio (€)
</span> <input class="w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="priceEur" min="0" step="0.01" value="0.00" required${addAttribute(!canCreate, "disabled")}> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Imagen del producto
</span> <input class="block w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-sky-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-950 hover:file:bg-sky-400 focus:border-sky-400/40 focus:outline-none" type="file" name="imageFile" accept="image/jpeg,image/png,image/webp"${addAttribute(!canCreate, "disabled")}> <span class="mt-2 block text-xs leading-6 text-slate-500">
JPG, PNG o WEBP · máximo 4 MB. El archivo se renombra
              automáticamente a partir del producto.
</span> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Description
</span> <textarea class="min-h-28 w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" name="description"${addAttribute(!canCreate, "disabled")}></textarea> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Details
</span> <textarea class="min-h-36 w-full rounded-[24px] border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" name="details"${addAttribute(!canCreate, "disabled")}></textarea> </label> </div> </div> <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4"> <label class="block rounded-[26px] border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active" checked${addAttribute(!canCreate, "disabled")}> <div> <div class="text-sm font-semibold text-white">Activo</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Disponible en catálogo
</p> </div> </div> </label> <label class="block rounded-[26px] border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="deliveryEnabled" checked${addAttribute(!canCreate, "disabled")}> <div> <div class="text-sm font-semibold text-white">Delivery</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Canal a domicilio
</p> </div> </div> </label> <label class="block rounded-[26px] border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="pickupEnabled" checked${addAttribute(!canCreate, "disabled")}> <div> <div class="text-sm font-semibold text-white">Pickup</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Canal recogida
</p> </div> </div> </label> <label class="block rounded-[26px] border border-white/10 bg-slate-950/40 p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="dineInEnabled"${addAttribute(!canCreate, "disabled")}> <div> <div class="text-sm font-semibold text-white">Sala</div> <p class="mt-1 text-sm leading-6 text-slate-400">Consumo local</p> </div> </div> </label> </div> <div class="mt-6 flex flex-wrap gap-3"> <button${addAttribute([
    "inline-flex items-center justify-center rounded-[24px] px-5 py-3 text-sm font-semibold transition",
    canCreate ? "bg-sky-500 text-slate-950 hover:bg-sky-400" : "cursor-not-allowed border border-white/10 bg-white/[0.03] text-slate-500"
  ], "class:list")} type="submit"${addAttribute(!canCreate, "disabled")}>
Crear producto
</button> <a href="/admin/catalogo/productos" class="inline-flex items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Cancelar
</a> </div> </form> <aside class="space-y-6"> <section class="rounded-[32px] border border-white/10 bg-[#111827]/82 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Qué crea esta pantalla
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Alta mínima
</h2> <div class="mt-6 space-y-4"> <article class="rounded-[26px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-sm font-semibold text-white">Producto base</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Se guarda nombre, slug, categoría, precio, textos, flags de canal
              y estado activo.
</p> </article> <article class="rounded-[26px] border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">
Después de crear
</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
El alta redirige a la ficha del producto para completar
              ingredientes, variantes, groups y alérgenos.
</p> </article> <article class="rounded-[26px] border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-amber-200">
Dependencia de categoría
</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Sin categoría válida no se puede crear el producto, porque el
              schema real la exige desde el alta.
</p> </article> </div> </section> <section class="rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)] lg:p-7"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Categorías activas
</div> <h2 class="mt-3 text-2xl font-semibold tracking-[-0.03em] text-white">
Donde puedes darlo de alta
</h2> <div class="mt-6 flex flex-wrap gap-2"> ${activeCategories.length === 0 ? renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-500">
Sin categorías activas
</span>` : activeCategories.map((category) => renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300"> ${category.name} </span>`)} </div> </section> </aside> </section> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/productos/nuevo.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/catalogo/productos/nuevo.astro";
const $$url = "/admin/catalogo/productos/nuevo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Nuevo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
