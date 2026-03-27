import { e as createComponent, k as renderComponent, r as renderTemplate, h as createAstro, m as maybeRenderHead } from '../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$SiteLayout } from '../chunks/SiteLayout_Qpsqvz8u.mjs';
import { useState, useMemo } from 'preact/hooks';
import { jsxs, jsx } from 'preact/jsx-runtime';
export { renderers } from '../renderers.mjs';

const EYE_OPEN = jsxs("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: "20",
  height: "20",
  children: [jsx("path", {
    d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z"
  }), jsx("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })]
});
const EYE_CLOSED = jsxs("svg", {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  width: "20",
  height: "20",
  children: [jsx("path", {
    d: "M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a21.8 21.8 0 0 1 5.06-7.94"
  }), jsx("path", {
    d: "M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.9 21.9 0 0 1-3.17 4.62"
  }), jsx("path", {
    d: "M14.12 14.12a3 3 0 0 1-4.24-4.24"
  }), jsx("path", {
    d: "M1 1l22 22"
  })]
});
function errorMessage(code) {
  if (!code) return "";
  if (code === "email") return "Email inválido.";
  if (code === "exists") return "Ese email ya está registrado.";
  if (code === "password") return "La contraseña no cumple los requisitos.";
  return code;
}
function checkRules(pw) {
  const s = String(pw ?? "");
  return {
    len: s.length >= 8,
    upper: /[A-Z]/.test(s),
    lower: /[a-z]/.test(s),
    num: /[0-9]/.test(s),
    sym: /[^A-Za-z0-9]/.test(s)
  };
}
function strengthColor(okCount) {
  if (okCount <= 1) return "bg-red-600";
  if (okCount === 2) return "bg-orange-500";
  if (okCount <= 4) return "bg-yellow-400";
  return "bg-emerald-500";
}
function RegisterCard({
  next = "/cuenta",
  error = ""
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showPwd2, setShowPwd2] = useState(false);
  const [localError, setLocalError] = useState("");
  const rules = useMemo(() => checkRules(password), [password]);
  const okCount = (rules.len ? 1 : 0) + (rules.upper ? 1 : 0) + (rules.lower ? 1 : 0) + (rules.num ? 1 : 0) + (rules.sym ? 1 : 0);
  const progress = Math.round(okCount / 5 * 100);
  const allOk = okCount === 5;
  const matchOk = password.length > 0 && password === password2;
  const fullName = useMemo(() => {
    const a = firstName.trim();
    const b = lastName.trim();
    return `${a}${a && b ? " " : ""}${b}`.trim();
  }, [firstName, lastName]);
  const errText = useMemo(() => errorMessage(error) || localError, [error, localError]);
  const barClass = strengthColor(okCount);
  return jsx("div", {
    class: "w-full max-w-md sm:max-w-lg lg:max-w-150",
    children: jsxs("div", {
      class: "rounded-[22px] border border-zinc-300 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] sm:p-8",
      children: [jsx("div", {
        class: "text-center",
        children: jsx("h1", {
          class: "text-xl font-black tracking-wide",
          children: "CREAR CUENTA"
        })
      }), errText ? jsx("div", {
        class: "mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900",
        children: errText
      }) : null, jsxs("form", {
        class: "mt-5 grid gap-3 sm:mt-6 sm:gap-4",
        method: "post",
        action: "/api/auth/register",
        onSubmit: (e) => {
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
        },
        children: [jsx("input", {
          type: "hidden",
          name: "next",
          value: next
        }), jsx("input", {
          type: "hidden",
          name: "name",
          value: fullName
        }), jsxs("div", {
          class: "grid gap-3 sm:grid-cols-2",
          children: [jsxs("label", {
            class: "grid gap-2",
            children: [jsx("span", {
              class: "text-sm font-medium",
              children: "Nombre"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11",
              value: firstName,
              onInput: (e) => setFirstName(e.target.value),
              placeholder: "Pedro",
              autoComplete: "given-name"
            })]
          }), jsxs("label", {
            class: "grid gap-2",
            children: [jsx("span", {
              class: "text-sm font-medium",
              children: "Apellido"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11",
              value: lastName,
              onInput: (e) => setLastName(e.target.value),
              placeholder: "Picapiedra",
              autoComplete: "family-name"
            })]
          })]
        }), jsxs("label", {
          class: "grid gap-2",
          children: [jsx("span", {
            class: "text-sm font-medium",
            children: "Usuario"
          }), jsx("input", {
            class: "h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11",
            value: username,
            onInput: (e) => setUsername(e.target.value),
            placeholder: "lapiedra",
            autoComplete: "username"
          }), jsx("div", {
            class: "text-xs text-zinc-500",
            children: "(Se usará más adelante para login por usuario)"
          })]
        }), jsxs("label", {
          class: "grid gap-2",
          children: [jsx("span", {
            class: "text-sm font-medium",
            children: "Correo"
          }), jsx("input", {
            class: "h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11",
            name: "email",
            type: "email",
            required: true,
            value: email,
            onInput: (e) => setEmail(e.target.value),
            placeholder: "example@gmail.com",
            autoComplete: "email"
          })]
        }), jsxs("div", {
          class: "grid gap-3 sm:grid-cols-2",
          children: [jsxs("label", {
            class: "grid gap-2",
            children: [jsx("span", {
              class: "text-sm font-medium",
              children: "Contraseña"
            }), jsxs("div", {
              class: "relative",
              children: [jsx("input", {
                class: "h-10 w-full rounded-xl border border-zinc-300 px-4 pr-11 text-sm outline-none focus:border-zinc-500 sm:h-11",
                name: "password",
                type: showPwd ? "text" : "password",
                required: true,
                minLength: 8,
                value: password,
                onInput: (e) => setPassword(e.target.value),
                placeholder: "Tu contraseña",
                autoComplete: "new-password"
              }), jsx("button", {
                type: "button",
                class: "absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900",
                onClick: () => setShowPwd((v) => !v),
                "aria-label": showPwd ? "Ocultar contraseña" : "Mostrar contraseña",
                title: showPwd ? "Ocultar" : "Mostrar",
                children: showPwd ? EYE_CLOSED : EYE_OPEN
              })]
            })]
          }), jsxs("label", {
            class: "grid gap-2",
            children: [jsx("span", {
              class: "text-sm font-medium",
              children: "Repite la contraseña"
            }), jsxs("div", {
              class: "relative",
              children: [jsx("input", {
                class: "h-10 w-full rounded-xl border border-zinc-300 px-4 pr-11 text-sm outline-none focus:border-zinc-500 sm:h-11",
                type: showPwd2 ? "text" : "password",
                required: true,
                value: password2,
                onInput: (e) => setPassword2(e.target.value),
                placeholder: "Tu contraseña",
                autoComplete: "new-password"
              }), jsx("button", {
                type: "button",
                class: "absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-900",
                onClick: () => setShowPwd2((v) => !v),
                "aria-label": showPwd2 ? "Ocultar contraseña" : "Mostrar contraseña",
                title: showPwd2 ? "Ocultar" : "Mostrar",
                children: showPwd2 ? EYE_CLOSED : EYE_OPEN
              })]
            })]
          })]
        }), jsx("div", {
          class: "mt-1",
          children: jsx("div", {
            class: "h-2 w-full rounded-full bg-zinc-200",
            children: jsx("div", {
              class: `h-2 rounded-full transition-[width] duration-200 ${barClass}`,
              style: {
                width: `${progress}%`
              }
            })
          })
        }), jsxs("div", {
          class: "mt-2 space-y-1 text-sm",
          children: [jsx(Rule, {
            ok: rules.len,
            label: "Mínimo 8 caracteres"
          }), jsx(Rule, {
            ok: rules.upper,
            label: "Al menos una mayúscula (A-Z)"
          }), jsx(Rule, {
            ok: rules.lower,
            label: "Al menos una minúscula (a-z)"
          }), jsx(Rule, {
            ok: rules.num,
            label: "Al menos un número (0-9)"
          }), jsx(Rule, {
            ok: rules.sym,
            label: "Al menos un símbolo (@ # $ % & * _ - + = ! ? …)"
          }), jsx("div", {
            class: "pt-2 text-xs text-zinc-500",
            children: "La contraseña debe cumplir todos los requisitos."
          })]
        }), jsx("button", {
          class: `mt-2 h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-hover sm:h-11 ${!allOk || !matchOk ? "opacity-90" : ""}`,
          type: "submit",
          children: "Registrarme"
        }), jsxs("div", {
          class: "pt-2 text-center text-sm text-zinc-600",
          children: ["¿Ya tienes cuenta?", " ", jsx("a", {
            class: "font-semibold text-indigo-700 underline",
            href: `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`,
            children: "Inicia Sesión"
          })]
        })]
      })]
    })
  });
}
function Rule({
  ok,
  label
}) {
  return jsxs("div", {
    class: `flex items-start gap-2 ${ok ? "text-emerald-700" : "text-red-700"}`,
    children: [jsx("span", {
      class: "mt-0.5",
      children: ok ? "✓" : "•"
    }), jsx("span", {
      children: label
    })]
  });
}

const $$Astro = createAstro();
const $$Registro = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Registro;
  const next = Astro2.url.searchParams.get("next") ?? "";
  const error = Astro2.url.searchParams.get("error") ?? "";
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Registro \xB7 Arcadia", "variant": "landing" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"> <div class="grid place-items-center"> ${renderComponent($$result2, "RegisterCard", RegisterCard, { "client:load": true, "next": next, "error": error, "client:component-hydration": "load", "client:component-path": "@/islands/auth/RegisterCard", "client:component-export": "default" })} </div> </div> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/registro.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/registro.astro";
const $$url = "/registro";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Registro,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
