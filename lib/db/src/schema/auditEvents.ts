import mongoose, { Schema, model, Types } from "mongoose";

export const AUDIT_ACTIONS = [
  "create", "update", "delete", "bulk_create", "bulk_update", "bulk_delete",
  "login", "logout", "password_change", "password_reset_requested", "email_verified",
  "invite_sent", "invite_accepted", "role_change", "member_removed",
  "workspace_deleted", "setting_changed", "billing_changed",
  "calculation_run", "payout_status_changed",
  "dispute_submitted", "dispute_resolved",
  "integration_connected", "integration_disconnected", "sync_triggered",
  "sample_data_loaded", "sample_data_deleted",
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_RESOURCE_TYPES = [
  "plan", "deal", "rep", "run", "payout", "dispute", "role",
  "workspace", "member", "integration", "setting", "billing",
  "user", "session", "notification", "sample_data", "api_key",
] as const;

export type AuditResourceType = (typeof AUDIT_RESOURCE_TYPES)[number];

const ChangeSchema = new Schema({
  field: { type: String, required: true },
  from: { type: Schema.Types.Mixed },
  to: { type: Schema.Types.Mixed },
}, { _id: false });

const AuditEventSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  userId: { type: String, index: true },
  userName: { type: String },
  userEmail: { type: String },
  action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
  resourceType: { type: String, enum: AUDIT_RESOURCE_TYPES, required: true, index: true },
  resourceId: { type: Schema.Types.Mixed, index: true },
  resourceName: { type: String },
  changes: { type: [ChangeSchema], default: [] },
  metadata: { type: Schema.Types.Mixed, default: {} },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
}, { timestamps: { createdAt: false, updatedAt: false } });

AuditEventSchema.index({ workspaceId: 1, timestamp: -1 });
AuditEventSchema.index({ workspaceId: 1, resourceType: 1, timestamp: -1 });
AuditEventSchema.index({ workspaceId: 1, userId: 1, timestamp: -1 });
AuditEventSchema.index({ workspaceId: 1, resourceId: 1 });
AuditEventSchema.index({ workspaceId: 1, action: 1, timestamp: -1 });

export const AuditEvent = model("AuditEvent", AuditEventSchema);

export type AuditEvent = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId?: string;
  userName?: string;
  userEmail?: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: Types.ObjectId | string;
  resourceName?: string;
  changes: Array<{ field: string; from?: unknown; to?: unknown }>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
};
