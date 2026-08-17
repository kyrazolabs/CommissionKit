import type mongoose from "mongoose";
import { model, Schema, type Types } from "mongoose";

const WorkspaceSubscriptionSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
    stripeCustomerId: { type: String },
    stripeSubscriptionId: { type: String }, // null for lifetime
    stripePriceId: { type: String },
    stripeProductId: { type: String },
    plan: { type: String, enum: ["starter", "growth", "pro", "flex", "free"], default: "free" },
    billingInterval: { type: String, enum: ["month", "year"], default: "month" },
    status: { type: String, default: "active" }, // active | past_due | canceled | trialing
    /** true for legacy lifetime (one-time payment) */
    isLifetime: { type: Boolean, default: false },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    /** Purchased add-on seats from Stripe (monthly or yearly extra-rep line item quantity). */
    extraRepSeats: { type: Number, default: 0, min: 0 },
    /** true if this workspace has ever used a trial. Trials are one-time per workspace. */
    trialUsed: { type: Boolean, default: false },
  },
  { timestamps: true },
);

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
  plan: "starter" | "growth" | "pro" | "flex" | "free";
  billingInterval: "month" | "year";
  status: string;
  isLifetime: boolean;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  extraRepSeats: number;
  trialUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
};
