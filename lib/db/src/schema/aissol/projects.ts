import type mongoose from "mongoose";
import { model, Schema, type Types } from "mongoose";

const AissolProjectSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    repId: { type: Schema.Types.ObjectId, ref: "Rep", required: true },
    name: { type: String, required: true },
    totalValue: { type: Number, required: true },
    totalCost: { type: Number, required: true },
    currency: { type: String, default: "SAR" },
    period: { type: String, required: true },
    status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const AissolProject = model("AissolProject", AissolProjectSchema);

export type AissolProject = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  repId: Types.ObjectId;
  name: string;
  totalValue: number;
  totalCost: number;
  currency: string;
  period: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};
