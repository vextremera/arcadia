import { d as db, a as AuditLog } from './_astro_db_Bcz5lWRF.mjs';

async function getNextAuditId() {
  const rows = await db.select({
    id: AuditLog.id
  }).from(AuditLog);
  return rows.reduce((max, row) => Math.max(max, Number(row.id ?? 0)), 0) + 1;
}
async function writeAuditLog(input) {
  const nextId = await getNextAuditId();
  await db.insert(AuditLog).values({
    id: nextId,
    actorUserId: input.actorUserId ?? void 0,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: input.diff ?? void 0,
    ip: input.ip?.trim() || void 0,
    userAgent: input.userAgent?.trim() || void 0,
    createdAt: /* @__PURE__ */ new Date()
  });
  return nextId;
}
function getRequestAuditMeta(request) {
  const forwardedFor = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "";
  const ip = forwardedFor.split(",").map((item) => item.trim()).find(Boolean) || null;
  const userAgent = request.headers.get("user-agent") || null;
  return {
    ip,
    userAgent
  };
}

export { getRequestAuditMeta as g, writeAuditLog as w };
