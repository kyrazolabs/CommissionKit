import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const CommissionRunSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  period: { type: String, required: true },
  totalCommission: { type: Number, required: true, default: 0 },
  totalDeals: { type: Number, required: true, default: 0 },
  skippedDeals: { type: Number, required: true, default: 0 },
  repsCount: { type: Number, required: true, default: 0 },
  status: { type: String, enum: ["pending", "processing", "completed", "failed"], default: "pending" },
  error: { type: String },
}, { timestamps: { createdAt: true, updatedAt: true } });

const CommissionResultSchema = new Schema({
  runId: { type: Schema.Types.ObjectId, ref: "CommissionRun", required: true },
  repId: { type: Schema.Types.ObjectId, ref: "Rep", required: true },
  dealId: { type: Schema.Types.ObjectId, ref: "Deal", required: true },
  rateApplied: { type: Number, required: true },
  commissionAmount: { type: Number, required: true },
  /** Original deal currency (e.g. "EUR"). Same as currency field for backwards compat. */
  currency: { type: String, required: true, default: "USD" },
  calculationNote: { type: String, required: true },
  /** Workspace currency at calculation time (e.g. "SAR") */
  wsCurrency: { type: String },
  /** Deal amount converted to workspace currency at calculation time */
  convertedDealAmount: { type: Number },
  /** Commission converted to workspace currency at calculation time */
  convertedCommission: { type: Number },
  /** 1 <dealCurrency> = exchangeRateSnapshot <wsCurrency>. Captured from historical ExchangeRate record. */
  exchangeRateSnapshot: { type: Number },
  /** ISO date string of the ExchangeRate record used for conversion */
  rateSnapshotDate: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const CommissionRun = model("CommissionRun", CommissionRunSchema);
export const CommissionResult = model("CommissionResult", CommissionResultSchema);

export type CommissionRun = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  period: string;
  totalCommission: number;
  totalDeals: number;
  skippedDeals: number;
  repsCount: number;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CommissionResult = mongoose.Document & {
  _id: Types.ObjectId;
  runId: Types.ObjectId;
  repId: Types.ObjectId;
  dealId: Types.ObjectId;
  rateApplied: number;
  commissionAmount: number;
  currency: string;
  calculationNote: string;
  createdAt: Date;
  // Snapshot fields (present on results calculated after the multi-currency update)
  wsCurrency?: string;
  convertedDealAmount?: number;
  convertedCommission?: number;
  exchangeRateSnapshot?: number;
  rateSnapshotDate?: string;
};

export const insertCommissionRunSchema = z.object({
  workspaceId: z.string(),
  period: z.string(),
  totalCommission: z.number().default(0),
  totalDeals: z.number().default(0),
  skippedDeals: z.number().default(0),
  repsCount: z.number().default(0),
  status: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  error: z.string().optional(),
});

export const insertCommissionResultSchema = z.object({
  runId: z.string(),
  repId: z.string(),
  dealId: z.string(),
  rateApplied: z.number(),
  commissionAmount: z.number(),
  currency: z.string().default("USD"),
  calculationNote: z.string(),
  wsCurrency: z.string().optional(),
  convertedDealAmount: z.number().optional(),
  convertedCommission: z.number().optional(),
  exchangeRateSnapshot: z.number().optional(),
  rateSnapshotDate: z.string().optional(),
});
