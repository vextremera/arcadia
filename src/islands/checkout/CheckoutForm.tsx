import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";
import { getClientLang, type ClientSiteLang } from "@/islands/_shared/lang";
import { formatEuros as money } from "@/lib/money";

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
  deliveryAreaRule?: {
    enabled: boolean;
  };
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


async function safeJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizeAreaText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isDeliveryAreaAllowed(city: string, postalCode: string) {
  const normalizedCity = normalizeAreaText(city);
  const normalizedPostalCode = String(postalCode ?? "").trim();

  return normalizedCity === "lloret de mar" && normalizedPostalCode === "17310";
}

const LAST_ADDRESS_KEY = "arcadia:lastAddressId";


const checkoutCopy = {
  es: { loading: "Cargando checkout…", empty: "Tu carrito está vacío.", incompleteArea: "Completa ciudad y código postal para comprobar si entra en la zona de reparto.", outsideArea: "Esta dirección está fuera de la zona de reparto. Solo repartimos en Lloret de Mar (17310).", insideArea: "Dirección dentro de la zona de reparto.", couponError: "No se ha podido validar el cupón.", defaultError: "No se pudo marcar como default.", defaultOk: "Dirección marcada como default.", submitError: "Error al crear el pedido", pickupOnly: "Solo recogida", deliveryUnavailable: "Delivery no disponible ahora", orderType: "Tipo de pedido", delivery: "Delivery", pickup: "Recogida", contact: "Datos de contacto", name: "Nombre", phone: "Teléfono", emailOptional: "Email (opcional)", address: "Dirección", account: "Mi cuenta", savedAddress: "Usar dirección guardada", newAddress: "— Introducir nueva —", makeDefault: "Hacer default", defaultTag: " (default)", savedHint: "Si eliges una guardada, no se volverá a guardar.", floor: "Piso/puerta (opcional)", city: "Ciudad", postalCode: "Código postal", addressNotes: "Notas de dirección (opcional)", deliveryZone: "Zona de reparto", saveAddress: "Guardar esta dirección en mi cuenta", labelOptional: "Etiqueta (opcional)", labelPlaceholder: "Casa / Trabajo / Suegros…", saveDefault: "Guardar como dirección default", loginToSave: "Inicia sesión para guardar direcciones en tu cuenta.", payment: "Pago", paymentInfo: "Efectivo y tarjeta están disponibles tanto en delivery como en recogida.", cash: "Efectivo", card: "Tarjeta", coupon: "Cupón", apply: "Aplicar", validating: "Validando…", remove: "Quitar", orderComments: "Comentarios del pedido", orderCommentsHelp: "Para cosas como “más hecho”, “sin sal”, etc. (no ingredientes).", summary: "Resumen", subtotal: "Subtotal", total: "Total", confirm: "Confirmar pedido" },
  ca: { loading: "Carregant checkout…", empty: "El teu carret és buit.", incompleteArea: "Completa ciutat i codi postal per comprovar si entra dins la zona de repartiment.", outsideArea: "Aquesta adreça és fora de la zona de repartiment. Només repartim a Lloret de Mar (17310).", insideArea: "Adreça dins la zona de repartiment.", couponError: "No s'ha pogut validar el cupó.", defaultError: "No s'ha pogut marcar com a default.", defaultOk: "Adreça marcada com a default.", submitError: "Error en crear la comanda", pickupOnly: "Només recollida", deliveryUnavailable: "Delivery no disponible ara", orderType: "Tipus de comanda", delivery: "Delivery", pickup: "Recollida", contact: "Dades de contacte", name: "Nom", phone: "Telèfon", emailOptional: "Email (opcional)", address: "Adreça", account: "El meu compte", savedAddress: "Fer servir una adreça guardada", newAddress: "— Introduir-ne una de nova —", makeDefault: "Fer default", defaultTag: " (default)", savedHint: "Si n'esculls una de guardada, no es tornarà a desar.", floor: "Pis/porta (opcional)", city: "Ciutat", postalCode: "Codi postal", addressNotes: "Notes de l'adreça (opcional)", deliveryZone: "Zona de repartiment", saveAddress: "Guardar aquesta adreça al meu compte", labelOptional: "Etiqueta (opcional)", labelPlaceholder: "Casa / Feina / Família…", saveDefault: "Guardar com a adreça default", loginToSave: "Inicia sessió per guardar adreces al teu compte.", payment: "Pagament", paymentInfo: "Efectiu i targeta estan disponibles tant per delivery com per recollida.", cash: "Efectiu", card: "Targeta", coupon: "Cupó", apply: "Aplicar", validating: "Validant…", remove: "Treure", orderComments: "Comentaris de la comanda", orderCommentsHelp: "Per a coses com “més fet”, “sense sal”, etc. (no ingredients).", summary: "Resum", subtotal: "Subtotal", total: "Total", confirm: "Confirmar comanda" },
  en: { loading: "Loading checkout…", empty: "Your cart is empty.", incompleteArea: "Complete city and postal code to check whether it is inside the delivery area.", outsideArea: "This address is outside the delivery area. We only deliver in Lloret de Mar (17310).", insideArea: "Address inside the delivery area.", couponError: "The coupon could not be validated.", defaultError: "Could not mark as default.", defaultOk: "Address marked as default.", submitError: "Error creating the order", pickupOnly: "Pickup only", deliveryUnavailable: "Delivery unavailable right now", orderType: "Order type", delivery: "Delivery", pickup: "Pickup", contact: "Contact details", name: "Name", phone: "Phone", emailOptional: "Email (optional)", address: "Address", account: "My account", savedAddress: "Use saved address", newAddress: "— Enter a new one —", makeDefault: "Make default", defaultTag: " (default)", savedHint: "If you choose a saved one, it will not be stored again.", floor: "Flat / door (optional)", city: "City", postalCode: "Postal code", addressNotes: "Address notes (optional)", deliveryZone: "Delivery area", saveAddress: "Save this address to my account", labelOptional: "Label (optional)", labelPlaceholder: "Home / Work / Parents…", saveDefault: "Save as default address", loginToSave: "Sign in to save addresses to your account.", payment: "Payment", paymentInfo: "Cash and card are available for both delivery and pickup.", cash: "Cash", card: "Card", coupon: "Coupon", apply: "Apply", validating: "Validating…", remove: "Remove", orderComments: "Order notes", orderCommentsHelp: "For things like “well done”, “no salt”, etc. (not ingredients).", summary: "Summary", subtotal: "Subtotal", total: "Total", confirm: "Confirm order" },
  fr: { loading: "Chargement du checkout…", empty: "Votre panier est vide.", incompleteArea: "Complétez la ville et le code postal pour vérifier si l'adresse est dans la zone de livraison.", outsideArea: "Cette adresse est hors de la zone de livraison. Nous livrons uniquement à Lloret de Mar (17310).", insideArea: "Adresse dans la zone de livraison.", couponError: "Le coupon n'a pas pu être validé.", defaultError: "Impossible de définir cette adresse par défaut.", defaultOk: "Adresse définie par défaut.", submitError: "Erreur lors de la création de la commande", pickupOnly: "Retrait uniquement", deliveryUnavailable: "Livraison indisponible pour le moment", orderType: "Type de commande", delivery: "Livraison", pickup: "Retrait", contact: "Coordonnées", name: "Nom", phone: "Téléphone", emailOptional: "Email (optionnel)", address: "Adresse", account: "Mon compte", savedAddress: "Utiliser une adresse enregistrée", newAddress: "— Saisir une nouvelle adresse —", makeDefault: "Définir par défaut", defaultTag: " (défaut)", savedHint: "Si vous en choisissez une enregistrée, elle ne sera pas sauvegardée de nouveau.", floor: "Étage / porte (optionnel)", city: "Ville", postalCode: "Code postal", addressNotes: "Notes d'adresse (optionnel)", deliveryZone: "Zone de livraison", saveAddress: "Enregistrer cette adresse dans mon compte", labelOptional: "Étiquette (optionnel)", labelPlaceholder: "Maison / Travail / Famille…", saveDefault: "Enregistrer comme adresse par défaut", loginToSave: "Connectez-vous pour enregistrer des adresses dans votre compte.", payment: "Paiement", paymentInfo: "Espèces et carte sont disponibles aussi bien en livraison qu'en retrait.", cash: "Espèces", card: "Carte", coupon: "Coupon", apply: "Appliquer", validating: "Validation…", remove: "Retirer", orderComments: "Commentaires de la commande", orderCommentsHelp: "Pour des choses comme “plus cuit”, “sans sel”, etc. (pas des ingrédients).", summary: "Résumé", subtotal: "Sous-total", total: "Total", confirm: "Confirmer la commande" },
} satisfies Record<ClientSiteLang, Record<string, string>>;


export default function CheckoutForm() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [avail, setAvail] = useState<Availability | null>(null);

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

  const lang = useMemo(() => getClientLang(), []);
  const tt = useMemo(() => checkoutCopy[lang], [lang]);

  const deliveryAreaRuleEnabled = Boolean(avail?.deliveryAreaRule?.enabled);

  const deliveryAreaStatus = useMemo(() => {
    if (type !== "DELIVERY") return "IDLE" as const;
    if (!deliveryAreaRuleEnabled) return "DISABLED" as const;
    if (!city.trim() || !postalCode.trim()) return "INCOMPLETE" as const;
    return isDeliveryAreaAllowed(city, postalCode) ? ("INSIDE" as const) : ("OUTSIDE" as const);
  }, [type, deliveryAreaRuleEnabled, city, postalCode]);

  const deliveryAreaMessage = useMemo(() => {
    if (type !== "DELIVERY" || !deliveryAreaRuleEnabled) return "";
    if (deliveryAreaStatus === "INCOMPLETE") {
      return tt.incompleteArea;
    }
    if (deliveryAreaStatus === "OUTSIDE") {
      return tt.outsideArea;
    }
    return tt.insideArea;
  }, [type, deliveryAreaRuleEnabled, deliveryAreaStatus]);

  const deliveryDisabled = useMemo(() => !avail?.deliveryAvailable, [avail]);

  const checkoutBlocked = useMemo(() => {
    if (avail?.pauseOrders) return true;
    if (type === "DELIVERY" && deliveryAreaRuleEnabled) {
      return deliveryAreaStatus === "OUTSIDE" || deliveryAreaStatus === "INCOMPLETE";
    }
    return false;
  }, [avail, type, deliveryAreaRuleEnabled, deliveryAreaStatus]);

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
          message: tt.couponError,
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
        const [c, a] = await Promise.all([
          api<CartResponse>("/api/cart/summary"),
          api<Availability>("/api/checkout/availability"),
        ]);

        setCart(c);
        setAvail(a);
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
      if (!res?.ok) throw new Error(res?.error || tt.defaultError);

      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(selectedAddressId));
      } catch { }

      const addr = await safeJson<AddressesResponse>("/api/account/addresses");
      const list = addr?.ok ? addr.addresses ?? [] : [];
      setSavedAddresses(list);

      alert(tt.defaultOk);
    } catch (e) {
      alert(e instanceof Error ? e.message : tt.defaultError);
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
      if (data?.error === "OUTSIDE_DELIVERY_AREA") {
        setType("PICKUP");
      }
      alert(data?.message || data?.error || tt.submitError);
      return;
    }

    if (data?.savedAddressId) {
      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(data.savedAddressId));
      } catch { }
    }

    if (data.forcedPickup) {
      alert(`Reparto no disponible ahora. Pedido cambiado a RECOGIDA. ${data.forcedReason ?? ""}`);
    }

    if (data?.redirectUrl) {
      window.location.href = data.redirectUrl;
      return;
    }

    window.location.href = `/pedido/${data.publicId}`;
  }

  if (loading) return <div class="mt-6 text-sm text-zinc-600">{tt.loading}</div>;
  if (!cart || cart.items.length === 0) {
    return <div class="mt-6 text-sm text-zinc-600">{tt.empty}</div>;
  }

  return (
    <div class="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_30rem]">
      <div class="space-y-4 sm:space-y-6">
        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">{tt.orderType}</h2>

          {!avail?.deliveryAvailable ? (
            <div class="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <div class="font-semibold">
                {avail?.forcePickup ? tt.pickupOnly : tt.deliveryUnavailable}
              </div>
              <p class="mt-1 leading-6">
                {deliveryNotice} Tu pedido será <b>recogida</b>.
              </p>
            </div>
          ) : null}

          <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">{tt.contact}</h2>

          <div class="mt-4 grid gap-3 lg:grid-cols-2">
            <div>
              <label class="text-sm font-medium">{tt.name}</label>
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
              <label class="text-sm font-medium">{tt.phone}</label>
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
              <label class="text-sm font-medium">{tt.emailOptional}</label>
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
              <h2 class="text-lg font-semibold">{tt.address}</h2>

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
                <label class="text-sm font-medium">{tt.savedAddress}</label>

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
                        } catch { }
                      }

                      const address = savedAddresses.find((item) => item.id === id);
                      if (address) applyAddress(address);
                    }}
                  >
                    <option value="">{tt.newAddress}</option>
                    {savedAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {(address.label ? `${address.label} · ` : "")}
                        {address.line1} · {address.postalCode} {address.city}
                        {address.isDefault ? tt.defaultTag : ""}
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
                  {tt.savedHint}
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
                <label class="text-sm font-medium">{tt.floor}</label>
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
                <label class="text-sm font-medium">{tt.city}</label>
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
                <label class="text-sm font-medium">{tt.postalCode}</label>
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
                <label class="text-sm font-medium">{tt.addressNotes}</label>
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

            {deliveryAreaRuleEnabled ? (
              <div
                class={`mt-4 rounded-xl border p-3 text-sm ${deliveryAreaStatus === "INSIDE"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : deliveryAreaStatus === "OUTSIDE"
                    ? "border-rose-200 bg-rose-50 text-rose-900"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700"
                  }`}
              >
                <div class="font-semibold">{tt.deliveryZone}</div>
                <p class="mt-1 leading-6">{deliveryAreaMessage}</p>
              </div>
            ) : null}

            {isLoggedIn && !selectedAddressId ? (
              <label class="mt-4 flex items-center gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={saveThisAddress}
                  onChange={(e) => setSaveThisAddress((e.target as HTMLInputElement).checked)}
                />
                {tt.saveAddress}
              </label>
            ) : null}

            {isLoggedIn && !selectedAddressId && saveThisAddress ? (
              <div class="mt-3">
                <label class="text-sm font-medium">{tt.labelOptional}</label>
                <input
                  class="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm"
                  value={saveAddressLabel}
                  onInput={(e) => setSaveAddressLabel((e.target as HTMLInputElement).value)}
                  placeholder={tt.labelPlaceholder}
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
                {tt.saveDefault}
              </label>
            ) : null}

            {!isLoggedIn ? (
              <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
                {tt.loginToSave}
              </div>
            ) : null}
          </section>
        ) : null}

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">{tt.payment}</h2>

          <div class="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
            {tt.paymentInfo}
          </div>

          <div class="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CASH" ? "bg-zinc-900 text-white" : "border border-zinc-300"
                }`}
              onClick={() => setPaymentMethod("CASH")}
            >
              Efectivo
            </button>

            <button
              type="button"
              class={`rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CARD" ? "bg-zinc-900 text-white" : "border border-zinc-300"
                }`}
              onClick={() => setPaymentMethod("CARD")}
            >
              Tarjeta
            </button>
          </div>
        </section>

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">{tt.coupon}</h2>

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
                class={`rounded-xl px-4 py-2 text-sm font-semibold ${couponLoading ? "bg-zinc-400 text-white" : "bg-zinc-900 text-white"
                  }`}
                onClick={() => applyCoupon()}
                disabled={couponLoading || !couponCode.trim()}
              >
                {couponLoading ? tt.validating : tt.apply}
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
              class={`mt-3 rounded-xl p-3 text-sm ${couponFeedback.tone === "success"
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border border-rose-200 bg-rose-50 text-rose-900"
                }`}
            >
              {couponFeedback.message}
            </div>
          ) : null}
        </section>

        <section class="rounded-2xl border border-zinc-200 p-4 sm:p-5">
          <h2 class="text-lg font-semibold">{tt.orderComments}</h2>
          <p class="mt-1 text-sm text-zinc-600">
            {tt.orderCommentsHelp}
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
          <h2 class="text-lg font-semibold">{tt.summary}</h2>

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
            <span class="text-zinc-600">{tt.subtotal}</span>
            <span class="font-semibold">{money(cart.subtotalCents)}</span>
          </div>

          {type === "DELIVERY" ? (
            <div class="mt-2 flex items-center justify-between text-sm">
              <span class="text-zinc-600">{tt.delivery}</span>
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
            <span class="text-zinc-600">{tt.total}</span>
            <span class="text-base font-semibold">{money(totalCents)}</span>
          </div>

          <button
            class={`mt-4 min-h-12 w-full rounded-xl bg-zinc-900 px-4 py-3 text-base font-semibold text-white ${checkoutBlocked ? "opacity-60 pointer-events-none" : ""
              }`}
            type="button"
            onClick={submit}
            disabled={checkoutBlocked}
          >
            {tt.confirm}
          </button>
        </div>
      </aside>
    </div>
  );
}