import type { APIRoute } from "astro";
import nodemailer from "nodemailer";
import { escapeHtml, escapeHtmlWithBreaks } from "@/server/security/html";
import { checkRateLimit, clientKey } from "@/server/security/rateLimit";

function safeText(value: FormDataEntryValue | null) {
    return String(value ?? "").trim();
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function withQuery(path: string, params: Record<string, string>) {
    const url = new URL(path, "http://local");
    for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
    }
    return `${url.pathname}${url.search}`;
}

export const POST: APIRoute = async (context) => {
    const { request, redirect } = context;
    /**
     * Cinco mensajes por hora y IP.
     *
     * Este endpoint manda correo con la cuenta SMTP del restaurante. Sin límite,
     * cualquiera la usa de altavoz hasta que el proveedor la marca como origen
     * de spam, y entonces el bar se queda sin correo saliente.
     */
    const limit = await checkRateLimit({
        key: `contact:${clientKey(context)}`,
        limit: 5,
        windowSeconds: 60 * 60,
    });

    if (!limit.allowed) {
        return redirect(withQuery("/contacto", { error: "rate" }), 302);
    }

    const form = await request.formData();

    const name = safeText(form.get("name")).slice(0, 120);
    const email = safeText(form.get("email")).slice(0, 200);
    const subject = safeText(form.get("subject")).slice(0, 180);
    const message = safeText(form.get("message")).slice(0, 5000);

    if (!name || !email || !subject || !message) {
        return redirect(withQuery("/contacto", { error: "1" }), 302);
    }

    // El email acaba en la cabecera Reply-To del correo: tiene que parecer una
    // dirección, no texto libre.
    if (!isValidEmail(email)) {
        return redirect(withQuery("/contacto", { error: "1" }), 302);
    }

    const host = import.meta.env.SMTP_HOST;
    const port = Number(import.meta.env.SMTP_PORT || 0);
    const secure =
        import.meta.env.SMTP_SECURE === "1" ||
        import.meta.env.SMTP_SECURE === "true";
    const from = import.meta.env.SMTP_FROM;
    const replyTo = import.meta.env.SMTP_REPLY_TO || undefined;
    const to =
        import.meta.env.CONTACT_TO ||
        import.meta.env.SMTP_REPLY_TO ||
        import.meta.env.SMTP_FROM;

    if (!host || !port || !from || !to) {
        return redirect(withQuery("/contacto", { error: "1" }), 302);
    }

    const authUser = import.meta.env.SMTP_USER || undefined;
    const authPass = import.meta.env.SMTP_PASS || undefined;

    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: authUser && authPass ? { user: authUser, pass: authPass } : undefined,
        });

        await transporter.sendMail({
            from,
            to,
            replyTo: email || replyTo,
            subject: `[Arcadia Contact] ${subject}`,
            text: `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
            // Todo lo que escribe el remitente va escapado: si no, mandando
            // `<a href="...">Pincha aquí</a>` se le cuela al personal un enlace
            // con pinta de legítimo dentro de un correo que sí sale de la web.
            html: `
        <p><b>Nombre:</b> ${escapeHtml(name)}</p>
        <p><b>Email:</b> ${escapeHtml(email)}</p>
        <p><b>Asunto:</b> ${escapeHtml(subject)}</p>
        <hr />
        <p>${escapeHtmlWithBreaks(message)}</p>
      `,
        });

        return redirect(withQuery("/contacto", { sent: "1" }), 302);
    } catch (error) {
        console.error("[contact] send failed", error);
        return redirect(withQuery("/contacto", { error: "1" }), 302);
    }
};