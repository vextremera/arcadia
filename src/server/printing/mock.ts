/**
 * Estado de impresoras simulado (mock).
 *
 * Interfaz de datos deliberadamente pequeña (getPrinters/getPrinterStatus/...)
 * respaldada por AppSetting en vez de una tabla dedicada, porque hoy no hay
 * hardware real detrás: cuando se integre ESC/POS/QZ Tray/agente local, esta
 * capa se sustituye por consultas reales sin tocar las páginas que la usan.
 */
import { db, AppSetting, eq } from "astro:db";

export type PrinterStatus = "ONLINE" | "OFFLINE";
export type PrinterKind = "TICKET" | "KITCHEN";

export type MockPrinter = {
  id: string;
  name: string;
  location: string;
  kind: PrinterKind;
  status: PrinterStatus;
  lastSeenAt: string;
};

export type PrintJob = {
  id: number;
  printerId: string;
  printerName: string;
  label: string;
  createdAt: string;
};

const PRINTERS_KEY = "printersMock";
const JOBS_KEY = "printerJobsMock";
const MAX_JOBS = 20;

function defaultPrinters(): MockPrinter[] {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return [
    { id: "cocina", name: "Cocina", location: "Pase de cocina", kind: "KITCHEN", status: "ONLINE", lastSeenAt: now.toISOString() },
    { id: "barra", name: "Barra", location: "Zona de barra", kind: "TICKET", status: "ONLINE", lastSeenAt: now.toISOString() },
    { id: "recepcion", name: "Recepción", location: "Entrada", kind: "TICKET", status: "OFFLINE", lastSeenAt: yesterday.toISOString() },
  ];
}

async function getSettingRow(key: string) {
  const [row] = await db
    .select({ id: AppSetting.id, value: AppSetting.value })
    .from(AppSetting)
    .where(eq(AppSetting.key, key))
    .limit(1);
  return row ?? null;
}

async function getNextAppSettingId() {
  const rows = await db.select({ id: AppSetting.id }).from(AppSetting);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

async function upsertSetting(key: string, value: unknown, id?: number) {
  if (id) {
    await db.update(AppSetting).set({ value, updatedAt: new Date() }).where(eq(AppSetting.id, id));
    return id;
  }

  const nextId = await getNextAppSettingId();
  await db.insert(AppSetting).values({ id: nextId, key, value, updatedAt: new Date() });
  return nextId;
}

export async function getPrinters(): Promise<MockPrinter[]> {
  const row = await getSettingRow(PRINTERS_KEY);
  if (row?.value) return row.value as MockPrinter[];

  const seeded = defaultPrinters();
  await upsertSetting(PRINTERS_KEY, seeded);
  return seeded;
}

export async function getPrinterStatus(printerId: string): Promise<MockPrinter | null> {
  const printers = await getPrinters();
  return printers.find((printer) => printer.id === printerId) ?? null;
}

export async function getPrinterJobs(limit = MAX_JOBS): Promise<PrintJob[]> {
  const row = await getSettingRow(JOBS_KEY);
  const jobs = (row?.value as PrintJob[] | undefined) ?? [];
  return jobs.slice(0, limit);
}

export async function togglePrinterStatus(printerId: string): Promise<MockPrinter | null> {
  const row = await getSettingRow(PRINTERS_KEY);
  const printers = (row?.value as MockPrinter[] | undefined) ?? defaultPrinters();

  const next = printers.map((printer) =>
    printer.id === printerId
      ? { ...printer, status: (printer.status === "ONLINE" ? "OFFLINE" : "ONLINE") as PrinterStatus, lastSeenAt: new Date().toISOString() }
      : printer,
  );

  await upsertSetting(PRINTERS_KEY, next, row?.id);
  return next.find((printer) => printer.id === printerId) ?? null;
}

export async function recordTestPrint(printerId: string): Promise<PrintJob | null> {
  const printersRow = await getSettingRow(PRINTERS_KEY);
  const printers = (printersRow?.value as MockPrinter[] | undefined) ?? defaultPrinters();
  const printer = printers.find((item) => item.id === printerId);
  if (!printer) return null;

  const updatedPrinters = printers.map((item) =>
    item.id === printerId ? { ...item, status: "ONLINE" as PrinterStatus, lastSeenAt: new Date().toISOString() } : item,
  );
  await upsertSetting(PRINTERS_KEY, updatedPrinters, printersRow?.id);

  const jobsRow = await getSettingRow(JOBS_KEY);
  const jobs = (jobsRow?.value as PrintJob[] | undefined) ?? [];
  const nextJobId = jobs.reduce((max, job) => Math.max(max, job.id), 0) + 1;

  const job: PrintJob = {
    id: nextJobId,
    printerId,
    printerName: printer.name,
    label: `Prueba de impresión #${nextJobId}`,
    createdAt: new Date().toISOString(),
  };

  await upsertSetting(JOBS_KEY, [job, ...jobs].slice(0, MAX_JOBS), jobsRow?.id);
  return job;
}
