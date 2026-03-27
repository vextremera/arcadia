import { e as createComponent, k as renderComponent, r as renderTemplate, l as Fragment, m as maybeRenderHead } from '../../chunks/astro/server_CA5VZefa.mjs';
import 'piccolore';
import { $ as $$AdminLayout } from '../../chunks/AdminLayout_Ccjf6LBM.mjs';
import { useState, useRef, useEffect, useMemo } from 'preact/hooks';
import { jsxs, jsx } from 'preact/jsx-runtime';
export { renderers } from '../../renderers.mjs';

function money(cents) {
  return `${(Number(cents ?? 0) / 100).toFixed(2)} €`;
}
function minutesOpen(iso) {
  const openedAt = new Date(iso).getTime();
  const now = Date.now();
  return Math.max(0, Math.round((now - openedAt) / 6e4));
}
function ageLabel(iso) {
  const mins = minutesOpen(iso);
  if (mins <= 0) return "ahora";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}
function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Europe/Madrid"
  }).format(date);
}
function beep() {
  try {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
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
  }
}
function statusBadgeClass(status) {
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
function paymentStatusBadgeClass(status) {
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
function columnTone(key) {
  if (key === "new") return "border-amber-400/20 bg-amber-400/5";
  if (key === "kitchen") return "border-violet-400/20 bg-violet-400/5";
  if (key === "ready") return "border-emerald-400/20 bg-emerald-400/5";
  return "border-fuchsia-400/20 bg-fuchsia-400/5";
}
function sortByQueueTime(a, b) {
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}
function nextPrimaryAction(order) {
  if (order.status === "PENDING" || order.status === "PAID") {
    return {
      label: "Aceptar",
      status: "ACCEPTED"
    };
  }
  if (order.status === "ACCEPTED") {
    return {
      label: "Preparando",
      status: "PREPARING"
    };
  }
  if (order.status === "PREPARING") {
    return {
      label: "Marcar listo",
      status: "READY"
    };
  }
  if (order.status === "READY") {
    if (order.type === "DELIVERY") {
      return {
        label: "En reparto",
        status: "OUT_FOR_DELIVERY"
      };
    }
    return {
      label: "Entregado",
      status: "DELIVERED"
    };
  }
  if (order.status === "OUT_FOR_DELIVERY") {
    return {
      label: "Entregado",
      status: "DELIVERED"
    };
  }
  return null;
}
function quickVisibleItems(order, dense) {
  return order.items.slice(0, dense ? 3 : 5);
}
function KitchenBoard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dense, setDense] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState(null);
  const seenIds = useRef(/* @__PURE__ */ new Set());
  const firstLoad = useRef(true);
  async function load(options) {
    const silent = options?.silent ?? false;
    if (!silent) {
      if (loading) ; else {
        setRefreshing(true);
      }
    }
    setErr(null);
    try {
      const res = await fetch("/api/admin/kitchen/orders", {
        headers: {
          accept: "application/json"
        }
      });
      if (!res.ok) {
        const data2 = await res.json().catch(() => ({
          error: `HTTP ${res.status}`
        }));
        throw new Error(String(data2.error ?? `HTTP ${res.status}`));
      }
      const data = await res.json();
      const next = [...data.orders ?? []].sort(sortByQueueTime);
      const newOnes = next.filter((order) => !seenIds.current.has(order.publicId));
      if (!firstLoad.current && soundEnabled && newOnes.length > 0) {
        beep();
      }
      for (const order of next) {
        seenIds.current.add(order.publicId);
      }
      firstLoad.current = false;
      setOrders(next);
      setLastLoadedAt(data.now ?? (/* @__PURE__ */ new Date()).toISOString());
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
    };
  }, []);
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(() => {
      void load({
        silent: true
      });
    }, 8e3);
    return () => window.clearInterval(timer);
  }, [autoRefresh, soundEnabled]);
  async function postUpdate(publicId, patch) {
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
        body: fd
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(txt || "No se pudo actualizar el pedido.");
        return;
      }
      await load({
        silent: true
      });
    } finally {
      setBusyKey(null);
    }
  }
  const columns = useMemo(() => {
    const nuevos = orders.filter((order) => order.status === "PENDING" || order.status === "PAID").sort(sortByQueueTime);
    const cocina = orders.filter((order) => order.status === "ACCEPTED" || order.status === "PREPARING").sort(sortByQueueTime);
    const listos = orders.filter((order) => order.status === "READY").sort(sortByQueueTime);
    const reparto = orders.filter((order) => order.status === "OUT_FOR_DELIVERY").sort(sortByQueueTime);
    return {
      nuevos,
      cocina,
      listos,
      reparto
    };
  }, [orders]);
  const stats = useMemo(() => {
    const live = orders.length;
    const delivery = orders.filter((order) => order.type === "DELIVERY").length;
    const overdue = orders.filter((order) => minutesOpen(order.createdAt) >= 20).length;
    const withNotes = orders.filter((order) => order.notes || order.adminInternalNote || order.lastAdminEvent).length;
    return {
      live,
      delivery,
      overdue,
      withNotes
    };
  }, [orders]);
  return jsxs("section", {
    class: "rounded-[30px] border border-white/10 bg-white/5 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]",
    children: [jsxs("div", {
      class: "flex flex-wrap items-start justify-between gap-4",
      children: [jsxs("div", {
        children: [jsx("div", {
          class: "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500",
          children: "Board live"
        }), jsx("h2", {
          class: "mt-2 text-xl font-semibold tracking-tight text-white",
          children: "Flujo operativo de cocina"
        }), jsx("p", {
          class: "mt-2 max-w-3xl text-sm leading-6 text-slate-400",
          children: "Cola viva con acciones rápidas de estado, ticket compacto, notas internas y lectura clara de pickup vs delivery."
        })]
      }), jsxs("div", {
        class: "flex flex-wrap gap-2",
        children: [jsx("button", {
          type: "button",
          class: `inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${autoRefresh ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:border-emerald-400/30 hover:bg-emerald-400/15" : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"}`,
          onClick: () => setAutoRefresh((value) => !value),
          children: autoRefresh ? "Auto refresh ON" : "Auto refresh OFF"
        }), jsx("button", {
          type: "button",
          class: `inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${soundEnabled ? "border border-cyan-400/20 bg-cyan-400/10 text-cyan-300 hover:border-cyan-400/30 hover:bg-cyan-400/15" : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"}`,
          onClick: () => setSoundEnabled((value) => !value),
          children: soundEnabled ? "Sonido ON" : "Sonido OFF"
        }), jsx("button", {
          type: "button",
          class: `inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition ${dense ? "border border-violet-400/20 bg-violet-400/10 text-violet-300 hover:border-violet-400/30 hover:bg-violet-400/15" : "border border-white/10 bg-white/5 text-slate-200 hover:border-white/15 hover:bg-white/10 hover:text-white"}`,
          onClick: () => setDense((value) => !value),
          children: dense ? "Vista compacta" : "Vista amplia"
        }), jsx("button", {
          type: "button",
          class: "inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white",
          onClick: () => {
            void load();
          },
          children: refreshing ? "Refrescando…" : "Refrescar ahora"
        })]
      })]
    }), jsxs("div", {
      class: "mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4",
      children: [jsx(StatCard, {
        label: "Pedidos vivos",
        value: String(stats.live),
        helper: "Estados operativos abiertos",
        tone: "neutral"
      }), jsx(StatCard, {
        label: "Delivery",
        value: String(stats.delivery),
        helper: "Con reparto en curso",
        tone: "cyan"
      }), jsx(StatCard, {
        label: "Overdue",
        value: String(stats.overdue),
        helper: "20 min o más en cola",
        tone: "amber"
      }), jsx(StatCard, {
        label: "Con notas",
        value: String(stats.withNotes),
        helper: lastLoadedAt ? `Última carga ${formatDateTime(lastLoadedAt)}` : "Sincronizando",
        tone: "violet"
      })]
    }), loading ? jsx("div", {
      class: "mt-6 rounded-3xl border border-white/10 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-400",
      children: "Cargando pedidos…"
    }) : err ? jsxs("div", {
      class: "mt-6 rounded-3xl border border-rose-400/20 bg-rose-400/10 p-5 text-sm text-rose-200",
      children: ["Error: ", err]
    }) : jsxs("div", {
      class: "mt-6 grid gap-4 xl:grid-cols-2 2xl:grid-cols-4",
      children: [jsx(Column, {
        title: "Nuevos",
        hint: "PENDING / PAID",
        tone: "new",
        orders: columns.nuevos,
        dense,
        busyKey,
        onUpdate: postUpdate
      }), jsx(Column, {
        title: "En cocina",
        hint: "ACCEPTED / PREPARING",
        tone: "kitchen",
        orders: columns.cocina,
        dense,
        busyKey,
        onUpdate: postUpdate
      }), jsx(Column, {
        title: "Listos",
        hint: "READY",
        tone: "ready",
        orders: columns.listos,
        dense,
        busyKey,
        onUpdate: postUpdate
      }), jsx(Column, {
        title: "Reparto",
        hint: "OUT_FOR_DELIVERY",
        tone: "delivery",
        orders: columns.reparto,
        dense,
        busyKey,
        onUpdate: postUpdate
      })]
    })]
  });
}
function StatCard(props) {
  const toneClass = props.tone === "amber" ? "border-amber-400/20 bg-amber-400/10" : props.tone === "cyan" ? "border-cyan-400/20 bg-cyan-400/10" : props.tone === "violet" ? "border-violet-400/20 bg-violet-400/10" : "border-white/10 bg-white/5";
  return jsxs("article", {
    class: `rounded-3xl border p-5 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${toneClass}`,
    children: [jsx("div", {
      class: "text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500",
      children: props.label
    }), jsx("div", {
      class: "mt-3 text-2xl font-semibold tracking-tight text-white",
      children: props.value
    }), jsx("p", {
      class: "mt-2 text-sm text-slate-400",
      children: props.helper
    })]
  });
}
function Column(props) {
  return jsxs("div", {
    class: `rounded-3xl border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.18)] ${columnTone(props.tone)}`,
    children: [jsxs("div", {
      class: "flex items-start justify-between gap-3",
      children: [jsxs("div", {
        children: [jsx("div", {
          class: "text-lg font-semibold tracking-tight text-white",
          children: props.title
        }), jsx("div", {
          class: "mt-1 text-xs uppercase tracking-[0.16em] text-slate-400",
          children: props.hint
        })]
      }), jsx("div", {
        class: "inline-flex min-w-9 items-center justify-center rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs font-semibold text-slate-200",
        children: props.orders.length
      })]
    }), jsx("div", {
      class: "mt-4 space-y-3",
      children: props.orders.length === 0 ? jsx("div", {
        class: "rounded-2xl border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-500",
        children: "Sin pedidos en esta columna."
      }) : props.orders.map((order) => jsx(OrderCard, {
        order,
        dense: props.dense,
        busyKey: props.busyKey,
        onUpdate: props.onUpdate
      }, order.publicId))
    })]
  });
}
function OrderCard(props) {
  const {
    order,
    dense
  } = props;
  const primary = nextPrimaryAction(order);
  const visibleItems = quickVisibleItems(order, dense);
  const hiddenItems = Math.max(0, order.items.length - visibleItems.length);
  const ageMinutesValue = minutesOpen(order.createdAt);
  const isBusy = props.busyKey?.startsWith(`${order.publicId}:`) ?? false;
  const canQuickMarkPaid = order.paymentMethod === "CARD" && order.paymentStatus !== "PAID" && order.paymentStatus !== "REFUNDED" && order.paymentStatus !== "PARTIALLY_REFUNDED";
  return jsxs("article", {
    class: `rounded-3xl border border-white/10 bg-[#0f172a] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition ${isBusy ? "pointer-events-none opacity-60" : ""}`,
    children: [jsxs("div", {
      class: "flex items-start justify-between gap-3",
      children: [jsxs("div", {
        class: "min-w-0",
        children: [jsxs("div", {
          class: "flex flex-wrap items-center gap-2",
          children: [jsx("div", {
            class: "text-base font-semibold text-white",
            children: order.publicId
          }), jsx("span", {
            class: `inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${statusBadgeClass(order.status)}`,
            children: order.status
          }), jsx("span", {
            class: `inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${order.type === "DELIVERY" ? "border-cyan-400/20 bg-cyan-400/10 text-cyan-300" : "border-indigo-400/20 bg-indigo-400/10 text-indigo-300"}`,
            children: order.type
          }), order.paymentMethod ? jsx("span", {
            class: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300",
            children: order.paymentMethod
          }) : null, jsx("span", {
            class: `inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${paymentStatusBadgeClass(order.paymentStatus)}`,
            children: order.paymentStatus
          }), ageMinutesValue >= 20 ? jsx("span", {
            class: "inline-flex items-center rounded-full border border-rose-400/20 bg-rose-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-rose-300",
            children: ageLabel(order.createdAt)
          }) : jsx("span", {
            class: "inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300",
            children: ageLabel(order.createdAt)
          }), order.couponCode ? jsx("span", {
            class: "inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300",
            children: order.couponCode
          }) : null]
        }), jsx("div", {
          class: "mt-3 text-sm font-medium text-slate-200",
          children: order.customerName || "Cliente"
        }), jsxs("div", {
          class: "mt-1 text-xs text-slate-500",
          children: [order.customerPhone || "Sin teléfono", " · ", order.itemCount, " ud", order.itemCount === 1 ? "" : "s", " · ", money(order.totalCents)]
        }), order.type === "DELIVERY" && order.address?.line1 ? jsxs("div", {
          class: "mt-2 text-xs text-slate-400",
          children: [order.address.line1, order.address.city ? ` · ${order.address.city}` : ""]
        }) : null]
      }), jsxs("div", {
        class: "flex flex-col gap-2",
        children: [jsx("a", {
          class: "inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white",
          href: `/admin/pedidos/${order.publicId}`,
          children: "Ver"
        }), jsx("a", {
          class: "inline-flex items-center justify-center rounded-xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-300 transition hover:border-sky-400/30 hover:bg-sky-400/15",
          href: `/admin/pedidos/ticket/${order.publicId}?print=1`,
          target: "_blank",
          rel: "noreferrer",
          children: "Ticket"
        })]
      })]
    }), jsxs("div", {
      class: "mt-4 space-y-2",
      children: [visibleItems.map((item) => jsxs("div", {
        class: "rounded-2xl border border-white/10 bg-white/5 p-3",
        children: [jsxs("div", {
          class: "text-sm font-semibold text-white",
          children: [item.qty, "× ", item.nameSnapshot]
        }), item.variantSnapshot ? jsx("div", {
          class: "mt-1 text-xs text-slate-400",
          children: item.variantSnapshot
        }) : null, item.modifiers.modifierOptions.length ? jsxs("div", {
          class: "mt-2 text-xs text-slate-400",
          children: ["Extras: ", item.modifiers.modifierOptions.map((entry) => entry.name).join(", ")]
        }) : null, item.modifiers.ingredientsAdded.length ? jsxs("div", {
          class: "mt-1 text-xs text-slate-400",
          children: ["Añadidos: ", item.modifiers.ingredientsAdded.map((entry) => entry.name).join(", ")]
        }) : null, item.modifiers.ingredientsRemoved.length ? jsxs("div", {
          class: "mt-1 text-xs text-slate-400",
          children: ["Quitados: ", item.modifiers.ingredientsRemoved.map((entry) => entry.name).join(", ")]
        }) : null]
      }, item.id)), hiddenItems > 0 ? jsxs("div", {
        class: "rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400",
        children: ["+ ", hiddenItems, " línea", hiddenItems === 1 ? "" : "s", " más"]
      }) : null]
    }), Number(order.discountCents ?? 0) > 0 || Number(order.deliveryFeeCents ?? 0) > 0 ? jsxs("div", {
      class: "mt-4 flex flex-wrap gap-2",
      children: [Number(order.deliveryFeeCents ?? 0) > 0 ? jsxs("span", {
        class: "inline-flex items-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300",
        children: ["Fee ", money(order.deliveryFeeCents)]
      }) : null, Number(order.discountCents ?? 0) > 0 ? jsxs("span", {
        class: "inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300",
        children: ["-", money(order.discountCents)]
      }) : null]
    }) : null, order.forcedPickup ? jsxs("div", {
      class: "mt-4 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs text-amber-200",
      children: ["Forzado a recogida", order.forcedReason ? ` · ${order.forcedReason}` : ""]
    }) : null, order.notes ? jsxs("div", {
      class: "mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-xs text-slate-300",
      children: [jsx("span", {
        class: "font-semibold text-white",
        children: "Notas cliente:"
      }), " ", order.notes]
    }) : null, order.adminInternalNote ? jsxs("div", {
      class: "mt-3 rounded-2xl border border-amber-400/20 bg-amber-400/10 p-3 text-xs text-amber-100/85",
      children: [jsx("span", {
        class: "font-semibold text-white",
        children: "Nota interna:"
      }), " ", order.adminInternalNote]
    }) : null, order.lastAdminEvent ? jsxs("div", {
      class: "mt-3 rounded-2xl border border-violet-400/20 bg-violet-400/10 p-3 text-xs text-violet-100/85",
      children: [jsx("div", {
        class: "font-semibold text-white",
        children: order.lastAdminEvent.title
      }), jsx("div", {
        class: "mt-1",
        children: order.lastAdminEvent.detail
      }), jsxs("div", {
        class: "mt-2 text-[11px] text-violet-200/80",
        children: [formatDateTime(order.lastAdminEvent.at ?? null), order.lastAdminEvent.by ? ` · ${order.lastAdminEvent.by}` : ""]
      })]
    }) : null, jsxs("div", {
      class: "mt-4 flex flex-wrap gap-2",
      children: [primary ? jsx("button", {
        type: "button",
        class: "inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 transition hover:bg-sky-400",
        onClick: () => {
          void props.onUpdate(order.publicId, {
            status: primary.status
          });
        },
        children: primary.label
      }) : null, canQuickMarkPaid ? jsx("button", {
        type: "button",
        class: "inline-flex items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:border-emerald-400/30 hover:bg-emerald-400/15",
        onClick: () => {
          void props.onUpdate(order.publicId, {
            paymentStatus: "PAID"
          });
        },
        children: "Marcar cobrado"
      }) : null, jsx("button", {
        type: "button",
        class: "inline-flex items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:border-rose-400/30 hover:bg-rose-400/15",
        onClick: () => {
          void props.onUpdate(order.publicId, {
            status: "CANCELLED"
          });
        },
        children: "Cancelar"
      })]
    })]
  });
}

const $$Cocina = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "AdminLayout", $$AdminLayout, { "title": "Cocina \xB7 Admin \xB7 Arcadia", "heading": "Cocina", "description": "Board operativo final con refresco autom\xE1tico, atajos de estado, lectura compacta de tickets y visibilidad de notas internas y actividad reciente.", "actions": true }, { "actions": ($$result2) => renderTemplate`${renderComponent($$result2, "Fragment", Fragment, { "slot": "actions" }, { "default": ($$result3) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-wrap gap-3"> <a href="/admin/pedidos" class="inline-flex items-center justify-center rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400">
Ver pedidos
</a> <a href="/admin/operativa" class="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/15 hover:bg-white/10 hover:text-white">
Ver operativa
</a> </div> ` })}`, "default": ($$result2) => renderTemplate`  <section class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"> <div class="min-w-0"> ${renderComponent($$result2, "KitchenBoard", KitchenBoard, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/admin/KitchenBoard.tsx", "client:component-export": "default" })} </div> <aside class="space-y-6"> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Flujo
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Secuencia operativa
</h2> <div class="mt-6 space-y-3"> <div class="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-4"> <div class="text-sm font-semibold text-white">1. Entrada</div> <p class="mt-2 text-sm leading-6 text-amber-100/80">
Los pedidos nuevos entran en <code>PENDING</code> o <code>PAID</code>.
</p> </div> <div class="rounded-3xl border border-violet-400/20 bg-violet-400/10 p-4"> <div class="text-sm font-semibold text-white">2. Cocina</div> <p class="mt-2 text-sm leading-6 text-violet-100/80">
El bloque de cocina trabaja con <code>ACCEPTED</code> y <code>PREPARING</code>.
</p> </div> <div class="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4"> <div class="text-sm font-semibold text-white">3. Listo</div> <p class="mt-2 text-sm leading-6 text-emerald-100/80">
Cuando sale de cocina pasa a <code>READY</code>.
</p> </div> <div class="rounded-3xl border border-fuchsia-400/20 bg-fuchsia-400/10 p-4"> <div class="text-sm font-semibold text-white">4. Entrega</div> <p class="mt-2 text-sm leading-6 text-fuchsia-100/80">
Delivery pasa a <code>OUT_FOR_DELIVERY</code>. Pickup puede cerrarse directamente como <code>DELIVERED</code>.
</p> </div> </div> </section> <section class="rounded-[30px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]"> <div class="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
Criterio
</div> <h2 class="mt-2 text-xl font-semibold tracking-tight text-white">
Qué ve cocina
</h2> <div class="mt-6 space-y-4"> <div class="rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="text-sm font-semibold text-white">Ticket compacto</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Nombre del cliente, tiempo en cola, tipo de pedido, cobro, líneas y modificaciones clave.
</p> </div> <div class="rounded-3xl border border-white/10 bg-white/5 p-4"> <div class="text-sm font-semibold text-white">Nota interna y actividad</div> <p class="mt-2 text-sm leading-6 text-slate-400">
Si el pedido tiene nota interna o actividad reciente de staff, aparece visible también en board.
</p> </div> <div class="rounded-3xl border border-cyan-400/20 bg-cyan-400/10 p-4"> <div class="text-sm font-semibold text-cyan-200">Refresco controlado</div> <p class="mt-2 text-sm leading-6 text-cyan-100/80">
El board refresca solo, permite pausa y puede avisar con sonido cuando entran pedidos nuevos.
</p> </div> </div> </section> </aside> </section> ` })}`;
}, "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/cocina.astro", void 0);

const $$file = "C:/Users/VICTOR/Dev/arcadia/src/pages/admin/cocina.astro";
const $$url = "/admin/cocina";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Cocina,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
