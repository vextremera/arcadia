import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type KitchenOrder = {
  id: number;
  publicId: string;
  createdAt: string;
  type: "DELIVERY" | "PICKUP";
  status:
  | "PENDING"
  | "ACCEPTED"
  | "PREPARING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  totalCents: number;
  deliveryFeeCents: number;
  notes?: string | null;

  paymentMethod?: "CASH" | "CARD" | null;
  forcedPickup?: boolean;
  forcedReason?: string | null;
  address?: any;

  items: Array<{
    id: number;
    qty: number;
    nameSnapshot: string;
    variantSnapshot?: string | null;
    lineTotalCents: number;
    modifiers: {
      modifierOptions: Array<{ id: number; name: string; priceDeltaCents: number }>;
      ingredientsAdded: Array<{ id: number; name: string; priceDeltaCents: number }>;
      ingredientsRemoved: Array<{ id: number; name: string }>;
    };
  }>;
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

function minutesAgo(iso: string) {
  const t = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(0, Math.round((now - t) / 60000));
  return mins === 0 ? "ahora" : `hace ${mins} min`;
}

// beep simple sin archivos
function beep() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.04;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    setTimeout(() => {
      o.stop();
      ctx.close?.();
    }, 140);
  } catch { }
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
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      const next: KitchenOrder[] = data.orders ?? [];

      // detectar nuevos pedidos (por publicId)
      const newOnes = next.filter((o) => !seenIds.current.has(o.publicId));
      if (!firstLoad.current && newOnes.length) beep();

      // actualizar "seen"
      for (const o of next) seenIds.current.add(o.publicId);
      firstLoad.current = false;

      setOrders(next);
    } catch (e: any) {
      setErr(e?.message || "Error cargando pedidos");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 8000); // polling suave
    return () => clearInterval(t);
  }, []);

  async function postUpdate(publicId: string, patch: { status?: string; paymentStatus?: string }) {
    if (busy) return;
    setBusy(publicId);
    try {
      const fd = new FormData();
      if (patch.status) fd.set("status", patch.status);
      if (patch.paymentStatus) fd.set("paymentStatus", patch.paymentStatus);

      const res = await fetch(`/api/admin/orders/${publicId}/update`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(txt || "No se pudo actualizar");
        return;
      }

      // refresca tablero
      await load();
    } finally {
      setBusy(null);
    }
  }

  const cols = useMemo(() => {
    const nuevos = orders.filter((o) => o.status === "PENDING");
    const cocina = orders.filter((o) => o.status === "ACCEPTED" || o.status === "PREPARING");
    const listos = orders.filter((o) => o.status === "READY");
    const reparto = orders.filter((o) => o.status === "OUT_FOR_DELIVERY");

    return { nuevos, cocina, listos, reparto };
  }, [orders]);

  return (
    <div class="mt-6">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="text-sm text-zinc-600">
          Se actualiza automáticamente cada 8s.
        </div>
        <button
          type="button"
          class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold"
          onClick={load}
        >
          Refrescar
        </button>
      </div>

      {loading ? (
        <div class="mt-6 text-sm text-zinc-600">Cargando pedidos…</div>
      ) : err ? (
        <div class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          Error: {err}
        </div>
      ) : (
        <div class="mt-6 grid gap-4 lg:grid-cols-4">
          <Column title="Nuevos" hint="PENDING" orders={cols.nuevos} busy={busy} onUpdate={postUpdate} />
          <Column title="En cocina" hint="ACCEPTED / PREPARING" orders={cols.cocina} busy={busy} onUpdate={postUpdate} />
          <Column title="Listos" hint="READY" orders={cols.listos} busy={busy} onUpdate={postUpdate} />
          <Column title="Reparto" hint="OUT_FOR_DELIVERY" orders={cols.reparto} busy={busy} onUpdate={postUpdate} />
        </div>
      )}
    </div>
  );
}

function Column(props: {
  title: string;
  hint: string;
  orders: KitchenOrder[];
  busy: string | null;
  onUpdate: (publicId: string, patch: { status?: string; paymentStatus?: string }) => Promise<void>;
}) {
  return (
    <div class="rounded-2xl border border-zinc-200 p-4">
      <div class="flex items-baseline justify-between gap-2">
        <div class="text-lg font-semibold">{props.title}</div>
        <div class="text-xs text-zinc-600">{props.orders.length}</div>
      </div>
      <div class="mt-1 text-xs text-zinc-500">{props.hint}</div>

      <div class="mt-4 space-y-3">
        {props.orders.length === 0 ? (
          <div class="text-sm text-zinc-600">Vacío.</div>
        ) : (
          props.orders.map((o) => (
            <OrderCard key={o.publicId} order={o} busy={props.busy} onUpdate={props.onUpdate} />
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
  const o = props.order;
  const isBusy = props.busy === o.publicId;

  function nextPrimaryAction() {
    if (o.status === "PENDING") return { label: "Aceptar", status: "ACCEPTED" };
    if (o.status === "ACCEPTED") return { label: "Preparando", status: "PREPARING" };
    if (o.status === "PREPARING") return { label: "Listo", status: "READY" };
    if (o.status === "READY") {
      if (o.type === "DELIVERY") return { label: "En reparto", status: "OUT_FOR_DELIVERY" };
      return { label: "Entregado", status: "DELIVERED" };
    }
    if (o.status === "OUT_FOR_DELIVERY") return { label: "Entregado", status: "DELIVERED" };
    return null;
  }

  const primary = nextPrimaryAction();

  return (
    <div class={`rounded-2xl border border-zinc-200 p-4 ${isBusy ? "opacity-60 pointer-events-none" : ""}`}>
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <div class="font-semibold">{o.publicId}</div>
            <span class="rounded-lg border border-zinc-200 px-2 py-0.5 text-xs font-semibold">
              {o.type}
            </span>
            {o.paymentMethod ? (
              <span class="rounded-lg border border-zinc-200 px-2 py-0.5 text-xs font-semibold">
                {o.paymentMethod}
              </span>
            ) : null}
          </div>
          <div class="mt-1 text-sm text-zinc-700">
            {o.customerName} · {o.customerPhone}
          </div>
          <div class="mt-1 text-xs text-zinc-500">
            {minutesAgo(o.createdAt)} · Total {money(o.totalCents)}
          </div>

          {o.forcedPickup ? (
            <div class="mt-2 text-xs text-amber-700">
              Forzado a RECOGIDA: {o.forcedReason ?? ""}
            </div>
          ) : null}
        </div>

        <div class="flex gap-2">
          <a
            class="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold"
            href={`/admin/pedidos/ticket/${o.publicId}`}
            target="_blank"
            rel="noreferrer"
          >
            Ticket
          </a>

          <a
            class="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold"
            href={`/admin/pedidos/${o.publicId}`}
          >
            Ver
          </a>
        </div>

      </div>

      <div class="mt-3 space-y-2 text-sm">
        {o.items.map((it) => {
          const opts = it.modifiers?.modifierOptions ?? [];
          const adds = it.modifiers?.ingredientsAdded ?? [];
          const rems = it.modifiers?.ingredientsRemoved ?? [];

          return (
            <div class="rounded-xl border border-zinc-100 p-3">
              <div class="font-semibold">
                {it.qty}× {it.nameSnapshot}
              </div>

              {it.variantSnapshot ? (
                <div class="mt-1 text-xs text-zinc-600">{it.variantSnapshot}</div>
              ) : null}

              {opts.length ? (
                <div class="mt-1 text-xs text-zinc-600">
                  Extras: {opts.map((x) => x.name).join(", ")}
                </div>
              ) : null}

              {adds.length ? (
                <div class="mt-1 text-xs text-zinc-600">
                  Añadidos: {adds.map((x) => x.name).join(", ")}
                </div>
              ) : null}

              {rems.length ? (
                <div class="mt-1 text-xs text-zinc-600">
                  Quitados: {rems.map((x) => x.name).join(", ")}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      {o.notes ? (
        <div class="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-700">
          <b>Notas:</b> {o.notes}
        </div>
      ) : null}

      <div class="mt-3 flex flex-wrap gap-2">
        {primary ? (
          <button
            type="button"
            class="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white"
            onClick={() => props.onUpdate(o.publicId, { status: primary.status })}
          >
            {primary.label}
          </button>
        ) : null}

        <button
          type="button"
          class="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold"
          onClick={() => props.onUpdate(o.publicId, { status: "CANCELLED" })}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
