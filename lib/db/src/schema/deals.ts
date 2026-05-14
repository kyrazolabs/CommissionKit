import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const DealSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  repId: { type: Schema.Types.ObjectId, ref: "Rep", required: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  closeDate: { type: String, required: true },
  period: { type: String, required: true },
  stage: { type: String, required: true, default: "closed_won" },
  currency: { type: String, required: true, default: "USD" },
  notes: { type: String },
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
  notes?: string;
  createdAt: Date;
};

export const insertDealSchema = z.object({
  workspaceId: z.string(),
  repId: z.string(),
  name: z.string(),
  amount: z.number(),
  closeDate: z.string(),
  period: z.string(),
  stage: z.string().default("closed_won"),
  currency: z.string().default("USD"),
  notes: z.string().optional(),
});
