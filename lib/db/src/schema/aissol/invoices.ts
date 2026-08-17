import type mongoose from "mongoose";
import { model, Schema, type Types } from "mongoose";

const AissolInvoiceSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "AissolProject", required: true },
    repId: { type: Schema.Types.ObjectId, ref: "Rep", required: true },
    invoiceNumber: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "SAR" },
    period: { type: String, required: true },
    notes: { type: String },
    dueDate: { type: String },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "paid", "partial", "on_hold"],
      default: "unpaid",
    },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

export const AissolInvoice = model("AissolInvoice", AissolInvoiceSchema);

export type AissolInvoice = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  projectId: Types.ObjectId;
  repId: Types.ObjectId;
  invoiceNumber: string;
  amount: number;
  currency: string;
  period: string;
  createdAt: Date;
  updatedAt: Date;
};
