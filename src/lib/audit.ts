import { prisma } from "./db";

interface WriteAuditLogParams {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

// Fire-and-forget — never awaited in the hot path so it never blocks a response.
// Errors are swallowed with a console.error to avoid breaking the calling request.
export function writeAuditLog(params: WriteAuditLogParams): void {
  prisma.auditLog
    .create({
      data: {
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: params.metadata ?? undefined,
        ipAddress: params.ipAddress,
      },
    })
    .catch((err) => console.error("[AuditLog] Failed to write:", err));
}
