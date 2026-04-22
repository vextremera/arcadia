import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { $ as $$SiteLayout } from './SiteLayout_CblPac9t.mjs';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { jsxs, jsx } from 'preact/jsx-runtime';

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
  if (code === "invalid") return "Usuario o contraseña incorrectos.";
  if (code === "captcha") return "Verifica el captcha para continuar.";
  return code;
}
function LoginCard({
  next = "",
  error = "",
  siteKey = ""
}) {
  const [showPwd, setShowPwd] = useState(false);
  const [fakeCaptchaOk, setFakeCaptchaOk] = useState(false);
  const hasRecaptcha = !!siteKey;
  const errText = useMemo(() => errorMessage(error), [error]);
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
  return jsx("div", {
    class: "w-full max-w-md lg:max-w-112.5",
    children: jsxs("div", {
      class: "rounded-[22px] border border-zinc-300 bg-white p-5 shadow-[0_14px_40px_rgba(0,0,0,0.08)] sm:p-7",
      children: [jsx("div", {
        class: "text-center",
        children: jsx("h1", {
          class: "text-lg font-black tracking-wide sm:text-xl",
          children: "INICIA SESION"
        })
      }), errText ? jsx("div", {
        class: "mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900",
        children: errText
      }) : null, jsxs("form", {
        class: "mt-5 grid gap-3 sm:mt-6 sm:gap-4",
        method: "post",
        action: "/api/auth/login",
        onSubmit: (e) => {
          if (!hasRecaptcha && !fakeCaptchaOk) {
            e.preventDefault();
            alert("Marca 'I'm not a robot' para continuar.");
          }
        },
        children: [jsx("input", {
          type: "hidden",
          name: "next",
          value: next
        }), jsxs("label", {
          class: "grid gap-2",
          children: [jsx("span", {
            class: "text-sm font-medium",
            children: "Usuario o correo"
          }), jsx("input", {
            class: "h-10 rounded-xl border border-zinc-300 px-4 text-sm outline-none focus:border-zinc-500 sm:h-11",
            name: "email",
            type: "text",
            required: true,
            autoComplete: "username",
            placeholder: "example@gmail.com"
          })]
        }), jsxs("label", {
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
              autoComplete: "current-password",
              placeholder: "Tu contraseña"
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
          class: "flex items-start gap-3 text-sm text-zinc-600 sm:items-center",
          children: [jsx("input", {
            name: "remember",
            type: "checkbox",
            class: "mt-0.5 h-4 w-4 rounded border-zinc-300 sm:mt-0"
          }), "Remember me"]
        }), jsx("div", {
          class: "rounded-xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4",
          children: hasRecaptcha ? jsx("div", {
            class: "g-recaptcha",
            "data-sitekey": siteKey
          }) : jsxs("label", {
            class: "flex items-start gap-3 text-sm text-zinc-700 sm:items-center",
            children: [jsx("input", {
              type: "checkbox",
              class: "mt-0.5 h-5 w-5 rounded border-zinc-300 sm:mt-0",
              checked: fakeCaptchaOk,
              onChange: (e) => setFakeCaptchaOk(e.target.checked)
            }), "I'm not a robot"]
          })
        }), jsx("a", {
          class: "w-fit text-sm text-indigo-700 underline",
          href: "#",
          onClick: (e) => e.preventDefault(),
          children: "Forgot your password?"
        }), jsx("button", {
          class: "mt-1 h-10 w-full rounded-xl bg-accent text-sm font-semibold text-white hover:bg-accent-hover sm:h-11",
          type: "submit",
          children: "Entrar"
        }), jsxs("div", {
          class: "my-2 flex items-center gap-3 text-sm text-zinc-500",
          children: [jsx("div", {
            class: "h-px flex-1 bg-zinc-200"
          }), jsx("span", {
            children: "O bien"
          }), jsx("div", {
            class: "h-px flex-1 bg-zinc-200"
          })]
        }), jsx("button", {
          type: "button",
          class: "h-10 w-full rounded-xl border border-zinc-300 bg-white text-sm font-semibold text-zinc-800 hover:bg-zinc-50 sm:h-11",
          onClick: () => alert("Google OAuth se integrará más adelante."),
          children: jsxs("span", {
            class: "inline-flex items-center justify-center gap-2 sm:gap-3",
            children: [jsx("span", {
              class: "grid h-6 w-6 place-items-center rounded-full bg-white",
              children: jsxs("svg", {
                width: "20",
                height: "20",
                viewBox: "0 0 48 48",
                "aria-hidden": "true",
                children: [jsx("path", {
                  fill: "#FFC107",
                  d: "M43.611 20.083H42V20H24v8h11.303C33.803 32.657 29.304 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.869 6.053 29.691 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917Z"
                }), jsx("path", {
                  fill: "#FF3D00",
                  d: "M6.306 14.691 12.87 19.5C14.65 15.098 18.956 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.869 6.053 29.691 4 24 4 16.318 4 9.656 8.337 6.306 14.691Z"
                }), jsx("path", {
                  fill: "#4CAF50",
                  d: "M24 44c5.186 0 10.129-1.986 13.78-5.205l-6.36-5.385C29.355 35.091 26.816 36 24 36c-5.284 0-9.77-3.319-11.287-7.946l-6.49 5.002C9.537 39.556 16.227 44 24 44Z"
                }), jsx("path", {
                  fill: "#1976D2",
                  d: "M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.223 5.41l.003-.002 6.36 5.385C36.992 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917Z"
                })]
              })
            }), "Inicia sesión con Google"]
          })
        }), jsxs("div", {
          class: "pt-2 text-center text-sm text-zinc-600",
          children: ["¿No tienes cuenta?", " ", jsx("a", {
            class: "font-semibold text-indigo-700 underline",
            href: `/registro${next ? `?next=${encodeURIComponent(next)}` : ""}`,
            children: "Crear cuenta"
          })]
        })]
      })]
    })
  });
}

const $$Login = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Login;
  const next = Astro2.url.searchParams.get("next") ?? "";
  const error = Astro2.url.searchParams.get("error") ?? "";
  const siteKey = "6Lc0LsUsAAAAAOnvkGWRiIPWBCE2FMtXAZDIES4f";
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Login · Arcadia", "variant": "landing" }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"> <div class="grid place-items-center"> ${renderComponent($$result2, "LoginCard", LoginCard, { "client:load": true, "next": next, "error": error, "siteKey": siteKey, "client:component-hydration": "load", "client:component-path": "@/islands/auth/LoginCard", "client:component-export": "default" })} </div> </div> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/login.astro", void 0);
const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Login,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
