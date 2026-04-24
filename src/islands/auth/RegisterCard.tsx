import { useMemo, useState } from "preact/hooks";
import { getClientLang, type ClientSiteLang } from "@/islands/_shared/lang";

type Props = { next?: string; error?: string; };
const EYE_OPEN = (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></svg>);
const EYE_CLOSED = (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-7.94" /><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.9 21.9 0 0 1-3.17 4.62" /><path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" /><path d="M1 1l22 22" /></svg>);
const copy = {
    "es": {
        "title": "CREAR CUENTA",
        "name": "Nombre",
        "lastName": "Apellido",
        "username": "Usuario",
        "usernameHelp": "(Se usará más adelante para login por usuario)",
        "email": "Correo",
        "password": "Contraseña",
        "repeatPassword": "Repite la contraseña",
        "passwordPlaceholder": "Tu contraseña",
        "register": "Registrarme",
        "already": "¿Ya tienes cuenta?",
        "login": "Inicia sesión",
        "show": "Mostrar contraseña",
        "hide": "Ocultar contraseña",
        "invalidEmail": "Email inválido.",
        "exists": "Ese email ya está registrado.",
        "invalidPassword": "La contraseña no cumple los requisitos.",
        "rulesError": "La contraseña debe cumplir todos los requisitos.",
        "matchError": "Las contraseñas no coinciden.",
        "min": "Mínimo 8 caracteres",
        "upper": "Al menos una mayúscula (A-Z)",
        "lower": "Al menos una minúscula (a-z)",
        "num": "Al menos un número (0-9)",
        "sym": "Al menos un símbolo (@ # $ % & * _ - + = ! ? …)",
        "footerRule": "La contraseña debe cumplir todos los requisitos."
    },
    "ca": {
        "title": "CREAR COMPTE",
        "name": "Nom",
        "lastName": "Cognom",
        "username": "Usuari",
        "usernameHelp": "(Es farà servir més endavant per al login per usuari)",
        "email": "Correu",
        "password": "Contrasenya",
        "repeatPassword": "Repeteix la contrasenya",
        "passwordPlaceholder": "La teva contrasenya",
        "register": "Registrar-me",
        "already": "Ja tens compte?",
        "login": "Inicia sessió",
        "show": "Mostrar contrasenya",
        "hide": "Ocultar contrasenya",
        "invalidEmail": "Email invàlid.",
        "exists": "Aquest email ja està registrat.",
        "invalidPassword": "La contrasenya no compleix els requisits.",
        "rulesError": "La contrasenya ha de complir tots els requisits.",
        "matchError": "Les contrasenyes no coincideixen.",
        "min": "Mínim 8 caràcters",
        "upper": "Almenys una majúscula (A-Z)",
        "lower": "Almenys una minúscula (a-z)",
        "num": "Almenys un número (0-9)",
        "sym": "Almenys un símbol (@ # $ % & * _ - + = ! ? …)",
        "footerRule": "La contrasenya ha de complir tots els requisits."
    },
    "en": {
        "title": "CREATE ACCOUNT",
        "name": "First name",
        "lastName": "Last name",
        "username": "Username",
        "usernameHelp": "(This will be used later for username login)",
        "email": "Email",
        "password": "Password",
        "repeatPassword": "Repeat password",
        "passwordPlaceholder": "Your password",
        "register": "Create account",
        "already": "Already have an account?",
        "login": "Sign in",
        "show": "Show password",
        "hide": "Hide password",
        "invalidEmail": "Invalid email.",
        "exists": "That email is already registered.",
        "invalidPassword": "The password does not meet the requirements.",
        "rulesError": "The password must meet all requirements.",
        "matchError": "Passwords do not match.",
        "min": "Minimum 8 characters",
        "upper": "At least one uppercase letter (A-Z)",
        "lower": "At least one lowercase letter (a-z)",
        "num": "At least one number (0-9)",
        "sym": "At least one symbol (@ # $ % & * _ - + = ! ? …)",
        "footerRule": "The password must meet all requirements."
    },
    "fr": {
        "title": "CRÉER UN COMPTE",
        "name": "Prénom",
        "lastName": "Nom",
        "username": "Utilisateur",
        "usernameHelp": "(Sera utilisé plus tard pour la connexion par identifiant)",
        "email": "Email",
        "password": "Mot de passe",
        "repeatPassword": "Répéter le mot de passe",
        "passwordPlaceholder": "Votre mot de passe",
        "register": "Créer un compte",
        "already": "Vous avez déjà un compte ?",
        "login": "Se connecter",
        "show": "Afficher le mot de passe",
        "hide": "Masquer le mot de passe",
        "invalidEmail": "Email invalide.",
        "exists": "Cet email est déjà enregistré.",
        "invalidPassword": "Le mot de passe ne respecte pas les exigences.",
        "rulesError": "Le mot de passe doit respecter toutes les exigences.",
        "matchError": "Les mots de passe ne correspondent pas.",
        "min": "Minimum 8 caractères",
        "upper": "Au moins une majuscule (A-Z)",
        "lower": "Au moins une minuscule (a-z)",
        "num": "Au moins un chiffre (0-9)",
        "sym": "Au moins un symbole (@ # $ % & * _ - + = ! ? …)",
        "footerRule": "Le mot de passe doit respecter toutes les exigences."
    }
} satisfies Record<ClientSiteLang, Record<string, string>>;
function errorMessage(lang: ClientSiteLang, code: string) { if (!code) return ""; const t = copy[lang]; if (code === "email") return t.invalidEmail; if (code === "exists") return t.exists; if (code === "password") return t.invalidPassword; return code; }
function checkRules(pw: string) { const s = String(pw ?? ""); return { len: s.length >= 8, upper: /[A-Z]/.test(s), lower: /[a-z]/.test(s), num: /[0-9]/.test(s), sym: /[^A-Za-z0-9]/.test(s) }; }
function strengthColor(okCount: number) { if (okCount <= 1) return "bg-red-600"; if (okCount === 2) return "bg-orange-500"; if (okCount <= 4) return "bg-yellow-400"; return "bg-emerald-500"; }
export default function RegisterCard({ next = "/cuenta", error = "" }: Props) {
    const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState(""); const [username, setUsername] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [password2, setPassword2] = useState(""); const [showPwd, setShowPwd] = useState(false); const [showPwd2, setShowPwd2] = useState(false); const [localError, setLocalError] = useState<string>("");
    const lang = useMemo(() => getClientLang(), []); const t = copy[lang]; const rules = useMemo(() => checkRules(password), [password]); const okCount = (rules.len ? 1 : 0) + (rules.upper ? 1 : 0) + (rules.lower ? 1 : 0) + (rules.num ? 1 : 0) + (rules.sym ? 1 : 0); const progress = Math.round((okCount / 5) * 100); const allOk = okCount === 5; const matchOk = password.length > 0 && password === password2; const fullName = useMemo(() => { const a = firstName.trim(); const b = lastName.trim(); return `${a}${a && b ? " " : ""}${b}`.trim(); }, [firstName, lastName]); const errText = useMemo(() => errorMessage(lang, error) || localError, [lang, error, localError]); const barClass = strengthColor(okCount);
    return <div class="w-full max-w-md sm:max-w-lg lg:max-w-150"><div class="rounded-[22px] border border-zinc-300 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] sm:p-8"><div class="text-center"><h1 class="text-xl font-black tracking-wide">{t.title}</h1></div>{errText ? <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{errText}</div> : null}<form class="mt-5 grid gap-3 sm:mt-6 sm:gap-4" method="post" action="/api/auth/register" onSubmit={(e) => { setLocalError(""); if (!allOk) { e.preventDefault(); setLocalError(t.rulesError); return; } if (!matchOk) { e.preventDefault(); setLocalError(t.matchError); } }}><input type="hidden" name="next" value={next} /><input type="hidden" name="name" value={fullName} /><div class="grid gap-3 sm:grid-cols-2"><label class="grid gap-2"><span class="text-sm font-medium">{t.name}</span><input class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11" value={firstName} onInput={(e) => setFirstName((e.target as HTMLInputElement).value)} placeholder="Pedro" autoComplete="given-name" /></label><label class="grid gap-2"><span class="text-sm font-medium">{t.lastName}</span><input class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11" value={lastName} onInput={(e) => setLastName((e.target as HTMLInputElement).value)} placeholder="Picapiedra" autoComplete="family-name" /></label></div><label class="grid gap-2"><span class="text-sm font-medium">{t.username}</span><input class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11" value={username} onInput={(e) => setUsername((e.target as HTMLInputElement).value)} placeholder="lapiedra" autoComplete="username" /><div class="text-xs text-zinc-500">{t.usernameHelp}</div></label><label class="grid gap-2"><span class="text-sm font-medium">{t.email}</span><input class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11" name="email" type="email" required value={email} onInput={(e) => setEmail((e.target as HTMLInputElement).value)} placeholder="example@gmail.com" autoComplete="email" /></label><div class="grid gap-3 sm:grid-cols-2"><label class="grid gap-2"><span class="text-sm font-medium">{t.password}</span><div class="relative"><input class="h-10 w-full rounded-xl border border-zinc-300 px-4 pr-11 text-sm outline-none focus:border-zinc-500 sm:h-11" name="password" type={showPwd ? "text" : "password"} required minLength={8} value={password} onInput={(e) => setPassword((e.target as HTMLInputElement).value)} placeholder={t.passwordPlaceholder} autoComplete="new-password" /><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? t.hide : t.show} title={showPwd ? t.hide : t.show}>{showPwd ? EYE_CLOSED : EYE_OPEN}</button></div></label><label class="grid gap-2"><span class="text-sm font-medium">{t.repeatPassword}</span><div class="relative"><input class="h-10 w-full rounded-xl border border-zinc-300 px-4 pr-11 text-sm outline-none focus:border-zinc-500 sm:h-11" type={showPwd2 ? "text" : "password"} required value={password2} onInput={(e) => setPassword2((e.target as HTMLInputElement).value)} placeholder={t.passwordPlaceholder} autoComplete="new-password" /><button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900" onClick={() => setShowPwd2(v => !v)} aria-label={showPwd2 ? t.hide : t.show} title={showPwd2 ? t.hide : t.show}>{showPwd2 ? EYE_CLOSED : EYE_OPEN}</button></div></label></div><div class="mt-1"><div class="h-2 w-full rounded-full bg-zinc-200"><div class={`h-2 rounded-full transition-[width] duration-200 ${barClass}`} style={{ width: `${progress}%` }} /></div></div><div class="mt-2 space-y-1 text-sm"><Rule ok={rules.len} label={t.min} /><Rule ok={rules.upper} label={t.upper} /><Rule ok={rules.lower} label={t.lower} /><Rule ok={rules.num} label={t.num} /><Rule ok={rules.sym} label={t.sym} /><div class="pt-2 text-xs text-zinc-500">{t.footerRule}</div></div><button class={`mt-2 h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-hover sm:h-11 ${!allOk || !matchOk ? "opacity-90" : ""}`} type="submit">{t.register}</button><div class="pt-2 text-center text-sm text-zinc-600">{t.already}{" "}<a class="font-semibold text-indigo-700 underline" href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>{t.login}</a></div></form></div></div>;
}
function Rule({ ok, label }: { ok: boolean; label: string }) { return <div class={`flex items-start gap-2 ${ok ? "text-emerald-700" : "text-red-700"}`}><span class="mt-0.5">{ok ? "✓" : "•"}</span><span>{label}</span></div>; }
