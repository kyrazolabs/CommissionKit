import { AsyncLocalStorage } from "async_hooks";

export interface AuditContext {
  userId?: string;
  userName?: string;
  userEmail?: string;
  workspaceId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export const auditContext = new AsyncLocalStorage<AuditContext>();

export function getAuditContext(): AuditContext {
  return auditContext.getStore() ?? {};
}

export function setAuditUser(user: {
  userId?: string;
  userName?: string;
  userEmail?: string;
}): void {
  const store = auditContext.getStore();
  if (!store) return;
  if (user.userId !== undefined) store.userId = user.userId;
  if (user.userName !== undefined) store.userName = user.userName;
  if (user.userEmail !== undefined) store.userEmail = user.userEmail;
}

export function setAuditWorkspace(workspaceId: string): void {
  const store = auditContext.getStore();
  if (!store) return;
  store.workspaceId = workspaceId;
}
