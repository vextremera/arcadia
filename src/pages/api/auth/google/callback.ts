import type { APIRoute } from "astro";
import { db, User, eq } from "astro:db";
import { hashPassword } from "@/server/auth/password";
import { randomUUID } from "node:crypto";

const SESSION_COOKIE = "astro-session";

function safeNext(value: unknown) {
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

async function exchangeCodeForToken(input: {
    code: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
}) {
    const body = new URLSearchParams({
        code: input.code,
        client_id: input.clientId,
        client_secret: input.clientSecret,
        redirect_uri: input.redirectUri,
        grant_type: "authorization_code",
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body,
    });

    const data = (await res.json().catch(() => null)) as
        | {
            access_token?: string;
            id_token?: string;
            error?: string;
        }
        | null;

    if (!res.ok || !data?.access_token) return null;
    return data;
}

async function fetchGoogleProfile(accessToken: string) {
    const res = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    const data = (await res.json().catch(() => null)) as
        | {
            sub?: string;
            email?: string;
            email_verified?: boolean;
            name?: string;
        }
        | null;

    if (!res.ok || !data?.sub || !data?.email) return null;
    return data;
}

export const GET: APIRoute = async ({ request, session, cookies, redirect }) => {
    if (!session) return new Response("Session not available", { status: 500 });

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
        process.env.GOOGLE_REDIRECT_URI ||
        `${new URL(request.url).origin}/api/auth/google/callback`;

    if (!clientId || !clientSecret || !redirectUri) {
        return redirect(buildLoginErrorRedirect("google_missing"), 302);
    }

    const url = new URL(request.url);
    const error = String(url.searchParams.get("error") ?? "").trim();
    const code = String(url.searchParams.get("code") ?? "").trim();
    const state = String(url.searchParams.get("state") ?? "").trim();

    const storedState = String((await session.get("googleOAuthState")) ?? "");
    const storedNext = safeNext(await session.get("googleOAuthNext"));

    if (error) {
        await session.delete("googleOAuthState");
        await session.delete("googleOAuthNext");
        return redirect(buildLoginErrorRedirect("google_denied", storedNext), 302);
    }

    if (!code || !state || !storedState || state !== storedState) {
        await session.delete("googleOAuthState");
        await session.delete("googleOAuthNext");
        return redirect(buildLoginErrorRedirect("google_state", storedNext), 302);
    }

    const token = await exchangeCodeForToken({
        code,
        clientId,
        clientSecret,
        redirectUri,
    });

    if (!token?.access_token) {
        await session.delete("googleOAuthState");
        await session.delete("googleOAuthNext");
        return redirect(buildLoginErrorRedirect("google_token", storedNext), 302);
    }

    const profile = await fetchGoogleProfile(token.access_token);

    if (!profile?.sub || !profile?.email || profile.email_verified !== true) {
        await session.delete("googleOAuthState");
        await session.delete("googleOAuthNext");
        return redirect(buildLoginErrorRedirect("google_email", storedNext), 302);
    }

    const googleSub = String(profile.sub).trim();
    const email = String(profile.email).trim().toLowerCase();
    const name = String(profile.name ?? "").trim() || null;

    const [byGoogleSub] = await db
        .select({
            id: User.id,
            email: User.email,
            name: User.name,
            role: User.role,
            active: User.active,
            googleSub: User.googleSub,
        })
        .from(User)
        .where(eq(User.googleSub, googleSub))
        .limit(1);

    let user = byGoogleSub ?? null;

    if (!user) {
        const [byEmail] = await db
            .select({
                id: User.id,
                email: User.email,
                name: User.name,
                role: User.role,
                active: User.active,
                googleSub: User.googleSub,
            })
            .from(User)
            .where(eq(User.email, email))
            .limit(1);

        if (byEmail) {
            if (byEmail.googleSub && byEmail.googleSub !== googleSub) {
                await session.delete("googleOAuthState");
                await session.delete("googleOAuthNext");
                return redirect(buildLoginErrorRedirect("google_account", storedNext), 302);
            }

            await db
                .update(User)
                .set({
                    googleSub,
                    name: byEmail.name ?? name,
                    updatedAt: new Date(),
                })
                .where(eq(User.id, byEmail.id));

            user = {
                ...byEmail,
                googleSub,
                name: byEmail.name ?? name,
            };
        } else {
            await db.insert(User).values({
                email,
                name,
                googleSub,
                passwordHash: hashPassword(randomUUID()),
                role: "CUSTOMER",
                active: true,
            });

            const [created] = await db
                .select({
                    id: User.id,
                    email: User.email,
                    name: User.name,
                    role: User.role,
                    active: User.active,
                    googleSub: User.googleSub,
                })
                .from(User)
                .where(eq(User.email, email))
                .limit(1);

            user = created ?? null;
        }
    }

    if (!user || !user.active) {
        await session.delete("googleOAuthState");
        await session.delete("googleOAuthNext");
        return redirect(buildLoginErrorRedirect("google_account", storedNext), 302);
    }

    const secure = new URL(request.url).protocol === "https:";
    const sessionId = cookies.get(SESSION_COOKIE)?.value;
    if (sessionId) {
        cookies.set(SESSION_COOKIE, sessionId, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            secure,
        });
    }

    await session.set("user", {
        id: user.id,
        email: user.email,
        name: user.name ?? null,
        role: user.role as "ADMIN" | "STAFF" | "CUSTOMER",
    });

    await session.delete("googleOAuthState");
    await session.delete("googleOAuthNext");

    const next = storedNext;
    if (next) return redirect(next, 302);

    if (user.role === "ADMIN" || user.role === "STAFF") {
        return redirect("/admin", 302);
    }

    return redirect("/cuenta", 302);
};