import type { APIRoute } from "astro";
import { db, Allergen, eq } from "astro:db";

function parseId(value: FormDataEntryValue | null) {
  const n = Number(String(value ?? "").trim());
  return Number.isFinite(n) ? n : null;
}

function parseSortOrder(value: FormDataEntryValue | null, fallback = 0) {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : fallback;
}

function toNullableText(value: FormDataEntryValue | null) {
  const s = String(value ?? "").trim();
  return s ? s : null;
}

function withQuery(path: string, params: Record<string, string>) {
  const url = new URL(path, "http://local");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return `${url.pathname}${url.search}`;
}

const REDIRECT_PATH = "/admin/catalogo/alergenos";

export const POST: APIRoute = async (context) => {
  const user = context.locals.user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const form = await context.request.formData();
  const intent = String(form.get("intent") ?? "").trim();

  if (intent !== "update") {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-intent" }));
  }

  const allergenId = parseId(form.get("allergenId"));
  if (!allergenId) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-allergen" }));
  }

  const [allergen] = await db
    .select({ id: Allergen.id })
    .from(Allergen)
    .where(eq(Allergen.id, allergenId))
    .limit(1);

  if (!allergen) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "not-found" }));
  }

  const name = String(form.get("name") ?? "").trim();
  const iconUrl = toNullableText(form.get("iconUrl"));
  const sortOrder = parseSortOrder(form.get("sortOrder"), 0);
  const active = form.get("active") === "on";

  if (!name) {
    return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
  }

  await db
    .update(Allergen)
    .set({
      name,
      iconUrl,
      sortOrder,
      active,
      updatedAt: new Date(),
    })
    .where(eq(Allergen.id, allergenId));

  return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
};