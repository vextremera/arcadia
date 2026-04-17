import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";

type Availability = {
  now: string;
  pauseOrders: boolean;
  forcePickup: boolean;
  deliveryFeeCents: number;
  deliveryMessage?: string;
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

type CouponPreviewResponse =
  | {
      ok: true;
      couponId: number;
      code: string;
      type: "PERCENT" | "FIXED" | "FREE_DELIVERY";
      value: number;
      discountCents: number;
      minSubtotalCents: number | null;
      maxUses: number | null;
      usesCount: number;
      requiredTierId: number | null;
      requiredTierName: string | null;
      message: string;
    }
  | {
      ok: false;
      error: string;
      message: string;
    };

function money(cents: number) {
  return `${(cents / 100).toFixed(2)} €`;
}

async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
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

  const [initialProfileName, setInitialProfileName] = useState("");
  const [initialProfilePhone, setInitialProfilePhone] = useState("");

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("Lloret de Mar");
  const [postalCode, setPostalCode] = useState("");
  const [addressNotes, setAddressNotes] = useState("");

  const [orderNotes, setOrderNotes] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | "">("");

  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState<CouponPreviewResponse | null>(null);
  const [couponFeedback, setCouponFeedback] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const deliveryDisabled = useMemo(() => !avail?.deliveryAvailable, [avail]);

  const deliveryFeeCents = useMemo(() => {
    if (type !== "DELIVERY") return 0;
    return avail?.deliveryFeeCents ?? 0;
  }, [type, avail]);

  const couponDiscountCents = useMemo(() => {
    return couponPreview?.ok ? couponPreview.discountCents : 0;
  }, [couponPreview]);

  const totalCents = useMemo(() => {
    if (!cart) return 0;
    return Math.max(0, cart.subtotalCents + deliveryFeeCents - couponDiscountCents);
  }, [cart, deliveryFeeCents, couponDiscountCents]);

  const cashEnabled = useMemo(() => {
    if (!payments) return true;
    return type === "DELIVERY" ? payments.delivery.cashEnabled : payments.pickup.cashEnabled;
  }, [payments, type]);

  const cardEnabled = useMemo(() => {
    if (!payments) return true;
    return type === "DELIVERY" ? payments.delivery.cardEnabled : payments.pickup.cardEnabled;
  }, [payments, type]);

  function applyAddress(address: AddressDto) {
    setLine1(address.line1 ?? "");
    setLine2(address.line2 ?? "");
    setCity(address.city ?? "Lloret de Mar");
    setPostalCode(address.postalCode ?? "");
    setAddressNotes(address.notes ?? "");

    if (!nameDirty) setCustomerName(address.contactName ?? "");
    if (!phoneDirty) setCustomerPhone(address.phone ?? "");

    setSaveThisAddress(false);
    setSaveAsDefault(false);
    setSaveAddressLabel("");
  }

  async function applyCoupon(codeOverride?: string, silent = false) {
    if (!cart) return;

    const nextCode = String(codeOverride ?? couponCode).trim();
    if (!nextCode) {
      setCouponPreview(null);
      if (!silent) setCouponFeedback(null);
      return;
    }

    setCouponLoading(true);

    try {
      const res = await fetch("/api/checkout/coupon", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          code: nextCode,
          type,
          subtotalCents: cart.subtotalCents,
          deliveryFeeCents,
        }),
      });

      const data = (await res.json().catch(() => null)) as CouponPreviewResponse | null;
      if (!data) {
        setCouponPreview(null);
        setCouponFeedback({
          tone: "error",
          message: "No se ha podido validar el cupón.",
        });
        return;
      }

      if (data.ok) {
        setCouponCode(data.code);
        setCouponPreview(data);
        setCouponFeedback({
          tone: "success",
          message: data.message,
        });
      } else {
        setCouponPreview(null);
        setCouponFeedback({
          tone: "error",
          message: data.message,
        });
      }
    } finally {
      setCouponLoading(false);
    }
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

        const profile = await safeJson<ProfileResponse>("/api/account/profile");
        if (profile?.ok && profile.user?.role === "CUSTOMER") {
          setIsLoggedIn(true);

          const initialName = profile.user.name ?? "";
          const initialPhone = profile.profile?.phone ?? "";

          setInitialProfileName(initialName);
          setInitialProfilePhone(initialPhone);

          if (initialName) setCustomerName(initialName);
          if (profile.user.email) setCustomerEmail(profile.user.email);
          if (initialPhone) setCustomerPhone(initialPhone);

          const addressResponse = await safeJson<AddressesResponse>("/api/account/addresses");
          const list = addressResponse?.ok ? addressResponse.addresses ?? [] : [];
          setSavedAddresses(list);

          const lastIdRaw =
            typeof window !== "undefined" ? window.localStorage.getItem(LAST_ADDRESS_KEY) : null;
          const lastId = lastIdRaw ? Number(lastIdRaw) : NaN;

          const last = Number.isFinite(lastId)
            ? list.find((item) => item.id === lastId)
            : undefined;
          const def = list.find((item) => item.isDefault);
          const chosen = last ?? def ?? list[0];

          if (chosen) {
            setSelectedAddressId(chosen.id);
            applyAddress(chosen);
          } else {
            setSaveThisAddress(true);
          }
        } else {
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!payments) return;

    const okCash =
      type === "DELIVERY" ? payments.delivery.cashEnabled : payments.pickup.cashEnabled;
    const okCard =
      type === "DELIVERY" ? payments.delivery.cardEnabled : payments.pickup.cardEnabled;

    if (paymentMethod === "CASH" && !okCash && okCard) setPaymentMethod("CARD");
    if (paymentMethod === "CARD" && !okCard && okCash) setPaymentMethod("CASH");
  }, [payments, type, paymentMethod]);

  useEffect(() => {
    if (type !== "DELIVERY") {
      setSaveThisAddress(false);
      setSaveAsDefault(false);
      setSaveAddressLabel("");
    }
  }, [type]);

  useEffect(() => {
    if (!couponPreview?.ok) return;
    if (!cart) return;

    void applyCoupon(couponPreview.code, true);
  }, [type, deliveryFeeCents]);

  const deliveryNotice = useMemo(() => {
    if (avail?.deliveryMessage?.trim()) return avail.deliveryMessage.trim();
    return `Fuera de horario de reparto (${avail?.windows.delivery.start ?? ""}–${avail?.windows.delivery.end ?? ""}).`;
  }, [avail]);

  async function makeDefaultFromCheckout() {
    if (!isLoggedIn) return;
    if (!selectedAddressId) return;

    try {
      const res = await api<any>("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify({ id: selectedAddressId, isDefault: true }),
      });
      if (!res?.ok) throw new Error(res?.error || "No se pudo marcar como default.");

      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(selectedAddressId));
      } catch {}

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
      couponCode: couponPreview?.ok ? couponPreview.code : undefined,
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
      saveProfile: shouldSaveProfile,
      saveAddress: isLoggedIn && type === "DELIVERY" && saveThisAddress && !selectedAddressId,
      saveAddressDefault:
        isLoggedIn &&
        type === "DELIVERY" &&
        saveThisAddress &&
        saveAsDefault &&
        !selectedAddressId,
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

    if (data?.savedAddressId) {
      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(data.savedAddressId));
      } catch {}
    }

    if (data.forcedPickup) {
      alert(`Reparto no disponible ahora. Pedido cambiado a RECOGIDA. ${data.forcedReason ?? ""}`);
    }

    window.location.href = `/pedido/${data.publicId}`;
  }

  if (loading) return <div class="mt-6 text-sm text-zinc-600">Cargando checkout…</div>;
  if (!cart || cart.items.length === 0) {
    return <div class="mt-6 text-sm text-zinc-600">Tu carrito está vacío.</div>;
  }

  return (
    <div class="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_30rem]">
      <div class="space-y-4 sm:space-y-6">
        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">Tipo de pedido</h2>

          {!avail?.deliveryAvailable ? (
            <div class="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div class="font-semibold">
                {avail?.forcePickup ? "Solo recogida" : "Delivery no disponible ahora"}
              </div>
              <p class="mt-1 leading-6">
                {deliveryNotice} Tu pedido será <b>recogida</b>.
              </p>
            </div>
          ) : null}

          <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${
                type === "DELIVERY" ? "bg-zinc-900 text-white" : "border border-zinc-300"
              } ${deliveryDisabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setType("DELIVERY")}
              disabled={deliveryDisabled}
            >
              Entrega a domicilio
            </button>

            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${
                type === "PICKUP" ? "bg-zinc-900 text-white" : "border border-zinc-300"
              }`}
              onClick={() => setType("PICKUP")}
            >
              Recogida
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">Datos de contacto</h2>

          <div class="mt-4 grid gap-3 lg:grid-cols-2">
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

            <div class="lg:col-span-2">
              <label class="text-sm font-medium">Email (opcional)</label>
              <input
                class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                value={customerEmail}
                onInput={(e) => setCustomerEmail((e.target as HTMLInputElement).value)}
              />
            </div>
          </div>
        </section>

        {type === "DELIVERY" ? (
          <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
            <div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start sm:gap-4">
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

                <div class="mt-1 flex flex-col gap-2 xl:flex-row xl:items-center">
                  <select
                    class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                    value={selectedAddressId}
                    onChange={(e) => {
                      const value = (e.target as HTMLSelectElement).value;
                      const id = value ? Number(value) : "";
                      setSelectedAddressId(id);

                      if (id) {
                        try {
                          window.localStorage.setItem(LAST_ADDRESS_KEY, String(id));
                        } catch {}
                      }

                      const address = savedAddresses.find((item) => item.id === id);
                      if (address) applyAddress(address);
                    }}
                  >
                    <option value="">— Introducir nueva —</option>
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {(address.label ? `${address.label} · ` : "")}
                        {address.line1} · {address.postalCode} {address.city}
                        {address.isDefault ? " (default)" : ""}
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

                <div class="mt-2 text-xs text-zinc-600">
                  Si eliges una guardada, no se volverá a guardar.
                </div>
              </div>
            ) : null}

            <div class="mt-4 grid gap-3 lg:grid-cols-2">
              <div class="lg:col-span-2">
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

              <div class="lg:col-span-2">
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

              <div class="lg:col-span-2">
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

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">Pago</h2>

          <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${
                paymentMethod === "CASH" ? "bg-zinc-900 text-white" : "border border-zinc-300"
              } ${!cashEnabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setPaymentMethod("CASH")}
              disabled={!cashEnabled}
            >
              Efectivo
            </button>

            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${
                paymentMethod === "CARD" ? "bg-zinc-900 text-white" : "border border-zinc-300"
              } ${!cardEnabled ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => setPaymentMethod("CARD")}
              disabled={!cardEnabled}
            >
              Tarjeta
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">Cupón</h2>

          <div class="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              class="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase tracking-[0.06em]"
              value={couponCode}
              onInput={(e) => {
                setCouponCode((e.target as HTMLInputElement).value.toUpperCase());
                setCouponPreview(null);
                setCouponFeedback(null);
              }}
              placeholder="BIENVENIDA10"
            />

            <div class="flex gap-2">
              <button
                type="button"
                class={`rounded-xl px-4 py-2 text-sm font-semibold ${
                  couponLoading ? "bg-zinc-400 text-white" : "bg-zinc-900 text-white"
                }`}
                onClick={() => applyCoupon()}
                disabled={couponLoading || !couponCode.trim()}
              >
                {couponLoading ? "Validando…" : "Aplicar"}
              </button>

              {couponPreview?.ok || couponCode.trim() ? (
                <button
                  type="button"
                  class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold"
                  onClick={() => {
                    setCouponCode("");
                    setCouponPreview(null);
                    setCouponFeedback(null);
                  }}
                >
                  Quitar
                </button>
              ) : null}
            </div>
          </div>

          {couponFeedback ? (
            <div
              class={`mt-3 rounded-xl p-3 text-sm ${
                couponFeedback.tone === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border border-rose-200 bg-rose-50 text-rose-900"
              }`}
            >
              {couponFeedback.message}
            </div>
          ) : null}
        </section>

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">Comentarios del pedido</h2>
          <p class="mt-1 text-sm text-zinc-600">
            Para cosas como “más hecho”, “sin sal”, etc. (no ingredientes).
          </p>
          <textarea
            class="mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
            rows={3}
            value={orderNotes}
            onInput={(e) => setOrderNotes((e.target as HTMLTextAreaElement).value)}
          />
        </section>
      </div>

      <aside class="xl:sticky xl:top-4 xl:h-fit">
        <div class="rounded-2xl border border-zinc-200 p-4 sm:p-5 2xl:p-6">
          <h2 class="text-lg font-semibold">Resumen</h2>

          <div class="mt-4 space-y-3 sm:space-y-4 text-sm">
            {cart.items.map((item) => (
              <div key={item.lineId} class="rounded-2xl border border-zinc-200 p-3 sm:p-4">
                <div class="flex items-baseline justify-between gap-3">
                  <div class="min-w-0 truncate font-semibold">
                    {item.qty}× {item.name}
                  </div>
                  <div class="shrink-0 font-semibold">{money(item.lineTotalCents)}</div>
                </div>

                {item.variantLabel ? (
                  <div class="mt-1 text-xs text-zinc-600">{item.variantLabel}</div>
                ) : null}
              </div>
            ))}
          </div>

          <div class="mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-sm">
            <span class="text-zinc-600">Subtotal</span>
            <span class="font-semibold">{money(cart.subtotalCents)}</span>
          </div>

          {type === "DELIVERY" ? (
            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-zinc-600">Delivery</span>
              <span class="font-semibold">{money(deliveryFeeCents)}</span>
            </div>
          ) : null}

          {couponPreview?.ok ? (
            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-zinc-600">Cupón · {couponPreview.code}</span>
              <span class="font-semibold text-emerald-700">
                - {money(couponPreview.discountCents)}
              </span>
            </div>
          ) : null}

          <div class="mt-3 flex items-center justify-between text-sm">
            <span class="text-zinc-600">Total</span>
            <span class="text-base font-semibold">{money(totalCents)}</span>
          </div>

          <button
            class={`mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${
              avail?.pauseOrders ? "opacity-60 pointer-events-none" : ""
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