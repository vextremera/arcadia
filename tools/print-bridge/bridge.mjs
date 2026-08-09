#!/usr/bin/env node
/**
 * Bridge de impresión de ARCADIA.
 *
 * Corre en un equipo de la LAN del restaurante (el PC del TPV, un mini PC o una
 * Raspberry Pi). Existe porque la app está en Vercel y una función serverless no
 * puede abrir un socket contra 192.168.x.x: la conexión tiene que salir desde
 * dentro. Por eso el bridge *pregunta* ("¿hay trabajos?") en vez de recibir.
 *
 * No abre ningún puerto entrante ni requiere tocar el router. Sólo hace HTTPS
 * saliente hacia la app y TCP saliente hacia las impresoras.
 *
 * Uso:
 *   ARCADIA_URL=https://tu-dominio.com \
 *   PRINT_BRIDGE_TOKEN=xxxxx \
 *   node bridge.mjs
 *
 * Requiere Node 18 o superior (usa fetch nativo).
 */
import net from "node:net";

const BASE_URL = (process.env.ARCADIA_URL ?? "").replace(/\/$/, "");
const TOKEN = process.env.PRINT_BRIDGE_TOKEN ?? "";
const POLL_MS = Number(process.env.POLL_INTERVAL_MS ?? 4000);
const SOCKET_TIMEOUT_MS = Number(process.env.SOCKET_TIMEOUT_MS ?? 8000);
const HEALTH_EVERY_MS = Number(process.env.HEALTH_INTERVAL_MS ?? 60000);

if (!BASE_URL || !TOKEN) {
  console.error("Faltan ARCADIA_URL o PRINT_BRIDGE_TOKEN.");
  process.exit(1);
}

const POLL_URL = `${BASE_URL}/api/print/poll`;

/** Acks pendientes de entregar en el siguiente ciclo. */
let pendingAcks = [];
let lastHealthAt = 0;
let consecutiveFailures = 0;
let stopping = false;

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

/**
 * Envía bytes crudos a la impresora por TCP (ESC/POS sobre puerto 9100).
 * Espera al 'close' y no sólo al 'write': el write se resuelve contra el buffer
 * del socket, no contra el papel, y cerrar antes de tiempo trunca el ticket.
 */
function sendToPrinter(host, port, buffer) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let settled = false;

    const fail = (error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(error);
    };

    socket.setTimeout(SOCKET_TIMEOUT_MS);
    socket.once("timeout", () => fail(new Error(`Timeout conectando a ${host}:${port}`)));
    socket.once("error", fail);

    socket.once("close", () => {
      if (settled) return;
      settled = true;
      resolve();
    });

    socket.connect(port, host, () => {
      socket.write(buffer, (error) => {
        if (error) return fail(error);
        socket.end();
      });
    });
  });
}

/** Comprueba si la impresora acepta conexión, sin mandar nada. */
function checkPrinter(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let done = false;

    const finish = (online, error) => {
      if (done) return;
      done = true;
      socket.destroy();
      resolve({ online, error });
    };

    socket.setTimeout(3000);
    socket.once("timeout", () => finish(false, "Timeout"));
    socket.once("error", (error) => finish(false, error.message));
    socket.connect(port, host, () => finish(true, null));
  });
}

async function poll() {
  const acks = pendingAcks;
  pendingAcks = [];

  let health = [];
  const now = Date.now();
  const shouldCheckHealth = now - lastHealthAt > HEALTH_EVERY_MS;

  let response;
  try {
    response = await fetch(POLL_URL, {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify({ acks, health: [] }),
    });
  } catch (error) {
    // Los acks vuelven a la cola local: si se pierden, el servidor reintentará
    // el trabajo por timeout y saldría el ticket dos veces.
    pendingAcks = acks.concat(pendingAcks);
    consecutiveFailures += 1;
    log(`Error de red (${consecutiveFailures}):`, error.message);
    return;
  }

  if (response.status === 401) {
    log("Token rechazado. Revisa PRINT_BRIDGE_TOKEN.");
    consecutiveFailures += 1;
    return;
  }

  if (!response.ok) {
    pendingAcks = acks.concat(pendingAcks);
    consecutiveFailures += 1;
    log(`Respuesta ${response.status} del servidor.`);
    return;
  }

  if (consecutiveFailures > 0) log("Conexión restablecida.");
  consecutiveFailures = 0;

  const data = await response.json();

  for (const job of data.jobs ?? []) {
    const buffer = Buffer.from(job.payloadBase64, "base64");
    try {
      await sendToPrinter(job.host, job.port, buffer);
      log(`Impreso #${job.id} "${job.title}" en ${job.host}:${job.port}`);
      pendingAcks.push({ id: job.id, ok: true });
    } catch (error) {
      log(`Fallo #${job.id} en ${job.host}:${job.port}:`, error.message);
      pendingAcks.push({ id: job.id, ok: false, error: error.message });
    }
  }

  if (shouldCheckHealth) {
    lastHealthAt = now;
    health = await Promise.all(
      (data.printers ?? []).map(async (printer) => {
        const result = await checkPrinter(printer.host, printer.port);
        return { printerId: printer.id, online: result.online, error: result.error };
      }),
    );

    // El estado se manda en su propia llamada para no retrasar la impresión.
    try {
      await fetch(POLL_URL, {
        method: "POST",
        headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
        body: JSON.stringify({ acks: [], health }),
      });
    } catch {
      // El estado es informativo: si falla, se reintenta en el siguiente ciclo.
    }
  }
}

async function loop() {
  log(`Bridge iniciado. Sondeando ${POLL_URL} cada ${POLL_MS}ms.`);

  while (!stopping) {
    try {
      await poll();
    } catch (error) {
      log("Error inesperado:", error.message);
    }

    // Backoff si el servidor no responde, para no martillear en un corte largo.
    const wait = consecutiveFailures > 3 ? Math.min(POLL_MS * 8, 60000) : POLL_MS;
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    log("Parando…");
    stopping = true;
    setTimeout(() => process.exit(0), 500);
  });
}

loop();
