import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const CommissionRunSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  period: { type: String, required: true },
  totalCommission: { type: Number, required: true, default: 0 },
  totalDeals: { type: Number, required: true, default: 0 },
  repsCount: { type: Number, required: true, default: 0 },
}, { timestamps: { createdAt: true, updatedAt: false } });

const CommissionResultSchema = new Schema({
  runId: { type: Schema.Types.ObjectId, ref: "CommissionRun", required: true },
  repId: { type: Schema.Types.ObjectId, ref: "Rep", required: true },
  dealId: { type: Schema.Types.ObjectId, ref: "Deal", required: true },
  rateApplied: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  calculationNote: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const CommissionRun = model("CommissionRun", CommissionRunSchema);
export const CommissionResult = model("CommissionResult", CommissionResultSchema);

export type CommissionRun = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  period: string;
  totalCommission: number;
  totalDeals: number;
  repsCount: number;
  createdAt: Date;
};

export type CommissionResult = mongoose.Document & {
  _id: Types.ObjectId;
  runId: Types.ObjectId;
  repId: Types.ObjectId;
  dealId: Types.ObjectId;
  rateApplied: number;
  commissionAmount: number;
  calculationNote: string;
  createdAt: Date;
};

export const insertCommissionRunSchema = z.object({
  workspaceId: z.string(),
  period: z.string(),
  totalCommission: z.number().default(0),
  totalDeals: z.number().default(0),
  repsCount: z.number().default(0),
});

export const insertCommissionResultSchema = z.object({
  runId: z.string(),
  repId: z.string(),
  dealId: z.string(),
  rateApplied: z.number(),
  commissionAmount: z.number(),
  calculationNote: z.string(),
});
