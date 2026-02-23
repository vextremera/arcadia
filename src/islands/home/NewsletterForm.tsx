import { useState } from "preact/hooks";

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
      <div class="flex w-full items-center gap-3 rounded-2xl bg-white px-4 py-3">
        <input
          class="w-full bg-transparent text-sm outline-none"
          placeholder="example@correo.com"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
        />
        <button
          type="button"
          class={`grid h-10 w-10 place-items-center rounded-xl bg-[#7b1f1f] text-white ${
            status === "loading" ? "opacity-60 pointer-events-none" : ""
          }`}
          onClick={submit}
          aria-label="Suscribirme"
        >
          ➤
        </button>
      </div>

      {msg ? (
        <div class={`mt-3 text-sm ${status === "error" ? "text-red-200" : "text-white/80"}`}>
          {msg}
        </div>
      ) : null}
    </div>
  );
}
