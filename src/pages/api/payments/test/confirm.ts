import type { APIRoute } from "astro";
import { db, Order, Payment, eq } from "astro:db";
import { randomUUID } from "node:crypto";
import { enqueueOrderPrints } from "@/server/printing/queue";

function redirect(location: string) {
    return new Response(null, {
        status: 302,
        headers: { location },
    });
}

function safeText(value: FormDataEntryValue | null) {
    return String(value ?? "").trim();
}

export const POST: APIRoute = async ({ request, session }) => {
    const form = await request.formData();
    const publicId = safeText(form.get("publicId"));

    if (!publicId) return new Response("Missing publicId", { status: 400 });

    const [order] = await db
        .select({
            id: Order.id,
            publicId: Order.publicId,
            status: Order.status,
            paymentStatus: Order.paymentStatus,
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

    if (String(payment.status) !== "PAID") {
        const raw =
            payment.raw && typeof payment.raw === "object" && !Array.isArray(payment.raw)
                ? { ...(payment.raw as Record<string, unknown>) }
                : {};

        raw.confirmedAt = new Date().toISOString();
        raw.confirmMethod = "test-gateway";
        raw.note = "Pago confirmado desde pasarela sandbox interna.";

        await db
            .update(Payment)
            .set({
                status: "PAID",
                providerChargeId: `arcadia-test-charge-${randomUUID().slice(0, 8)}`,
                raw,
            })
            .where(eq(Payment.id, payment.id));

        await db
            .update(Order)
            .set({
                paymentStatus: "PAID",
                status: "PAID",
                updatedAt: new Date(),
            })
            .where(eq(Order.id, order.id));
    }

    // Con tarjeta la comanda sale aquí, no en el checkout: hasta este punto el
    // pedido no está pagado. enqueueOrderPrints es idempotente por pedido e
    // impresora, así que volver a esta ruta no duplica tickets.
    try {
        await enqueueOrderPrints(order.id);
    } catch (error) {
        console.error("[print] enqueue on payment confirm failed", error);
    }

    if (session) {
        await session.delete("cart");
    }

    return redirect(`/pedido/${publicId}`);
};