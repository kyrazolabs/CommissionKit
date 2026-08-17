import type mongoose from "mongoose";
import { model, Schema, type Types } from "mongoose";
import { z } from "zod";

const ApiKeySchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    keyHash: { type: String, required: true, index: true },
    prefix: { type: String, required: true },
    permissions: { type: [String], default: ["read:all"] },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    lastUsedAt: { type: Date },
    expiresAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ApiKey = model("ApiKey", ApiKeySchema);

export type ApiKey = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  keyHash: string;
  prefix: string;
  permissions: string[];
  createdBy: Types.ObjectId;
  lastUsedAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default(["read:all"]),
  expiresAt: z.string().datetime().optional(),
});
