import { c as createComponent } from './astro-component_BmOi03Hm.mjs';
import 'piccolore';
import { T as renderTemplate, B as maybeRenderHead } from './sequence_BvZ5THv7.mjs';
import { r as renderComponent } from './entrypoint_BPbdkgv6.mjs';
import { a as api, $ as $$SiteLayout } from './SiteLayout_CblPac9t.mjs';
import { d as db, k as UserProfile, L as LoyaltyTier } from './_astro_db_Bcz5lWRF.mjs';
import { useState, useMemo, useEffect } from 'preact/hooks';
import { jsx, jsxs } from 'preact/jsx-runtime';
import { eq } from '@astrojs/db/dist/runtime/virtual.js';

function emptyAddress() {
  return {
    label: "",
    contactName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "Lloret de Mar",
    postalCode: "",
    notes: "",
    isDefault: false
  };
}
function normalizeOptionalString(v) {
  const t = v.trim();
  return t ? t : void 0;
}
function AccountPanel() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthday, setBirthday] = useState("");
  const [newsletterActive, setNewsletterActive] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState("");
  const [savingNewsletter, setSavingNewsletter] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [savingAddress, setSavingAddress] = useState(false);
  const [addrMsg, setAddrMsg] = useState("");
  const isEditing = !!editing;
  const form = editing ?? emptyAddress();
  const defaultId = useMemo(() => addresses.find((a) => a.isDefault)?.id ?? null, [addresses]);
  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const p = await api("/api/account/profile");
      if (!p.ok) throw new Error(p.error || "No se pudo cargar el perfil.");
      setName(p.user?.name ?? "");
      setPhone(p.profile?.phone ?? "");
      setBirthday(p.profile?.birthday ?? "");
      setNewsletterActive(!!p.newsletter?.active);
      const a = await api("/api/account/addresses");
      if (!a.ok) throw new Error(a.error || "No se pudieron cargar las direcciones.");
      setAddresses(a.addresses ?? []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Error cargando cuenta.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadAll();
  }, []);
  async function saveProfile() {
    setSavingProfile(true);
    setProfileMsg("");
    try {
      const payload = {
        name: name.trim(),
        phone: normalizeOptionalString(phone) ?? null,
        birthday: normalizeOptionalString(birthday) ?? null
      };
      const res = await api("/api/account/profile", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(res.error || "No se pudo guardar.");
      setProfileMsg("Guardado.");
    } catch (e) {
      setProfileMsg(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSavingProfile(false);
    }
  }
  async function saveNewsletter(nextActive) {
    setSavingNewsletter(true);
    setNewsletterMsg("");
    try {
      const res = await api("/api/account/profile", {
        method: "POST",
        body: JSON.stringify({
          newsletterActive: nextActive
        })
      });
      if (!res.ok) throw new Error(res.error || "No se pudo actualizar el newsletter.");
      setNewsletterActive(!!res.newsletter?.active);
      setNewsletterMsg(nextActive ? "Te has suscrito correctamente." : "Te has dado de baja correctamente.");
    } catch (e) {
      setNewsletterMsg(e instanceof Error ? e.message : "No se pudo actualizar el newsletter.");
    } finally {
      setSavingNewsletter(false);
    }
  }
  function startNewAddress() {
    setAddrMsg("");
    setEditing({
      ...emptyAddress(),
      isDefault: addresses.length === 0
    });
  }
  function startEditAddress(a) {
    setAddrMsg("");
    setEditing({
      id: a.id,
      label: a.label ?? "",
      contactName: a.contactName,
      phone: a.phone,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      postalCode: a.postalCode,
      notes: a.notes ?? "",
      isDefault: a.isDefault
    });
  }
  function patchEditing(patch) {
    setEditing((prev) => ({
      ...prev ?? emptyAddress(),
      ...patch
    }));
  }
  async function saveAddress() {
    if (!editing) return;
    setSavingAddress(true);
    setAddrMsg("");
    try {
      const payload = {
        ...editing.id ? {
          id: editing.id
        } : null,
        label: normalizeOptionalString(editing.label),
        contactName: editing.contactName.trim(),
        phone: editing.phone.trim(),
        line1: editing.line1.trim(),
        line2: normalizeOptionalString(editing.line2),
        city: editing.city.trim(),
        postalCode: editing.postalCode.trim(),
        notes: normalizeOptionalString(editing.notes),
        isDefault: !!editing.isDefault
      };
      if (!payload.contactName || !payload.phone || !payload.line1 || !payload.city || !payload.postalCode) {
        setAddrMsg("Rellena contacto, teléfono, dirección, ciudad y CP.");
        setSavingAddress(false);
        return;
      }
      const res = await api("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      if (!res?.ok) throw new Error(res?.error || "No se pudo guardar.");
      await loadAll();
      setEditing(null);
      setAddrMsg("Guardado.");
    } catch (e) {
      setAddrMsg(e instanceof Error ? e.message : "No se pudo guardar.");
    } finally {
      setSavingAddress(false);
    }
  }
  async function deleteAddress(id) {
    const ok = confirm("¿Borrar esta dirección?");
    if (!ok) return;
    setAddrMsg("");
    try {
      const res = await api("/api/account/addresses", {
        method: "DELETE",
        body: JSON.stringify({
          id
        })
      });
      if (!res?.ok) throw new Error(res?.error || "No se pudo borrar.");
      if (editing?.id === id) setEditing(null);
      await loadAll();
      setAddrMsg("Dirección borrada.");
    } catch (e) {
      setAddrMsg(e instanceof Error ? e.message : "No se pudo borrar.");
    }
  }
  async function makeDefault(id) {
    setAddrMsg("");
    try {
      const res = await api("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify({
          id,
          isDefault: true
        })
      });
      if (!res?.ok) throw new Error(res?.error || "No se pudo marcar como default.");
      await loadAll();
      setAddrMsg("Dirección marcada como default.");
    } catch (e) {
      setAddrMsg(e instanceof Error ? e.message : "No se pudo marcar como default.");
    }
  }
  if (loading) {
    return jsx("div", {
      class: "mt-6 rounded-2xl border border-zinc-200 p-4 sm:p-5",
      children: jsx("div", {
        class: "text-sm text-zinc-600",
        children: "Cargando datos de tu cuenta…"
      })
    });
  }
  if (err) {
    return jsxs("div", {
      class: "mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5",
      children: [jsx("div", {
        class: "text-sm font-semibold text-red-900",
        children: "No se pudo cargar tu cuenta"
      }), jsx("div", {
        class: "mt-1 text-sm text-red-900/80",
        children: err
      }), jsx("button", {
        type: "button",
        class: "mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto",
        onClick: loadAll,
        children: "Reintentar"
      })]
    });
  }
  return jsxs("div", {
    class: "mt-6 space-y-4 sm:space-y-6",
    children: [jsxs("section", {
      class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
      children: [jsx("div", {
        class: "text-sm font-semibold",
        children: "Mis datos"
      }), jsx("div", {
        class: "mt-1 text-sm text-zinc-600",
        children: "Estos datos se usarán para facilitar el checkout."
      }), jsxs("div", {
        class: "mt-4 grid gap-3 sm:grid-cols-2",
        children: [jsxs("label", {
          class: "grid gap-1",
          children: [jsx("span", {
            class: "text-xs font-semibold text-zinc-600",
            children: "Nombre"
          }), jsx("input", {
            class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
            value: name,
            onInput: (e) => setName(e.target.value),
            placeholder: "Tu nombre"
          })]
        }), jsxs("label", {
          class: "grid gap-1",
          children: [jsx("span", {
            class: "text-xs font-semibold text-zinc-600",
            children: "Teléfono"
          }), jsx("input", {
            class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
            value: phone,
            onInput: (e) => setPhone(e.target.value),
            placeholder: "600 123 123",
            inputMode: "tel"
          })]
        }), jsxs("label", {
          class: "grid gap-1",
          children: [jsx("span", {
            class: "text-xs font-semibold text-zinc-600",
            children: "Cumpleaños"
          }), jsx("input", {
            class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
            value: birthday,
            onInput: (e) => setBirthday(e.target.value),
            placeholder: "YYYY-MM-DD"
          })]
        })]
      }), jsxs("div", {
        class: "mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center",
        children: [jsx("button", {
          type: "button",
          class: `w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto ${savingProfile ? "opacity-60 pointer-events-none" : ""}`,
          onClick: saveProfile,
          children: "Guardar"
        }), profileMsg ? jsx("div", {
          class: "text-sm text-zinc-600",
          children: profileMsg
        }) : null]
      })]
    }), jsxs("section", {
      class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
      children: [jsx("div", {
        class: "text-sm font-semibold",
        children: "Newsletter"
      }), jsx("div", {
        class: "mt-1 text-sm text-zinc-600",
        children: "Suscríbete o date de baja fácilmente desde tu cuenta."
      }), jsxs("div", {
        class: "mt-4 flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:flex-row sm:items-center sm:justify-between",
        children: [jsxs("div", {
          children: [jsx("div", {
            class: "text-sm font-semibold text-zinc-900",
            children: newsletterActive ? "Estás suscrito" : "No estás suscrito"
          }), jsx("div", {
            class: "mt-1 text-sm text-zinc-600",
            children: newsletterActive ? "Recibirás ofertas, cupones y novedades de Arcadia en tu correo." : "Activa la suscripción para recibir ofertas, cupones y novedades."
          })]
        }), jsx("button", {
          type: "button",
          class: `w-full rounded-xl px-4 py-2 text-sm font-semibold sm:w-auto ${newsletterActive ? "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100" : "bg-zinc-900 text-white"} ${savingNewsletter ? "opacity-60 pointer-events-none" : ""}`,
          onClick: () => saveNewsletter(!newsletterActive),
          children: newsletterActive ? "Darme de baja" : "Suscribirme"
        })]
      }), newsletterMsg ? jsx("div", {
        class: "mt-3 text-sm text-zinc-600",
        children: newsletterMsg
      }) : null]
    }), jsxs("section", {
      class: "rounded-2xl border border-zinc-200 p-4 sm:p-5",
      children: [jsxs("div", {
        class: "flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-start sm:gap-4",
        children: [jsxs("div", {
          children: [jsx("div", {
            class: "text-sm font-semibold",
            children: "Direcciones"
          }), jsx("div", {
            class: "mt-1 text-sm text-zinc-600",
            children: "Guarda tus direcciones para pedir más rápido."
          })]
        }), jsx("button", {
          type: "button",
          class: "w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 sm:w-auto",
          onClick: startNewAddress,
          children: "+ Nueva"
        })]
      }), addresses.length === 0 ? jsx("div", {
        class: "mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600",
        children: "Aún no tienes direcciones guardadas."
      }) : jsx("div", {
        class: "mt-4 grid gap-3",
        children: addresses.map((a) => jsx("div", {
          class: "rounded-2xl border border-zinc-200 p-4",
          children: jsxs("div", {
            class: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
            children: [jsxs("div", {
              class: "min-w-0",
              children: [jsxs("div", {
                class: "flex flex-wrap items-center gap-2",
                children: [jsx("div", {
                  class: "text-sm font-semibold",
                  children: a.label ? a.label : "Dirección"
                }), a.isDefault ? jsx("span", {
                  class: "rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white",
                  children: "Default"
                }) : null, !a.isDefault && defaultId ? jsx("span", {
                  class: "text-[11px] text-zinc-500",
                  children: "(no default)"
                }) : null]
              }), jsxs("div", {
                class: "mt-1 wrap-break-words text-sm text-zinc-700",
                children: [a.contactName, " · ", a.phone]
              }), jsxs("div", {
                class: "mt-1 wrap-break-words text-sm text-zinc-600",
                children: [a.line1, a.line2 ? `, ${a.line2}` : "", " · ", a.postalCode, " ", a.city]
              }), a.notes ? jsx("div", {
                class: "mt-1 wrap-break-words text-xs text-zinc-500",
                children: a.notes
              }) : null]
            }), jsxs("div", {
              class: "flex w-full flex-col gap-2 sm:w-auto sm:shrink-0 sm:flex-row sm:flex-wrap sm:justify-end",
              children: [!a.isDefault ? jsx("button", {
                type: "button",
                class: "w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-50 sm:w-auto",
                onClick: () => makeDefault(a.id),
                children: "Hacer default"
              }) : null, jsx("button", {
                type: "button",
                class: "w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-50 sm:w-auto",
                onClick: () => startEditAddress(a),
                children: "Editar"
              }), jsx("button", {
                type: "button",
                class: "w-full rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 sm:w-auto",
                onClick: () => deleteAddress(a.id),
                children: "Borrar"
              })]
            })]
          })
        }, a.id))
      }), isEditing ? jsxs("div", {
        class: "mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4",
        children: [jsx("div", {
          class: "text-sm font-semibold",
          children: editing?.id ? "Editar dirección" : "Nueva dirección"
        }), jsxs("div", {
          class: "mt-4 grid gap-3 sm:grid-cols-2",
          children: [jsxs("label", {
            class: "grid gap-1",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Etiqueta (opcional)"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.label,
              onInput: (e) => patchEditing({
                label: e.target.value
              }),
              placeholder: "Casa / Trabajo"
            })]
          }), jsxs("label", {
            class: "grid gap-1",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Contacto *"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.contactName,
              onInput: (e) => patchEditing({
                contactName: e.target.value
              }),
              placeholder: "Nombre"
            })]
          }), jsxs("label", {
            class: "grid gap-1",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Teléfono *"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.phone,
              onInput: (e) => patchEditing({
                phone: e.target.value
              }),
              placeholder: "600 123 123",
              inputMode: "tel"
            })]
          }), jsxs("label", {
            class: "grid gap-1 sm:col-span-2",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Dirección *"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.line1,
              onInput: (e) => patchEditing({
                line1: e.target.value
              }),
              placeholder: "Calle / número"
            })]
          }), jsxs("label", {
            class: "grid gap-1 sm:col-span-2",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Piso / puerta (opcional)"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.line2,
              onInput: (e) => patchEditing({
                line2: e.target.value
              }),
              placeholder: "2º 1ª"
            })]
          }), jsxs("label", {
            class: "grid gap-1",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Ciudad *"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.city,
              onInput: (e) => patchEditing({
                city: e.target.value
              })
            })]
          }), jsxs("label", {
            class: "grid gap-1",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Código postal *"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.postalCode,
              onInput: (e) => patchEditing({
                postalCode: e.target.value
              }),
              placeholder: "17310",
              inputMode: "numeric"
            })]
          }), jsxs("label", {
            class: "grid gap-1 sm:col-span-2",
            children: [jsx("span", {
              class: "text-xs font-semibold text-zinc-600",
              children: "Notas (opcional)"
            }), jsx("input", {
              class: "h-10 rounded-xl border border-zinc-300 px-3 text-sm sm:h-11",
              value: form.notes,
              onInput: (e) => patchEditing({
                notes: e.target.value
              }),
              placeholder: "Llamar al llegar, timbre..."
            })]
          })]
        }), jsxs("label", {
          class: "mt-4 flex items-start gap-2 text-sm sm:items-center",
          children: [jsx("input", {
            type: "checkbox",
            checked: form.isDefault,
            onChange: (e) => patchEditing({
              isDefault: e.target.checked
            })
          }), "Marcar como default"]
        }), jsxs("div", {
          class: "mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center",
          children: [jsx("button", {
            type: "button",
            class: `w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white sm:w-auto ${savingAddress ? "opacity-60 pointer-events-none" : ""}`,
            onClick: saveAddress,
            children: "Guardar"
          }), jsx("button", {
            type: "button",
            class: "w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100 sm:w-auto",
            onClick: () => setEditing(null),
            children: "Cancelar"
          }), addrMsg ? jsx("div", {
            class: "text-sm text-zinc-600",
            children: addrMsg
          }) : null]
        })]
      }) : addrMsg ? jsx("div", {
        class: "mt-4 text-sm text-zinc-600",
        children: addrMsg
      }) : null]
    })]
  });
}

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$props, $$slots);
  Astro2.self = $$Index;
  const user = Astro2.locals.user;
  let points = 0;
  let tierName = null;
  if (user) {
    const [profile] = await db.select({
      pointsBalance: UserProfile.pointsBalance,
      tierId: UserProfile.tierId
    }).from(UserProfile).where(eq(UserProfile.userId, user.id)).limit(1);
    points = Number(profile?.pointsBalance ?? 0);
    if (profile?.tierId) {
      const [tier] = await db.select({ name: LoyaltyTier.name }).from(LoyaltyTier).where(eq(LoyaltyTier.id, profile.tierId)).limit(1);
      tierName = tier?.name ?? null;
    }
  }
  return renderTemplate`${renderComponent($$result, "SiteLayout", $$SiteLayout, { "title": "Mi cuenta · Arcadia" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<h1 class="text-2xl font-semibold tracking-tight">Mi cuenta</h1> <div class="mt-6 rounded-2xl border border-zinc-200 p-4 sm:p-5"> <div class="text-sm text-zinc-600">Sesión activa</div> <div class="mt-1 wrap-break-words font-semibold"> ${user?.name ?? user?.email} · ${user?.role} </div> <div class="mt-5 grid gap-3 sm:grid-cols-2"> <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4"> <div class="text-xs font-semibold text-zinc-600">Puntos</div> <div class="mt-1 text-2xl font-black">${points}</div> <div class="mt-1 text-xs text-zinc-600">
Se suman al pagar/entregar.
</div> </div> <div class="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 sm:p-4"> <div class="text-xs font-semibold text-zinc-600">Nivel</div> <div class="mt-1 text-2xl font-black">${tierName ?? "—"}</div> <div class="mt-1 text-xs text-zinc-600">Automático por puntos.</div> </div> </div> <div class="mt-5 border-t border-zinc-200 pt-5"> <div class="text-sm font-semibold">Acciones</div> <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"> <a class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-center text-sm font-semibold hover:bg-zinc-50 sm:w-auto" href="/cuenta/pedidos">
Mis pedidos
</a> </div> </div> <div class="mt-5 border-t border-zinc-200 pt-5"> <form method="post" action="/api/auth/logout"> <button class="w-full rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50 sm:w-auto" type="submit">
Cerrar sesión
</button> </form> </div> </div> ${renderComponent($$result2, "AccountPanel", AccountPanel, { "client:load": true, "client:component-hydration": "load", "client:component-path": "@/islands/account/AccountPanel", "client:component-export": "default" })} ` })}`;
}, "C:/Users/vicre/Dev/arcadia/src/pages/cuenta/index.astro", void 0);

const $$file = "C:/Users/vicre/Dev/arcadia/src/pages/cuenta/index.astro";
const $$url = "/cuenta";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    default: $$Index,
    file: $$file,
    url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
