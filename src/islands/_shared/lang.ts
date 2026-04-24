export const SUPPORTED_SITE_LANGS = ["es", "ca", "en", "fr"] as const;
export type ClientSiteLang = (typeof SUPPORTED_SITE_LANGS)[number];

export function getClientLang(): ClientSiteLang {
    if (typeof document === "undefined") return "es";
    const raw = document.documentElement.lang?.trim().toLowerCase() || "es";
    if (raw === "ca" || raw === "en" || raw === "fr") return raw;
    return "es";
}
