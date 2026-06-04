import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const DealPaymentStatus = ["unpaid", "paid", "partial", "on_hold"] as const;

const DealSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  repId: { type: Schema.Types.ObjectId, ref: "Rep", required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  closeDate: { type: String, required: true },
  period: { type: String, required: true },
  stage: { type: String, required: true, default: "closed_won" },
  currency: { type: String, required: true, default: "USD" },
  paymentStatus: { type: String, enum: DealPaymentStatus, default: "unpaid" },
  notes: { type: String },
  clawbackApplied: { type: Boolean, default: false },
  clawbackAmount: { type: Number, default: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

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
  createdAt: Date;
};

export { DealPaymentStatus };
export type DealPaymentStatus = (typeof DealPaymentStatus)[number];

export const insertDealSchema = z.object({
  workspaceId: z.string(),
  repId: z.string(),
  name: z.string(),
  amount: z.number(),
  closeDate: z.string(),
  period: z.string(),
  stage: z.string().default("closed_won"),
  currency: z.string().default("USD"),
  paymentStatus: z.enum(["unpaid", "paid", "partial", "on_hold"]).default("unpaid"),
  notes: z.string().optional(),
});
