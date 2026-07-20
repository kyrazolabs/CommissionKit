import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";
import { auditPlugin } from "../plugins/audit.js";

const PayoutSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    repId:       { type: Schema.Types.ObjectId, ref: "Rep", required: true },
    periodStart: { type: Date, required: true },
    periodEnd:   { type: Date, required: true },
    /** Base commission amount from the calculation run */
    commissionAmount: { type: Number, required: true, default: 0 },
    /** Manual adjustments (positive = bonus, negative = clawback) */
    adjustments: { type: Number, default: 0 },
    /** commissionAmount + adjustments */
    finalAmount:  { type: Number, required: true },
    /** Payment currency (inherits from workspace default) */
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "disputed", "on_hold"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["payroll", "bank_transfer", "other"],
    },
    scheduledPaymentDate: { type: Date },
    actualPaymentDate:    { type: Date },
    notes: { type: String },
    /** Internal log of status changes for audit trail */
    statusHistory: [
      {
        status:    { type: String },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String }, // userId
        note:      { type: String },
      },
    ],
  },
  { timestamps: true },
);

PayoutSchema.index({ workspaceId: 1, repId: 1 });
PayoutSchema.index({ workspaceId: 1, status: 1 });
PayoutSchema.index({ workspaceId: 1, periodStart: 1, periodEnd: 1 });

PayoutSchema.plugin(auditPlugin({ resourceType: "payout" }));

export const Payout = model("Payout", PayoutSchema);

export type Payout = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  repId: Types.ObjectId;
  periodStart: Date;
  periodEnd: Date;
  commissionAmount: number;
  adjustments: number;
  finalAmount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "disputed" | "on_hold";
  paymentMethod?: "payroll" | "bank_transfer" | "other";
  scheduledPaymentDate?: Date;
  actualPaymentDate?: Date;
  notes?: string;
  statusHistory: Array<{ status: string; changedAt: Date; changedBy?: string; note?: string }>;
  createdAt: Date;
  updatedAt: Date;
};

export const createPayoutSchema = z.object({
  repId:            z.string(),
  periodStart:      z.string(),
  periodEnd:        z.string(),
  commissionAmount: z.number().min(0),
  adjustments:      z.number().default(0),
  currency:         z.string().optional(),
  paymentMethod:    z.enum(["payroll", "bank_transfer", "other"]).optional(),
  scheduledPaymentDate: z.string().optional(),
  notes:            z.string().optional(),
});
