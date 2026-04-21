export type DeliveryAreaRule = {
    enabled: boolean;
};

export type DeliveryAreaValidation = {
    enabled: boolean;
    allowed: boolean;
    status: "DISABLED" | "INSIDE" | "OUTSIDE" | "INCOMPLETE";
    message: string;
};

export const DEFAULT_DELIVERY_AREA_RULE: DeliveryAreaRule = {
    enabled: false,
};

export function normalizeDeliveryCity(value: unknown) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

export function matchesArcadiaDeliveryArea(city: unknown, postalCode: unknown) {
    const normalizedCity = normalizeDeliveryCity(city);
    const normalizedPostalCode = String(postalCode ?? "").trim();

    return normalizedCity === "lloret de mar" && normalizedPostalCode === "17310";
}

export function validateDeliveryAddressByArea(
    input: {
        city?: string | null;
        postalCode?: string | null;
    },
    rule: DeliveryAreaRule = DEFAULT_DELIVERY_AREA_RULE
): DeliveryAreaValidation {
    if (!rule.enabled) {
        return {
            enabled: false,
            allowed: true,
            status: "DISABLED",
            message: "La validación por zona está desactivada.",
        };
    }

    const city = String(input.city ?? "").trim();
    const postalCode = String(input.postalCode ?? "").trim();

    if (!city || !postalCode) {
        return {
            enabled: true,
            allowed: false,
            status: "INCOMPLETE",
            message: "Completa ciudad y código postal para comprobar si entra en la zona de reparto.",
        };
    }

    const allowed = matchesArcadiaDeliveryArea(city, postalCode);

    return {
        enabled: true,
        allowed,
        status: allowed ? "INSIDE" : "OUTSIDE",
        message: allowed
            ? "Dirección dentro de la zona de reparto."
            : "Esta dirección está fuera de la zona de reparto. Solo repartimos en Lloret de Mar (17310).",
    };
}