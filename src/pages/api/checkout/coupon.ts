import type { APIRoute } from "astro";
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

export const POST: APIRoute = async ({ request, session }) => {
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