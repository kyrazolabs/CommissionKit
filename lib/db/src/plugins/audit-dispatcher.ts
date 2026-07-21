import type { AuditAction, AuditResourceType } from "../schema/auditEvents.js";

export interface AuditEventPayload {
  workspaceId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId: string | null;
  resourceName: string | null;
  changes: Array<{ field: string; from?: unknown; to?: unknown }>;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp?: string;
}

export interface AuditContextLike {
  userId?: string;
  userName?: string;
  userEmail?: string;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

let dispatchFn: (event: AuditEventPayload) => void = () => {};

export function setAuditDispatcher(fn: (event: AuditEventPayload) => void): void {
  dispatchFn = fn;
}

export function dispatchAuditEvent(event: AuditEventPayload): void {
  dispatchFn(event);
}

let contextProvider: () => AuditContextLike = () => ({});

export function setAuditContextProvider(fn: () => AuditContextLike): void {
  contextProvider = fn;
}

export function getAuditContext(): AuditContextLike {
  return contextProvider();
}
