import type { APIRoute } from "astro";
import { getArcadiaAvailability } from "@/server/time/madrid";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

type AvailabilityLike = {
  forcePickup?: boolean;
  windows?: {
    delivery?: {
      start?: string;
      end?: string;
    };
  };
  sources?: {
    delivery?: string;
  };
  sourceNotes?: {
    delivery?: string | null;
  };
};

function buildDeliveryMessage(availability: AvailabilityLike) {
  const start = availability.windows?.delivery?.start ?? "";
  const end = availability.windows?.delivery?.end ?? "";
  const source = availability.sources?.delivery ?? "APP_SETTING";
  const note = availability.sourceNotes?.delivery?.trim() || null;

  if (availability.forcePickup) {
    return note
      ? `Delivery desactivado temporalmente desde operativa. ${note}`
      : "Delivery desactivado temporalmente desde operativa.";
  }

  if (source === "SPECIAL_DATE_CLOSED") {
    return note
      ? `Delivery no disponible hoy por una excepción operativa. ${note}`
      : "Delivery no disponible hoy por una excepción operativa.";
  }

  if (source === "SPECIAL_DATE") {
    return note
      ? `Fuera de la franja especial de reparto de hoy (${start}–${end}). ${note}`
      : `Fuera de la franja especial de reparto de hoy (${start}–${end}).`;
  }

  if (source === "OPENING_HOUR_CLOSED") {
    return "Delivery no disponible hoy según el horario semanal.";
  }

  if (source === "OPENING_HOUR") {
    return `Fuera de la franja semanal de reparto (${start}–${end}).`;
  }

  return `Fuera de horario de reparto (${start}–${end}).`;
}

export const GET: APIRoute = async () => {
  const rawAvailability = await getArcadiaAvailability();
  const availability = rawAvailability as typeof rawAvailability & AvailabilityLike;

  return json({
    ...rawAvailability,
    deliveryMessage: buildDeliveryMessage(availability),
  });
};