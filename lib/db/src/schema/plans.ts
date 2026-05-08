import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const PlanSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  type: { type: String, required: true },
  flatRate: { type: Number },
  acceleratorThreshold: { type: Number },
  acceleratorRate: { type: Number },
  clawbackDays: { type: Number },
}, { timestamps: { createdAt: true, updatedAt: false } });

const PlanTierSchema = new Schema({
  planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
  fromAmount: { type: Number, required: true },
  toAmount: { type: Number },
  rate: { type: Number, required: true },
});

export const Plan = model("Plan", PlanSchema);
export const PlanTier = model("PlanTier", PlanTierSchema);

export type Plan = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  type: string;
  flatRate?: number;
  acceleratorThreshold?: number;
  acceleratorRate?: number;
  clawbackDays?: number;
  createdAt: Date;
};

export type PlanTier = mongoose.Document & {
  _id: Types.ObjectId;
  planId: Types.ObjectId;
  fromAmount: number;
  toAmount?: number;
  rate: number;
};

export const insertPlanSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  type: z.string(),
  flatRate: z.number().optional(),
  acceleratorThreshold: z.number().optional(),
  acceleratorRate: z.number().optional(),
  clawbackDays: z.number().optional(),
});

export const insertPlanTierSchema = z.object({
  planId: z.string(),
  fromAmount: z.number(),
  toAmount: z.number().optional(),
  rate: z.number(),
});
