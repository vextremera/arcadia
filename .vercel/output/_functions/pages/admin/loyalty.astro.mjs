import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, g as addAttribute, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_Ccjf6LBM.mjs';
import { d as db, L as LoyaltyTier, U as UserProfile, j as User } from '../../chunks/_astro_db_BPgDZzX3.mjs';
import { inArray } from '@astrojs/db/dist/runtime/virtual.js';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Loyalty = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Loyalty;
  function safePerksText(perks) {
    if (!perks) return "";
    try {
      return JSON.stringify(perks, null, 2);
    } catch {
      return "";
    }
  }
  function moneyPoints(points) {
    return `${Number(points ?? 0)} pts`;
  }
  const url = new URL(Astro2.request.url);
  const saved = url.searchParams.get("saved") ?? "";
  const error = url.searchParams.get("error") ?? "";
  const tiers = await db.select({
    id: LoyaltyTier.id,
    name: LoyaltyTier.name,
    minPoints: LoyaltyTier.minPoints,
    perks: LoyaltyTier.perks,
    active: LoyaltyTier.active,
    sortOrder: LoyaltyTier.sortOrder
  }).from(LoyaltyTier);
  const sortedTiers = [...tiers].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    if (a.minPoints !== b.minPoints) return a.minPoints - b.minPoints;
    return a.name.localeCompare(b.name, "es");
  });
  const profiles = await db.select({
    id: UserProfile.id,
    userId: UserProfile.userId,
    pointsBalance: UserProfile.pointsBalance,
    tierId: UserProfile.tierId
  }).from(UserProfile);
  [...new Set(profiles.map((profile) => profile.tierId).filter((value) => typeof value === "number"))];
  const userIds = [...new Set(profiles.map((profile) => profile.userId))];
  const users = userIds.length ? await db.select({
    id: User.id,
    name: User.name,
    email: User.email,
    active: User.active,
    role: User.role
  }).from(User).where(inArray(User.id, userIds)) : [];
  const userById = new Map(users.map((user) => [user.id, user]));
  const assignedCountByTier = /* @__PURE__ */ new Map();
  const activeAssignedCountByTier = /* @__PURE__ */ new Map();
  const highestPointsByTier = /* @__PURE__ */ new Map();
  for (const profile of profiles) {
    if (typeof profile.tierId !== "number") continue;
    assignedCountByTier.set(
      profile.tierId,
      (assignedCountByTier.get(profile.tierId) ?? 0) + 1
    );
    const linkedUser = userById.get(profile.userId);
    if (linkedUser?.active) {
      activeAssignedCountByTier.set(
        profile.tierId,
        (activeAssignedCountByTier.get(profile.tierId) ?? 0) + 1
      );
    }
    highestPointsByTier.set(
      profile.tierId,
      Math.max(highestPointsByTier.get(profile.tierId) ?? 0, Number(profile.pointsBalance ?? 0))
    );
  }
  const summaries = sortedTiers.map((tier) => ({
    tier,
    assignedUserCount: assignedCountByTier.get(tier.id) ?? 0,
    activeAssignedUserCount: activeAssignedCountByTier.get(tier.id) ?? 0,
    highestPointsInTier: highestPointsByTier.get(tier.id) ?? 0
  }));
  const usersWithoutTier = profiles.filter((profile) => profile.tierId === null).length;
  const activeTiers = sortedTiers.filter((tier) => tier.active).length;
  const totalTiers = sortedTiers.length;
  const bestTier = [...sortedTiers].filter((tier) => tier.active).sort((a, b) => b.minPoints - a.minPoints)[0] ?? null;
  const successMessage = saved === "tier" ? "Tier actualizado correctamente." : saved === "delete" ? "Tier borrado correctamente." : "";
  const errorMessage = error === "missing-name" ? "El nombre del tier es obligatorio." : error === "invalid-min-points" ? "El m\xEDnimo de puntos no es v\xE1lido." : error === "invalid-sort-order" ? "El orden no es v\xE1lido." : error === "invalid-perks-json" ? "El JSON de perks no es v\xE1lido." : error === "invalid-tier" ? "El tier indicado no es v\xE1lido." : error === "not-found" ? "El tier ya no existe." : error === "tier-in-use" ? "No se puede borrar un tier que sigue asignado a usuarios." : error === "invalid-intent" ? "Acci\xF3n no v\xE1lida." : "";
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Loyalty \xB7 Admin \xB7 Arcadia", "heading": "Loyalty", "description": "Gesti\xF3n final de tiers. Cambiar un umbral o activar/desactivar un tier recalcula autom\xE1ticamente la asignaci\xF3n real de todos los perfiles.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/usuarios" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Ver usuarios
</a> <a href="/cuenta" target="_blank" rel="noreferrer" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Ver cuenta pública
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${successMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200"> ${successMessage} </section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> <article class="rounded-[28px] border border-white/10 bg-white/4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">Tiers</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${totalTiers}</div> <p class="mt-2 text-sm text-slate-400">Niveles definidos</p> </article> <article class="rounded-[28px] border border-emerald-400/15 bg-emerald-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-200/80">Activos</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${activeTiers}</div> <p class="mt-2 text-sm text-emerald-100/70">Tiers disponibles para asignación</p> </article> <article class="rounded-[28px] border border-violet-400/15 bg-violet-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-200/80">Sin tier</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${usersWithoutTier}</div> <p class="mt-2 text-sm text-violet-100/70">Perfiles aún sin nivel</p> </article> <article class="rounded-[28px] border border-cyan-400/15 bg-cyan-400/6 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-200/80">Tier top</div> <div class="mt-3 text-2xl font-semibold tracking-tight text-white">${bestTier?.name ?? "\u2014"}</div> <p class="mt-2 text-sm text-cyan-100/70">${bestTier ? `${bestTier.minPoints} pts m\xEDnimo` : "Sin tiers activos"}</p> </article> </section> <section class="mt-6 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"> <aside class="space-y-6"> <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Alta
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Nuevo tier
</h2> <form method="post" action="/api/admin/loyalty-tiers" class="mt-6 grid gap-4"> <input type="hidden" name="intent" value="create"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name" placeholder="Bronce" required> </label> <div class="grid gap-4 sm:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mínimo puntos</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="minPoints" min="0" step="1" value="0" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(sortedTiers.length, "value")} required> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Perks JSON</span> <textarea class="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="perks" placeholder="{&quot;benefits&quot;:[&quot;prioridad soporte&quot;,&quot;promo local&quot;]}"></textarea> </label> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active" checked>
Tier activo
</label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Crear tier
</button> </form> </section> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Cómo asigna el sistema
</h2> <div class="mt-6 space-y-4"> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">Por puntos reales</div> <p class="mt-2 text-sm leading-6 text-slate-400">
El tier se asigna automáticamente según <code>pointsBalance</code> y el <code>minPoints</code> más alto que el usuario cumpla.
</p> </div> <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">Recalculo global</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
Crear, editar o desactivar tiers recalcula inmediatamente <code>UserProfile.tierId</code> para no dejar datos incoherentes.
</p> </div> <div class="rounded-3xl border border-white/10 bg-white/3 p-4"> <div class="text-sm font-semibold text-white">Borrado protegido</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Un tier no se puede borrar mientras siga asignado a perfiles.
</p> </div> </div> </section> </aside> <section class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Gestión
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Tiers de loyalty
</h2> </div> <div class="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">
Basado en LoyaltyTier + UserProfile
</div> </div> </div> ${summaries.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">No hay tiers todavía</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Crea el primero desde el formulario lateral.
</p> </div> </div>` : renderTemplate`<div class="space-y-4 px-6 py-6"> ${summaries.map((summary) => {
    const canDelete = summary.assignedUserCount === 0;
    return renderTemplate`<section class="rounded-3xl border border-white/10 bg-white/4 p-5"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-base font-semibold text-white">${summary.tier.name}</div> <div class="mt-2 flex flex-wrap gap-2"> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
      summary.tier.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${summary.tier.active ? "Activo" : "Inactivo"} </span> <span class="inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-sky-300"> ${summary.tier.minPoints} pts mínimo
</span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300"> ${summary.assignedUserCount} usuario${summary.assignedUserCount === 1 ? "" : "s"} </span> </div> </div> <div class="text-sm text-slate-400">
Pico actual: ${moneyPoints(summary.highestPointsInTier)} </div> </div> <form method="post" action="/api/admin/loyalty-tiers" class="mt-5 grid gap-4"> <input type="hidden" name="intent" value="update"> <input type="hidden" name="tierId"${addAttribute(summary.tier.id, "value")}> <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_140px]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Nombre</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name"${addAttribute(summary.tier.name, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Mínimo puntos</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="minPoints" min="0" step="1"${addAttribute(summary.tier.minPoints, "value")} required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orden</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="number" name="sortOrder" min="0" step="1"${addAttribute(summary.tier.sortOrder, "value")} required> </label> </div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Perks JSON</span> <textarea class="min-h-28 w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="perks">${safePerksText(summary.tier.perks)}</textarea> </label> <div class="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"> <label class="inline-flex items-center gap-3 text-sm text-slate-300"> <input class="h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(summary.tier.active, "checked")}>
Tier activo
</label> <div class="flex flex-wrap gap-2"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Guardar tier
</button> </div> </div> </form> <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4"> <p class="text-sm text-slate-500"> ${canDelete ? "Se puede borrar porque no tiene perfiles asignados." : `No se puede borrar porque tiene ${summary.assignedUserCount} perfil${summary.assignedUserCount === 1 ? "" : "es"} asignado${summary.assignedUserCount === 1 ? "" : "s"}.`} </p> <form method="post" action="/api/admin/loyalty-tiers"> <input type="hidden" name="intent" value="delete"> <input type="hidden" name="tierId"${addAttribute(summary.tier.id, "value")}> <button type="submit"${addAttribute(!canDelete, "disabled")}${addAttribute([
      "inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition",
      canDelete ? "border border-rose-400/20 bg-rose-400/10 text-rose-300 hover:border-rose-400/30 hover:bg-rose-400/15" : "cursor-not-allowed border border-white/10 bg-white/5 text-slate-500"
    ], "class:list")}>
Borrar tier
</button> </form> </div> </section>`;
  })} </div>`} </section> </section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/loyalty.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/loyalty.astro";
const $$url = "/admin/loyalty";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Loyalty,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
