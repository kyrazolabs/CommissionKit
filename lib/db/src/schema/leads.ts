import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

// ─── Lead capture ─────────────────────────────────────────────────────────────

export const LEAD_SOURCES = ["hero", "calculator"] as const;
export type LeadSource = typeof LEAD_SOURCES[number];

export const LEAD_STATUSES = ["new", "contacted", "converted", "disqualified"] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];

const LeadSchema = new Schema({
  email: { type: String, required: true, trim: true, lowercase: true },
  source: { type: String, enum: LEAD_SOURCES, required: true },
  name: { type: String, trim: true },
  ip: { type: String },
  userAgent: { type: String },
  status: { type: String, enum: LEAD_STATUSES, default: "new" },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: { createdAt: true, updatedAt: true } });

// Unique on email so duplicate submissions update the existing lead.
LeadSchema.index({ email: 1 }, { unique: true });

export const Lead = model("Lead", LeadSchema);

export type Lead = mongoose.Document & {
  _id: Types.ObjectId;
  email: string;
  source: LeadSource;
  name?: string;
  ip?: string;
  userAgent?: string;
  status: LeadStatus;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

export const insertLeadSchema = z.object({
  email: z.string().email(),
  source: z.enum(LEAD_SOURCES),
  name: z.string().min(1).optional(),
});
