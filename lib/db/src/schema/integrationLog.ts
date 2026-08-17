import type mongoose from "mongoose";
import { model, Schema, type Types } from "mongoose";
import { z } from "zod";

const IntegrationLogSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    syncId: { type: Schema.Types.ObjectId, ref: "IntegrationSync", index: true },
    connectorName: { type: String, required: true },
    entityType: { type: String, required: true },
    externalId: { type: String, index: true },
    action: {
      type: String,
      enum: ["created", "updated", "skipped", "failed", "writeback_success", "writeback_failed"],
      required: true,
    },
    message: { type: String },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

IntegrationLogSchema.index({ workspaceId: 1, createdAt: -1 });
IntegrationLogSchema.index({ syncId: 1 });

export const IntegrationLog = model("IntegrationLog", IntegrationLogSchema);

export type IntegrationLog = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  syncId?: Types.ObjectId;
  connectorName: string;
  entityType: string;
  externalId: string;
  action: "created" | "updated" | "skipped" | "failed" | "writeback_success" | "writeback_failed";
  message?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
};
