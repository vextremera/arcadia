import type { APIRoute } from "astro";
import { db, Coupon, Order, Payment, eq } from "astro:db";
import { reverseRemainingOrderPointsOnce } from "@/server/loyalty/engine";

function redirect(location: string) {
    return new Response(null, {
        status: 302,
        headers: { location },
    });
}

function safeText(value: FormDataEntryValue | null) {
    return String(value ?? "").trim();
}

export const POST: APIRoute = async ({ request }) => {
    const form = await request.formData();
    const publicId = safeText(form.get("publicId"));

    if (!publicId) return new Response("Missing publicId", { status: 400 });

    const [order] = await db
        .select({
            id: Order.id,
            publicId: Order.publicId,
            userId: Order.userId,
            status: Order.status,
            paymentStatus: Order.paymentStatus,
            couponId: Order.couponId,
        })
        .from(Order)
        .where(eq(Order.publicId, publicId))
        .limit(1);

    if (!order) return new Response("Order not found", { status: 404 });

    const [payment] = await db
        .select({
            id: Payment.id,
            status: Payment.status,
            raw: Payment.raw,
        })
        .from(Payment)
        .where(eq(Payment.orderId, order.id))
        .limit(1);

    if (!payment) return new Response("Payment not found", { status: 404 });

    const raw =
        payment.raw && typeof payment.raw === "object" && !Array.isArray(payment.raw)
            ? { ...(payment.raw as Record<string, unknown>) }
            : {};

    raw.cancelledAt = new Date().toISOString();
    raw.cancelMethod = "test-gateway";
    raw.note = "Pago cancelado desde pasarela sandbox interna.";

    await db
        .update(Payment)
        .set({
            status: "FAILED",
            raw,
        })
        .where(eq(Payment.id, payment.id));

    const wasAlreadyCancelled = String(order.status) === "CANCELLED";

    await db
        .update(Order)
        .set({
            paymentStatus: "FAILED",
            status: "CANCELLED",
            updatedAt: new Date(),
        })
        .where(eq(Order.id, order.id));

    if (!wasAlreadyCancelled && order.couponId) {
        const [coupon] = await db
            .select({
                id: Coupon.id,
                usesCount: Coupon.usesCount,
            })
            .from(Coupon)
            .where(eq(Coupon.id, Number(order.couponId)))
            .limit(1);

        if (coupon && Number(coupon.usesCount ?? 0) > 0) {
            await db
                .update(Coupon)
                .set({
                    usesCount: Math.max(0, Number(coupon.usesCount ?? 0) - 1),
                })
                .where(eq(Coupon.id, coupon.id));
        }
    }

    if (order.userId) {
        try {
            await reverseRemainingOrderPointsOnce({
                orderId: order.id,
                userId: Number(order.userId),
                meta: {
                    source: "test-gateway-cancel",
                    cancelledAt: new Date().toISOString(),
                },
            });
        } catch (error) {
            console.error("[test-gateway] loyalty reverse failed", error);
        }
    }

    return redirect(`/checkout?payment=cancelled&order=${publicId}`);
};