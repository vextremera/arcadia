import { useState } from "preact/hooks";

const ARROW = (
  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h12" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [msg, setMsg] = useState<string>("");

  async function submit() {
    const value = email.trim();
    if (!value) return;

    setStatus("loading");
    setMsg("");

    const res = await fetch("/api/marketing/subscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: value }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("error");
      setMsg(data?.message || "No se pudo suscribir.");
      return;
    }

    setStatus("ok");
    setMsg("¡Perfecto! Te avisaremos con ofertas y novedades.");
    setEmail("");
  }

  return (
    <div>
      <div class="flex items-center gap-5">
        <input
          class="h-14 w-full rounded-2xl border border-white/20 bg-white px-5 text-base text-zinc-900 outline-none placeholder:text-zinc-500"
          placeholder="example@correo.com"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />

        <button
          type="button"
          class={`grid h-14 w-14 place-items-center rounded-2xl text-white hover:text-white/90 ${status === "loading" ? "opacity-60 pointer-events-none" : ""
            }`}
          onClick={submit}
          aria-label="Suscribirme"
          title="Suscribirme"
        >
          {ARROW}
        </button>
      </div>

      {msg ? (
        <div class={`mt-4 text-sm ${status === "error" ? "text-red-200" : "text-white/80"}`}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}