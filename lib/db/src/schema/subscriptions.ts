import mongoose, { Schema, model, Types } from "mongoose";

const WorkspaceSubscriptionSchema = new Schema({
  workspaceId:          { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
  stripeCustomerId:     { type: String },
  stripeSubscriptionId: { type: String },       // null for lifetime
  stripePriceId:        { type: String },
  stripeProductId:      { type: String },
  plan:                 { type: String, enum: ["starter", "growth", "flex", "annual", "free"], default: "free" },
  status:               { type: String, default: "active" }, // active | past_due | canceled | trialing
  /** true for legacy lifetime (one-time payment) */
  isLifetime:           { type: Boolean, default: false },
  currentPeriodEnd:     { type: Date },
  cancelAtPeriodEnd:    { type: Boolean, default: false },
}, { timestamps: true });

WorkspaceSubscriptionSchema.index({ stripeCustomerId: 1 });
WorkspaceSubscriptionSchema.index({ stripeSubscriptionId: 1 });

export const WorkspaceSubscription = model("WorkspaceSubscription", WorkspaceSubscriptionSchema);

export type WorkspaceSubscription = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeProductId?: string;
  plan: "starter" | "growth" | "flex" | "annual" | "free";
  status: string;
  isLifetime: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
};
