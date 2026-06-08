import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const IntegrationSyncSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
  connectorName: { type: String, required: true },
  entityType: {
    type: String,
    enum: ["reps", "deals"],
    required: true,
  },
  direction: { type: String, enum: ["ingress", "egress"], required: true },
  trigger: { type: String, enum: ["scheduled", "webhook", "manual", "initial"], required: true },
  status: { type: String, enum: ["running", "completed", "failed", "partial"], required: true },
  stats: {
    total: { type: Number, default: 0 },
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  error: { type: String },
  startedAt: { type: Date },
  completedAt: { type: Date },
}, { timestamps: { createdAt: true, updatedAt: false } });

IntegrationSyncSchema.index({ workspaceId: 1, startedAt: -1 });

export const IntegrationSync = model("IntegrationSync", IntegrationSyncSchema);

export type IntegrationSync = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  connectorName: string;
  entityType: "reps" | "deals";
  direction: "ingress" | "egress";
  trigger: "scheduled" | "webhook" | "manual" | "initial";
  status: "running" | "completed" | "failed" | "partial";
  stats: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
};
