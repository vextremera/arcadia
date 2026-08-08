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
  /** Momento en que entró en el estado actual (para el tiempo en fase). */
  currentStatusSince?: string | null;
  address?: KitchenAddress | null;
  items: KitchenOrderItem[];
};

type ChannelFilter = "ALL" | "DELIVERY" | "PICKUP";

/** Minutos a partir de los cuales un pedido se considera retrasado. */
const OVERDUE_MINUTES = 20;

/** Ventana durante la que un pedido recién entrado se resalta como nuevo. */
const NEW_HIGHLIGHT_MS = 45_000;

const DONE_LINES_STORAGE_KEY = "arcadia:kitchen:doneLines";

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

/** Pill compacto: solo color de texto + fondo tenue, sin borde, para bajar ruido. */
function statusPillClass(status: KitchenOrderStatus) {
  switch (status) {
    case "PENDING":
      return "bg-amber-400/15 text-amber-300";
    case "PAID":
      return "bg-sky-400/15 text-sky-300";
    case "ACCEPTED":
      return "bg-cyan-400/15 text-cyan-300";
    case "PREPARING":
      return "bg-violet-400/15 text-violet-300";
    case "READY":
      return "bg-emerald-400/15 text-emerald-300";
    case "OUT_FOR_DELIVERY":
      return "bg-fuchsia-400/15 text-fuchsia-300";
    case "DELIVERED":
      return "bg-emerald-400/15 text-emerald-200";
    case "CANCELLED":
      return "bg-rose-400/15 text-rose-300";
    default:
      return "bg-white/[0.06] text-slate-300";
  }
}

function paymentPillClass(status: string) {
  switch (status) {
    case "PAID":
      return "bg-emerald-400/15 text-emerald-300";
    case "UNPAID":
      return "bg-amber-400/15 text-amber-300";
    case "AUTH":
      return "bg-sky-400/15 text-sky-300";
    case "FAILED":
      return "bg-rose-400/15 text-rose-300";
    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
      return "bg-fuchsia-400/15 text-fuchsia-300";
    default:
      return "bg-white/[0.06] text-slate-300";
  }
}

/** Acento de la columna: solo una barra superior, el fondo se mantiene neutro. */
function columnAccent(key: "new" | "kitchen" | "ready" | "delivery") {
  if (key === "new") return "bg-amber-400";
  if (key === "kitchen") return "bg-violet-400";
  if (key === "ready") return "bg-emerald-400";
  return "bg-fuchsia-400";
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

type KitchenBoardProps = {
  /** Modo pase: pensado para un monitor en cocina (texto grande, sin cromo de admin). */
  pase?: boolean;
};

export default function KitchenBoard({ pase = false }: KitchenBoardProps = {}) {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dense, setDense] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [failedPolls, setFailedPolls] = useState(0);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>("ALL");
  const [doneLines, setDoneLines] = useState<Set<string>>(new Set());
  const [showHelp, setShowHelp] = useState(false);
  // Se actualiza cada segundo para que los tiempos corran entre sondeos.
  const [tick, setTick] = useState(() => Date.now());

  const seenIds = useRef<Set<string>>(new Set());
  const firstLoad = useRef(true);
  const firstSeenAt = useRef<Map<string, number>>(new Map());
  const alertedOverdue = useRef<Set<string>>(new Set());
  const soundRef = useRef(soundEnabled);
  soundRef.current = soundEnabled;

  async function load(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) setRefreshing(true);

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

      const now = Date.now();
      const newOnes = next.filter((order) => !seenIds.current.has(order.publicId));

      if (!firstLoad.current && soundRef.current && newOnes.length > 0) {
        beep();
      }

      for (const order of next) {
        seenIds.current.add(order.publicId);
        if (!firstSeenAt.current.has(order.publicId)) {
          // En la primera carga no se resalta nada: no son novedades reales.
          firstSeenAt.current.set(order.publicId, firstLoad.current ? 0 : now);
        }
      }

      // Un pedido que sale del board deja de ocupar memoria y puede volver a
      // avisar si reaparece.
      const liveIds = new Set(next.map((order) => order.publicId));
      for (const id of [...firstSeenAt.current.keys()]) {
        if (!liveIds.has(id)) firstSeenAt.current.delete(id);
      }
      for (const id of [...alertedOverdue.current]) {
        if (!liveIds.has(id)) alertedOverdue.current.delete(id);
      }
      for (const id of [...seenIds.current]) {
        if (!liveIds.has(id)) seenIds.current.delete(id);
      }

      firstLoad.current = false;
      setOrders(next);
      setLastLoadedAt(data.now ?? new Date().toISOString());
      setErr(null);
      setFailedPolls(0);
    } catch (error) {
      // No se vacía el board: en cocina es peor quedarse sin pedidos por un
      // fallo de red puntual que mostrar datos de hace unos segundos.
      const message = error instanceof Error ? error.message : "Error cargando pedidos";
      setErr(message);
      setFailedPolls((value) => value + 1);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const timer = window.setInterval(() => {
      // Con la pestaña en segundo plano no tiene sentido sondear.
      if (document.visibilityState === "hidden") return;
      void load({ silent: true });
    }, 8000);

    return () => window.clearInterval(timer);
  }, [autoRefresh]);

  // Al volver a la pestaña, refrescar de inmediato en vez de esperar al ciclo.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && autoRefresh) {
        void load({ silent: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [autoRefresh]);

  // Aviso sonoro cuando un pedido cruza el umbral de retraso (una vez cada uno).
  useEffect(() => {
    if (!soundEnabled) return;

    for (const order of orders) {
      if (minutesOpen(order.createdAt) < OVERDUE_MINUTES) continue;
      if (alertedOverdue.current.has(order.publicId)) continue;
      alertedOverdue.current.add(order.publicId);
      if (!firstLoad.current) beep();
    }
  }, [orders, tick, soundEnabled]);

  // Líneas marcadas como preparadas: se guardan en el navegador para que un
  // refresco o un cambio de pestaña no pierda el progreso durante el servicio.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DONE_LINES_STORAGE_KEY);
      if (raw) setDoneLines(new Set(JSON.parse(raw) as string[]));
    } catch {
      // almacenamiento no disponible
    }
  }, []);

  function toggleLineDone(key: string) {
    setDoneLines((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try {
        window.localStorage.setItem(DONE_LINES_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // almacenamiento no disponible
      }
      return next;
    });
  }

  // El estado de pantalla completa puede cambiar desde fuera (tecla Esc, F11).
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", sync);
    sync();
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // El navegador puede denegarlo si no viene de un gesto del usuario.
    }
  }

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

  // Atajos de teclado: pensados para el pase, donde no hay ratón a mano.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || target?.isContentEditable) return;

      switch (event.key.toLowerCase()) {
        case "a":
          setAutoRefresh((value) => !value);
          break;
        case "s":
          setSoundEnabled((value) => !value);
          break;
        case "d":
          setDense((value) => !value);
          break;
        case "r":
          void load();
          break;
        case "f":
          void toggleFullscreen();
          break;
        case "1":
          setChannelFilter("ALL");
          break;
        case "2":
          setChannelFilter("DELIVERY");
          break;
        case "3":
          setChannelFilter("PICKUP");
          break;
        case "?":
          setShowHelp((value) => !value);
          break;
        case "escape":
          setShowHelp(false);
          break;
        default:
          return;
      }

      event.preventDefault();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visibleOrders = useMemo(
    () => (channelFilter === "ALL" ? orders : orders.filter((order) => order.type === channelFilter)),
    [orders, channelFilter],
  );

  const columns = useMemo(() => {
    const orders = visibleOrders;
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
  }, [visibleOrders]);

  const stats = useMemo(() => {
    const live = orders.length;
    const delivery = orders.filter((order) => order.type === "DELIVERY").length;
    const overdue = orders.filter((order) => minutesOpen(order.createdAt) >= OVERDUE_MINUTES).length;
    const withNotes = orders.filter(
      (order) => order.notes || order.adminInternalNote || order.lastAdminEvent
    ).length;

    return { live, delivery, overdue, withNotes };
  }, [orders, tick]);

  const toggleClass = (on: boolean, onClasses: string) =>
    `inline-flex items-center justify-center rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
      on ? onClasses : "border border-admin-border bg-white/[0.03] text-admin-muted hover:bg-white/[0.06] hover:text-white"
    }`;

  return (
    <section class={pase ? "flex h-full min-h-0 flex-col" : "flex flex-col"}>
      {/* Barra única: métricas a la izquierda, controles a la derecha. */}
      <div class="flex flex-wrap items-center justify-between gap-3 rounded-admin-lg border border-admin-border bg-white/[0.02] px-4 py-2.5">
        <div class="flex flex-wrap items-center gap-x-5 gap-y-1.5">
          <Metric label="Vivos" value={stats.live} />
          <Metric label="Delivery" value={stats.delivery} tone="text-cyan-300" />
          <Metric label="+20 min" value={stats.overdue} tone={stats.overdue > 0 ? "text-amber-300" : undefined} />
          <Metric label="Con notas" value={stats.withNotes} />

          {failedPolls > 0 ? (
            <span class="inline-flex items-center gap-1.5 rounded-md bg-rose-400/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300">
              <span class="h-1.5 w-1.5 rounded-full bg-rose-400" />
              Sin conexión · {failedPolls} intento{failedPolls === 1 ? "" : "s"}
            </span>
          ) : (
            <span class="text-[11px] text-admin-faint">
              {lastLoadedAt ? `Actualizado ${formatDateTime(lastLoadedAt)}` : "Sincronizando…"}
            </span>
          )}
        </div>

        <div class="flex flex-wrap items-center gap-1.5">
          <div class="mr-1 inline-flex overflow-hidden rounded-xl border border-admin-border">
            {([
              { key: "ALL", label: "Todos" },
              { key: "DELIVERY", label: "Envío" },
              { key: "PICKUP", label: "Recogida" },
            ] as Array<{ key: ChannelFilter; label: string }>).map((option) => (
              <button
                key={option.key}
                type="button"
                class={`px-2.5 py-1.5 text-xs font-semibold transition ${
                  channelFilter === option.key
                    ? "bg-sky-400/20 text-sky-200"
                    : "text-admin-muted hover:bg-white/[0.06] hover:text-white"
                }`}
                onClick={() => setChannelFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            class={toggleClass(autoRefresh, "bg-emerald-400/15 text-emerald-300")}
            onClick={() => setAutoRefresh((value) => !value)}
            title="Refresco automático cada 8 segundos"
          >
            Auto {autoRefresh ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            class={toggleClass(soundEnabled, "bg-cyan-400/15 text-cyan-300")}
            onClick={() => setSoundEnabled((value) => !value)}
            title="Aviso sonoro al entrar pedidos nuevos"
          >
            Sonido {soundEnabled ? "ON" : "OFF"}
          </button>

          <button
            type="button"
            class={toggleClass(!dense, "bg-violet-400/15 text-violet-300")}
            onClick={() => setDense((value) => !value)}
            title="Mostrar más líneas por pedido"
          >
            {dense ? "Compacto" : "Ampliado"}
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border border-admin-border bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-admin-muted transition hover:bg-white/[0.06] hover:text-white"
            onClick={() => {
              void load();
            }}
          >
            {refreshing ? "…" : "Refrescar"}
          </button>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl border border-admin-border bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-admin-muted transition hover:bg-white/[0.06] hover:text-white"
            onClick={() => {
              void toggleFullscreen();
            }}
            title="Pantalla completa"
          >
            {isFullscreen ? "Salir" : "Pantalla completa"}
          </button>

          <button
            type="button"
            class="inline-flex h-[30px] w-[30px] items-center justify-center rounded-xl border border-admin-border bg-white/[0.03] text-xs font-semibold text-admin-muted transition hover:bg-white/[0.06] hover:text-white"
            onClick={() => setShowHelp((value) => !value)}
            title="Atajos de teclado"
          >
            ?
          </button>

          {pase ? (
            <a
              class="inline-flex items-center justify-center rounded-xl border border-admin-border bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-admin-muted transition hover:bg-white/[0.06] hover:text-white"
              href="/admin/cocina"
            >
              Salir del pase
            </a>
          ) : (
            <a
              class="inline-flex items-center justify-center rounded-xl bg-sky-400/15 px-3 py-1.5 text-xs font-semibold text-sky-300 transition hover:bg-sky-400/25"
              href="/admin/cocina/pase"
            >
              Modo pase
            </a>
          )}
        </div>
      </div>

      {showHelp ? (
        <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-admin-lg border border-admin-border bg-white/[0.02] px-4 py-2 text-[11px] text-admin-muted">
          {[
            ["A", "auto refresh"],
            ["S", "sonido"],
            ["D", "densidad"],
            ["R", "refrescar"],
            ["F", "pantalla completa"],
            ["1 / 2 / 3", "todos / envío / recogida"],
            ["?", "esta ayuda"],
          ].map(([key, label]) => (
            <span key={key} class="inline-flex items-center gap-1.5">
              <kbd class="rounded border border-admin-border bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white">{key}</kbd>
              {label}
            </span>
          ))}
          <span class="text-admin-faint">Toca una línea del pedido para marcarla preparada.</span>
        </div>
      ) : null}

      {err && !loading ? (
        <div class="mt-2 rounded-admin-lg border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs text-rose-200">
          No se pudo contactar con el servidor ({err}). Se sigue mostrando la última carga correcta
          {lastLoadedAt ? ` de las ${formatDateTime(lastLoadedAt)}` : ""}.
        </div>
      ) : null}

      {loading ? (
        <div class="mt-3 rounded-admin-lg border border-admin-border bg-white/[0.02] px-5 py-10 text-center text-sm text-admin-muted">
          Cargando pedidos…
        </div>
      ) : (
        <div
          class={`mt-3 grid min-h-0 flex-1 gap-3 ${
            pase ? "grid-cols-2 2xl:grid-cols-4" : "md:grid-cols-2 2xl:grid-cols-4"
          }`}
        >
          {(
            [
              { title: "Nuevos", hint: "Pendientes de aceptar", tone: "new", orders: columns.nuevos },
              { title: "En cocina", hint: "Aceptados y en preparación", tone: "kitchen", orders: columns.cocina },
              { title: "Listos", hint: "Esperando salida", tone: "ready", orders: columns.listos },
              { title: "Reparto", hint: "En camino", tone: "delivery", orders: columns.reparto },
            ] as const
          ).map((column) => (
            <Column
              key={column.title}
              title={column.title}
              hint={column.hint}
              tone={column.tone}
              orders={column.orders}
              dense={dense}
              pase={pase}
              busyKey={busyKey}
              onUpdate={postUpdate}
              now={tick}
              firstSeenAt={firstSeenAt.current}
              doneLines={doneLines}
              onToggleLine={toggleLineDone}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Metric(props: { label: string; value: number; tone?: string }) {
  return (
    <span class="inline-flex items-baseline gap-1.5">
      <span class={`text-base font-semibold tabular-nums ${props.tone ?? "text-white"}`}>{props.value}</span>
      <span class="text-[11px] uppercase tracking-[0.14em] text-admin-faint">{props.label}</span>
    </span>
  );
}

function Column(props: {
  title: string;
  hint: string;
  tone: "new" | "kitchen" | "ready" | "delivery";
  orders: KitchenOrder[];
  dense: boolean;
  pase: boolean;
  busyKey: string | null;
  onUpdate: (publicId: string, patch: { status?: string; paymentStatus?: string }) => Promise<void>;
  now: number;
  firstSeenAt: Map<string, number>;
  doneLines: Set<string>;
  onToggleLine: (key: string) => void;
}) {
  return (
    <div class="flex min-h-0 flex-col overflow-hidden rounded-admin-lg border border-admin-border bg-white/[0.02]">
      <div class={`h-0.5 w-full ${columnAccent(props.tone)}`} />

      <div class="flex shrink-0 items-center justify-between gap-3 border-b border-admin-border px-3.5 py-2.5">
        <div class="min-w-0">
          <div class={`font-semibold text-white ${props.pase ? "text-lg" : "text-sm"}`}>{props.title}</div>
          <div class="truncate text-[11px] text-admin-faint">{props.hint}</div>
        </div>

        <span class={`shrink-0 font-semibold tabular-nums text-white ${props.pase ? "text-2xl" : "text-lg"}`}>
          {props.orders.length}
        </span>
      </div>

      <div class="min-h-0 flex-1 space-y-2 overflow-y-auto p-2.5">
        {props.orders.length === 0 ? (
          <div class="rounded-admin border border-dashed border-admin-border px-3 py-6 text-center text-xs text-admin-faint">
            Sin pedidos
          </div>
        ) : (
          props.orders.map((order) => (
            <OrderCard
              key={order.publicId}
              order={order}
              dense={props.dense}
              pase={props.pase}
              busyKey={props.busyKey}
              onUpdate={props.onUpdate}
              now={props.now}
              isNew={(() => {
                const seen = props.firstSeenAt.get(order.publicId) ?? 0;
                return seen > 0 && props.now - seen < NEW_HIGHLIGHT_MS;
              })()}
              doneLines={props.doneLines}
              onToggleLine={props.onToggleLine}
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
  pase: boolean;
  busyKey: string | null;
  onUpdate: (publicId: string, patch: { status?: string; paymentStatus?: string }) => Promise<void>;
  now: number;
  isNew: boolean;
  doneLines: Set<string>;
  onToggleLine: (key: string) => void;
}) {
  const { order, dense, pase } = props;
  const primary = nextPrimaryAction(order);
  const visibleItems = quickVisibleItems(order, dense);
  const hiddenItems = Math.max(0, order.items.length - visibleItems.length);
  const ageMinutesValue = minutesOpen(order.createdAt);
  const isBusy = props.busyKey?.startsWith(`${order.publicId}:`) ?? false;
  const phaseSince = order.currentStatusSince ?? order.createdAt;
  const phaseMinutes = minutesOpen(phaseSince);
  // Solo aporta si difiere de la antigüedad total (si no, es ruido duplicado).
  const showPhase = Math.abs(ageMinutesValue - phaseMinutes) >= 1;
  const doneCount = order.items.filter((item) => props.doneLines.has(`${order.id}:${item.id}`)).length;
  const allLinesDone = order.items.length > 0 && doneCount === order.items.length;

  const canQuickMarkPaid =
    order.paymentMethod === "CARD" &&
    order.paymentStatus !== "PAID" &&
    order.paymentStatus !== "REFUNDED" &&
    order.paymentStatus !== "PARTIALLY_REFUNDED";

  const pill = "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]";
  const isLate = ageMinutesValue >= 20;

  return (
    <article
      class={`rounded-admin border bg-admin-surface transition ${
        props.isNew
          ? "border-sky-400/50 ring-1 ring-sky-400/30"
          : isLate
            ? "border-amber-400/30"
            : "border-admin-border"
      } ${allLinesDone ? "opacity-80" : ""} ${isBusy ? "pointer-events-none opacity-50" : ""}`}
    >
      {/* Cabecera: id + tiempo en cola son lo que cocina lee primero. */}
      <div class="flex items-center justify-between gap-2 border-b border-admin-border px-3 py-2">
        <div class="flex min-w-0 items-center gap-2">
          <span class={`truncate font-semibold text-white ${pase ? "text-lg" : "text-sm"}`}>
            {order.publicId}
          </span>
          <span class={`${pill} ${order.type === "DELIVERY" ? "bg-cyan-400/15 text-cyan-300" : "bg-indigo-400/15 text-indigo-300"}`}>
            {order.type === "DELIVERY" ? "Env" : "Rec"}
          </span>
          {props.isNew ? <span class={`${pill} bg-sky-400/20 text-sky-200`}>Nuevo</span> : null}
        </div>

        <div class="flex shrink-0 flex-col items-end leading-tight">
          <span
            class={`font-semibold tabular-nums ${pase ? "text-lg" : "text-sm"} ${
              isLate ? "text-amber-300" : "text-admin-muted"
            }`}
            title="Tiempo total desde que entró el pedido"
          >
            {ageLabel(order.createdAt)}
          </span>
          {showPhase ? (
            <span class="text-[10px] tabular-nums text-admin-faint" title="Tiempo en el estado actual">
              fase {ageLabel(phaseSince)}
            </span>
          ) : null}
        </div>
      </div>

      <div class="px-3 py-2">
        {/* Líneas del pedido: lo más grande de la tarjeta. */}
        <ul class="space-y-1.5">
          {visibleItems.map((item) => {
            const lineKey = `${order.id}:${item.id}`;
            const isDone = props.doneLines.has(lineKey);

            return (
              <li key={item.id}>
                <button
                  type="button"
                  class={`w-full text-left transition ${isDone ? "opacity-40" : "hover:opacity-80"}`}
                  onClick={() => props.onToggleLine(lineKey)}
                  title={isDone ? "Marcar como pendiente" : "Marcar como preparada"}
                >
                  <div
                    class={`font-semibold leading-snug text-white ${pase ? "text-base" : "text-sm"} ${
                      isDone ? "line-through decoration-2" : ""
                    }`}
                  >
                    <span class="text-sky-300">{item.qty}×</span> {item.nameSnapshot}
                  </div>

                  {item.variantSnapshot ? (
                    <div class={`text-admin-muted ${pase ? "text-sm" : "text-xs"}`}>{item.variantSnapshot}</div>
                  ) : null}

                  {item.modifiers.modifierOptions.length ? (
                    <div class={`text-admin-muted ${pase ? "text-sm" : "text-xs"}`}>
                      + {item.modifiers.modifierOptions.map((entry) => entry.name).join(", ")}
                    </div>
                  ) : null}

                  {item.modifiers.ingredientsAdded.length ? (
                    <div class={`text-emerald-300/90 ${pase ? "text-sm" : "text-xs"}`}>
                      + {item.modifiers.ingredientsAdded.map((entry) => entry.name).join(", ")}
                    </div>
                  ) : null}

                  {item.modifiers.ingredientsRemoved.length ? (
                    <div class={`text-rose-300/90 ${pase ? "text-sm" : "text-xs"}`}>
                      − {item.modifiers.ingredientsRemoved.map((entry) => entry.name).join(", ")}
                    </div>
                  ) : null}
                </button>
              </li>
            );
          })}

          {hiddenItems > 0 ? (
            <li class="text-[11px] font-semibold text-admin-faint">
              +{hiddenItems} línea{hiddenItems === 1 ? "" : "s"} más
            </li>
          ) : null}
        </ul>

        {/* Avisos: solo lo que cambia la preparación o la entrega. */}
        {order.notes ? (
          <div class={`mt-2 rounded-admin bg-amber-400/10 px-2 py-1.5 text-amber-100 ${pase ? "text-sm" : "text-xs"}`}>
            {order.notes}
          </div>
        ) : null}

        {order.adminInternalNote ? (
          <div class={`mt-1.5 rounded-admin bg-cyan-400/10 px-2 py-1.5 text-cyan-100 ${pase ? "text-sm" : "text-xs"}`}>
            {order.adminInternalNote}
          </div>
        ) : null}

        {order.forcedPickup ? (
          <div class="mt-1.5 text-[11px] font-semibold text-amber-300">
            Forzado a recogida{order.forcedReason ? ` · ${order.forcedReason}` : ""}
          </div>
        ) : null}

        {order.lastAdminEvent ? (
          <div class="mt-1.5 truncate text-[11px] text-violet-300/80" title={`${order.lastAdminEvent.title} · ${order.lastAdminEvent.detail}`}>
            {order.lastAdminEvent.detail}
            {order.lastAdminEvent.by ? ` · ${order.lastAdminEvent.by}` : ""}
          </div>
        ) : null}

        {order.type === "DELIVERY" && order.address?.line1 ? (
          <div class={`mt-2 text-admin-muted ${pase ? "text-sm" : "text-xs"}`}>
            {order.address.line1}
            {order.address.city ? ` · ${order.address.city}` : ""}
          </div>
        ) : null}

        {/* Pie: cliente y cobro, secundarios frente a las líneas. */}
        <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-admin-border pt-2 text-[11px] text-admin-muted">
          {doneCount > 0 ? (
            <span class={`${pill} ${allLinesDone ? "bg-emerald-400/20 text-emerald-300" : "bg-white/[0.06] text-slate-300"}`}>
              {doneCount}/{order.items.length} listas
            </span>
          ) : null}
          <span class="truncate font-medium text-slate-300">{order.customerName || "Cliente"}</span>
          {order.customerPhone ? <span class="tabular-nums">{order.customerPhone}</span> : null}
          <span class="tabular-nums">{money(order.totalCents)}</span>
          <span class={`${pill} ${paymentPillClass(order.paymentStatus)}`}>
            {order.paymentMethod ? `${order.paymentMethod} · ` : ""}{order.paymentStatus}
          </span>
          {order.couponCode ? <span class={`${pill} bg-violet-400/15 text-violet-300`}>{order.couponCode}</span> : null}
          {!pase ? <span class={`${pill} ${statusPillClass(order.status)}`}>{order.status}</span> : null}
        </div>
      </div>

      {/* Acciones: la principal ocupa el ancho para poder pulsarla sin apuntar. */}
      <div class="flex items-stretch gap-1.5 border-t border-admin-border px-2 py-2">
        {primary ? (
          <button
            type="button"
            class={`flex-1 rounded-admin bg-sky-500 font-semibold text-slate-950 transition hover:bg-sky-400 ${
              pase ? "px-3 py-2.5 text-base" : "px-3 py-2 text-xs"
            }`}
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
            class={`rounded-admin bg-emerald-400/15 font-semibold text-emerald-300 transition hover:bg-emerald-400/25 ${
              pase ? "px-3 py-2.5 text-base" : "px-2.5 py-2 text-xs"
            }`}
            onClick={() => {
              void props.onUpdate(order.publicId, { paymentStatus: "PAID" });
            }}
            title="Marcar como cobrado"
          >
            Cobrado
          </button>
        ) : null}

        {!pase ? (
          <>
            <a
              class="inline-flex items-center rounded-admin border border-admin-border px-2.5 py-2 text-xs font-semibold text-admin-muted transition hover:bg-white/[0.06] hover:text-white"
              href={`/admin/pedidos/${order.publicId}`}
            >
              Ver
            </a>
            <a
              class="inline-flex items-center rounded-admin border border-admin-border px-2.5 py-2 text-xs font-semibold text-admin-muted transition hover:bg-white/[0.06] hover:text-white"
              href={`/admin/pedidos/ticket/${order.publicId}?print=1`}
              target="_blank"
              rel="noreferrer"
            >
              Ticket
            </a>
            <button
              type="button"
              class="inline-flex items-center rounded-admin border border-admin-border px-2.5 py-2 text-xs font-semibold text-rose-300/80 transition hover:bg-rose-400/10 hover:text-rose-300"
              onClick={() => {
                void props.onUpdate(order.publicId, { status: "CANCELLED" });
              }}
              title="Cancelar pedido"
            >
              ✕
            </button>
          </>
        ) : (
          <a
            class="inline-flex items-center rounded-admin border border-admin-border px-3 py-2.5 text-base font-semibold text-admin-muted transition hover:bg-white/[0.06] hover:text-white"
            href={`/admin/pedidos/ticket/${order.publicId}?print=1`}
            target="_blank"
            rel="noreferrer"
          >
            Ticket
          </a>
        )}
      </div>
    </article>
  );
}