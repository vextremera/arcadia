import type { APIRoute } from "astro";
import { checkRateLimit, clientKey, tooManyRequests } from "@/server/security/rateLimit";
import {
  validateCheckoutCoupon,
  type CheckoutOrderType,
} from "@/server/checkout/coupons";

type SessionUser = {
  id: number;
  email: string;
  name?: string | null;
  role: "ADMIN" | "STAFF" | "CUSTOMER";
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export const POST: APIRoute = async (context) => {
  const { request, session } = context;
  /**
   * Treinta comprobaciones por minuto e IP.
   *
   * Este endpoint dice si un código de cupón existe y cuánto descuenta. Sin
   * límite se pueden recorrer combinaciones hasta dar con una promoción viva.
   */
  const limit = await checkRateLimit({
    key: `coupon:${clientKey(context)}`,
    limit: 30,
    windowSeconds: 60,
  });

  if (!limit.allowed) {
    return tooManyRequests(limit, "Demasiados intentos con cupones. Espera un momento.");
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return json({ ok: false, error: "INVALID_JSON", message: "Body inválido." }, 400);
  }

  const user = session
    ? ((await session.get("user")) as SessionUser | undefined)
    : undefined;

  const type: CheckoutOrderType =
    String(body.type ?? "").toUpperCase() === "DELIVERY" ? "DELIVERY" : "PICKUP";

  const subtotalCents = Math.max(0, Number(body.subtotalCents ?? 0) || 0);
  const deliveryFeeCents = Math.max(0, Number(body.deliveryFeeCents ?? 0) || 0);
  const code = String(body.code ?? "");

  const result = await validateCheckoutCoupon({
    code,
    type,
    subtotalCents,
    deliveryFeeCents,
    userId: user?.role === "CUSTOMER" ? user.id : null,
  });

  return json(result);
};