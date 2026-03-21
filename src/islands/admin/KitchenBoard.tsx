import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type KitchenOrderStatus =
  | "PENDING"
  | "PAID"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type KitchenPaymentMethod = "CASH" | "CARD" | null;

type KitchenModifierOption = {
  id: number;
  name: string;
  priceDeltaCents: number;
};

type KitchenIngredientRemoved = {
  id: number;
  name: string;
};

type KitchenOrderItem = {
  id: number;
  qty: number;
  nameSnapshot: string;
  variantSnapshot?: string | null;
  lineTotalCents: number;
  modifiers: {
    modifierOptions: KitchenModifierOption[];
    ingredientsAdded: KitchenModifierOption[];
    ingredientsRemoved: KitchenIngredientRemoved[];
  };
};

type KitchenAddress = {
  line1?: string;
  line2?: string;
  city?: string;
  postalCode?: string;
  notes?: string;
};

type KitchenOrder = {
  id: number;
  publicId: string;
  createdAt: string;
  type: "DELIVERY" | "PICKUP";
  status: KitchenOrderStatus;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  totalCents: number;
  deliveryFeeCents: number;
  notes?: string | null;
  paymentMethod: KitchenPaymentMethod;
  forcedPickup: boolean;
  forcedReason?: string | null;
  address?: KitchenAddress | null;
  items: KitchenOrderItem[];
};

function money(cents: number) {
  return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
}

function minutesAgo(iso: string) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.round((now - t) / 60000));
  return mins === 0 ? "ahora" : `hace ${mins} min`;
}

function beep() {
  try {
    const audioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!audioCtor) return;

    const ctx = new audioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    window.setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 140);
  } catch {
    // no-op
  }
}

function badgeClass(status: KitchenOrderStatus) {
  switch (status) {
    case "PENDING":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "PAID":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
    case "ACCEPTED":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
    case "PREPARING":
      return "border-violet-400/20 bg-violet-400/10 text-violet-300";
    case "READY":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "OUT_FOR_DELIVERY":
      return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300";
    case "DELIVERED":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "CANCELLED":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    default:
      return "border-white/10 bg-white/5 text-slate-300";
  }
}

function columnTone(key: "new" | "kitchen" | "ready" | "delivery") {
  if (key === "new") return "border-amber-400/20 bg-amber-400/5";
  if (key === "kitchen") return "border-violet-400/20 bg-violet-400/5";
  if (key === "ready") return "border-emerald-400/20 bg-emerald-400/5";
  return "border-fuchsia-400/20 bg-fuchsia-400/5";
}

export default function KitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  async function load() {
    setErr(null);

    try {
      const res = await fetch("/api/admin/kitchen/orders");
      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(String(data.error ?? `HTTP ${res.status}`));
      }

      const data = (await res.json()) as { orders?: KitchenOrder[] };
      const next = data.orders ?? [];

      const newOnes = next.filter((order) => !seenIds.current.has(order.publicId));
      if (!firstLoad.current && newOnes.length > 0) {
        beep();
      }

      for (const order of next) {
        seenIds.current.add(order.publicId);
      }

      firstLoad.current = false;
      setOrders(next);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error cargando pedidos";
      setErr(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();

    const timer = window.setInterval(() => {
      void load();
    }, 8000);

    return () => window.clearInterval(timer);
  }, []);

  async function postUpdate(
    publicId: string,
    patch: { status?: string; paymentStatus?: string }
  ) {
    if (busy) return;

    setBusy(publicId);

    try {
      const fd = new FormData();
      if (patch.status) fd.set("status", patch.status);
      if (patch.paymentStatus) fd.set("paymentStatus", patch.paymentStatus);
      fd.set("redirectTo", "/admin/cocina");

      const res = await fetch(`/api/admin/orders/${publicId}/update`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(txt || "No se pudo actualizar");
        return;
      }

      await load();
    } finally {
      setBusy(null);
    }
  }

  const cols = useMemo(() => {
    const nuevos = orders.filter((o) => o.status === "PENDING" || o.status === "PAID");
    const cocina = orders.filter((o) => o.status === "ACCEPTED" || o.status === "PREPARING");
    const listos = orders.filter((o) => o.status === "READY");
    const reparto = orders.filter((o) => o.status === "OUT_FOR_DELIVERY");

    return { nuevos, cocina, listos, reparto };
  }, [orders]);

  return (
    <section class="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Board live
          </div>
          <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
            Flujo operativo de cocina
          </h2>
          <p class="mt-2 text-sm leading-6 text-slate-400">
            Actualización automática cada 8 segundos con aviso sonoro cuando entran pedidos nuevos.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
          onClick={() => {
            void load();
          }}
        >
          Refrescar ahora
        </button>
      </div>

      {loading ? (
        <div class="mt-6 rounded-3xl border border-white/10 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-400">
          Cargando pedidos…
        </div>
      ) : err ? (
        <div class="mt-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-200">
          Error: {err}
        </div>
      ) : (
        <div class="mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4">
          <Column
            title="Nuevos"
            hint="PENDING / PAID"
            tone="new"
            orders={cols.nuevos}
            busy={busy}
            onUpdate={postUpdate}
          />
          <Column
            title="En cocina"
            hint="ACCEPTED / PREPARING"
            tone="kitchen"
            orders={cols.cocina}
            busy={busy}
            onUpdate={postUpdate}
          />
          <Column
            title="Listos"
            hint="READY"
            tone="ready"
            orders={cols.listos}
            busy={busy}
            onUpdate={postUpdate}
          />
          <Column
            title="Reparto"
            hint="OUT_FOR_DELIVERY"
            tone="delivery"
            orders={cols.reparto}
            busy={busy}
            onUpdate={postUpdate}
          />
        </div>
      )}
    </section>
  );
}

function Column(props: {
  title: string;
  hint: string;
  tone: "new" | "kitchen" | "ready" | "delivery";
  orders: KitchenOrder[];
  busy: string | null;
  onUpdate: (publicId: string, patch: { status?: string; paymentStatus?: string }) => Promise<void>;
}) {
  return (
    <div class={`rounded-3xl border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${columnTone(props.tone)}`}>
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-lg font-semibold tracking-tight text-white">{props.title}</div>
          <div class="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">{props.hint}</div>
        </div>

        <div class="inline-flex min-w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-200">
          {props.orders.length}
        </div>
      </div>

      <div class="mt-4 space-y-3">
        {props.orders.length === 0 ? (
          <div class="rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-500">
            Sin pedidos en esta columna.
          </div>
        ) : (
          props.orders.map((order) => (
            <OrderCard key={order.publicId} order={order} busy={props.busy} onUpdate={props.onUpdate} />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard(props: {
  order: KitchenOrder;
  busy: string | null;
  onUpdate: (publicId: string, patch: { status?: string; paymentStatus?: string }) => Promise<void>;
}) {
  const order = props.order;
  const isBusy = props.busy === order.publicId;

  function nextPrimaryAction() {
    if (order.status === "PENDING" || order.status === "PAID") {
      return { label: "Aceptar", status: "ACCEPTED" };
    }
    if (order.status === "ACCEPTED") {
      return { label: "Preparando", status: "PREPARING" };
    }
    if (order.status === "PREPARING") {
      return { label: "Marcar listo", status: "READY" };
    }
    if (order.status === "READY") {
      if (order.type === "DELIVERY") {
        return { label: "En reparto", status: "OUT_FOR_DELIVERY" };
      }
      return { label: "Entregado", status: "DELIVERED" };
    }
    if (order.status === "OUT_FOR_DELIVERY") {
      return { label: "Entregado", status: "DELIVERED" };
    }
    return null;
  }

  const primary = nextPrimaryAction();

  return (
    <article
      class={`rounded-3xl border border-white/10 bg-[#0f172a] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition ${
        isBusy ? "pointer-events-none opacity-60" : ""
      }`}
    >
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <div class="text-base font-semibold text-white">{order.publicId}</div>

            <span
              class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${badgeClass(
                order.status
              )}`}
            >
              {order.status}
            </span>

            <span
              class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                order.type === "DELIVERY"
                  ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300"
                  : "border-indigo-400/20 bg-indigo-400/10 text-indigo-300"
              }`}
            >
              {order.type}
            </span>

            {order.paymentMethod ? (
              <span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                {order.paymentMethod}
              </span>
            ) : null}

            <span
              class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
                order.paymentStatus === "PAID"
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                  : order.paymentStatus === "UNPAID"
                    ? "border-amber-400/20 bg-amber-400/10 text-amber-300"
                    : "border-white/10 bg-white/5 text-slate-300"
              }`}
            >
              {order.paymentStatus}
            </span>
          </div>

          <div class="mt-3 text-sm font-medium text-slate-200">{order.customerName}</div>

          <div class="mt-1 text-xs text-slate-500">
            {order.customerPhone} · {minutesAgo(order.createdAt)} · {money(order.totalCents)}
          </div>

          {order.forcedPickup ? (
            <div class="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
              Forzado a recogida{order.forcedReason ? ` · ${order.forcedReason}` : ""}
            </div>
          ) : null}

          {order.type === "DELIVERY" && order.address?.line1 ? (
            <div class="mt-3 text-xs text-slate-400">{order.address.line1}</div>
          ) : null}
        </div>

        <div class="flex flex-col gap-2">
          <a
            class="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
            href={`/admin/pedidos/${order.publicId}`}
          >
            Ver
          </a>

          <a
            class="inline-flex items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15"
            href={`/admin/pedidos/ticket/${order.publicId}?print=1`}
            target="_blank"
            rel="noreferrer"
          >
            Ticket
          </a>
        </div>
      </div>

      <div class="mt-4 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} class="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div class="text-sm font-semibold text-white">
              {item.qty}× {item.nameSnapshot}
            </div>

            {item.variantSnapshot ? (
              <div class="mt-1 text-xs text-slate-400">{item.variantSnapshot}</div>
            ) : null}

            {item.modifiers.modifierOptions.length ? (
              <div class="mt-2 text-xs text-slate-400">
                Extras: {item.modifiers.modifierOptions.map((x) => x.name).join(", ")}
              </div>
            ) : null}

            {item.modifiers.ingredientsAdded.length ? (
              <div class="mt-1 text-xs text-slate-400">
                Añadidos: {item.modifiers.ingredientsAdded.map((x) => x.name).join(", ")}
              </div>
            ) : null}

            {item.modifiers.ingredientsRemoved.length ? (
              <div class="mt-1 text-xs text-slate-400">
                Quitados: {item.modifiers.ingredientsRemoved.map((x) => x.name).join(", ")}
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {order.notes ? (
        <div class="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300">
          <span class="font-semibold text-white">Notas:</span> {order.notes}
        </div>
      ) : null}

      <div class="mt-4 flex flex-wrap gap-2">
        {primary ? (
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400"
            onClick={() => {
              void props.onUpdate(order.publicId, { status: primary.status });
            }}
          >
            {primary.label}
          </button>
        ) : null}

        <button
          type="button"
          class="inline-flex items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15"
          onClick={() => {
            void props.onUpdate(order.publicId, { status: "CANCELLED" });
          }}
        >
          Cancelar
        </button>
      </div>
    </article>
  );
}