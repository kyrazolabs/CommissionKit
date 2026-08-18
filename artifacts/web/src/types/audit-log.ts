// AuditEvent types matching the API response shape

export interface AuditEvent {
  id: string;
  workspaceId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  resourceName: string | null;
  changes: Array<{ field: string; from?: unknown; to?: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: string;
}

export interface AuditLogResponse {
  data: AuditEvent[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuditFilters {
  search: string;
  dateRange: { from?: string; to?: string };
  userId: string;
  actions: string[];
  resourceTypes: string[];
}

// Action and resource type constants for filtering
export const AUDIT_ACTIONS = [
  "create",
  "update",
  "delete",
  "bulk_create",
  "invite_sent",
  "invite_accepted",
  "role_change",
  "login",
  "logout",
  "password_changed",
  "approved",
  "rejected",
  "mark_paid",
] as const;

export const AUDIT_RESOURCE_TYPES = [
  "plan",
  "deal",
  "rep",
  "run",
  "payout",
  "dispute",
  "role",
  "workspace",
  "member",
  "integration",
  "billing",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];
export type AuditResourceType = (typeof AUDIT_RESOURCE_TYPES)[number];
