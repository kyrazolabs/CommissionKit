import type mongoose from "mongoose";
import { model, Schema, type Types } from "mongoose";

const AissolCommissionMatrixSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true, unique: true },
    slabs: [
      {
        index: { type: Number, required: true },
        label: { type: String, required: true },
        max: { type: Number, default: null },
      },
    ],
    gmBrackets: [
      {
        key: { type: String, required: true },
        label: { type: String, required: true },
        max: { type: Number, default: null },
      },
    ],
    rates: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const AissolCommissionMatrix = model("AissolCommissionMatrix", AissolCommissionMatrixSchema);

export interface SlabDef {
  index: number;
  label: string;
  max: number | null;
}

export interface GmBracketDef {
  key: string;
  label: string;
  max: number | null;
}

export type AissolCommissionMatrix = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  slabs: SlabDef[];
  gmBrackets: GmBracketDef[];
  rates: Record<string, Record<string, number>>;
  createdAt: Date;
  updatedAt: Date;
};
