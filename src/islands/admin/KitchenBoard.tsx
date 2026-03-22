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
  id?: number;
  name: string;
  priceDeltaCents?: number;
};

type KitchenIngredientRemoved = {
  id?: number;
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

type KitchenLastEvent = {
  title: string;
  detail: string;
  by?: string | null;
  at?: string | null;
} | null;

type KitchenOrder = {
  id: number;
  publicId: string;
  createdAt: string;
  updatedAt: string;
  type: "DELIVERY" | "PICKUP";
  status: KitchenOrderStatus;
  paymentStatus: string;
  customerName: string;
  customerPhone: string;
  totalCents: number;
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  itemCount: number;
  notes?: string | null;
  paymentMethod: KitchenPaymentMethod;
  forcedPickup: boolean;
  forcedReason?: string | null;
  couponCode?: string | null;
  adminInternalNote?: string | null;
  lastAdminEvent: KitchenLastEvent;
  address?: KitchenAddress | null;
  items: KitchenOrderItem[];
};

type LoadResponse = {
  now?: string;
  orders?: KitchenOrder[];
};

function money(cents: number) {
  return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
}

function minutesOpen(iso: string) {
  const openedAt = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((now - openedAt) / 60000));
}

function ageLabel(iso: string) {
  const mins = minutesOpen(iso);
  if (mins <= 0) return "ahora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(date);
}

function beep() {
  try {
    const AudioCtor =
      window.AudioContext ||
      (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.035;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();

    window.setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 140);
  } catch {
    // noop
  }
}

function statusBadgeClass(status: KitchenOrderStatus) {
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

function paymentStatusBadgeClass(status: string) {
  switch (status) {
    case "PAID":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
    case "UNPAID":
      return "border-amber-400/20 bg-amber-400/10 text-amber-300";
    case "AUTH":
      return "border-sky-400/20 bg-sky-400/10 text-sky-300";
    case "FAILED":
      return "border-rose-400/20 bg-rose-400/10 text-rose-300";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-300";
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

function sortByQueueTime(a: KitchenOrder, b: KitchenOrder) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

function nextPrimaryAction(order: KitchenOrder) {
  if (order.status === "PENDING" || order.status === "PAID") {
    return { label: "Aceptar", status: "ACCEPTED" as const };
  }

  if (order.status === "ACCEPTED") {
    return { label: "Preparando", status: "PREPARING" as const };
  }

  if (order.status === "PREPARING") {
    return { label: "Marcar listo", status: "READY" as const };
  }

  if (order.status === "READY") {
    if (order.type === "DELIVERY") {
      return { label: "En reparto", status: "OUT_FOR_DELIVERY" as const };
    }
    return { label: "Entregado", status: "DELIVERED" as const };
  }

  if (order.status === "OUT_FOR_DELIVERY") {
    return { label: "Entregado", status: "DELIVERED" as const };
  }

  return null;
}

function quickVisibleItems(order: KitchenOrder, dense: boolean) {
  return order.items.slice(0, dense ? 3 : 5);
}

export default function KitchenBoard() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dense, setDense] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);

  async function load(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    if (!silent) {
      if (loading) {
        // keep loading state
      } else {
        setRefreshing(true);
      }
    }

    setErr(null);

    try {
      const res = await fetch("/api/admin/kitchen/orders", {
        headers: { accept: "application/json" },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(String(data.error ?? `HTTP ${res.status}`));
      }

      const data = (await res.json()) as LoadResponse;
      const next = [...(data.orders ?? [])].sort(sortByQueueTime);

      const newOnes = next.filter((order) => !seenIds.current.has(order.publicId));
      if (!firstLoad.current && soundEnabled && newOnes.length > 0) {
        beep();
      }

      for (const order of next) {
        seenIds.current.add(order.publicId);
      }

      firstLoad.current = false;
      setOrders(next);
      setLastLoadedAt(data.now ?? new Date().toISOString());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error cargando pedidos";
      setErr(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();

    return () => {
      // noop cleanup for first load
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = window.setInterval(() => {
      void load({ silent: true });
    }, 8000);

    return () => window.clearInterval(timer);
  }, [autoRefresh, soundEnabled]);

  async function postUpdate(
    publicId: string,
    patch: { status?: string; paymentStatus?: string }
  ) {
    if (busyKey) return;

    const key = `${publicId}:${patch.status ?? patch.paymentStatus ?? "update"}`;
    setBusyKey(key);

    try {
      const fd = new FormData();
      fd.set("redirectTo", "/admin/cocina");

      if (patch.status) {
        fd.set("intent", "update-status");
        fd.set("status", patch.status);
      }

      if (patch.paymentStatus) {
        fd.set("intent", "update-payment");
        fd.set("paymentStatus", patch.paymentStatus);
      }

      const res = await fetch(`/api/admin/orders/${publicId}/update`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(txt || "No se pudo actualizar el pedido.");
        return;
      }

      await load({ silent: true });
    } finally {
      setBusyKey(null);
    }
  }

  const columns = useMemo(() => {
    const nuevos = orders
      .filter((order) => order.status === "PENDING" || order.status === "PAID")
      .sort(sortByQueueTime);

    const cocina = orders
      .filter((order) => order.status === "ACCEPTED" || order.status === "PREPARING")
      .sort(sortByQueueTime);

    const listos = orders
      .filter((order) => order.status === "READY")
      .sort(sortByQueueTime);

    const reparto = orders
      .filter((order) => order.status === "OUT_FOR_DELIVERY")
      .sort(sortByQueueTime);

    return { nuevos, cocina, listos, reparto };
  }, [orders]);

  const stats = useMemo(() => {
    const live = orders.length;
    const delivery = orders.filter((order) => order.type === "DELIVERY").length;
    const overdue = orders.filter((order) => minutesOpen(order.createdAt) >= 20).length;
    const withNotes = orders.filter(
      (order) => order.notes || order.adminInternalNote || order.lastAdminEvent
    ).length;

    return { live, delivery, overdue, withNotes };
  }, [orders]);

  return (
    <section class="rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            Board live
          </div>
          <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
            Flujo operativo de cocina
          </h2>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Cola viva con acciones rápidas de estado, ticket compacto, notas internas y lectura clara de pickup vs delivery.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              autoRefresh
                ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/30 hover:bg-emerald-400/15"
                : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setAutoRefresh((value) => !value)}
          >
            {autoRefresh ? "Auto refresh ON" : "Auto refresh OFF"}
          </button>

          <button
            type="button"
            class={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              soundEnabled
                ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:border-cyan-400/30 hover:bg-cyan-400/15"
                : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setSoundEnabled((value) => !value)}
          >
            {soundEnabled ? "Sonido ON" : "Sonido OFF"}
          </button>

          <button
            type="button"
            class={`inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${
              dense
                ? "border border-violet-400/20 bg-violet-400/10 text-violet-300 hover:border-violet-400/30 hover:bg-violet-400/15"
                : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => setDense((value) => !value)}
          >
            {dense ? "Vista compacta" : "Vista amplia"}
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white"
            onClick={() => {
              void load();
            }}
          >
            {refreshing ? "Refrescando…" : "Refrescar ahora"}
          </button>
        </div>
      </div>

      <div class="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pedidos vivos" value={String(stats.live)} helper="Estados operativos abiertos" tone="neutral" />
        <StatCard label="Delivery" value={String(stats.delivery)} helper="Con reparto en curso" tone="cyan" />
        <StatCard label="Overdue" value={String(stats.overdue)} helper="20 min o más en cola" tone="amber" />
        <StatCard
          label="Con notas"
          value={String(stats.withNotes)}
          helper={lastLoadedAt ? `Última carga ${formatDateTime(lastLoadedAt)}` : "Sincronizando"}
          tone="violet"
        />
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
            orders={columns.nuevos}
            dense={dense}
            busyKey={busyKey}
            onUpdate={postUpdate}
          />
          <Column
            title="En cocina"
            hint="ACCEPTED / PREPARING"
            tone="kitchen"
            orders={columns.cocina}
            dense={dense}
            busyKey={busyKey}
            onUpdate={postUpdate}
          />
          <Column
            title="Listos"
            hint="READY"
            tone="ready"
            orders={columns.listos}
            dense={dense}
            busyKey={busyKey}
            onUpdate={postUpdate}
          />
          <Column
            title="Reparto"
            hint="OUT_FOR_DELIVERY"
            tone="delivery"
            orders={columns.reparto}
            dense={dense}
            busyKey={busyKey}
            onUpdate={postUpdate}
          />
        </div>
      )}
    </section>
  );
}

function StatCard(props: {
  label: string;
  value: string;
  helper: string;
  tone: "neutral" | "amber" | "cyan" | "violet";
}) {
  const toneClass =
    props.tone === "amber"
      ? "border-amber-400/20 bg-amber-400/10"
      : props.tone === "cyan"
        ? "border-cyan-400/20 bg-cyan-400/10"
        : props.tone === "violet"
          ? "border-violet-400/20 bg-violet-400/10"
          : "border-white/10 bg-white/5";

  return (
    <article class={`rounded-3xl border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${toneClass}`}>
      <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
        {props.label}
      </div>
      <div class="mt-3 text-2xl font-semibold tracking-tight text-white">{props.value}</div>
      <p class="mt-2 text-sm text-slate-400">{props.helper}</p>
    </article>
  );
}

function Column(props: {
  title: string;
  hint: string;
  tone: "new" | "kitchen" | "ready" | "delivery";
  orders: KitchenOrder[];
  dense: boolean;
  busyKey: string | null;
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
            <OrderCard
              key={order.publicId}
              order={order}
              dense={props.dense}
              busyKey={props.busyKey}
              onUpdate={props.onUpdate}
            />
          ))
        )}
      </div>
    </div>
  );
}

function OrderCard(props: {
  order: KitchenOrder;
  dense: boolean;
  busyKey: string | null;
  onUpdate: (publicId: string, patch: { status?: string; paymentStatus?: string }) => Promise<void>;
}) {
  const { order, dense } = props;
  const primary = nextPrimaryAction(order);
  const visibleItems = quickVisibleItems(order, dense);
  const hiddenItems = Math.max(0, order.items.length - visibleItems.length);
  const ageMinutesValue = minutesOpen(order.createdAt);
  const isBusy = props.busyKey?.startsWith(`${order.publicId}:`) ?? false;

  const canQuickMarkPaid =
    order.paymentMethod === "CARD" &&
    order.paymentStatus !== "PAID" &&
    order.paymentStatus !== "REFUNDED" &&
    order.paymentStatus !== "PARTIALLY_REFUNDED";

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
              class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(
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
              class={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${paymentStatusBadgeClass(
                order.paymentStatus
              )}`}
            >
              {order.paymentStatus}
            </span>

            {ageMinutesValue >= 20 ? (
              <span class="inline-flex items-center rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-300">
                {ageLabel(order.createdAt)}
              </span>
            ) : (
              <span class="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                {ageLabel(order.createdAt)}
              </span>
            )}

            {order.couponCode ? (
              <span class="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                {order.couponCode}
              </span>
            ) : null}
          </div>

          <div class="mt-3 text-sm font-medium text-slate-200">
            {order.customerName || "Cliente"}
          </div>

          <div class="mt-1 text-xs text-slate-500">
            {order.customerPhone || "Sin teléfono"} · {order.itemCount} ud{order.itemCount === 1 ? "" : "s"} · {money(order.totalCents)}
          </div>

          {order.type === "DELIVERY" && order.address?.line1 ? (
            <div class="mt-2 text-xs text-slate-400">
              {order.address.line1}
              {order.address.city ? ` · ${order.address.city}` : ""}
            </div>
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
        {visibleItems.map((item) => (
          <div key={item.id} class="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div class="text-sm font-semibold text-white">
              {item.qty}× {item.nameSnapshot}
            </div>

            {item.variantSnapshot ? (
              <div class="mt-1 text-xs text-slate-400">{item.variantSnapshot}</div>
            ) : null}

            {item.modifiers.modifierOptions.length ? (
              <div class="mt-2 text-xs text-slate-400">
                Extras: {item.modifiers.modifierOptions.map((entry) => entry.name).join(", ")}
              </div>
            ) : null}

            {item.modifiers.ingredientsAdded.length ? (
              <div class="mt-1 text-xs text-slate-400">
                Añadidos: {item.modifiers.ingredientsAdded.map((entry) => entry.name).join(", ")}
              </div>
            ) : null}

            {item.modifiers.ingredientsRemoved.length ? (
              <div class="mt-1 text-xs text-slate-400">
                Quitados: {item.modifiers.ingredientsRemoved.map((entry) => entry.name).join(", ")}
              </div>
            ) : null}
          </div>
        ))}

        {hiddenItems > 0 ? (
          <div class="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
            + {hiddenItems} línea{hiddenItems === 1 ? "" : "s"} más
          </div>
        ) : null}
      </div>

      {Number(order.discountCents ?? 0) > 0 || Number(order.deliveryFeeCents ?? 0) > 0 ? (
        <div class="mt-4 flex flex-wrap gap-2">
          {Number(order.deliveryFeeCents ?? 0) > 0 ? (
            <span class="inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
              Fee {money(order.deliveryFeeCents)}
            </span>
          ) : null}

          {Number(order.discountCents ?? 0) > 0 ? (
            <span class="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
              -{money(order.discountCents)}
            </span>
          ) : null}
        </div>
      ) : null}

      {order.forcedPickup ? (
        <div class="mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200">
          Forzado a recogida{order.forcedReason ? ` · ${order.forcedReason}` : ""}
        </div>
      ) : null}

      {order.notes ? (
        <div class="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300">
          <span class="font-semibold text-white">Notas cliente:</span> {order.notes}
        </div>
      ) : null}

      {order.adminInternalNote ? (
        <div class="mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100/85">
          <span class="font-semibold text-white">Nota interna:</span> {order.adminInternalNote}
        </div>
      ) : null}

      {order.lastAdminEvent ? (
        <div class="mt-3 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-3 text-xs text-violet-100/85">
          <div class="font-semibold text-white">{order.lastAdminEvent.title}</div>
          <div class="mt-1">{order.lastAdminEvent.detail}</div>
          <div class="mt-2 text-[11px] text-violet-200/80">
            {formatDateTime(order.lastAdminEvent.at ?? null)}
            {order.lastAdminEvent.by ? ` · ${order.lastAdminEvent.by}` : ""}
          </div>
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

        {canQuickMarkPaid ? (
          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/15"
            onClick={() => {
              void props.onUpdate(order.publicId, { paymentStatus: "PAID" });
            }}
          >
            Marcar cobrado
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