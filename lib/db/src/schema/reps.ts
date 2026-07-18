import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const RepSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, default: "Sales Rep" },
  planId: { type: Schema.Types.ObjectId, ref: "Plan" },
  portalAccessCode: { type: String, unique: true, sparse: true },
  portalUsername: { type: String, unique: true, sparse: true },
  externalId: { type: String, index: true, sparse: true },
  sourceSystem: { type: String },
  syncHash: { type: String },
  lastSyncedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed },
  isSampleData: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

RepSchema.index(
  { workspaceId: 1, sourceSystem: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { sourceSystem: { $type: "string" }, externalId: { $type: "string" } } },
);

export const Rep = model("Rep", RepSchema);

export type Rep = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  email: string;
  role: string;
  planId?: Types.ObjectId;
  portalAccessCode?: string;
  portalUsername?: string;
  externalId?: string;
  sourceSystem?: string;
  syncHash?: string;
  lastSyncedAt?: Date;
  metadata?: Record<string, unknown>;
  isSampleData?: boolean;
  createdAt: Date;
};

export const insertRepSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.string().default("Sales Rep"),
  planId: z.string().optional(),
});
