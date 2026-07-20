import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";
import { auditPlugin } from "../plugins/audit.js";

const SyncScheduleSchema = new Schema({
  reps: { type: String, enum: ["realtime", "hourly", "daily", "manual"], default: "hourly" },
  deals: { type: String, enum: ["realtime", "hourly", "daily", "manual"], default: "hourly" },
}, { _id: false });

const IntegrationConnectionSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
  connectorName: { type: String, required: true },
  status: {
    type: String,
    enum: ["disconnected", "connecting", "connected", "error"],
    default: "disconnected",
  },
  config: { type: Schema.Types.Mixed, default: {} },
  metadata: { type: Schema.Types.Mixed, default: {} },
  webhookSecret: { type: String },
  syncSchedule: { type: SyncScheduleSchema, default: () => ({ reps: "hourly", deals: "hourly" }) },
  writeBackEnabled: { type: Boolean, default: false },
  lastConnectedAt: { type: Date },
  lastSyncedAt: { type: Date },
  lastError: { type: String },
}, { timestamps: true });

IntegrationConnectionSchema.index({ workspaceId: 1, connectorName: 1 });

IntegrationConnectionSchema.plugin(auditPlugin({ resourceType: "integration", resourceNameField: "connectorName" }));

export const IntegrationConnection = model("IntegrationConnection", IntegrationConnectionSchema);

export type IntegrationConnection = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  connectorName: string;
  status: "disconnected" | "connecting" | "connected" | "error";
  config: Record<string, unknown>;
  metadata: Record<string, unknown>;
  webhookSecret?: string;
  syncSchedule: {
    reps: "realtime" | "hourly" | "daily" | "manual";
    deals: "realtime" | "hourly" | "daily" | "manual";
  };
  writeBackEnabled: boolean;
  lastConnectedAt?: Date;
  lastSyncedAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
};

export const insertIntegrationConnectionSchema = z.object({
  workspaceId: z.string(),
  connectorName: z.string(),
  config: z.record(z.string(), z.unknown()).optional(),
  syncSchedule: z.object({
    reps: z.enum(["realtime", "hourly", "daily", "manual"]).optional(),
    deals: z.enum(["realtime", "hourly", "daily", "manual"]).optional(),
  }).optional(),
  writeBackEnabled: z.boolean().optional(),
});

export const updateIntegrationConnectionSchema = z.object({
  config: z.record(z.string(), z.unknown()).optional(),
  syncSchedule: z.object({
    reps: z.enum(["realtime", "hourly", "daily", "manual"]).optional(),
    deals: z.enum(["realtime", "hourly", "daily", "manual"]).optional(),
  }).optional(),
  writeBackEnabled: z.boolean().optional(),
});
