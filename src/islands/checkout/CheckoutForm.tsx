import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";

type Availability = {
  now: string;
  isOpen: boolean;
  kitchenOpen: boolean;
  deliveryAvailable: boolean;
  windows: { delivery: { start: string; end: string } };
};

type PaymentsSettings = {
  delivery: { cashEnabled: boolean; cardEnabled: boolean };
  pickup: { cashEnabled: boolean; cardEnabled: boolean };
};

type CartResponse = {
  currency: "EUR";
  items: Array<{
    lineId: string;
    name: string;
    qty: number;
    lineTotalCents: number;

    baseLineTotalCents: number;

    modifierDetails?: Array<{ id: number; name: string; deltaCents: number }>;
    addedIngredientDetails?: Array<{ id: number; name: string; deltaCents: number }>;

    removedLines?: string[];
    variantLabel?: string | null;
  }>;
  subtotalCents: number;
};

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

export default function CheckoutForm() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [avail, setAvail] = useState<Availability | null>(null);
  const [payments, setPayments] = useState<PaymentsSettings | null>(null);

  const [loading, setLoading] = useState(true);

  const [type, setType] = useState<"DELIVERY" | "PICKUP">("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Lloret de Mar");
  const [postalCode, setPostalCode] = useState("");
  const [addressNotes, setAddressNotes] = useState("");

  const [orderNotes, setOrderNotes] = useState("");

  const deliveryDisabled = useMemo(() => !avail?.deliveryAvailable, [avail]);

  const deliveryFeeCents = useMemo(() => {
    if (type !== "DELIVERY") return 0;
    return avail?.deliveryFeeCents ?? 0;
  }, [type, avail]);

  const totalCents = useMemo(() => {
    if (!cart) return 0;
    return cart.subtotalCents + deliveryFeeCents;
  }, [cart, deliveryFeeCents]);


  const cashEnabled = useMemo(() => {
    if (!payments) return true;
    return type === "DELIVERY"
      ? payments.delivery.cashEnabled
      : payments.pickup.cashEnabled;
  }, [payments, type]);

  const cardEnabled = useMemo(() => {
    if (!payments) return true;
    return type === "DELIVERY"
      ? payments.delivery.cardEnabled
      : payments.pickup.cardEnabled;
  }, [payments, type]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [c, a, p] = await Promise.all([
          api<CartResponse>("/api/cart/summary"),
          api<Availability>("/api/checkout/availability"),
          api<PaymentsSettings>("/api/settings/payments"),
        ]);

        setCart(c);
        setAvail(a);
        setPayments(p);

        // tipo por defecto: entrega si está disponible, si no recogida
        setType(a.deliveryAvailable ? "DELIVERY" : "PICKUP");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!payments) return;

    const okCash =
      type === "DELIVERY"
        ? payments.delivery.cashEnabled
        : payments.pickup.cashEnabled;
    const okCard =
      type === "DELIVERY"
        ? payments.delivery.cardEnabled
        : payments.pickup.cardEnabled;

    if (paymentMethod === "CASH" && !okCash && okCard) setPaymentMethod("CARD");
    if (paymentMethod === "CARD" && !okCard && okCash) setPaymentMethod("CASH");

    // si ambos false, lo dejamos y el submit dará error (o lo bloqueamos luego)
  }, [payments, type, paymentMethod]);

  async function submit() {
    if (!cart || cart.items.length === 0) return;

    const payload = {
      type,
      paymentMethod,
      orderNotes,
      customerName,
      customerPhone,
      customerEmail,
      address: {
        contactName: customerName,
        phone: customerPhone,
        line1,
        line2,
        city,
        postalCode,
        notes: addressNotes,
      },
    };

    const res = await fetch("/api/checkout/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data?.message || data?.error || "Error al crear el pedido");
      return;
    }

    // si forzó recogida, avisamos (y seguimos)
    if (data.forcedPickup) {
      alert(
        `Reparto no disponible ahora. Pedido cambiado a RECOGIDA. ${data.forcedReason ?? ""
        }`
      );
    }

    window.location.href = `/pedido/${data.publicId}`;
  }

  if (loading)
    return <div class="mt-6 text-sm text-zinc-600">Cargando checkout…</div>;
  if (!cart || cart.items.length === 0)
    return <div class="mt-6 text-sm text-zinc-600">Tu carrito está vacío.</div>;

  return (
    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
      <div class="space-y-6">
        {/* Tipo */}
        <section class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Tipo de pedido</h2>

          {!avail?.deliveryAvailable ? (
            <div class="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Ahora mismo no hay reparto. Horario delivery:{" "}
              {avail?.windows.delivery.start}–{avail?.windows.delivery.end}. Tu
              pedido será <b>recogida</b>.
            </div>
          ) : null}

          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${type === "DELIVERY"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300"
                } ${deliveryDisabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setType("DELIVERY")}
              disabled={deliveryDisabled}
            >
              Entrega a domicilio
            </button>

            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${type === "PICKUP"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300"
                }`}
              onClick={() => setType("PICKUP")}
            >
              Recogida
            </button>
          </div>
        </section>

        {/* Contacto */}
        <section class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Datos de contacto</h2>

          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label class="text-sm font-medium">Nombre</label>
              <input
                class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                value={customerName}
                onInput={(e) =>
                  setCustomerName((e.target as HTMLInputElement).value)
                }
              />
            </div>

            <div>
              <label class="text-sm font-medium">Teléfono</label>
              <input
                class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                value={customerPhone}
                onInput={(e) =>
                  setCustomerPhone((e.target as HTMLInputElement).value)
                }
              />
            </div>

            <div class="sm:col-span-2">
              <label class="text-sm font-medium">Email (opcional)</label>
              <input
                class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                value={customerEmail}
                onInput={(e) =>
                  setCustomerEmail((e.target as HTMLInputElement).value)
                }
              />
            </div>
          </div>
        </section>

        {/* Dirección si DELIVERY */}
        {type === "DELIVERY" ? (
          <section class="rounded-2xl border border-zinc-200 p-5">
            <h2 class="text-lg font-semibold">Dirección</h2>

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="text-sm font-medium">Dirección</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={line1}
                  onInput={(e) =>
                    setLine1((e.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div class="sm:col-span-2">
                <label class="text-sm font-medium">
                  Piso/puerta (opcional)
                </label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={line2}
                  onInput={(e) =>
                    setLine2((e.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div>
                <label class="text-sm font-medium">Ciudad</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={city}
                  onInput={(e) => setCity((e.target as HTMLInputElement).value)}
                />
              </div>

              <div>
                <label class="text-sm font-medium">Código postal</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={postalCode}
                  onInput={(e) =>
                    setPostalCode((e.target as HTMLInputElement).value)
                  }
                />
              </div>

              <div class="sm:col-span-2">
                <label class="text-sm font-medium">
                  Notas de dirección (opcional)
                </label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={addressNotes}
                  onInput={(e) =>
                    setAddressNotes((e.target as HTMLInputElement).value)
                  }
                />
              </div>
            </div>
          </section>
        ) : null}

        {/* Pago */}
        <section class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Pago</h2>

          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CASH"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300"
                } ${!cashEnabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setPaymentMethod("CASH")}
              disabled={!cashEnabled}
            >
              Efectivo
            </button>

            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CARD"
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300"
                } ${!cardEnabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setPaymentMethod("CARD")}
              disabled={!cardEnabled}
            >
              Tarjeta
            </button>

            {payments &&
              (!cashEnabled && !cardEnabled ? (
                <div class="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                  Ahora mismo no hay métodos de pago disponibles para este tipo
                  de pedido. Ajusta los métodos en Admin.
                </div>
              ) : null)}

          </div>

          <p class="mt-2 text-xs text-zinc-600">
            (Por ahora solo guardamos la preferencia. La pasarela Stripe la
            conectamos después.)
          </p>
        </section>

        {/* Notas pedido */}
        <section class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Comentarios del pedido</h2>
          <p class="mt-1 text-sm text-zinc-600">
            Para cosas como “más hecho”, “sin sal”, etc. (no ingredientes).
          </p>
          <textarea
            class="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            rows={3}
            value={orderNotes}
            onInput={(e) =>
              setOrderNotes((e.target as HTMLTextAreaElement).value)
            }
          />
        </section>
      </div>

      {/* Resumen */}
      <aside class="lg:sticky lg:top-4 lg:h-fit">
        <div class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Resumen</h2>

          <div class="mt-4 space-y-4 text-sm">
            {cart.items.map((it) => {
              const extras = [
                ...(it.modifierDetails ?? []).map((x) => ({ label: x.name, deltaCents: x.deltaCents })),
                ...(it.addedIngredientDetails ?? []).map((x) => ({ label: x.name, deltaCents: x.deltaCents })),
              ];

              return (
                <div key={it.lineId} class="rounded-2xl border border-zinc-200 p-4">
                  {/* Producto */}
                  <div class="flex items-baseline justify-between gap-3">
                    <div class="min-w-0 truncate font-semibold">
                      {it.qty}× {it.name}
                    </div>
                    <div class="shrink-0 font-semibold">{money(it.baseLineTotalCents)}</div>
                  </div>

                  {it.variantLabel ? (
                    <div class="mt-1 text-xs text-zinc-600">{it.variantLabel}</div>
                  ) : null}

                  {/* Extras con precio a la derecha */}
                  {extras.length ? (
                    <div class="mt-2 space-y-1">
                      {extras.map((e) => (
                        <div class="flex items-baseline justify-between gap-3 text-xs text-zinc-600">
                          <div class="min-w-0 truncate">Extras: {e.label}</div>
                          <div class="shrink-0 font-medium">
                            +{money((e.deltaCents ?? 0) * (it.qty ?? 1))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* Quitados (sin precio) */}
                  {it.removedLines?.length ? (
                    <div class="mt-2 space-y-1 text-xs text-zinc-600">
                      {it.removedLines.map((l) => (
                        <div>{l}</div>
                      ))}
                    </div>
                  ) : null}

                  {/* Línea “fantasma” total */}
                  <div class="mt-3 flex items-baseline justify-between gap-3 border-t border-zinc-100 pt-3">
                    <div class="text-xs text-zinc-500">Total producto</div>
                    <div class="font-semibold">{money(it.lineTotalCents)}</div>
                  </div>
                </div>
              );
            })}
          </div>


          <div class="mt-4 border-t border-zinc-200 pt-4 flex items-center justify-between text-sm">
            <span class="text-zinc-600">Subtotal</span>
            <span class="font-semibold">{money(cart.subtotalCents)}</span>
          </div>

          {type === "DELIVERY" ? (
            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-zinc-600">Delivery</span>
              <span class="font-semibold">{money(deliveryFeeCents)}</span>
            </div>
          ) : null}

          <div class="mt-3 flex items-center justify-between text-sm">
            <span class="text-zinc-600">Total</span>
            <span class="text-base font-semibold">{money(totalCents)}</span>
          </div>

          <button
            class={`mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${avail?.pauseOrders ? "opacity-60 pointer-events-none" : ""
              }`}
            type="button"
            onClick={submit}
            disabled={!!avail?.pauseOrders}
          >
            Confirmar pedido
          </button>

        </div>
      </aside>
    </div>
  );
}
