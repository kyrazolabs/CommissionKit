import mongoose, { Schema, model, Types } from "mongoose";
import { z } from "zod";
import { auditPlugin } from "../plugins/audit.js";

const RoleSchema = new Schema({
  workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  isSystem: { type: Boolean, default: false }, // true for Built-in roles (Owner, Admin, Member)
  permissions: [{ type: String }],
}, { timestamps: { createdAt: true, updatedAt: true } });

// Ensure role names are unique per workspace
RoleSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

RoleSchema.plugin(auditPlugin({ resourceType: "role", resourceNameField: "name" }));

export const Role = model("Role", RoleSchema);

export type Role = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
};

export const insertRoleSchema = z.object({
  workspaceId: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  isSystem: z.boolean().default(false),
  permissions: z.array(z.string()).default([]),
});
