import type { AuditAction, AuditResourceType } from "@workspace/db";
import { enqueueAuditEvent } from "@workspace/queue";
import { getAuditContext } from "./audit-context";

export async function logAudit(
  action: AuditAction,
  resourceType: AuditResourceType,
  payload: {
    workspaceId?: string;
    resourceId?: string;
    resourceName?: string;
    changes?: Array<{ field: string; from?: unknown; to?: unknown }>;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const ctx = getAuditContext();

  enqueueAuditEvent({
    workspaceId: payload.workspaceId ?? ctx.workspaceId ?? "",
    userId: ctx.userId ?? null,
    userName: ctx.userName ?? null,
    userEmail: ctx.userEmail ?? null,
    action,
    resourceType,
    resourceId: payload.resourceId ?? null,
    resourceName: payload.resourceName ?? null,
    changes: payload.changes ?? [],
    metadata: payload.metadata ?? {},
    ipAddress: ctx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? null,
  }).catch(() => {});
}
