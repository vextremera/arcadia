import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";

type Availability = {
  now: string;

  pauseOrders: boolean;
  forcePickup: boolean;
  deliveryFeeCents: number;

  isOpen: boolean;
  kitchenOpen: boolean;
  deliveryAvailable: boolean;

  windows: {
    open: { start: string; end: string };
    kitchen: { start: string; end: string };
    delivery: { start: string; end: string };
  };
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

type ProfileResponse = {
  ok: boolean;
  user?: { id: number; email: string; name: string | null; role: string };
  profile?: {
    phone: string | null;
    birthday: string | null;
    pointsBalance: number;
    tierId: number | null;
  };
  error?: string;
};

type AddressDto = {
  id: number;
  label: string | null;
  contactName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  postalCode: string;
  notes: string | null;
  lat: number | null;
  lng: number | null;
  isDefault: boolean;
};

type AddressesResponse = { ok: boolean; addresses?: AddressDto[]; error?: string };

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

// fetch “tolerante”: si estás anónimo, no rompe el checkout
async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizeOptionalString(v: string) {
  const t = v.trim();
  return t ? t : undefined;
}

const LAST_ADDRESS_KEY = "arcadia:lastAddressId";

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

  const [nameDirty, setNameDirty] = useState(false);
  const [phoneDirty, setPhoneDirty] = useState(false);

  // para micro-mejora saveProfile
  const [initialProfileName, setInitialProfileName] = useState("");
  const [initialProfilePhone, setInitialProfilePhone] = useState("");

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Lloret de Mar");
  const [postalCode, setPostalCode] = useState("");
  const [addressNotes, setAddressNotes] = useState("");

  const [orderNotes, setOrderNotes] = useState("");

  // Cuenta / direcciones
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");

  // Guardar dirección desde checkout
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState("");

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
    return type === "DELIVERY" ? payments.delivery.cashEnabled : payments.pickup.cashEnabled;
  }, [payments, type]);

  const cardEnabled = useMemo(() => {
    if (!payments) return true;
    return type === "DELIVERY" ? payments.delivery.cardEnabled : payments.pickup.cardEnabled;
  }, [payments, type]);

  function applyAddress(a: AddressDto) {
    setLine1(a.line1 ?? "");
    setLine2(a.line2 ?? "");
    setCity(a.city ?? "Lloret de Mar");
    setPostalCode(a.postalCode ?? "");
    setAddressNotes(a.notes ?? "");

    // Si el usuario no ha tocado los inputs, usamos contacto/teléfono de esa dirección
    if (!nameDirty) setCustomerName(a.contactName ?? "");
    if (!phoneDirty) setCustomerPhone(a.phone ?? "");

    // Si escoges una guardada, no tiene sentido “guardar”
    setSaveThisAddress(false);
    setSaveAsDefault(false);
    setSaveAddressLabel("");
  }

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

        setType(a.deliveryAvailable ? "DELIVERY" : "PICKUP");

        // Prefill si hay sesión
        const prof = await safeJson<ProfileResponse>("/api/account/profile");
        if (prof?.ok && prof.user?.role === "CUSTOMER") {
          setIsLoggedIn(true);

          const initName = prof.user.name ?? "";
          const initPhone = prof.profile?.phone ?? "";

          setInitialProfileName(initName);
          setInitialProfilePhone(initPhone);

          if (initName) setCustomerName(initName);
          if (prof.user.email) setCustomerEmail(prof.user.email);
          if (initPhone) setCustomerPhone(initPhone);

          const addr = await safeJson<AddressesResponse>("/api/account/addresses");
          const list = addr?.ok ? addr.addresses ?? [] : [];
          setSavedAddresses(list);

          const lastIdRaw =
            typeof window !== "undefined" ? window.localStorage.getItem(LAST_ADDRESS_KEY) : null;
          const lastId = lastIdRaw ? Number(lastIdRaw) : NaN;

          const last = Number.isFinite(lastId) ? list.find((x) => x.id === lastId) : undefined;
          const def = list.find((x) => x.isDefault);
          const chosen = last ?? def ?? list[0];

          if (chosen) {
            setSelectedAddressId(chosen.id);
            applyAddress(chosen);
          } else {
            // si estás logueado y no tienes direcciones, sugerimos guardarla
            setSaveThisAddress(true);
          }
        } else {
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!payments) return;

    const okCash = type === "DELIVERY" ? payments.delivery.cashEnabled : payments.pickup.cashEnabled;
    const okCard = type === "DELIVERY" ? payments.delivery.cardEnabled : payments.pickup.cardEnabled;

    if (paymentMethod === "CASH" && !okCash && okCard) setPaymentMethod("CARD");
    if (paymentMethod === "CARD" && !okCard && okCash) setPaymentMethod("CASH");
  }, [payments, type, paymentMethod]);

  // Si cambias a PICKUP, no mostramos dirección ni guardado
  useEffect(() => {
    if (type !== "DELIVERY") {
      setSaveThisAddress(false);
      setSaveAsDefault(false);
      setSaveAddressLabel("");
    }
  }, [type]);

  async function makeDefaultFromCheckout() {
    if (!isLoggedIn) return;
    if (!selectedAddressId) return;

    try {
      const res = await api<any>("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify({ id: selectedAddressId, isDefault: true }),
      });
      if (!res?.ok) throw new Error(res?.error || "No se pudo marcar como default.");

      // guardar como “última”
      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(selectedAddressId));
      } catch { }

      // refrescar lista local
      const addr = await safeJson<AddressesResponse>("/api/account/addresses");
      const list = addr?.ok ? addr.addresses ?? [] : [];
      setSavedAddresses(list);

      alert("Dirección marcada como default.");
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudo marcar como default.");
    }
  }

  async function submit() {
    if (!cart || cart.items.length === 0) return;

    const currentName = customerName.trim();
    const currentPhone = customerPhone.trim();

    const shouldSaveProfile =
      isLoggedIn &&
      ((currentName && currentName !== initialProfileName) ||
        (currentPhone && currentPhone !== initialProfilePhone));

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

      // ✅ guardar perfil (best-effort) solo si hay cambios
      saveProfile: shouldSaveProfile,

      // ✅ guardar dirección (si es nueva)
      saveAddress: isLoggedIn && type === "DELIVERY" && saveThisAddress && !selectedAddressId,
      saveAddressDefault:
        isLoggedIn && type === "DELIVERY" && saveThisAddress && saveAsDefault && !selectedAddressId,
      saveAddressLabel:
        isLoggedIn && type === "DELIVERY" && saveThisAddress && !selectedAddressId
          ? saveAddressLabel.trim()
          : undefined,
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

    // ✅ si el backend guardó/actualizó una address desde checkout, la recordamos como última
    if (data?.savedAddressId) {
      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(data.savedAddressId));
      } catch { }
    }

    if (data.forcedPickup) {
      alert(`Reparto no disponible ahora. Pedido cambiado a RECOGIDA. ${data.forcedReason ?? ""}`);
    }

    window.location.href = `/pedido/${data.publicId}`;
  }

  if (loading) return <div class="mt-6 text-sm text-zinc-600">Cargando checkout…</div>;
  if (!cart || cart.items.length === 0) return <div class="mt-6 text-sm text-zinc-600">Tu carrito está vacío.</div>;

  return (
    <div class="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
      <div class="space-y-6">
        {/* Tipo */}
        <section class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Tipo de pedido</h2>

          {!avail?.deliveryAvailable ? (
            <div class="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Ahora mismo no hay reparto. Horario delivery: {avail?.windows.delivery.start}–{avail?.windows.delivery.end}.
              Tu pedido será <b>recogida</b>.
            </div>
          ) : null}

          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${type === "DELIVERY" ? "bg-zinc-900 text-white" : "border border-zinc-300"
                } ${deliveryDisabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setType("DELIVERY")}
              disabled={deliveryDisabled}
            >
              Entrega a domicilio
            </button>

            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${type === "PICKUP" ? "bg-zinc-900 text-white" : "border border-zinc-300"
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
                onInput={(e) => {
                  setNameDirty(true);
                  setCustomerName((e.target as HTMLInputElement).value);
                }}
              />
            </div>

            <div>
              <label class="text-sm font-medium">Teléfono</label>
              <input
                class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                value={customerPhone}
                onInput={(e) => {
                  setPhoneDirty(true);
                  setCustomerPhone((e.target as HTMLInputElement).value);
                }}
              />
            </div>

            <div class="sm:col-span-2">
              <label class="text-sm font-medium">Email (opcional)</label>
              <input
                class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                value={customerEmail}
                onInput={(e) => setCustomerEmail((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
        </section>

        {/* Dirección si DELIVERY */}
        {type === "DELIVERY" ? (
          <section class="rounded-2xl border border-zinc-200 p-5">
            <div class="flex items-start justify-between gap-4">
              <h2 class="text-lg font-semibold">Dirección</h2>

              {isLoggedIn ? (
                <a
                  class="text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900"
                  href="/cuenta"
                >
                  Mi cuenta
                </a>
              ) : null}
            </div>

            {isLoggedIn && savedAddresses.length ? (
              <div class="mt-3">
                <label class="text-sm font-medium">Usar dirección guardada</label>

                <div class="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    value={selectedAddressId}
                    onChange={(e) => {
                      const v = (e.target as HTMLSelectElement).value;
                      const id = v ? Number(v) : "";
                      setSelectedAddressId(id);

                      if (id) {
                        try {
                          window.localStorage.setItem(LAST_ADDRESS_KEY, String(id));
                        } catch { }
                      }

                      const a = savedAddresses.find((x) => x.id === id);
                      if (a) applyAddress(a);
                    }}
                  >
                    <option value="">— Introducir nueva —</option>
                    {savedAddresses.map((a) => (
                      <option key={a.id} value={a.id}>
                        {(a.label ? `${a.label} · ` : "")}
                        {a.line1} · {a.postalCode} {a.city}
                        {a.isDefault ? " (default)" : ""}
                      </option>
                    ))}
                  </select>

                  {selectedAddressId ? (
                    <button
                      type="button"
                      class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
                      onClick={makeDefaultFromCheckout}
                    >
                      Hacer default
                    </button>
                  ) : null}
                </div>

                <div class="mt-2 text-xs text-zinc-600">Si eliges una guardada, no se volverá a guardar.</div>
              </div>
            ) : null}

            <div class="mt-4 grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <label class="text-sm font-medium">Dirección</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={line1}
                  onInput={(e) => {
                    setLine1((e.target as HTMLInputElement).value);
                    if (selectedAddressId) setSelectedAddressId("");
                  }}
                />
              </div>

              <div class="sm:col-span-2">
                <label class="text-sm font-medium">Piso/puerta (opcional)</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={line2}
                  onInput={(e) => {
                    setLine2((e.target as HTMLInputElement).value);
                    if (selectedAddressId) setSelectedAddressId("");
                  }}
                />
              </div>

              <div>
                <label class="text-sm font-medium">Ciudad</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={city}
                  onInput={(e) => {
                    setCity((e.target as HTMLInputElement).value);
                    if (selectedAddressId) setSelectedAddressId("");
                  }}
                />
              </div>

              <div>
                <label class="text-sm font-medium">Código postal</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={postalCode}
                  onInput={(e) => {
                    setPostalCode((e.target as HTMLInputElement).value);
                    if (selectedAddressId) setSelectedAddressId("");
                  }}
                />
              </div>

              <div class="sm:col-span-2">
                <label class="text-sm font-medium">Notas de dirección (opcional)</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={addressNotes}
                  onInput={(e) => {
                    setAddressNotes((e.target as HTMLInputElement).value);
                    if (selectedAddressId) setSelectedAddressId("");
                  }}
                />
              </div>
            </div>

            {/* Guardar dirección */}
            {isLoggedIn && !selectedAddressId ? (
              <label class="mt-4 flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={saveThisAddress}
                  onChange={(e) => setSaveThisAddress((e.target as HTMLInputElement).checked)}
                />
                Guardar esta dirección en mi cuenta
              </label>
            ) : null}

            {isLoggedIn && !selectedAddressId && saveThisAddress ? (
              <div class="mt-3">
                <label class="text-sm font-medium">Etiqueta (opcional)</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={saveAddressLabel}
                  onInput={(e) => setSaveAddressLabel((e.target as HTMLInputElement).value)}
                  placeholder="Casa / Trabajo / Suegros…"
                />
              </div>
            ) : null}

            {isLoggedIn && !selectedAddressId && saveThisAddress ? (
              <label class="mt-2 flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={saveAsDefault}
                  onChange={(e) => setSaveAsDefault((e.target as HTMLInputElement).checked)}
                />
                Guardar como dirección default
              </label>
            ) : null}

            {!isLoggedIn ? (
              <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                Inicia sesión para guardar direcciones en tu cuenta.
              </div>
            ) : null}
          </section>
        ) : null}

        {/* Pago */}
        <section class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Pago</h2>

          <div class="mt-4 flex gap-2">
            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CASH" ? "bg-zinc-900 text-white" : "border border-zinc-300"
                } ${!cashEnabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setPaymentMethod("CASH")}
              disabled={!cashEnabled}
            >
              Efectivo
            </button>

            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CARD" ? "bg-zinc-900 text-white" : "border border-zinc-300"
                } ${!cardEnabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setPaymentMethod("CARD")}
              disabled={!cardEnabled}
            >
              Tarjeta
            </button>
          </div>
        </section>

        {/* Notas pedido */}
        <section class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Comentarios del pedido</h2>
          <p class="mt-1 text-sm text-zinc-600">Para cosas como “más hecho”, “sin sal”, etc. (no ingredientes).</p>
          <textarea
            class="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            rows={3}
            value={orderNotes}
            onInput={(e) => setOrderNotes((e.target as HTMLTextAreaElement).value)}
          />
        </section>
      </div>

      {/* Resumen */}
      <aside class="lg:sticky lg:top-4 lg:h-fit">
        <div class="rounded-2xl border border-zinc-200 p-5">
          <h2 class="text-lg font-semibold">Resumen</h2>

          <div class="mt-4 space-y-4 text-sm">
            {cart.items.map((it) => (
              <div key={it.lineId} class="rounded-2xl border border-zinc-200 p-4">
                <div class="flex items-baseline justify-between gap-3">
                  <div class="min-w-0 truncate font-semibold">
                    {it.qty}× {it.name}
                  </div>
                  <div class="shrink-0 font-semibold">{money(it.lineTotalCents)}</div>
                </div>

                {it.variantLabel ? <div class="mt-1 text-xs text-zinc-600">{it.variantLabel}</div> : null}
              </div>
            ))}
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