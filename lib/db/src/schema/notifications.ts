import mongoose, { Schema, model, Types } from "mongoose";

// ─── Notification types ───────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = [
  "commission_run_completed",
  "new_rep_added",
  "deal_imported",
  "clawback_triggered",
  "member_invited",
  "member_role_changed",
  "plan_created",
  "plan_updated",
  "dispute_submitted",
  "dispute_resolved",
  "dispute_updated",
  "payout_approved",
  "payout_paid",
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

const NotificationSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  userId:      { type: String, required: true }, // recipient
  type:        { type: String, enum: NOTIFICATION_TYPES, required: true },
  title:       { type: String, required: true },
  message:     { type: String, required: true },
  read:        { type: Boolean, default: false },
  /** Optional link to navigate to on click */
  href:        { type: String },
  /** Extra metadata (runId, repId, etc.) */
  meta:        { type: Schema.Types.Mixed },
}, { timestamps: { createdAt: true, updatedAt: false } });

// Index for fast unread queries per user + workspace
NotificationSchema.index({ userId: 1, workspaceId: 1, read: 1, createdAt: -1 });

export const Notification = model("Notification", NotificationSchema);

export type Notification = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  href?: string;
  meta?: Record<string, unknown>;
  createdAt: Date;
};

// ─── User notification preferences ───────────────────────────────────────────

/** Default: all events enabled for both email and in-app */
const defaultPrefs = Object.fromEntries(
  NOTIFICATION_TYPES.map((t) => [t, { email: true, inApp: true }]),
);

const UserNotificationPrefsSchema = new Schema({
  userId:      { type: String, required: true, unique: true },
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace" },
  prefs: {
    type: Schema.Types.Mixed,
    default: defaultPrefs,
  },
}, { timestamps: { createdAt: true, updatedAt: true } });

export const UserNotificationPrefs = model("UserNotificationPrefs", UserNotificationPrefsSchema);

export type NotificationPref = { email: boolean; inApp: boolean };
export type UserNotificationPrefsDoc = mongoose.Document & {
  _id: Types.ObjectId;
  userId: string;
  workspaceId?: Types.ObjectId;
  prefs: Record<NotificationType, NotificationPref>;
  updatedAt: Date;
};
