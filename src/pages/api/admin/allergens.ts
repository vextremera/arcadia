import type { APIRoute } from "astro";
import {
  db,
  Allergen,
  ProductAllergen,
  eq,
} from "astro:db";
import { saveCatalogFlags } from "@/server/catalog/settings";
import { getRequestAuditMeta, writeAuditLog } from "@/server/audit/log";

function safeText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

function parseId(value: FormDataEntryValue | null) {
  const n = Number(safeText(value));
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function parseNonNegativeInt(value: FormDataEntryValue | null, fallback = 0) {
  const raw = safeText(value);
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
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
  const intent = safeText(form.get("intent"));

  if (intent === "save-visibility") {
    const showAllergens = safeText(form.get("showAllergens")) === "on";
    await saveCatalogFlags({ showAllergens });

    try {
      const { ip, userAgent } = getRequestAuditMeta(context.request);
      await writeAuditLog({
        actorUserId: user.id,
        action: showAllergens ? "ALLERGENS_SHOWN" : "ALLERGENS_HIDDEN",
        entityType: "catalog_flags",
        entityId: "showAllergens",
        diff: { next: { showAllergens } },
        ip,
        userAgent,
      });
    } catch (error) {
      console.error("[audit] allergen visibility failed", error);
    }

    return context.redirect("/admin/catalogo/alergenos?saved=1");
  }

  if (intent === "create") {
    const name = safeText(form.get("name"));
    const slugInput = safeText(form.get("slug"));
    const slug = slugify(slugInput || name);
    const iconUrl = safeText(form.get("iconUrl"));
    const sortOrder = parseNonNegativeInt(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    if (sortOrder === null) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-allergen" }));
    }

    const [duplicateSlug] = await db
      .select({ id: Allergen.id })
      .from(Allergen)
      .where(eq(Allergen.slug, slug))
      .limit(1);

    if (duplicateSlug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-slug" }));
    }

    const existing = await db.select({ id: Allergen.id }).from(Allergen);
    const nextId = existing.reduce((max, row) => Math.max(max, row.id), 0) + 1;

    await db.insert(Allergen).values({
      id: nextId,
      name,
      slug,
      iconUrl: iconUrl || null,
      sortOrder,
      active,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
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

  if (intent === "update") {
    const name = safeText(form.get("name"));
    const slugInput = safeText(form.get("slug"));
    const slug = slugify(slugInput || name);
    const iconUrl = safeText(form.get("iconUrl"));
    const sortOrder = parseNonNegativeInt(form.get("sortOrder"), 0);
    const active = form.get("active") === "on";

    if (!name) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "missing-name" }));
    }

    if (!slug) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-slug" }));
    }

    if (sortOrder === null) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-allergen" }));
    }

    const [duplicateSlug] = await db
      .select({ id: Allergen.id })
      .from(Allergen)
      .where(eq(Allergen.slug, slug))
      .limit(1);

    if (duplicateSlug && duplicateSlug.id !== allergenId) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "duplicate-slug" }));
    }

    await db
      .update(Allergen)
      .set({
        name,
        slug,
        iconUrl: iconUrl || null,
        sortOrder,
        active,
        updatedAt: new Date(),
      })
      .where(eq(Allergen.id, allergenId));

    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  if (intent === "delete") {
    const links = await db
      .select({ id: ProductAllergen.id })
      .from(ProductAllergen)
      .where(eq(ProductAllergen.allergenId, allergenId));

    if (links.length > 0) {
      return context.redirect(withQuery(REDIRECT_PATH, { error: "in-use-products" }));
    }

    await db.delete(Allergen).where(eq(Allergen.id, allergenId));
    return context.redirect(withQuery(REDIRECT_PATH, { saved: "1" }));
  }

  return context.redirect(withQuery(REDIRECT_PATH, { error: "invalid-intent" }));
};