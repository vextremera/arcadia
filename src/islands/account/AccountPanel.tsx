import { useEffect, useMemo, useState } from "preact/hooks";
import { api } from "@/islands/_shared/http";

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

type AddressFormState = {
    id?: number;
    label: string;
    contactName: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    postalCode: string;
    notes: string;
    isDefault: boolean;
};

function emptyAddress(): AddressFormState {
    return {
        label: "",
        contactName: "",
        phone: "",
        line1: "",
        line2: "",
        city: "Lloret de Mar",
        postalCode: "",
        notes: "",
        isDefault: false,
    };
}

function normalizeOptionalString(v: string) {
    const t = v.trim();
    return t ? t : undefined;
}

export default function AccountPanel() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string>("");

    // Perfil
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [birthday, setBirthday] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState<string>("");

    // Direcciones
    const [addresses, setAddresses] = useState<AddressDto[]>([]);
    const [editing, setEditing] = useState<AddressFormState | null>(null);
    const [savingAddress, setSavingAddress] = useState(false);
    const [addrMsg, setAddrMsg] = useState<string>("");

    const isEditing = !!editing;
    const form = editing ?? emptyAddress();

    const defaultId = useMemo(
        () => addresses.find((a) => a.isDefault)?.id ?? null,
        [addresses]
    );

    async function loadAll() {
        setLoading(true);
        setErr("");
        try {
            const p = await api<ProfileResponse>("/api/account/profile");
            if (!p.ok) throw new Error(p.error || "No se pudo cargar el perfil.");
            setName(p.user?.name ?? "");
            setPhone(p.profile?.phone ?? "");
            setBirthday(p.profile?.birthday ?? "");

            const a = await api<AddressesResponse>("/api/account/addresses");
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
            const payload: any = {
                name: name.trim(),
                phone: normalizeOptionalString(phone) ?? null,
                birthday: normalizeOptionalString(birthday) ?? null,
            };
            const res = await api<ProfileResponse>("/api/account/profile", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error(res.error || "No se pudo guardar.");
            setProfileMsg("Guardado.");
        } catch (e) {
            setProfileMsg(e instanceof Error ? e.message : "No se pudo guardar.");
        } finally {
            setSavingProfile(false);
        }
    }

    function startNewAddress() {
        setAddrMsg("");
        setEditing({ ...emptyAddress(), isDefault: addresses.length === 0 });
    }

    function startEditAddress(a: AddressDto) {
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
            isDefault: a.isDefault,
        });
    }

    function patchEditing(patch: Partial<AddressFormState>) {
        setEditing((prev) => ({ ...(prev ?? emptyAddress()), ...patch }));
    }

    async function saveAddress() {
        if (!editing) return;
        setSavingAddress(true);
        setAddrMsg("");
        try {
            const payload: any = {
                ...(editing.id ? { id: editing.id } : null),
                label: normalizeOptionalString(editing.label),
                contactName: editing.contactName.trim(),
                phone: editing.phone.trim(),
                line1: editing.line1.trim(),
                line2: normalizeOptionalString(editing.line2),
                city: editing.city.trim(),
                postalCode: editing.postalCode.trim(),
                notes: normalizeOptionalString(editing.notes),
                isDefault: !!editing.isDefault,
            };

            // Backend requiere mínimos
            if (!payload.contactName || !payload.phone || !payload.line1 || !payload.city || !payload.postalCode) {
                setAddrMsg("Rellena contacto, teléfono, dirección, ciudad y CP.");
                setSavingAddress(false);
                return;
            }

            const res = await api<any>("/api/account/addresses", {
                method: "POST",
                body: JSON.stringify(payload),
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

    async function deleteAddress(id: number) {
        const ok = confirm("¿Borrar esta dirección?");
        if (!ok) return;
        setAddrMsg("");
        try {
            const res = await api<any>("/api/account/addresses", {
                method: "DELETE",
                body: JSON.stringify({ id }),
            });
            if (!res?.ok) throw new Error(res?.error || "No se pudo borrar.");
            if (editing?.id === id) setEditing(null);
            await loadAll();
            setAddrMsg("Dirección borrada.");
        } catch (e) {
            setAddrMsg(e instanceof Error ? e.message : "No se pudo borrar.");
        }
    }

    async function makeDefault(id: number) {
        setAddrMsg("");
        try {
            const res = await api<any>("/api/account/addresses", {
                method: "POST",
                body: JSON.stringify({ id, isDefault: true }),
            });
            if (!res?.ok) throw new Error(res?.error || "No se pudo marcar como default.");
            await loadAll();
            setAddrMsg("Dirección marcada como default.");
        } catch (e) {
            setAddrMsg(e instanceof Error ? e.message : "No se pudo marcar como default.");
        }
    }

    if (loading) {
        return (
            <div class="mt-6 rounded-2xl border border-zinc-200 p-5">
                <div class="text-sm text-zinc-600">Cargando datos de tu cuenta…</div>
            </div>
        );
    }

    if (err) {
        return (
            <div class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5">
                <div class="text-sm font-semibold text-red-900">No se pudo cargar tu cuenta</div>
                <div class="mt-1 text-sm text-red-900/80">{err}</div>
                <button
                    type="button"
                    class="mt-4 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
                    onClick={loadAll}
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div class="mt-6 space-y-6">
            {/* Perfil */}
            <section class="rounded-2xl border border-zinc-200 p-5">
                <div class="text-sm font-semibold">Mis datos</div>
                <div class="mt-1 text-sm text-zinc-600">Estos datos se usarán para facilitar el checkout.</div>

                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    <label class="grid gap-1">
                        <span class="text-xs font-semibold text-zinc-600">Nombre</span>
                        <input
                            class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                            value={name}
                            onInput={(e) => setName((e.target as HTMLInputElement).value)}
                            placeholder="Tu nombre"
                        />
                    </label>

                    <label class="grid gap-1">
                        <span class="text-xs font-semibold text-zinc-600">Teléfono</span>
                        <input
                            class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                            value={phone}
                            onInput={(e) => setPhone((e.target as HTMLInputElement).value)}
                            placeholder="600 123 123"
                            inputMode="tel"
                        />
                    </label>

                    <label class="grid gap-1">
                        <span class="text-xs font-semibold text-zinc-600">Cumpleaños</span>
                        <input
                            class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                            value={birthday}
                            onInput={(e) => setBirthday((e.target as HTMLInputElement).value)}
                            placeholder="YYYY-MM-DD"
                        />
                    </label>
                </div>

                <div class="mt-4 flex flex-wrap items-center gap-3">
                    <button
                        type="button"
                        class={`rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${savingProfile ? "opacity-60 pointer-events-none" : ""
                            }`}
                        onClick={saveProfile}
                    >
                        Guardar
                    </button>

                    {profileMsg ? <div class="text-sm text-zinc-600">{profileMsg}</div> : null}
                </div>
            </section>

            {/* Direcciones */}
            <section class="rounded-2xl border border-zinc-200 p-5">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <div class="text-sm font-semibold">Direcciones</div>
                        <div class="mt-1 text-sm text-zinc-600">Guarda tus direcciones para pedir más rápido.</div>
                    </div>

                    <button
                        type="button"
                        class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-50"
                        onClick={startNewAddress}
                    >
                        + Nueva
                    </button>
                </div>

                {addresses.length === 0 ? (
                    <div class="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
                        Aún no tienes direcciones guardadas.
                    </div>
                ) : (
                    <div class="mt-4 grid gap-3">
                        {addresses.map((a) => (
                            <div key={a.id} class="rounded-2xl border border-zinc-200 p-4">
                                <div class="flex items-start justify-between gap-4">
                                    <div class="min-w-0">
                                        <div class="flex flex-wrap items-center gap-2">
                                            <div class="text-sm font-semibold">{a.label ? a.label : "Dirección"}</div>
                                            {a.isDefault ? (
                                                <span class="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                                                    Default
                                                </span>
                                            ) : null}
                                            {!a.isDefault && defaultId ? (
                                                <span class="text-[11px] text-zinc-500">(no default)</span>
                                            ) : null}
                                        </div>

                                        <div class="mt-1 text-sm text-zinc-700">
                                            {a.contactName} · {a.phone}
                                        </div>
                                        <div class="mt-1 text-sm text-zinc-600">
                                            {a.line1}
                                            {a.line2 ? `, ${a.line2}` : ""} · {a.postalCode} {a.city}
                                        </div>
                                        {a.notes ? <div class="mt-1 text-xs text-zinc-500">{a.notes}</div> : null}
                                    </div>

                                    <div class="flex shrink-0 flex-wrap gap-2">
                                        {!a.isDefault ? (
                                            <button
                                                type="button"
                                                class="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                                                onClick={() => makeDefault(a.id)}
                                            >
                                                Hacer default
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            class="rounded-xl border border-zinc-300 px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                                            onClick={() => startEditAddress(a)}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            type="button"
                                            class="rounded-xl border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                                            onClick={() => deleteAddress(a.id)}
                                        >
                                            Borrar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isEditing ? (
                    <div class="mt-5 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                        <div class="text-sm font-semibold">{editing?.id ? "Editar dirección" : "Nueva dirección"}</div>

                        <div class="mt-4 grid gap-3 sm:grid-cols-2">
                            <label class="grid gap-1">
                                <span class="text-xs font-semibold text-zinc-600">Etiqueta (opcional)</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.label}
                                    onInput={(e) => patchEditing({ label: (e.target as HTMLInputElement).value })}
                                    placeholder="Casa / Trabajo"
                                />
                            </label>

                            <label class="grid gap-1">
                                <span class="text-xs font-semibold text-zinc-600">Contacto *</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.contactName}
                                    onInput={(e) => patchEditing({ contactName: (e.target as HTMLInputElement).value })}
                                    placeholder="Nombre"
                                />
                            </label>

                            <label class="grid gap-1">
                                <span class="text-xs font-semibold text-zinc-600">Teléfono *</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.phone}
                                    onInput={(e) => patchEditing({ phone: (e.target as HTMLInputElement).value })}
                                    placeholder="600 123 123"
                                    inputMode="tel"
                                />
                            </label>

                            <label class="grid gap-1 sm:col-span-2">
                                <span class="text-xs font-semibold text-zinc-600">Dirección *</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.line1}
                                    onInput={(e) => patchEditing({ line1: (e.target as HTMLInputElement).value })}
                                    placeholder="Calle / número"
                                />
                            </label>

                            <label class="grid gap-1 sm:col-span-2">
                                <span class="text-xs font-semibold text-zinc-600">Piso / puerta (opcional)</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.line2}
                                    onInput={(e) => patchEditing({ line2: (e.target as HTMLInputElement).value })}
                                    placeholder="2º 1ª"
                                />
                            </label>

                            <label class="grid gap-1">
                                <span class="text-xs font-semibold text-zinc-600">Ciudad *</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.city}
                                    onInput={(e) => patchEditing({ city: (e.target as HTMLInputElement).value })}
                                />
                            </label>

                            <label class="grid gap-1">
                                <span class="text-xs font-semibold text-zinc-600">Código postal *</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.postalCode}
                                    onInput={(e) => patchEditing({ postalCode: (e.target as HTMLInputElement).value })}
                                    placeholder="17310"
                                    inputMode="numeric"
                                />
                            </label>

                            <label class="grid gap-1 sm:col-span-2">
                                <span class="text-xs font-semibold text-zinc-600">Notas (opcional)</span>
                                <input
                                    class="h-11 rounded-xl border border-zinc-300 px-3 text-sm"
                                    value={form.notes}
                                    onInput={(e) => patchEditing({ notes: (e.target as HTMLInputElement).value })}
                                    placeholder="Llamar al llegar, timbre..."
                                />
                            </label>
                        </div>

                        <label class="mt-4 flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                checked={form.isDefault}
                                onChange={(e) => patchEditing({ isDefault: (e.target as HTMLInputElement).checked })}
                            />
                            Marcar como default
                        </label>

                        <div class="mt-4 flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                class={`rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white ${savingAddress ? "opacity-60 pointer-events-none" : ""
                                    }`}
                                onClick={saveAddress}
                            >
                                Guardar
                            </button>
                            <button
                                type="button"
                                class="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold hover:bg-zinc-100"
                                onClick={() => setEditing(null)}
                            >
                                Cancelar
                            </button>
                            {addrMsg ? <div class="text-sm text-zinc-600">{addrMsg}</div> : null}
                        </div>
                    </div>
                ) : addrMsg ? (
                    <div class="mt-4 text-sm text-zinc-600">{addrMsg}</div>
                ) : null}
            </section>
        </div>
    );
}