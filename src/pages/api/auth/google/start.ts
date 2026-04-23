import type { APIRoute } from "astro";
import { randomUUID } from "node:crypto";

const SESSION_COOKIE = "astro-session";

function safeNext(value: string) {
    const next = String(value ?? "").trim();
    if (!next) return "";
    if (!next.startsWith("/")) return "";
    if (next.startsWith("//")) return "";
    return next;
}

function buildLoginErrorRedirect(code: string, next = "") {
    const url = new URL("/login", "http://local");
    url.searchParams.set("error", code);
    if (next) url.searchParams.set("next", next);
    return `${url.pathname}${url.search}`;
}

export const GET: APIRoute = async ({ request, session, cookies, redirect }) => {
    if (!session) return new Response("Session not available", { status: 500 });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${new URL(request.url).origin}/api/auth/google/callback`;

    if (!clientId || !redirectUri) {
        return redirect(buildLoginErrorRedirect("google_missing"), 302);
    }

    const url = new URL(request.url);
    const next = safeNext(url.searchParams.get("next") ?? "");

    const secure = url.protocol === "https:";
    const existingSessionId = cookies.get(SESSION_COOKIE)?.value;
    const sessionId = existingSessionId || randomUUID();

    if (!existingSessionId) {
        await session.load(sessionId);
        cookies.set(SESSION_COOKIE, sessionId, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure,
        });
    }

    const state = randomUUID();
    await session.set("googleOAuthState", state);
    await session.set("googleOAuthNext", next || null);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("include_granted_scopes", "true");
    authUrl.searchParams.set("access_type", "online");

    return redirect(authUrl.toString(), 302);
};