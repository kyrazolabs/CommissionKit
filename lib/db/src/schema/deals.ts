import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const DealPaymentStatus = ["unpaid", "paid", "partial", "on_hold"] as const;

const DealSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  repId: { type: Schema.Types.ObjectId, ref: "Rep", required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  closeDate: { type: String },
  period: { type: String, required: true },
  stage: { type: String, required: true, default: "pending" },
  currency: { type: String, required: true, default: "USD" },
  paymentStatus: { type: String, enum: DealPaymentStatus, default: "unpaid" },
  notes: { type: String },
  clawbackApplied: { type: Boolean, default: false },
  clawbackAmount: { type: Number, default: 0 },
  externalId: { type: String, index: true, sparse: true },
  sourceSystem: { type: String },
  syncHash: { type: String },
  lastSyncedAt: { type: Date },
  metadata: { type: Schema.Types.Mixed },
  isSampleData: { type: Boolean, default: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

DealSchema.index(
  { workspaceId: 1, sourceSystem: 1, externalId: 1 },
  { unique: true, partialFilterExpression: { sourceSystem: { $type: "string" }, externalId: { $type: "string" } } },
);

export const Deal = model("Deal", DealSchema);

export type Deal = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  repId: Types.ObjectId;
  name: string;
  amount: number;
  closeDate: string;
  period: string;
  stage: string;
  currency: string;
  paymentStatus: string;
  notes?: string;
  clawbackApplied?: boolean;
  clawbackAmount?: number;
  externalId?: string;
  sourceSystem?: string;
  syncHash?: string;
  lastSyncedAt?: Date;
  metadata?: Record<string, unknown>;
  isSampleData?: boolean;
  createdAt: Date;
};

export { DealPaymentStatus };
export type DealPaymentStatus = (typeof DealPaymentStatus)[number];

export const insertDealSchema = z.object({
  workspaceId: z.string(),
  repId: z.string(),
  name: z.string(),
  amount: z.number(),
  closeDate: z.string().optional(),
  period: z.string(),
  stage: z.string().default("pending"),
  currency: z.string().default("USD"),
  paymentStatus: z.enum(["unpaid", "paid", "partial", "on_hold"]).default("unpaid"),
  notes: z.string().optional(),
});
