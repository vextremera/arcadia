/**
 * Envío de correo del restaurante.
 *
 * Antes cada sitio que mandaba correo (contacto, newsletter) se montaba su
 * propio transporte de nodemailer con las mismas seis variables de entorno.
 * Aquí se hace una vez.
 *
 * Falla en silencio y devuelve `false` si el SMTP no está configurado o
 * revienta: un correo que no sale no puede tumbar un pedido que el cliente ya
 * ha pagado. Quien llama decide qué hacer con eso.
 */
import nodemailer from "nodemailer";

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
};

function config() {
  const host = import.meta.env.SMTP_HOST;
  const port = Number(import.meta.env.SMTP_PORT || 0);
  const from = import.meta.env.SMTP_FROM;

  if (!host || !port || !from) return null;

  return {
    host,
    port,
    from,
    secure: import.meta.env.SMTP_SECURE === "1" || import.meta.env.SMTP_SECURE === "true",
    user: import.meta.env.SMTP_USER || undefined,
    pass: import.meta.env.SMTP_PASS || undefined,
  };
}

/** ¿Se puede mandar correo ahora mismo? */
export function mailerReady(): boolean {
  return config() !== null;
}

export async function sendMail(input: MailInput): Promise<boolean> {
  const cfg = config();

  if (!cfg) {
    console.warn("[mailer] SMTP sin configurar: no se envía", input.subject);
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: cfg.user && cfg.pass ? { user: cfg.user, pass: cfg.pass } : undefined,
    });

    await transporter.sendMail({
      from: cfg.from,
      to: input.to,
      replyTo: input.replyTo,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return true;
  } catch (error) {
    console.error("[mailer] envío fallido", input.subject, error);
    return false;
  }
}
