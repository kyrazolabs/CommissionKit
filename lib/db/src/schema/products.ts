import type mongoose from "mongoose";
import { model, Schema, type Types } from "mongoose";
import { z } from "zod";
import { auditPlugin } from "../plugins/audit.js";

export const PRODUCT_KINDS = [
  "service",
  "property",
  "vehicle",
  "job",
  "insurance",
  "physical_good",
  "subscription",
  "other",
] as const;

export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const PRODUCT_STATUSES = ["active", "archived"] as const;

export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

const ProductSchema = new Schema(
  {
    workspaceId: { type: Schema.Types.ObjectId, ref: "Workspace", required: true },
    name: { type: String, required: true },
    kind: { type: String, required: true, enum: PRODUCT_KINDS },
    description: { type: String },
    sku: { type: String },
    unitPrice: { type: Number },
    currency: { type: String, required: true, default: "USD" },
    status: { type: String, required: true, enum: PRODUCT_STATUSES, default: "active" },
    attributes: { type: Schema.Types.Mixed, default: {} },
    imageKey: { type: String },
    isSampleData: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ProductSchema.index({ workspaceId: 1, createdAt: -1 });
ProductSchema.index({ workspaceId: 1, kind: 1 });
ProductSchema.index(
  { workspaceId: 1, sku: 1 },
  {
    unique: true,
    partialFilterExpression: { sku: { $type: "string" } },
  },
);

ProductSchema.plugin(auditPlugin({ resourceType: "product", resourceNameField: "name" }));

export const Product = model("Product", ProductSchema);

export type Product = mongoose.Document & {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  kind: ProductKind;
  description?: string;
  sku?: string;
  unitPrice?: number;
  currency: string;
  status: ProductStatus;
  attributes?: Record<string, unknown>;
  imageKey?: string;
  isSampleData?: boolean;
  createdAt: Date;
};

export const insertProductSchema = z.object({
  workspaceId: z.string(),
  name: z.string(),
  kind: z.enum(PRODUCT_KINDS),
  description: z.string().optional(),
  sku: z.string().optional(),
  unitPrice: z.number().optional(),
  currency: z.string().default("USD"),
  status: z.enum(PRODUCT_STATUSES).default("active"),
  attributes: z.record(z.string(), z.unknown()).optional(),
  imageKey: z.string().optional(),
});

const serviceAttributes = z.object({
  durationHours: z.number().nonnegative().optional(),
  billingCycle: z.enum(["one_time", "monthly", "quarterly", "yearly"]).optional(),
});

const propertyAttributes = z.object({
  address: z.string().optional(),
  bedrooms: z.number().nonnegative().optional(),
  bathrooms: z.number().nonnegative().optional(),
  listingType: z.enum(["sale", "rent"]).optional(),
});

const vehicleAttributes = z.object({
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  vin: z.string().optional(),
});

const jobAttributes = z.object({
  roleTitle: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract"]).optional(),
});

const insuranceAttributes = z.object({
  policyType: z.string().optional(),
  coverageAmount: z.number().nonnegative().optional(),
});

const physicalGoodAttributes = z.object({
  manufacturer: z.string().optional(),
  weightKg: z.number().nonnegative().optional(),
});

const subscriptionAttributes = z.object({
  interval: z.enum(["monthly", "quarterly", "yearly"]).optional(),
  seats: z.number().int().nonnegative().optional(),
});

const ATTRIBUTE_SCHEMAS: Record<ProductKind, z.ZodTypeAny> = {
  service: serviceAttributes,
  property: propertyAttributes,
  vehicle: vehicleAttributes,
  job: jobAttributes,
  insurance: insuranceAttributes,
  physical_good: physicalGoodAttributes,
  subscription: subscriptionAttributes,
  other: z.object({}),
};

export function parseProductAttributes(
  kind: string,
  attributes?: Record<string, unknown> | null,
): Record<string, unknown> {
  const schema = ATTRIBUTE_SCHEMAS[kind as ProductKind] ?? z.object({});
  return schema.parse(attributes ?? {}) as Record<string, unknown>;
}
