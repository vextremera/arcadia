import { useEffect, useMemo, useState } from "preact/hooks";
import { getClientLang, type ClientSiteLang } from "@/islands/_shared/lang";

type Props = {
    next?: string;
    error?: string;
    siteKey?: string;
};

const EYE_OPEN = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EYE_CLOSED = (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-7.94" />
        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.9 21.9 0 0 1-3.17 4.62" />
        <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
        <path d="M1 1l22 22" />
    </svg>
);

const copy = {
    "es": {
        "title": "INICIA SESIÓN",
        "email": "Usuario o correo",
        "password": "Contraseña",
        "passwordPlaceholder": "Tu contraseña",
        "remember": "Recuérdame",
        "robot": "No soy un robot",
        "forgot": "¿Has olvidado tu contraseña?",
        "enter": "Entrar",
        "or": "O bien",
        "google": "Iniciar sesión con Google",
        "noAccount": "¿No tienes cuenta?",
        "register": "Regístrate",
        "show": "Mostrar contraseña",
        "hide": "Ocultar contraseña",
        "captchaAlert": "Marca 'No soy un robot' para continuar.",
        "invalid": "Usuario o contraseña incorrectos.",
        "captcha": "Verifica el captcha para continuar.",
        "google_missing": "Google OAuth no está configurado todavía.",
        "google_denied": "Has cancelado el acceso con Google.",
        "google_state": "La sesión de Google no es válida. Inténtalo de nuevo.",
        "google_token": "No se pudo validar el acceso con Google.",
        "google_email": "Google no devolvió un correo verificado.",
        "google_account": "No se pudo iniciar sesión con esa cuenta de Google."
    },
    "ca": {
        "title": "INICIA SESSIÓ",
        "email": "Usuari o correu",
        "password": "Contrasenya",
        "passwordPlaceholder": "La teva contrasenya",
        "remember": "Recorda'm",
        "robot": "No sóc un robot",
        "forgot": "Has oblidat la contrasenya?",
        "enter": "Entrar",
        "or": "O bé",
        "google": "Inicia sessió amb Google",
        "noAccount": "No tens compte?",
        "register": "Registra't",
        "show": "Mostrar contrasenya",
        "hide": "Ocultar contrasenya",
        "captchaAlert": "Marca 'No sóc un robot' per continuar.",
        "invalid": "Usuari o contrasenya incorrectes.",
        "captcha": "Verifica el captcha per continuar.",
        "google_missing": "Google OAuth encara no està configurat.",
        "google_denied": "Has cancel·lat l'accés amb Google.",
        "google_state": "La sessió de Google no és vàlida. Torna-ho a provar.",
        "google_token": "No s'ha pogut validar l'accés amb Google.",
        "google_email": "Google no ha retornat un correu verificat.",
        "google_account": "No s'ha pogut iniciar sessió amb aquest compte de Google."
    },
    "en": {
        "title": "SIGN IN",
        "email": "Username or email",
        "password": "Password",
        "passwordPlaceholder": "Your password",
        "remember": "Remember me",
        "robot": "I'm not a robot",
        "forgot": "Forgot your password?",
        "enter": "Sign in",
        "or": "Or",
        "google": "Sign in with Google",
        "noAccount": "Don't have an account?",
        "register": "Register",
        "show": "Show password",
        "hide": "Hide password",
        "captchaAlert": "Tick 'I'm not a robot' to continue.",
        "invalid": "Incorrect username or password.",
        "captcha": "Verify the captcha to continue.",
        "google_missing": "Google OAuth is not configured yet.",
        "google_denied": "You cancelled Google sign-in.",
        "google_state": "The Google session is not valid. Please try again.",
        "google_token": "Google sign-in could not be validated.",
        "google_email": "Google did not return a verified email.",
        "google_account": "Could not sign in with that Google account."
    },
    "fr": {
        "title": "CONNEXION",
        "email": "Utilisateur ou email",
        "password": "Mot de passe",
        "passwordPlaceholder": "Votre mot de passe",
        "remember": "Se souvenir de moi",
        "robot": "Je ne suis pas un robot",
        "forgot": "Mot de passe oublié ?",
        "enter": "Se connecter",
        "or": "Ou",
        "google": "Se connecter avec Google",
        "noAccount": "Vous n'avez pas de compte ?",
        "register": "S'inscrire",
        "show": "Afficher le mot de passe",
        "hide": "Masquer le mot de passe",
        "captchaAlert": "Cochez 'Je ne suis pas un robot' pour continuer.",
        "invalid": "Utilisateur ou mot de passe incorrect.",
        "captcha": "Vérifiez le captcha pour continuer.",
        "google_missing": "Google OAuth n'est pas encore configuré.",
        "google_denied": "Vous avez annulé l'accès avec Google.",
        "google_state": "La session Google n'est pas valide. Veuillez réessayer.",
        "google_token": "La connexion Google n'a pas pu être validée.",
        "google_email": "Google n'a pas renvoyé d'email vérifié.",
        "google_account": "Impossible de se connecter avec ce compte Google."
    }
} satisfies Record<ClientSiteLang, Record<string, string>>;

function errorMessage(lang: ClientSiteLang, code: string) {
    if (!code) return "";
    const t = copy[lang];
    return t[code as keyof typeof t] || code;
}

export default function LoginCard({ next = "", error = "", siteKey = "" }: Props) {
    const [showPwd, setShowPwd] = useState(false);
    const [fakeCaptchaOk, setFakeCaptchaOk] = useState(false);

    const lang = useMemo(() => getClientLang(), []);
    const t = copy[lang];
    const hasRecaptcha = !!siteKey;
    const errText = useMemo(() => errorMessage(lang, error), [lang, error]);

    useEffect(() => {
        if (!hasRecaptcha) return;
        const id = "recaptcha-v2";
        if (document.getElementById(id)) return;

        const s = document.createElement("script");
        s.id = id;
        s.src = "https://www.google.com/recaptcha/api.js";
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
    }, [hasRecaptcha]);

    return (
        <div class="w-full max-w-md lg:max-w-112.5">
            <div class="rounded-[22px] border border-zinc-300 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] sm:p-7">
                <div class="text-center">
                    <h1 class="text-lg font-black tracking-wide sm:text-xl">{t.title}</h1>
                </div>

                {errText ? (
                    <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{errText}</div>
                ) : null}

                <form
                    class="mt-5 grid gap-3 sm:mt-6 sm:gap-4"
                    method="post"
                    action="/api/auth/login"
                    onSubmit={(e) => {
                        if (!hasRecaptcha && !fakeCaptchaOk) {
                            e.preventDefault();
                            alert(t.captchaAlert);
                        }
                    }}
                >
                    <input type="hidden" name="next" value={next} />

                    <label class="grid gap-2">
                        <span class="text-sm font-medium">{t.email}</span>
                        <input class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11" name="email" type="text" required autoComplete="username" placeholder="example@gmail.com" />
                    </label>

                    <label class="grid gap-2">
                        <span class="text-sm font-medium">{t.password}</span>
                        <div class="relative">
                            <input class="h-10 w-full rounded-xl border border-zinc-300 px-4 pr-11 text-sm outline-none focus:border-zinc-500 sm:h-11" name="password" type={showPwd ? "text" : "password"} required autoComplete="current-password" placeholder={t.passwordPlaceholder} />
                            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900" onClick={() => setShowPwd((v) => !v)} aria-label={showPwd ? t.hide : t.show} title={showPwd ? t.hide : t.show}>
                                {showPwd ? EYE_CLOSED : EYE_OPEN}
                            </button>
                        </div>
                    </label>

                    <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-zinc-600">
                        <input name="remember" type="checkbox" class="h-5 w-5 shrink-0 rounded border-zinc-300" />
                        {t.remember}
                    </label>

                    <div class="rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4">
                        {hasRecaptcha ? (
                            <div class="g-recaptcha" data-sitekey={siteKey} />
                        ) : (
                            <label class="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-zinc-700">
                                <input type="checkbox" class="h-5 w-5 shrink-0 rounded border-zinc-300" checked={fakeCaptchaOk} onChange={(e) => setFakeCaptchaOk((e.target as HTMLInputElement).checked)} />
                                {t.robot}
                            </label>
                        )}
                    </div>

                    <a class="inline-flex min-h-11 w-fit items-center text-sm text-indigo-700 underline" href="#" onClick={(e) => e.preventDefault()}>
                        {t.forgot}
                    </a>

                    <button class="mt-1 h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-hover sm:h-11" type="submit">{t.enter}</button>

                    <div class="my-2 flex items-center gap-3 text-sm text-zinc-500"><div class="h-px flex-1 bg-zinc-200" /><span>{t.or}</span><div class="h-px flex-1 bg-zinc-200" /></div>

                    <button type="button" class="h-10 w-full rounded-xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-800 hover:bg-zinc-50 sm:h-11" onClick={() => { const url = new URL("/api/auth/google/start", window.location.origin); if (next) url.searchParams.set("next", next); window.location.href = url.toString(); }}>
                        <span class="inline-flex items-center justify-center gap-2 sm:gap-3">
                            <span class="grid h-6 w-6 place-items-center rounded-full bg-white">
                                <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.803 32.657 29.304 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.869 6.053 29.691 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z" /><path fill="#FF3D00" d="M6.306 14.691 12.87 19.5C14.65 15.098 18.956 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.869 6.053 29.691 4 24 4 16.318 4 9.656 8.337 6.306 14.691Z" /><path fill="#4CAF50" d="M24 44c5.186 0 10.129-1.986 13.78-5.205l-6.36-5.385C29.355 35.091 26.816 36 24 36c-5.282 0-9.772-3.328-11.526-8.009l-6.52 5.025C5.273 38.556 14.015 44 24 44Z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.05 12.05 0 0 1-3.883 5.41l.003-.002 6.36 5.385C37.362 38.48 44 33 44 24c0-1.341-.138-2.65-.389-3.917Z" /></svg>
                            </span>
                            {t.google}
                        </span>
                    </button>

                    <div class="pt-2 text-center text-sm text-zinc-600">{t.noAccount}{" "}<a class="inline-flex min-h-11 items-center font-semibold text-indigo-700 underline" href={`/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`}>{t.register}</a></div>
                </form>
            </div>
        </div>
    );
}
