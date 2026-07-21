import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";
import { auditPlugin } from "../plugins/audit.js";

const DisputeSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    payoutId:    { type: Schema.Types.ObjectId, ref: "Payout", required: true },
    repId:       { type: Schema.Types.ObjectId, ref: "Rep", required: true },
    reason:      { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved"],
      default: "open",
    },
    adminNotes: { type: String },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

DisputeSchema.index({ workspaceId: 1, status: 1 });
DisputeSchema.index({ workspaceId: 1, repId: 1 });
DisputeSchema.index({ payoutId: 1 }, { unique: true }); // one dispute per payout

DisputeSchema.plugin(auditPlugin({ resourceType: "dispute" }));

export const Dispute = model("Dispute", DisputeSchema);

export type Dispute = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  payoutId: Types.ObjectId;
  repId: Types.ObjectId;
  reason: string;
  status: "open" | "under_review" | "resolved";
  adminNotes?: string;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export const createDisputeSchema = z.object({
  payoutId: z.string().min(1),
  reason:   z.string().min(10, "Please provide a detailed reason (min 10 characters)."),
});

export const updateDisputeSchema = z.object({
  status:     z.enum(["open", "under_review", "resolved"]).optional(),
  adminNotes: z.string().optional(),
});
