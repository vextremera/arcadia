import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, B as maybeRenderHead, a4 as addAttribute } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { a as api, $ as $$SiteLayout } from './SiteLayout_CblPac9t.mjs';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { jsx, jsxs } from 'preact/jsx-runtime';
import { g as getArcadiaAvailability } from './madrid_57G2TjB3.mjs';

function money(cents) {
  return `${(cents / 100).toFixed(2)} €`;
}
async function safeJson(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
function normalizeAreaText(value) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}
function isDeliveryAreaAllowed(city, postalCode) {
  const normalizedCity = normalizeAreaText(city);
  const normalizedPostalCode = String(postalCode ?? "").trim();
  return normalizedCity === "lloret de mar" && normalizedPostalCode === "17310";
}
const LAST_ADDRESS_KEY = "arcadia:lastAddressId";
function CheckoutForm() {
  const [cart, setCart] = useState(null);
  const [avail, setAvail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState("PICKUP");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
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
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveThisAddress, setSaveThisAddress] = useState(false);
  const [saveAsDefault, setSaveAsDefault] = useState(false);
  const [saveAddressLabel, setSaveAddressLabel] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponFeedback, setCouponFeedback] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const deliveryAreaRuleEnabled = Boolean(avail?.deliveryAreaRule?.enabled);
  const deliveryAreaStatus = useMemo(() => {
    if (type !== "DELIVERY") return "IDLE";
    if (!deliveryAreaRuleEnabled) return "DISABLED";
    if (!city.trim() || !postalCode.trim()) return "INCOMPLETE";
    return isDeliveryAreaAllowed(city, postalCode) ? "INSIDE" : "OUTSIDE";
  }, [type, deliveryAreaRuleEnabled, city, postalCode]);
  const deliveryAreaMessage = useMemo(() => {
    if (type !== "DELIVERY" || !deliveryAreaRuleEnabled) return "";
    if (deliveryAreaStatus === "INCOMPLETE") {
      return "Completa ciudad y código postal para comprobar si entra en la zona de reparto.";
    }
    if (deliveryAreaStatus === "OUTSIDE") {
      return "Esta dirección está fuera de la zona de reparto. Solo repartimos en Lloret de Mar (17310).";
    }
    return "Dirección dentro de la zona de reparto.";
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
  function applyAddress(address) {
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
  async function applyCoupon(codeOverride, silent = false) {
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
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          code: nextCode,
          type,
          subtotalCents: cart.subtotalCents,
          deliveryFeeCents
        })
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        setCouponPreview(null);
        setCouponFeedback({
          tone: "error",
          message: "No se ha podido validar el cupón."
        });
        return;
      }
      if (data.ok) {
        setCouponCode(data.code);
        setCouponPreview(data);
        setCouponFeedback({
          tone: "success",
          message: data.message
        });
      } else {
        setCouponPreview(null);
        setCouponFeedback({
          tone: "error",
          message: data.message
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
        const [c, a] = await Promise.all([api("/api/cart/summary"), api("/api/checkout/availability")]);
        setCart(c);
        setAvail(a);
        setType(a.deliveryAvailable ? "DELIVERY" : "PICKUP");
        const profile = await safeJson("/api/account/profile");
        if (profile?.ok && profile.user?.role === "CUSTOMER") {
          setIsLoggedIn(true);
          const initialName = profile.user.name ?? "";
          const initialPhone = profile.profile?.phone ?? "";
          setInitialProfileName(initialName);
          setInitialProfilePhone(initialPhone);
          if (initialName) setCustomerName(initialName);
          if (profile.user.email) setCustomerEmail(profile.user.email);
          if (initialPhone) setCustomerPhone(initialPhone);
          const addressResponse = await safeJson("/api/account/addresses");
          const list = addressResponse?.ok ? addressResponse.addresses ?? [] : [];
          setSavedAddresses(list);
          const lastIdRaw = typeof window !== "undefined" ? window.localStorage.getItem(LAST_ADDRESS_KEY) : null;
          const lastId = lastIdRaw ? Number(lastIdRaw) : NaN;
          const last = Number.isFinite(lastId) ? list.find((item) => item.id === lastId) : void 0;
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
      const res = await api("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify({
          id: selectedAddressId,
          isDefault: true
        })
      });
      if (!res?.ok) throw new Error(res?.error || "No se pudo marcar como default.");
      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(selectedAddressId));
      } catch {
      }
      const addr = await safeJson("/api/account/addresses");
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
    const shouldSaveProfile = isLoggedIn && (currentName && currentName !== initialProfileName || currentPhone && currentPhone !== initialProfilePhone);
    const payload = {
      type,
      paymentMethod,
      orderNotes,
      couponCode: couponPreview?.ok ? couponPreview.code : void 0,
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
        notes: addressNotes
      },
      saveProfile: shouldSaveProfile,
      saveAddress: isLoggedIn && type === "DELIVERY" && saveThisAddress && !selectedAddressId,
      saveAddressDefault: isLoggedIn && type === "DELIVERY" && saveThisAddress && saveAsDefault && !selectedAddressId,
      saveAddressLabel: isLoggedIn && type === "DELIVERY" && saveThisAddress && !selectedAddressId ? saveAddressLabel.trim() : void 0
    };
    const res = await fetch("/api/checkout/submit", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data?.error === "OUTSIDE_DELIVERY_AREA") {
        setType("PICKUP");
      }
      alert(data?.message || data?.error || "Error al crear el pedido");
      return;
    }
    if (data?.savedAddressId) {
      try {
        window.localStorage.setItem(LAST_ADDRESS_KEY, String(data.savedAddressId));
      } catch {
      }
    }
    if (data.forcedPickup) {
      alert(`Reparto no disponible ahora. Pedido cambiado a RECOGIDA. ${data.forcedReason ?? ""}`);
    }
    window.location.href = `/pedido/${data.publicId}`;
  }
  if (loading) return jsx("div", {
    class: "mt-6 text-sm text-zinc-600",
    children: "Cargando checkout…"
  });
  if (!cart || cart.items.length === 0) {
    return jsx("div", {
      class: "mt-6 text-sm text-zinc-600",
      children: "Tu carrito está vacío."
    });
  }
  return jsxs("div", {
    class: "mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_30rem]",
    children: [jsxs("div", {
      class: "space-y-4 sm:space-y-6",
      children: [jsxs("section", {
        class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
        children: [jsx("h2", {
          class: "text-lg font-semibold",
          children: "Tipo de pedido"
        }), !avail?.deliveryAvailable ? jsxs("div", {
          class: "mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900",
          children: [jsx("div", {
            class: "font-semibold",
            children: avail?.forcePickup ? "Solo recogida" : "Delivery no disponible ahora"
          }), jsxs("p", {
            class: "mt-1 leading-6",
            children: [deliveryNotice, " Tu pedido será ", jsx("b", {
              children: "recogida"
            }), "."]
          })]
        }) : null, jsxs("div", {
          class: "mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap",
          children: [jsx("button", {
            type: "button",
            class: `rounded-xl px-4 py-2 text-sm font-semibold ${type === "DELIVERY" ? "bg-zinc-900 text-white" : "border border-zinc-300"} ${deliveryDisabled ? "opacity-50 pointer-events-none" : ""}`,
            onClick: () => setType("DELIVERY"),
            disabled: deliveryDisabled,
            children: "Entrega a domicilio"
          }), jsx("button", {
            type: "button",
            class: `rounded-xl px-4 py-2 text-sm font-semibold ${type === "PICKUP" ? "bg-zinc-900 text-white" : "border border-zinc-300"}`,
            onClick: () => setType("PICKUP"),
            children: "Recogida"
          })]
        })]
      }), jsxs("section", {
        class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
        children: [jsx("h2", {
          class: "text-lg font-semibold",
          children: "Datos de contacto"
        }), jsxs("div", {
          class: "mt-4 grid gap-3 lg:grid-cols-2",
          children: [jsxs("div", {
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Nombre"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: customerName,
              onInput: (e) => {
                setNameDirty(true);
                setCustomerName(e.target.value);
              }
            })]
          }), jsxs("div", {
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Teléfono"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: customerPhone,
              onInput: (e) => {
                setPhoneDirty(true);
                setCustomerPhone(e.target.value);
              }
            })]
          }), jsxs("div", {
            class: "lg:col-span-2",
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Email (opcional)"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: customerEmail,
              onInput: (e) => setCustomerEmail(e.target.value)
            })]
          })]
        })]
      }), type === "DELIVERY" ? jsxs("section", {
        class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
        children: [jsxs("div", {
          class: "flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-start sm:gap-4",
          children: [jsx("h2", {
            class: "text-lg font-semibold",
            children: "Dirección"
          }), isLoggedIn ? jsx("a", {
            class: "text-sm font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 hover:decoration-zinc-900",
            href: "/cuenta",
            children: "Mi cuenta"
          }) : null]
        }), isLoggedIn && savedAddresses.length ? jsxs("div", {
          class: "mt-3",
          children: [jsx("label", {
            class: "text-sm font-medium",
            children: "Usar dirección guardada"
          }), jsxs("div", {
            class: "mt-1 flex flex-col gap-2 xl:flex-row xl:items-center",
            children: [jsxs("select", {
              class: "w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: selectedAddressId,
              onChange: (e) => {
                const value = e.target.value;
                const id = value ? Number(value) : "";
                setSelectedAddressId(id);
                if (id) {
                  try {
                    window.localStorage.setItem(LAST_ADDRESS_KEY, String(id));
                  } catch {
                  }
                }
                const address = savedAddresses.find((item) => item.id === id);
                if (address) applyAddress(address);
              },
              children: [jsx("option", {
                value: "",
                children: "— Introducir nueva —"
              }), savedAddresses.map((address) => jsxs("option", {
                value: address.id,
                children: [address.label ? `${address.label} · ` : "", address.line1, " · ", address.postalCode, " ", address.city, address.isDefault ? " (default)" : ""]
              }, address.id))]
            }), selectedAddressId ? jsx("button", {
              type: "button",
              class: "rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50",
              onClick: makeDefaultFromCheckout,
              children: "Hacer default"
            }) : null]
          }), jsx("div", {
            class: "mt-2 text-xs text-zinc-600",
            children: "Si eliges una guardada, no se volverá a guardar."
          })]
        }) : null, jsxs("div", {
          class: "mt-4 grid gap-3 lg:grid-cols-2",
          children: [jsxs("div", {
            class: "lg:col-span-2",
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Dirección"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: line1,
              onInput: (e) => {
                setLine1(e.target.value);
                if (selectedAddressId) setSelectedAddressId("");
              }
            })]
          }), jsxs("div", {
            class: "lg:col-span-2",
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Piso/puerta (opcional)"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: line2,
              onInput: (e) => {
                setLine2(e.target.value);
                if (selectedAddressId) setSelectedAddressId("");
              }
            })]
          }), jsxs("div", {
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Ciudad"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: city,
              onInput: (e) => {
                setCity(e.target.value);
                if (selectedAddressId) setSelectedAddressId("");
              }
            })]
          }), jsxs("div", {
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Código postal"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: postalCode,
              onInput: (e) => {
                setPostalCode(e.target.value);
                if (selectedAddressId) setSelectedAddressId("");
              }
            })]
          }), jsxs("div", {
            class: "lg:col-span-2",
            children: [jsx("label", {
              class: "text-sm font-medium",
              children: "Notas de dirección (opcional)"
            }), jsx("input", {
              class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
              value: addressNotes,
              onInput: (e) => {
                setAddressNotes(e.target.value);
                if (selectedAddressId) setSelectedAddressId("");
              }
            })]
          })]
        }), deliveryAreaRuleEnabled ? jsxs("div", {
          class: `mt-4 rounded-xl border p-3 text-sm ${deliveryAreaStatus === "INSIDE" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : deliveryAreaStatus === "OUTSIDE" ? "border-rose-200 bg-rose-50 text-rose-900" : "border-zinc-200 bg-zinc-50 text-zinc-700"}`,
          children: [jsx("div", {
            class: "font-semibold",
            children: "Zona de reparto"
          }), jsx("p", {
            class: "mt-1 leading-6",
            children: deliveryAreaMessage
          })]
        }) : null, isLoggedIn && !selectedAddressId ? jsxs("label", {
          class: "mt-4 flex items-center gap-2 text-sm text-zinc-700",
          children: [jsx("input", {
            type: "checkbox",
            checked: saveThisAddress,
            onChange: (e) => setSaveThisAddress(e.target.checked)
          }), "Guardar esta dirección en mi cuenta"]
        }) : null, isLoggedIn && !selectedAddressId && saveThisAddress ? jsxs("div", {
          class: "mt-3",
          children: [jsx("label", {
            class: "text-sm font-medium",
            children: "Etiqueta (opcional)"
          }), jsx("input", {
            class: "mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
            value: saveAddressLabel,
            onInput: (e) => setSaveAddressLabel(e.target.value),
            placeholder: "Casa / Trabajo / Suegros…"
          })]
        }) : null, isLoggedIn && !selectedAddressId && saveThisAddress ? jsxs("label", {
          class: "mt-2 flex items-center gap-2 text-sm text-zinc-700",
          children: [jsx("input", {
            type: "checkbox",
            checked: saveAsDefault,
            onChange: (e) => setSaveAsDefault(e.target.checked)
          }), "Guardar como dirección default"]
        }) : null, !isLoggedIn ? jsx("div", {
          class: "mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600",
          children: "Inicia sesión para guardar direcciones en tu cuenta."
        }) : null]
      }) : null, jsxs("section", {
        class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
        children: [jsx("h2", {
          class: "text-lg font-semibold",
          children: "Pago"
        }), jsx("div", {
          class: "mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700",
          children: "Efectivo y tarjeta están disponibles tanto en delivery como en recogida."
        }), jsxs("div", {
          class: "mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap",
          children: [jsx("button", {
            type: "button",
            class: `rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CASH" ? "bg-zinc-900 text-white" : "border border-zinc-300"}`,
            onClick: () => setPaymentMethod("CASH"),
            children: "Efectivo"
          }), jsx("button", {
            type: "button",
            class: `rounded-xl px-4 py-2 text-sm font-semibold ${paymentMethod === "CARD" ? "bg-zinc-900 text-white" : "border border-zinc-300"}`,
            onClick: () => setPaymentMethod("CARD"),
            children: "Tarjeta"
          })]
        })]
      }), jsxs("section", {
        class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
        children: [jsx("h2", {
          class: "text-lg font-semibold",
          children: "Cupón"
        }), jsxs("div", {
          class: "mt-4 flex flex-col gap-3 sm:flex-row",
          children: [jsx("input", {
            class: "w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm uppercase tracking-[0.06em]",
            value: couponCode,
            onInput: (e) => {
              setCouponCode(e.target.value.toUpperCase());
              setCouponPreview(null);
              setCouponFeedback(null);
            },
            placeholder: "BIENVENIDA10"
          }), jsxs("div", {
            class: "flex gap-2",
            children: [jsx("button", {
              type: "button",
              class: `rounded-xl px-4 py-2 text-sm font-semibold ${couponLoading ? "bg-zinc-400 text-white" : "bg-zinc-900 text-white"}`,
              onClick: () => applyCoupon(),
              disabled: couponLoading || !couponCode.trim(),
              children: couponLoading ? "Validando…" : "Aplicar"
            }), couponPreview?.ok || couponCode.trim() ? jsx("button", {
              type: "button",
              class: "rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold",
              onClick: () => {
                setCouponCode("");
                setCouponPreview(null);
                setCouponFeedback(null);
              },
              children: "Quitar"
            }) : null]
          })]
        }), couponFeedback ? jsx("div", {
          class: `mt-3 rounded-xl p-3 text-sm ${couponFeedback.tone === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-900" : "border border-rose-200 bg-rose-50 text-rose-900"}`,
          children: couponFeedback.message
        }) : null]
      }), jsxs("section", {
        class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
        children: [jsx("h2", {
          class: "text-lg font-semibold",
          children: "Comentarios del pedido"
        }), jsx("p", {
          class: "mt-1 text-sm text-zinc-600",
          children: "Para cosas como “más hecho”, “sin sal”, etc. (no ingredientes)."
        }), jsx("textarea", {
          class: "mt-3 w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm",
          rows: 3,
          value: orderNotes,
          onInput: (e) => setOrderNotes(e.target.value)
        })]
      })]
    }), jsx("aside", {
      class: "xl:sticky xl:top-4 xl:h-fit",
      children: jsxs("div", {
        class: "rounded-2xl border border-zinc-200 p-4 sm:p-5 2xl:p-6",
        children: [jsx("h2", {
          class: "text-lg font-semibold",
          children: "Resumen"
        }), jsx("div", {
          class: "mt-4 space-y-3 sm:space-y-4 text-sm",
          children: cart.items.map((item) => jsxs("div", {
            class: "rounded-2xl border border-zinc-200 p-3 sm:p-4",
            children: [jsxs("div", {
              class: "flex items-baseline justify-between gap-3",
              children: [jsxs("div", {
                class: "min-w-0 truncate font-semibold",
                children: [item.qty, "× ", item.name]
              }), jsx("div", {
                class: "shrink-0 font-semibold",
                children: money(item.lineTotalCents)
              })]
            }), item.variantLabel ? jsx("div", {
              class: "mt-1 text-xs text-zinc-600",
              children: item.variantLabel
            }) : null]
          }, item.lineId))
        }), jsxs("div", {
          class: "mt-4 flex items-center justify-between border-t border-zinc-200 pt-4 text-sm",
          children: [jsx("span", {
            class: "text-zinc-600",
            children: "Subtotal"
          }), jsx("span", {
            class: "font-semibold",
            children: money(cart.subtotalCents)
          })]
        }), type === "DELIVERY" ? jsxs("div", {
          class: "mt-2 flex items-center justify-between text-sm",
          children: [jsx("span", {
            class: "text-zinc-600",
            children: "Delivery"
          }), jsx("span", {
            class: "font-semibold",
            children: money(deliveryFeeCents)
          })]
        }) : null, couponPreview?.ok ? jsxs("div", {
          class: "mt-2 flex items-center justify-between text-sm",
          children: [jsxs("span", {
            class: "text-zinc-600",
            children: ["Cupón · ", couponPreview.code]
          }), jsxs("span", {
            class: "font-semibold text-emerald-700",
            children: ["- ", money(couponPreview.discountCents)]
          })]
        }) : null, jsxs("div", {
          class: "mt-3 flex items-center justify-between text-sm",
          children: [jsx("span", {
            class: "text-zinc-600",
            children: "Total"
          }), jsx("span", {
            class: "text-base font-semibold",
            children: money(totalCents)
          })]
        }), jsx("button", {
          class: `mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${checkoutBlocked ? "opacity-60 pointer-events-none" : ""}`,
          type: "button",
          onClick: submit,
          disabled: checkoutBlocked,
          children: "Confirmar pedido"
        })]
      })
    })]
  });
}

const $$Checkout = createComponent(async ($$result, $$props, $$slots) => {
  const availability = await getArcadiaAvailability(/* @__PURE__ */ new Date());
  function formatDateISO(dateISO) {
    const match = String(dateISO).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return dateISO;
    return `${match[3]}/${match[2]}/${match[1]}`;
  }
  function sourceLabel(source) {
    if (source === "SPECIAL_DATE") return "Excepción activa";
    if (source === "SPECIAL_DATE_CLOSED") return "Excepción de cierre";
    if (source === "OPENING_HOUR") return "Horario semanal";
    if (source === "OPENING_HOUR_CLOSED") return "Descanso semanal";
    return "Horario base";
  }
  const specialCards = [
    {
      label: "Local",
      source: availability.sources.open,
      note: availability.sourceNotes.open,
      start: availability.windows.open.start,
      end: availability.windows.open.end,
      state: availability.isOpen ? "Abierto" : "Cerrado",
      tone: availability.isOpen ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"
    },
    {
      label: "Pickup",
      source: availability.sources.pickup,
      note: availability.sourceNotes.pickup,
      start: availability.windows.pickup.start,
      end: availability.windows.pickup.end,
      state: availability.pickupAvailable ? "Disponible" : "No disponible",
      tone: availability.pickupAvailable ? "border-indigo-200 bg-indigo-50 text-indigo-900" : "border-amber-200 bg-amber-50 text-amber-900"
    },
    {
      label: "Delivery",
      source: availability.sources.delivery,
      note: availability.sourceNotes.delivery,
      start: availability.windows.delivery.start,
      end: availability.windows.delivery.end,
      state: availability.forcePickup ? "Solo recogida" : availability.deliveryAvailable ? "Disponible" : "No disponible",
      tone: availability.forcePickup ? "border-amber-200 bg-amber-50 text-amber-900" : availability.deliveryAvailable ? "border-cyan-200 bg-cyan-50 text-cyan-900" : "border-amber-200 bg-amber-50 text-amber-900"
    }
  ].filter(
    (card) => card.source === "SPECIAL_DATE" || card.source === "SPECIAL_DATE_CLOSED"
  );
  const hasSpecialResolution = specialCards.length > 0;
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Checkout · Arcadia" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mx-auto w-full max-w-448"> <h1 class="text-2xl font-semibold tracking-tight 2xl:text-[2rem]">
Finalizar pedido
</h1> ${availability.pauseOrders ? renderTemplate`<section class="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900"> <div class="font-semibold">Pedidos pausados temporalmente</div> <p class="mt-1 leading-6">
Ahora mismo no estamos aceptando pedidos. Puedes revisar de nuevo más tarde.
</p> </section>` : null} ${hasSpecialResolution ? renderTemplate`<section class="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5"> <div class="flex flex-wrap items-center justify-between gap-3"> <div> <div class="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
Disponibilidad especial hoy
</div> <h2 class="mt-1 text-lg font-semibold text-amber-950"> ${formatDateISO(availability.todayDateISO)} se está resolviendo con una excepción
</h2> </div> <div class="rounded-full border border-amber-200 bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-amber-800">
SpecialDate
</div> </div> <p class="mt-3 text-sm leading-6 text-amber-900">
Hoy la disponibilidad no sale solo del horario base. Alguno de los canales está gobernado por una excepción puntual y por eso puedes ver franjas distintas o cierres temporales.
</p> <div class="mt-4 grid gap-3 lg:grid-cols-3"> ${specialCards.map((card) => renderTemplate`<article${addAttribute(["rounded-2xl border p-4", card.tone], "class:list")}> <div class="flex flex-wrap items-center justify-between gap-2"> <div class="text-sm font-semibold">${card.label}</div> <div class="text-xs font-semibold uppercase tracking-[0.14em]"> ${card.state} </div> </div> <div class="mt-2 text-sm"> ${card.start} - ${card.end} </div> <div class="mt-2 text-xs font-semibold uppercase tracking-[0.14em] opacity-80"> ${sourceLabel(card.source)} </div> ${card.note ? renderTemplate`<p class="mt-2 text-sm leading-6 opacity-90"> ${card.note} </p>` : null} </article>`)} </div> ${availability.forcePickup ? renderTemplate`<div class="mt-4 rounded-xl border border-amber-200 bg-white/70 px-4 py-3 text-sm text-amber-900">
Ahora mismo trabajamos solo recogida desde operativa, así que aunque hoy exista una franja especial de delivery el checkout seguirá por pickup.
</div>` : null} </section>` : null} ${renderComponent($$result2, "CheckoutForm", CheckoutForm, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/checkout/CheckoutForm", "client:component-export": "default" })} </div> ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/checkout.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/checkout.astro";
const $$url = "/checkout";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Checkout,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
