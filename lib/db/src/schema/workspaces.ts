import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";

const WorkspaceOnboardingSchema = new Schema({
  checklistDismissed: { type: Boolean, default: false },
  checklistCompletedAt: { type: Date, default: null },
  checklistShownAt: { type: Date, default: null },
}, { _id: false });

const WorkspaceSchema = new Schema({
  slug: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  // Workspace-level settings
  currency: { type: String, default: "USD" },
  fiscalYearStart: { type: String, default: "January" }, // month name
  commissionEngine: { type: String, default: "standard" },
  sampleDataLoaded: { type: Boolean, default: false },
  onboarding: { type: WorkspaceOnboardingSchema, default: () => ({ checklistDismissed: false, checklistCompletedAt: null, checklistShownAt: null }) },
}, { timestamps: { createdAt: true, updatedAt: false } });

const WorkspaceMemberSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  userId: { type: String },
  email: { type: String, required: true },
  role: { type: String, required: true, default: "member" }, // legacy fallback
  roleIds: [{ type: Schema.Types.ObjectId, ref: "Role" }],
}, { timestamps: { createdAt: true, updatedAt: false } });

export const Workspace = model("Workspace", WorkspaceSchema);
export const WorkspaceMember = model("WorkspaceMember", WorkspaceMemberSchema);

export type WorkspaceOnboarding = {
  checklistDismissed: boolean;
  checklistCompletedAt: Date | null;
  checklistShownAt: Date | null;
};

export type Workspace = mongoose.Document & {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  ownerId: string;
  currency: string;
  fiscalYearStart: string;
  commissionEngine: string;
  sampleDataLoaded?: boolean;
  onboarding?: WorkspaceOnboarding;
  createdAt: Date;
};

export type WorkspaceMember = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  userId?: string;
  email: string;
  role: string;
  roleIds?: Types.ObjectId[];
  createdAt: Date;
};

export const insertWorkspaceSchema = z.object({
  slug: z.string(),
  name: z.string(),
  ownerId: z.string(),
});

export const insertWorkspaceMemberSchema = z.object({
  workspaceId: z.string(),
  userId: z.string().optional(),
  email: z.string(),
  role: z.string().default("member"),
  roleIds: z.array(z.string()).optional(),
});

export const workspaceOnboardingSchema = z.object({
  checklistDismissed: z.boolean(),
  checklistCompletedAt: z.date().nullable(),
  checklistShownAt: z.date().nullable(),
});

export const updateWorkspaceOnboardingSchema = z.object({
  action: z.enum(["dismiss", "complete", "show"]),
});
