import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, a4 as addAttribute, F as Fragment, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$AdminLayout } from './AdminLayout_DMcBXVbD.mjs';
import { d as db, U as User, k as UserProfile, L as LoyaltyTier, O as Order, t as Address, u as LoyaltyLedger } from './_astro_db_Bcz5lWRF.mjs';
import { inArray, eq } from '@astrojs/db/dist/runtime/virtual.js';

const $$Usuarios = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Usuarios;
  function money(cents) {
    return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
  }
  function formatDateTime(value) {
    if (!value) return "—";
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("es-ES", {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "Europe/Madrid"
    }).format(date);
  }
  function safeMetaNote(meta) {
    if (!meta || typeof meta !== "object") return null;
    const note = meta.note;
    if (typeof note !== "string") return null;
    const trimmed = note.trim();
    return trimmed || null;
  }
  function paymentTone(status) {
    if (status === "PAID" || status === "PARTIALLY_REFUNDED") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
    if (status === "REFUNDED" || status === "FAILED") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    }
    if (status === "AUTH") {
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    }
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
  function roleTone(role) {
    if (role === "ADMIN")
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    if (role === "STAFF")
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    return "border-sky-400/20 bg-sky-400/10 text-sky-300";
  }
  function reasonTone(reason) {
    if (reason === "ORDER_PAID" || reason === "PROMO_BONUS") {
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    }
    if (reason === "ORDER_REFUND") {
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    }
    return "border-amber-400/20 bg-amber-400/10 text-amber-300";
  }
  function orderStatusTone(status) {
    if (status === "DELIVERED")
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    if (status === "CANCELLED")
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    if (status === "READY" || status === "OUT_FOR_DELIVERY")
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    if (status === "PREPARING" || status === "ACCEPTED")
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    return "border-slate-400/20 bg-slate-400/10 text-slate-300";
  }
  function isPaid(status) {
    return status === "PAID" || status === "PARTIALLY_REFUNDED";
  }
  const url = new URL(Astro2.request.url);
  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const roleFilter = (url.searchParams.get("role") ?? "").trim().toUpperCase();
  const activeFilter = (url.searchParams.get("active") ?? "").trim().toLowerCase();
  const tierFilterRaw = (url.searchParams.get("tierId") ?? "").trim();
  const ordersFilter = (url.searchParams.get("orders") ?? "").trim().toLowerCase();
  const selectedUserIdParam = Number(url.searchParams.get("user") ?? "");
  const saved = url.searchParams.get("saved") ?? "";
  const error = url.searchParams.get("error") ?? "";
  const users = await db.select({
    id: User.id,
    email: User.email,
    name: User.name,
    role: User.role,
    active: User.active,
    createdAt: User.createdAt,
    updatedAt: User.updatedAt
  }).from(User);
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role !== b.role) {
      const order = { ADMIN: 1, STAFF: 2, CUSTOMER: 3 };
      return order[a.role] - order[b.role];
    }
    const aName = (a.name ?? a.email).toLowerCase();
    const bName = (b.name ?? b.email).toLowerCase();
    return aName.localeCompare(bName, "es");
  });
  const userIds = sortedUsers.map((user) => user.id);
  const profiles = userIds.length ? await db.select({
    id: UserProfile.id,
    userId: UserProfile.userId,
    phone: UserProfile.phone,
    birthday: UserProfile.birthday,
    pointsBalance: UserProfile.pointsBalance,
    tierId: UserProfile.tierId,
    createdAt: UserProfile.createdAt,
    updatedAt: UserProfile.updatedAt
  }).from(UserProfile).where(inArray(UserProfile.userId, userIds)) : [];
  const tiers = await db.select({
    id: LoyaltyTier.id,
    name: LoyaltyTier.name,
    minPoints: LoyaltyTier.minPoints,
    active: LoyaltyTier.active,
    sortOrder: LoyaltyTier.sortOrder
  }).from(LoyaltyTier);
  const activeTiersAsc = [...tiers].filter((tier) => tier.active).sort(
    (a, b) => a.minPoints - b.minPoints || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "es")
  );
  const profileByUserId = /* @__PURE__ */ new Map();
  for (const profile of profiles) {
    profileByUserId.set(profile.userId, profile);
  }
  const tierById = /* @__PURE__ */ new Map();
  for (const tier of tiers) {
    tierById.set(tier.id, tier);
  }
  const orders = userIds.length ? await db.select({
    id: Order.id,
    publicId: Order.publicId,
    userId: Order.userId,
    type: Order.type,
    status: Order.status,
    paymentStatus: Order.paymentStatus,
    totalCents: Order.totalCents,
    discountCents: Order.discountCents,
    deliveryFeeCents: Order.deliveryFeeCents,
    customerName: Order.customerName,
    createdAt: Order.createdAt
  }).from(Order).where(inArray(Order.userId, userIds)) : [];
  const orderCountByUserId = /* @__PURE__ */ new Map();
  const paidOrderCountByUserId = /* @__PURE__ */ new Map();
  const totalSpentByUserId = /* @__PURE__ */ new Map();
  const lastOrderAtByUserId = /* @__PURE__ */ new Map();
  for (const order of orders) {
    if (typeof order.userId !== "number") continue;
    orderCountByUserId.set(
      order.userId,
      (orderCountByUserId.get(order.userId) ?? 0) + 1
    );
    const previousLast = lastOrderAtByUserId.get(order.userId);
    if (!previousLast || new Date(order.createdAt).getTime() > new Date(previousLast).getTime()) {
      lastOrderAtByUserId.set(order.userId, order.createdAt);
    }
    if (isPaid(order.paymentStatus)) {
      paidOrderCountByUserId.set(
        order.userId,
        (paidOrderCountByUserId.get(order.userId) ?? 0) + 1
      );
      totalSpentByUserId.set(
        order.userId,
        (totalSpentByUserId.get(order.userId) ?? 0) + order.totalCents
      );
    }
  }
  const summaries = sortedUsers.map((user) => {
    const profile = profileByUserId.get(user.id) ?? null;
    const tier = profile?.tierId ? tierById.get(profile.tierId) ?? null : null;
    return {
      user,
      profile,
      tier,
      orderCount: orderCountByUserId.get(user.id) ?? 0,
      paidOrderCount: paidOrderCountByUserId.get(user.id) ?? 0,
      totalSpentCents: totalSpentByUserId.get(user.id) ?? 0,
      lastOrderAt: lastOrderAtByUserId.get(user.id) ?? null
    };
  });
  const tierFilter = Number(tierFilterRaw);
  const validRoleFilter = roleFilter === "ADMIN" || roleFilter === "STAFF" || roleFilter === "CUSTOMER";
  const validActiveFilter = activeFilter === "active" || activeFilter === "inactive";
  const validOrdersFilter = ordersFilter === "with-orders" || ordersFilter === "without-orders" || ordersFilter === "paid-only";
  const filteredSummaries = summaries.filter((summary) => {
    if (q) {
      const haystack = [
        summary.user.name ?? "",
        summary.user.email,
        summary.user.role,
        summary.profile?.phone ?? "",
        summary.tier?.name ?? ""
      ].join(" ").toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (validRoleFilter && summary.user.role !== roleFilter) return false;
    if (validActiveFilter) {
      if (activeFilter === "active" && !summary.user.active) return false;
      if (activeFilter === "inactive" && summary.user.active) return false;
    }
    if (Number.isFinite(tierFilter)) {
      const currentTierId = summary.profile?.tierId ?? null;
      if (currentTierId !== tierFilter) return false;
    }
    if (validOrdersFilter) {
      if (ordersFilter === "with-orders" && summary.orderCount <= 0) return false;
      if (ordersFilter === "without-orders" && summary.orderCount > 0)
        return false;
      if (ordersFilter === "paid-only" && summary.paidOrderCount <= 0)
        return false;
    }
    return true;
  });
  const filterParams = new URLSearchParams();
  if (q) filterParams.set("q", q);
  if (validRoleFilter) filterParams.set("role", roleFilter);
  if (validActiveFilter) filterParams.set("active", activeFilter);
  if (Number.isFinite(tierFilter)) filterParams.set("tierId", String(tierFilter));
  if (validOrdersFilter) filterParams.set("orders", ordersFilter);
  const selectedSummary = filteredSummaries.find(
    (summary) => summary.user.id === selectedUserIdParam
  ) ?? summaries.find((summary) => summary.user.id === selectedUserIdParam) ?? filteredSummaries[0] ?? summaries[0] ?? null;
  const selectedUserId = selectedSummary?.user.id ?? null;
  const selectedAddresses = typeof selectedUserId === "number" ? await db.select({
    id: Address.id,
    userId: Address.userId,
    label: Address.label,
    contactName: Address.contactName,
    phone: Address.phone,
    line1: Address.line1,
    line2: Address.line2,
    city: Address.city,
    postalCode: Address.postalCode,
    notes: Address.notes,
    isDefault: Address.isDefault,
    createdAt: Address.createdAt
  }).from(Address).where(eq(Address.userId, selectedUserId)) : [];
  const selectedOrders = typeof selectedUserId === "number" ? [...orders].filter((order) => order.userId === selectedUserId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 10) : [];
  const selectedLedger = typeof selectedUserId === "number" ? (await db.select({
    id: LoyaltyLedger.id,
    userId: LoyaltyLedger.userId,
    orderId: LoyaltyLedger.orderId,
    pointsDelta: LoyaltyLedger.pointsDelta,
    reason: LoyaltyLedger.reason,
    meta: LoyaltyLedger.meta,
    createdAt: LoyaltyLedger.createdAt
  }).from(LoyaltyLedger).where(eq(LoyaltyLedger.userId, selectedUserId))).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 16) : [];
  const totalUsers = summaries.length;
  const customerCount = summaries.filter(
    (summary) => summary.user.role === "CUSTOMER"
  ).length;
  const activeCustomerCount = summaries.filter(
    (summary) => summary.user.role === "CUSTOMER" && summary.user.active
  ).length;
  const loyaltyUsers = summaries.filter(
    (summary) => summary.user.role === "CUSTOMER" && summary.profile
  ).length;
  const totalPoints = summaries.reduce(
    (sum, summary) => sum + Number(summary.profile?.pointsBalance ?? 0),
    0
  );
  const selectedProfile = selectedSummary?.profile ?? null;
  const selectedTier = selectedSummary?.tier ?? null;
  const selectedPoints = Number(selectedProfile?.pointsBalance ?? 0);
  const bestTierByPoints = activeTiersAsc.filter((tier) => tier.minPoints <= selectedPoints).sort((a, b) => b.minPoints - a.minPoints)[0] ?? null;
  const nextTier = activeTiersAsc.find((tier) => tier.minPoints > selectedPoints) ?? null;
  const currentTierFloor = bestTierByPoints?.minPoints ?? 0;
  const nextTierMin = nextTier?.minPoints ?? currentTierFloor;
  const tierProgressPct = nextTier && nextTierMin > currentTierFloor ? Math.max(
    0,
    Math.min(
      100,
      (selectedPoints - currentTierFloor) / (nextTierMin - currentTierFloor) * 100
    )
  ) : 100;
  const topCustomersByPoints = [...summaries].filter((summary) => summary.user.role === "CUSTOMER").sort((a, b) => {
    const aPts = Number(a.profile?.pointsBalance ?? 0);
    const bPts = Number(b.profile?.pointsBalance ?? 0);
    if (bPts !== aPts) return bPts - aPts;
    return b.totalSpentCents - a.totalSpentCents;
  }).slice(0, 6);
  const successMessage = saved === "user" ? "Usuario actualizado correctamente." : saved === "points" ? "Ajuste manual aplicado correctamente." : saved === "bonus" ? "Bonus promocional aplicado correctamente." : "";
  const errorMessage = error === "invalid-user" ? "El usuario indicado no es válido." : error === "not-found" ? "El usuario ya no existe." : error === "missing-email" ? "El email es obligatorio." : error === "invalid-email" ? "El email no es válido." : error === "duplicate-email" ? "Ya existe otro usuario con ese email." : error === "invalid-role" ? "El rol no es válido." : error === "invalid-birthday" ? "La fecha de cumpleaños debe tener formato YYYY-MM-DD." : error === "points-required" ? "El ajuste de puntos es obligatorio." : error === "points-zero" ? "El ajuste de puntos no puede ser cero." : error === "bonus-required" ? "El bonus promocional es obligatorio." : error === "bonus-negative" ? "El bonus promocional debe ser positivo." : error === "invalid-intent" ? "Acción no válida." : "";
  const summaryCards = [
    {
      label: "Usuarios",
      value: totalUsers,
      note: "Todas las cuentas registradas",
      tone: "border-white/10 bg-white/[0.03]"
    },
    {
      label: "Clientes activos",
      value: activeCustomerCount,
      note: `${customerCount} clientes en total`,
      tone: "border-sky-400/15 bg-sky-400/8"
    },
    {
      label: "Con loyalty",
      value: loyaltyUsers,
      note: "Perfiles con puntos",
      tone: "border-violet-400/15 bg-violet-400/8"
    },
    {
      label: "Puntos totales",
      value: totalPoints,
      note: "Saldo agregado actual",
      tone: "border-amber-400/15 bg-amber-400/8"
    }
  ];
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Usuarios y loyalty · Admin · Arcadia", "heading": "Usuarios y loyalty", "description": "Módulo final de clientes y cuentas: filtros serios, loyalty real, bonus promo separado, direcciones, pedidos y movimientos de puntos.", "actions": true }, { "actions": async ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": async ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/loyalty" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/[0.06] hover:text-white">
Ver tiers
</a> <a href="/admin/pedidos" class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Ver pedidos
</a> </div> ` })}`, "default": async ($$result2) => renderTemplate`  ${successMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 px-5 py-4 text-sm text-emerald-200"> ${successMessage} </section>` : null}${errorMessage ? renderTemplate`<section class="mb-6 rounded-[26px] border border-rose-400/20 bg-rose-400/10 px-5 py-4 text-sm text-rose-200"> ${errorMessage} </section>` : null}<section class="grid gap-4 md:grid-cols-2 xl:grid-cols-4"> ${summaryCards.map((card) => renderTemplate`<article${addAttribute([
    "rounded-[28px] border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]",
    card.tone
  ], "class:list")}> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500"> ${card.label} </div> <div class="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white"> ${card.value} </div> <p class="mt-2 text-sm leading-6 text-slate-400">${card.note}</p> </article>`)} </section> <section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_420px]"> <article class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-sky-300/80">
Base de usuarios
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Cuentas registradas
</h2> </div> <a href="/admin/usuarios" class="text-sm font-semibold text-slate-400 transition hover:text-white">
Limpiar filtros
</a> </div> <form method="get" class="mt-5 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_160px_160px_180px_160px_auto]"> <input class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400/40 focus:outline-none" type="text" name="q" placeholder="Nombre, email, teléfono o tier"${addAttribute(q, "value")}> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="role"> <option value="">Todos los roles</option> <option value="ADMIN"${addAttribute(roleFilter === "ADMIN", "selected")}>ADMIN</option> <option value="STAFF"${addAttribute(roleFilter === "STAFF", "selected")}>STAFF</option> <option value="CUSTOMER"${addAttribute(roleFilter === "CUSTOMER", "selected")}>CUSTOMER</option> </select> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="active"> <option value="">Todos</option> <option value="active"${addAttribute(activeFilter === "active", "selected")}>Activos</option> <option value="inactive"${addAttribute(activeFilter === "inactive", "selected")}>Inactivos</option> </select> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="tierId"> <option value="">Todos los tiers</option> ${tiers.slice().sort(
    (a, b) => a.sortOrder - b.sortOrder || a.minPoints - b.minPoints
  ).map((tier) => renderTemplate`<option${addAttribute(tier.id, "value")}${addAttribute(
    Number.isFinite(tierFilter) && tierFilter === tier.id,
    "selected"
  )}> ${tier.name} </option>`)} </select> <select class="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="orders"> <option value="">Todos</option> <option value="with-orders"${addAttribute(ordersFilter === "with-orders", "selected")}>Con pedidos</option> <option value="without-orders"${addAttribute(ordersFilter === "without-orders", "selected")}>Sin pedidos</option> <option value="paid-only"${addAttribute(ordersFilter === "paid-only", "selected")}>Con pedidos cobrados</option> </select> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Filtrar
</button> </form> </div> ${filteredSummaries.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">
No hay usuarios con ese filtro
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Ajusta el filtro o limpia la búsqueda para volver a ver toda la
                base.
</p> </div> </div>` : renderTemplate`<div class="space-y-5 px-6 py-6"> ${filteredSummaries.map((summary) => {
    const selected = summary.user.id === selectedUserId;
    const linkParams = new URLSearchParams(filterParams);
    linkParams.set("user", String(summary.user.id));
    return renderTemplate`<a${addAttribute(`/admin/usuarios?${linkParams.toString()}`, "href")}${addAttribute([
      "block rounded-[28px] border p-5 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition",
      selected ? "border-sky-400/30 bg-sky-400/10" : "border-white/10 bg-[#0b1220]/90 hover:border-white/15 hover:bg-white/[0.04]"
    ], "class:list")}> <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <div class="truncate text-lg font-semibold text-white"> ${summary.user.name ?? "Sin nombre"} </div> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
      roleTone(summary.user.role)
    ], "class:list")}> ${summary.user.role} </span> <span${addAttribute([
      "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
      summary.user.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
    ], "class:list")}> ${summary.user.active ? "Activa" : "Inactiva"} </span> ${summary.profile?.phone ? renderTemplate`<span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-slate-300"> ${summary.profile.phone} </span>` : null} </div> <div class="mt-2 break-all text-sm text-slate-400"> ${summary.user.email} </div> <div class="mt-4 grid gap-4 md:grid-cols-3"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Loyalty
</div> <div class="mt-2 text-sm font-semibold text-white"> ${summary.profile?.pointsBalance ?? 0} pts
</div> <div class="mt-1 text-xs text-slate-500"> ${summary.tier?.name ?? "Sin tier"} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Pedidos
</div> <div class="mt-2 text-sm font-semibold text-white"> ${summary.orderCount} total
</div> <div class="mt-1 text-xs text-slate-500"> ${summary.paidOrderCount} cobrados
</div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Gasto cobrado
</div> <div class="mt-2 text-sm font-semibold text-white"> ${money(summary.totalSpentCents)} </div> <div class="mt-1 text-xs text-slate-500"> ${formatDateTime(summary.lastOrderAt)} </div> </section> </div> </div> </div> </a>`;
  })} </div>`} </article> <aside class="space-y-6"> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Ranking
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Top clientes loyalty
</h2> <div class="mt-5 space-y-3"> ${topCustomersByPoints.length === 0 ? renderTemplate`<div class="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
Todavía no hay clientes suficientes para ranking.
</div>` : topCustomersByPoints.map((summary, index) => {
    const linkParams = new URLSearchParams(filterParams);
    linkParams.set("user", String(summary.user.id));
    return renderTemplate`<a${addAttribute(`/admin/usuarios?${linkParams.toString()}`, "href")} class="block rounded-3xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-sky-400/25 hover:bg-white/[0.05]"> <div class="flex items-start justify-between gap-3"> <div> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">
#${index + 1} </div> <div class="mt-1 text-sm font-semibold text-white"> ${summary.user.name ?? summary.user.email} </div> <div class="mt-1 text-xs text-slate-500"> ${summary.tier?.name ?? "Sin tier"} ·${" "} ${summary.paidOrderCount} cobrados
</div> </div> <div class="text-right"> <div class="text-sm font-semibold text-white"> ${summary.profile?.pointsBalance ?? 0} pts
</div> <div class="mt-1 text-xs text-slate-500"> ${money(summary.totalSpentCents)} </div> </div> </div> </a>`;
  })} </div> </section> ${selectedSummary ? renderTemplate`${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate` <section class="rounded-[30px] border border-white/10 bg-[#111827] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="flex flex-wrap items-start justify-between gap-4"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Usuario seleccionado
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white"> ${selectedSummary.user.name ?? "Sin nombre"} </h2> <div class="mt-1 text-sm text-slate-400"> ${selectedSummary.user.email} </div> </div> <div class="flex flex-wrap gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    roleTone(selectedSummary.user.role)
  ], "class:list")}> ${selectedSummary.user.role} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    selectedSummary.user.active ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
  ], "class:list")}> ${selectedSummary.user.active ? "Activa" : "Inactiva"} </span> </div> </div> <form method="post" action="/api/admin/users" class="mt-6 grid gap-4"> <input type="hidden" name="intent" value="update-user"> <input type="hidden" name="userId"${addAttribute(selectedSummary.user.id, "value")}> <div class="grid gap-4 lg:grid-cols-2"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nombre
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="name"${addAttribute(selectedSummary.user.name ?? "", "value")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Email
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="email" name="email"${addAttribute(selectedSummary.user.email, "value")} required> </label> </div> <div class="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)_minmax(0,1fr)]"> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Rol
</span> <select class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" name="role"> <option value="ADMIN"${addAttribute(selectedSummary.user.role === "ADMIN", "selected")}>
ADMIN
</option> <option value="STAFF"${addAttribute(selectedSummary.user.role === "STAFF", "selected")}>
STAFF
</option> <option value="CUSTOMER"${addAttribute(selectedSummary.user.role === "CUSTOMER", "selected")}>
CUSTOMER
</option> </select> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Teléfono
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="phone"${addAttribute(selectedProfile?.phone ?? "", "value")}> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Cumpleaños
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-sky-400/40 focus:outline-none" type="text" name="birthday"${addAttribute(selectedProfile?.birthday ?? "", "value")} placeholder="YYYY-MM-DD"> </label> </div> <label class="block rounded-[26px] border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-start gap-3"> <input class="mt-1 h-4 w-4 rounded border-white/20 bg-slate-950 text-sky-400" type="checkbox" name="active"${addAttribute(selectedSummary.user.active, "checked")}> <div> <div class="text-sm font-semibold text-white">
Cuenta activa
</div> <p class="mt-1 text-sm leading-6 text-slate-400">
Controla si la cuenta sigue operativa dentro del
                        sistema.
</p> </div> </div> </label> <div class="flex justify-end"> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Guardar usuario
</button> </div> </form> </section> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Loyalty
</div> <div class="mt-4 grid gap-4 sm:grid-cols-3"> <div class="rounded-3xl border border-white/10 bg-white/[0.03] p-4"> <div class="text-xs uppercase tracking-[0.16em] text-slate-500">
Puntos
</div> <div class="mt-2 text-2xl font-semibold text-white"> ${selectedPoints} </div> </div> <div class="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-4"> <div class="text-xs uppercase tracking-[0.16em] text-violet-200/80">
Tier actual
</div> <div class="mt-2 text-lg font-semibold text-white"> ${selectedTier?.name ?? bestTierByPoints?.name ?? "Sin tier"} </div> </div> <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-xs uppercase tracking-[0.16em] text-cyan-200/80">
Siguiente tier
</div> <div class="mt-2 text-lg font-semibold text-white"> ${nextTier ? `${nextTier.name} · ${nextTier.minPoints} pts` : "Máximo alcanzado"} </div> </div> </div> <div class="mt-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4"> <div class="flex items-center justify-between gap-3 text-sm"> <span class="font-semibold text-white">
Progreso al siguiente tier
</span> <span class="text-slate-400"> ${nextTier ? `${selectedPoints}/${nextTier.minPoints}` : "100%"} </span> </div> <div class="mt-3 h-3 rounded-full bg-white/[0.05]"> <div class="h-3 rounded-full bg-cyan-400/80"${addAttribute(`width:${Math.max(0, Math.min(100, tierProgressPct))}%`, "style")}></div> </div> </div> <div class="mt-5 grid gap-4 xl:grid-cols-2"> <form method="post" action="/api/admin/users" class="grid gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-4"> <input type="hidden" name="intent" value="adjust-points"> <input type="hidden" name="userId"${addAttribute(selectedSummary.user.id, "value")}> <div class="text-sm font-semibold text-white">
Ajuste manual
</div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Delta
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="number" name="pointsDelta" step="1" placeholder="+50 o -20" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
Nota interna
</span> <input class="w-full rounded-2xl border border-white/10 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-cyan-400/40 focus:outline-none" type="text" name="note" placeholder="Compensación, incidencia..."> </label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
Aplicar ajuste
</button> </form> <form method="post" action="/api/admin/users" class="grid gap-4 rounded-3xl border border-emerald-400/20 bg-emerald-400/6 p-4"> <input type="hidden" name="intent" value="promo-bonus"> <input type="hidden" name="userId"${addAttribute(selectedSummary.user.id, "value")}> <div class="text-sm font-semibold text-white">
Bonus promocional
</div> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
Bonus
</span> <input class="w-full rounded-2xl border border-emerald-400/20 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-emerald-300/40 focus:outline-none" type="number" name="bonusPoints" min="1" step="1" placeholder="25" required> </label> <label class="block"> <span class="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
Motivo promo
</span> <input class="w-full rounded-2xl border border-emerald-400/20 bg-[#0b1120] px-4 py-3 text-sm text-white focus:border-emerald-300/40 focus:outline-none" type="text" name="note" placeholder="Campaña local, cortesía, aniversario..."> </label> <button type="submit" class="inline-flex items-center justify-center rounded-2xl bg-emerald-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300">
Aplicar bonus promo
</button> </form> </div> </section> ` })}` : renderTemplate`<section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-lg font-semibold text-white">
No hay usuario seleccionado
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Selecciona una cuenta de la lista izquierda para ver perfil,
              loyalty, direcciones y pedidos.
</p> </section>`} </aside> </section> ${selectedSummary ? renderTemplate`<section class="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"> <article class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/80">
Direcciones
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Direcciones guardadas
</h2> </div> <div class="text-sm text-slate-400"> ${selectedAddresses.length} dirección
${selectedAddresses.length === 1 ? "" : "es"} </div> </div> </div> <div class="space-y-4 px-6 py-6"> ${selectedAddresses.length === 0 ? renderTemplate`<div class="rounded-[28px] border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-400">
Este usuario no tiene direcciones guardadas.
</div>` : selectedAddresses.sort(
    (a, b) => Number(b.isDefault) - Number(a.isDefault) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).map((address) => renderTemplate`<article class="rounded-3xl border border-white/10 bg-white/[0.03] p-4"> <div class="flex flex-wrap items-start justify-between gap-3"> <div> <div class="text-sm font-semibold text-white"> ${address.label ?? "Sin etiqueta"} </div> <div class="mt-1 text-sm text-slate-300"> ${address.contactName} · ${address.phone} </div> <div class="mt-2 text-sm text-slate-400"> ${address.line1} ${address.line2 ? `, ${address.line2}` : ""} ·${" "} ${address.postalCode} ${address.city} </div> ${address.notes ? renderTemplate`<div class="mt-2 text-sm text-slate-500"> ${address.notes} </div>` : null} </div> ${address.isDefault ? renderTemplate`<span class="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300">
Default
</span>` : null} </div> </article>`)} </div> </article> <article class="rounded-[30px] border border-white/10 bg-[#111827]/80 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-300/80">
Loyalty ledger
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Historial de puntos
</h2> </div> <div class="text-sm text-slate-400"> ${selectedLedger.length} movimiento
${selectedLedger.length === 1 ? "" : "s"} </div> </div> </div> <div class="space-y-4 px-6 py-6"> ${selectedLedger.length === 0 ? renderTemplate`<div class="rounded-[28px] border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-400">
Este usuario todavía no tiene movimientos en loyalty.
</div>` : selectedLedger.map((entry) => renderTemplate`<article class="rounded-3xl border border-white/10 bg-white/[0.03] p-4"> <div class="flex flex-wrap items-start justify-between gap-3"> <div> <div class="flex flex-wrap items-center gap-2"> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    reasonTone(entry.reason)
  ], "class:list")}> ${entry.reason} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]",
    entry.pointsDelta >= 0 ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-rose-400/20 bg-rose-400/10 text-rose-300"
  ], "class:list")}> ${entry.pointsDelta >= 0 ? `+${entry.pointsDelta}` : entry.pointsDelta}${" "}
pts
</span> </div> <div class="mt-3 text-sm text-slate-300"> ${formatDateTime(entry.createdAt)} </div> ${entry.orderId ? renderTemplate`<div class="mt-1 text-xs text-slate-500">
orderId #${entry.orderId} </div>` : null} ${safeMetaNote(entry.meta) ? renderTemplate`<div class="mt-2 text-sm text-slate-400"> ${safeMetaNote(entry.meta)} </div>` : null} </div> </div> </article>`)} </div> </article> </section>` : null}${selectedSummary ? renderTemplate`<section class="mt-6 rounded-[30px] border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_rgba(0,0,0,0.28)]"> <div class="border-b border-white/10 px-6 py-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Pedidos
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Últimos pedidos del usuario
</h2> </div> <div class="text-sm text-slate-400"> ${selectedOrders.length} registro
${selectedOrders.length === 1 ? "" : "s"} </div> </div> </div> ${selectedOrders.length === 0 ? renderTemplate`<div class="px-6 py-12 text-center"> <div class="mx-auto max-w-md rounded-[28px] border border-white/10 bg-slate-950/40 p-8"> <div class="text-lg font-semibold text-white">
Este usuario aún no tiene pedidos
</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Cuando haga pedidos, aquí aparecerán los últimos con su estado y
                total.
</p> </div> </div>` : renderTemplate`<div class="space-y-4 px-6 py-6"> ${selectedOrders.map((order) => renderTemplate`<article class="rounded-[28px] border border-white/10 bg-[#0b1220]/90 p-5"> <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between"> <div class="min-w-0 flex-1"> <div class="flex flex-wrap items-center gap-2.5"> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="text-base font-semibold text-white transition hover:text-sky-300"> ${order.publicId} </a> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
    orderStatusTone(order.status)
  ], "class:list")}> ${order.status} </span> <span${addAttribute([
    "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
    paymentTone(order.paymentStatus)
  ], "class:list")}> ${order.paymentStatus} </span> <span class="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300"> ${order.type} </span> </div> <div class="mt-4 grid gap-4 md:grid-cols-2"> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Fecha
</div> <div class="mt-2 text-sm font-semibold text-white"> ${formatDateTime(order.createdAt)} </div> </section> <section class="rounded-[24px] border border-white/10 bg-white/[0.03] p-4"> <div class="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
Total
</div> <div class="mt-2 text-sm font-semibold text-white"> ${money(order.totalCents)} </div> </section> </div> </div> <a${addAttribute(`/admin/pedidos/${order.publicId}`, "href")} class="inline-flex items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15">
Abrir pedido
</a> </div> </article>`)} </div>`} </section>` : null}` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/admin/usuarios.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/admin/usuarios.astro";
const $$url = "/admin/usuarios";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Usuarios,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
