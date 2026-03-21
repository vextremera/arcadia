import type { APIRoute } from "astro";
import { and, db, eq, ModifierGroup, ModifierOption } from "astro:db";

function parseId(value: string | undefined) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseIntValue(value: FormDataEntryValue | null, fallback = 0) {
  const raw = String(value ?? "").trim();
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

function parseEurToCentsAllowNegative(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(",", ".");
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

function safeRedirectTo(value: FormDataEntryValue | null, fallback: string) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  if (!raw.startsWith("/admin/")) return fallback;
  return raw;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}${url.hash}`;
}

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const groupId = parseId(context.params.id);
  if (!groupId) {
    return context.redirect("/admin/catalogo/productos?error=invalid-id");
  }

  const [group] = await db
    .select({
      id: ModifierGroup.id,
      active: ModifierGroup.active,
    })
    .from(ModifierGroup)
    .where(eq(ModifierGroup.id, groupId))
    .limit(1);

  if (!group) {
    return context.redirect("/admin/catalogo/productos?error=not-found");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();
  const redirectTo = safeRedirectTo(form.get("redirectTo"), "/admin/catalogo/productos");

  if (intent === "create") {
    const name = String(form.get("name") ?? "").trim();
    const priceDeltaCents = parseEurToCentsAllowNegative(form.get("priceDeltaEur"));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(redirectTo, { modifierOptionError: "missing-name" }));
    }

    if (priceDeltaCents === null) {
      return context.redirect(withQuery(redirectTo, { modifierOptionError: "invalid-price" }));
    }

    const existing = await db.select({ id: ModifierOption.id }).from(ModifierOption);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(ModifierOption).values({
      id: nextId,
      groupId,
      name,
      priceDeltaCents,
      sortOrder,
      active,
    });

    return context.redirect(withQuery(redirectTo, { modifierOptionSaved: "1" }));
  }

  const optionId = parseId(String(form.get("optionId") ?? ""));
  if (!optionId) {
    return context.redirect(withQuery(redirectTo, { modifierOptionError: "invalid-option" }));
  }

  const [option] = await db
    .select({
      id: ModifierOption.id,
      groupId: ModifierOption.groupId,
    })
    .from(ModifierOption)
    .where(and(eq(ModifierOption.id, optionId), eq(ModifierOption.groupId, groupId)))
    .limit(1);

  if (!option) {
    return context.redirect(withQuery(redirectTo, { modifierOptionError: "not-found" }));
  }

  if (intent === "delete") {
    await db.delete(ModifierOption).where(eq(ModifierOption.id, optionId));
    return context.redirect(withQuery(redirectTo, { modifierOptionSaved: "1" }));
  }

  if (intent === "update") {
    const name = String(form.get("name") ?? "").trim();
    const priceDeltaCents = parseEurToCentsAllowNegative(form.get("priceDeltaEur"));
    const sortOrder = parseIntValue(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(redirectTo, { modifierOptionError: "missing-name" }));
    }

    if (priceDeltaCents === null) {
      return context.redirect(withQuery(redirectTo, { modifierOptionError: "invalid-price" }));
    }

    await db
      .update(ModifierOption)
      .set({
        name,
        priceDeltaCents,
        sortOrder,
        active,
      })
      .where(eq(ModifierOption.id, optionId));

    return context.redirect(withQuery(redirectTo, { modifierOptionSaved: "1" }));
  }

  return context.redirect(withQuery(redirectTo, { modifierOptionError: "invalid-intent" }));
};