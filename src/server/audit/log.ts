import { db, AuditLog } from "astro:db";

type AuditInput = {
  actorUserId?: number | null;
  action: string;
  entityType: string;
  entityId: string;
  diff?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

async function getNextAuditId() {
  const rows = await db.select({ id: AuditLog.id }).from(AuditLog);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}

export async function writeAuditLog(input: AuditInput) {
  const nextId = await getNextAuditId();

  await db.insert(AuditLog).values({
    id: nextId,
    actorUserId: input.actorUserId ?? undefined,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: input.diff ?? undefined,
    ip: input.ip?.trim() || undefined,
    userAgent: input.userAgent?.trim() || undefined,
    createdAt: new Date(),
  });

  return nextId;
}

export function getRequestAuditMeta(request: Request) {
  const forwardedFor =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "";

  const ip = forwardedFor
    .split(",")
    .map((item) => item.trim())
    .find(Boolean) || null;

  const userAgent = request.headers.get("user-agent") || null;

  return { ip, userAgent };
}