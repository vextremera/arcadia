import { useMemo, useState } from "preact/hooks";

type Props = {
    next?: string;
    error?: string;
};

const EYE_OPEN = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const EYE_CLOSED = (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        width="20"
        height="20"
    >
        <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-7.94" />
        <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.9 21.9 0 0 1-3.17 4.62" />
        <path d="M14.12 14.12a3 3 0 0 1-4.24-4.24" />
        <path d="M1 1l22 22" />
    </svg>
);

function errorMessage(code: string) {
    if (!code) return "";
    if (code === "email") return "Email inválido.";
    if (code === "exists") return "Ese email ya está registrado.";
    if (code === "password") return "La contraseña no cumple los requisitos.";
    return code;
}

function checkRules(pw: string) {
    const s = String(pw ?? "");
    return {
        len: s.length >= 8,
        upper: /[A-Z]/.test(s),
        lower: /[a-z]/.test(s),
        num: /[0-9]/.test(s),
        sym: /[^A-Za-z0-9]/.test(s),
    };
}

function strengthColor(okCount: number) {
    // 0-1: rojo, 2: naranja, 3-4: amarillo, 5: verde
    if (okCount <= 1) return "bg-red-600";
    if (okCount === 2) return "bg-orange-500";
    if (okCount <= 4) return "bg-yellow-400";
    return "bg-emerald-500";
}

export default function RegisterCard({ next = "/cuenta", error = "" }: Props) {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");

    const [showPwd, setShowPwd] = useState(false);
    const [showPwd2, setShowPwd2] = useState(false);

    const [localError, setLocalError] = useState<string>("");

    const rules = useMemo(() => checkRules(password), [password]);
    const okCount =
        (rules.len ? 1 : 0) +
        (rules.upper ? 1 : 0) +
        (rules.lower ? 1 : 0) +
        (rules.num ? 1 : 0) +
        (rules.sym ? 1 : 0);

    const progress = Math.round((okCount / 5) * 100);
    const allOk = okCount === 5;
    const matchOk = password.length > 0 && password === password2;

    const fullName = useMemo(() => {
        const a = firstName.trim();
        const b = lastName.trim();
        return `${a}${a && b ? " " : ""}${b}`.trim();
    }, [firstName, lastName]);

    const errText = useMemo(() => errorMessage(error) || localError, [error, localError]);

    const barClass = strengthColor(okCount);

    return (
        <div class="w-full max-w-md sm:max-w-lg lg:max-w-150">
            <div class="rounded-[22px] border border-zinc-300 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] sm:p-8">
                <div class="text-center">
                    <h1 class="text-xl font-black tracking-wide">CREAR CUENTA</h1>
                </div>

                {errText ? (
                    <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{errText}</div>
                ) : null}

                <form
                    class="mt-5 grid gap-3 sm:mt-6 sm:gap-4"
                    method="post"
                    action="/api/auth/register"
                    onSubmit={(e) => {
                        setLocalError("");
                        if (allOk !== true) {
                            e.preventDefault();
                            setLocalError("La contraseña debe cumplir todos los requisitos.");
                            return;
                        }
                        if (!matchOk) {
                            e.preventDefault();
                            setLocalError("Las contraseñas no coinciden.");
                            return;
                        }
                    }}
                >
                    <input type="hidden" name="next" value={next} />
                    <input type="hidden" name="name" value={fullName} />

                    <div class="grid gap-3 sm:grid-cols-2">
                        <label class="grid gap-2">
                            <span class="text-sm font-medium">Nombre</span>
                            <input
                                class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11"
                                value={firstName}
                                onInput={(e) => setFirstName((e.target as HTMLInputElement).value)}
                                placeholder="Pedro"
                                autoComplete="given-name"
                            />
                        </label>

                        <label class="grid gap-2">
                            <span class="text-sm font-medium">Apellido</span>
                            <input
                                class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11"
                                value={lastName}
                                onInput={(e) => setLastName((e.target as HTMLInputElement).value)}
                                placeholder="Picapiedra"
                                autoComplete="family-name"
                            />
                        </label>
                    </div>

                    <label class="grid gap-2">
                        <span class="text-sm font-medium">Usuario</span>
                        <input
                            class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11"
                            value={username}
                            onInput={(e) => setUsername((e.target as HTMLInputElement).value)}
                            placeholder="lapiedra"
                            autoComplete="username"
                        />
                        <div class="text-xs text-zinc-500">(Se usará más adelante para login por usuario)</div>
                    </label>

                    <label class="grid gap-2">
                        <span class="text-sm font-medium">Correo</span>
                        <input
                            class="h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11"
                            name="email"
                            type="email"
                            required
                            value={email}
                            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
                            placeholder="example@gmail.com"
                            autoComplete="email"
                        />
                    </label>

                    <div class="grid gap-3 sm:grid-cols-2">
                        <label class="grid gap-2">
                            <span class="text-sm font-medium">Contraseña</span>
                            <div class="relative">
                                <input
                                    class="h-10 w-full rounded-xl border border-zinc-300 px-4 pr-11 text-sm outline-none focus:border-zinc-500 sm:h-11"
                                    name="password"
                                    type={showPwd ? "text" : "password"}
                                    required
                                    minLength={8}
                                    value={password}
                                    onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
                                    placeholder="Tu contraseña"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
                                    onClick={() => setShowPwd((v) => !v)}
                                    aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    title={showPwd ? "Ocultar" : "Mostrar"}
                                >
                                    {showPwd ? EYE_CLOSED : EYE_OPEN}
                                </button>
                            </div>
                        </label>

                        <label class="grid gap-2">
                            <span class="text-sm font-medium">Repite la contraseña</span>
                            <div class="relative">
                                <input
                                    class="h-10 w-full rounded-xl border border-zinc-300 px-4 pr-11 text-sm outline-none focus:border-zinc-500 sm:h-11"
                                    type={showPwd2 ? "text" : "password"}
                                    required
                                    value={password2}
                                    onInput={(e) => setPassword2((e.target as HTMLInputElement).value)}
                                    placeholder="Tu contraseña"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900"
                                    onClick={() => setShowPwd2((v) => !v)}
                                    aria-label={showPwd2 ? "Ocultar contraseña" : "Mostrar contraseña"}
                                    title={showPwd2 ? "Ocultar" : "Mostrar"}
                                >
                                    {showPwd2 ? EYE_CLOSED : EYE_OPEN}
                                </button>
                            </div>
                        </label>
                    </div>

                    <div class="mt-1">
                        <div class="h-2 w-full rounded-full bg-zinc-200">
                            <div
                                class={`h-2 rounded-full transition-[width] duration-200 ${barClass}`}
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div class="mt-2 space-y-1 text-sm">
                        <Rule ok={rules.len} label="Mínimo 8 caracteres" />
                        <Rule ok={rules.upper} label="Al menos una mayúscula (A-Z)" />
                        <Rule ok={rules.lower} label="Al menos una minúscula (a-z)" />
                        <Rule ok={rules.num} label="Al menos un número (0-9)" />
                        <Rule ok={rules.sym} label="Al menos un símbolo (@ # $ % & * _ - + = ! ? …)" />
                        <div class="pt-2 text-xs text-zinc-500">La contraseña debe cumplir todos los requisitos.</div>
                    </div>

                    <button
                        class={`mt-2 h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-hover sm:h-11 ${!allOk || !matchOk ? "opacity-90" : ""
                            }`}
                        type="submit"
                    >
                        Registrarme
                    </button>

                    <div class="pt-2 text-center text-sm text-zinc-600">
                        ¿Ya tienes cuenta?{" "}
                        <a class="font-semibold text-indigo-700 underline" href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>
                            Inicia Sesión
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}

function Rule({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div class={`flex items-start gap-2 ${ok ? "text-emerald-700" : "text-red-700"}`}>
            <span class="mt-0.5">{ok ? "✓" : "•"}</span>
            <span>{label}</span>
        </div>
    );
}