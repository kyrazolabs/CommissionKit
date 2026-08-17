import { z } from "zod";

export const AuthConfigSchema = z.union([
  z.object({
    type: z.literal("apiKey"),
    headerName: z.string().default("X-API-Key"),
    apiKey: z.string(),
  }),
  z.object({
    type: z.literal("bearer"),
    token: z.string(),
  }),
  z.object({
    type: z.literal("basic"),
    username: z.string(),
    password: z.string(),
  }),
  z.object({
    type: z.literal("oauth2"),
    tokenUrl: z.string(),
    clientId: z.string(),
    clientSecret: z.string(),
    scopes: z.string().optional(),
  }),
]);

export const PaginationConfigSchema = z.object({
  type: z.enum(["offset", "cursor", "page"]).default("offset"),
  limitParam: z.string().default("limit"),
  offsetParam: z.string().default("offset"),
  cursorParam: z.string().default("cursor"),
  pageParam: z.string().default("page"),
  limitValue: z.number().default(100),
  cursorPath: z.string().optional(),
});

export const EntityFieldMappingSchema = z.object({
  externalId: z.string().optional().default("id"),
  name: z.string().optional(),
  email: z.string().optional(),
  role: z.string().optional(),
  amount: z.string().optional(),
  closeDate: z.string().optional(),
  stage: z.string().optional(),
  currency: z.string().optional(),
  repExternalId: z.string().optional(),
  paymentStatus: z.string().optional(),
  notes: z.string().optional(),
});

export const StageFilterSchema = z.object({
  field: z.string(),
  include: z.array(z.string()),
});

export const EntityMappingSchema = z.object({
  enabled: z.boolean().default(false),
  method: z.enum(["GET", "POST"]).default("GET"),
  endpoint: z.string(),
  fields: EntityFieldMappingSchema.optional(),
  filters: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
  modifiedAfterParam: z.string().optional(),
  stageFilter: StageFilterSchema.optional(),
  currencyMapping: z.record(z.string(), z.string()).optional(),
  paymentStatusMapping: z
    .object({
      paid: z.array(z.string()).optional(),
      unpaid: z.array(z.string()).optional(),
      partial: z.array(z.string()).optional(),
      on_hold: z.array(z.string()).optional(),
    })
    .optional(),
});

export const CustomConnectorConfigSchema = z.object({
  baseUrl: z.string().url(),
  auth: AuthConfigSchema,
  pagination: PaginationConfigSchema.optional(),
  responsePath: z.string().optional(),
  entities: z
    .object({
      reps: EntityMappingSchema.optional(),
      deals: EntityMappingSchema.optional(),
    })
    .optional(),
});

export type CustomConnectorConfig = z.infer<typeof CustomConnectorConfigSchema>;
export type EntityFieldMapping = z.infer<typeof EntityFieldMappingSchema>;
export type PaginationConfig = z.infer<typeof PaginationConfigSchema>;
export type AuthConfig = z.infer<typeof AuthConfigSchema>;
