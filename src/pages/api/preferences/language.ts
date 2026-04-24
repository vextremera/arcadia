import type { APIRoute } from "astro";
import { DEFAULT_LANG, resolveSiteLang } from "@/lib/i18n";

function safeRedirectPath(value: string | null | undefined) {
    const raw = String(value ?? "").trim();
    if (!raw) return "/";
    if (!raw.startsWith("/")) return "/";
    if (raw.startsWith("//")) return "/";
    return raw;
}

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
    const lang = resolveSiteLang(url.searchParams.get("lang") ?? DEFAULT_LANG);
    const redirectTo = safeRedirectPath(url.searchParams.get("redirectTo"));

    cookies.set("arcadia_lang", lang, {
        path: "/",
        sameSite: "lax",
        httpOnly: false,
        secure: url.protocol === "https:",
        maxAge: 60 * 60 * 24 * 365,
    });

    return redirect(redirectTo, 302);
};