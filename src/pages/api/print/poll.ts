/**
 * Único endpoint que consume el bridge de impresión del local.
 *
 * Un ciclo del bridge = un POST: manda los acks de lo que imprimió y el estado
 * de cada impresora, y recibe la lista de impresoras y los trabajos pendientes
 * ya convertidos a bytes ESC/POS (base64). Todo en un round trip para que el
 * bridge pueda sondear cada pocos segundos sin castigar a la función serverless.
 *
 * OJO: src/middleware.ts sólo protege /admin y /cuenta, así que esta ruta es
 * pública. El token compartido es la única barrera y por eso falla cerrado si
 * PRINT_BRIDGE_TOKEN no está configurado.
 */
import type { APIRoute } from "astro";
import { renderEscPosBase64 } from "@/server/printing/escpos";
import { ackJob, claimJobs, getPrinters, reportPrinterHealth } from "@/server/printing/queue";

export const prerender = false;

type AckPayload = { id: number; ok: boolean; error?: string | null };
type HealthPayload = { printerId: number; online: boolean; error?: string | null };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/** Comparación en tiempo constante para no filtrar el token carácter a carácter. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function isAuthorized(request: Request): boolean {
  const expected = import.meta.env.PRINT_BRIDGE_TOKEN ?? process.env.PRINT_BRIDGE_TOKEN ?? "";
  // Sin token configurado no se sirve nada: mejor que la cola no avance a que
  // quede abierta una ruta que expone datos de pedidos.
  if (!expected) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!provided) return false;

  return safeEqual(provided, expected);
}

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) {
    return json({ error: "unauthorized" }, 401);
  }

  let body: { acks?: AckPayload[]; health?: HealthPayload[] } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    // Un ciclo sin cuerpo es válido: el bridge sólo quiere saber si hay trabajo.
  }

  for (const ack of body.acks ?? []) {
    const id = Number(ack?.id);
    if (Number.isFinite(id)) await ackJob(id, Boolean(ack.ok), ack.error ?? null);
  }

  for (const report of body.health ?? []) {
    const printerId = Number(report?.printerId);
    if (Number.isFinite(printerId)) {
      await reportPrinterHealth(printerId, Boolean(report.online), report.error ?? null);
    }
  }

  const printers = (await getPrinters()).filter((printer) => printer.enabled);
  const jobs = await claimJobs(10);
  const byId = new Map(printers.map((printer) => [printer.id, printer]));

  return json({
    printers: printers.map((printer) => ({
      id: printer.id,
      name: printer.name,
      host: printer.host,
      port: printer.port,
    })),
    jobs: jobs
      // Una impresora deshabilitada a mitad de cola no debe recibir nada.
      .filter((job) => byId.has(job.printerId))
      .map((job) => {
        const printer = byId.get(job.printerId)!;
        return {
          id: job.id,
          printerId: job.printerId,
          host: printer.host,
          port: printer.port,
          title: job.title,
          payloadBase64: renderEscPosBase64(job.document),
        };
      }),
  });
};

/** GET sirve de comprobación de conectividad y token desde el propio local. */
export const GET: APIRoute = async ({ request }) => {
  if (!isAuthorized(request)) return json({ error: "unauthorized" }, 401);
  return json({ ok: true, printers: (await getPrinters()).length });
};
