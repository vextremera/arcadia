import type { APIRoute } from "astro";
import { db, Order, eq } from "astro:db";

const ALLOWED_STATUS = new Set([
  "PENDING",
  "PAID",
  "ACCEPTED",
  "PREPARING",
  "READY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
]);

const ALLOWED_PAYMENT = new Set([
  "UNPAID",
  "AUTH",
  "PAID",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

export const POST: APIRoute = async (context) => {
  const u = context.locals.user;
  if (!u || (u.role !== "ADMIN" && u.role !== "STAFF")) {
    return context.redirect("/admin/login");
  }

  const publicId = String(context.params.publicId ?? "").trim();
  const form = await context.request.formData();

  const status = String(form.get("status") ?? "").toUpperCase();
  const paymentStatus = String(form.get("paymentStatus") ?? "").toUpperCase();

  const patch: any = { updatedAt: new Date() };

  if (status) {
    if (!ALLOWED_STATUS.has(status)) return new Response("Bad status", { status: 400 });
    patch.status = status;
  }

  if (paymentStatus) {
    if (!ALLOWED_PAYMENT.has(paymentStatus)) return new Response("Bad paymentStatus", { status: 400 });
    patch.paymentStatus = paymentStatus;
  }

  if (!patch.status && !patch.paymentStatus) {
    return context.redirect(`/admin/pedidos/${publicId}`);
  }

  await db.update(Order).set(patch).where(eq(Order.publicId, publicId));
  return context.redirect(`/admin/pedidos/${publicId}`);
};
