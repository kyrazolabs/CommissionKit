import type { Document, Schema, Types } from "mongoose";
import type { AuditAction, AuditResourceType } from "../schema/auditEvents.js";
import {
  type AuditContextLike,
  type AuditEventPayload,
  dispatchAuditEvent,
  getAuditContext,
} from "./audit-dispatcher.js";

const SENSITIVE_FIELDS = new Set<string>([
  "password",
  "secret",
  "token",
  "key",
  "webhookSecret",
  "apiKey",
  "apiSecret",
  "session",
  "cookie",
  "stripeCustomerId",
  "stripeSubscriptionId",
]);

function isSensitiveField(key: string): boolean {
  const lower = key.toLowerCase();
  for (const s of SENSITIVE_FIELDS) {
    if (lower.includes(s.toLowerCase())) return true;
  }
  return false;
}

function serializeValue(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (value && typeof value === "object" && "_bsontype" in value) {
    return (value as Types.ObjectId).toString();
  }
  if (Array.isArray(value)) {
    return value.map((v) => serializeValue(v));
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = serializeValue(v);
    }
    return out;
  }
  return value;
}

function normalizeDoc(doc: Document | Record<string, unknown>): Record<string, unknown> {
  const lean = (doc as Document).toObject ? (doc as Document).toObject() : doc;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(lean)) {
    if (key.startsWith("_")) continue;
    if (value && typeof value === "object" && (value as any)._bsontype) {
      out[key] = (value as Types.ObjectId).toString();
    } else {
      out[key] = value;
    }
  }
  return out;
}

function redactValue(key: string, value: unknown): unknown {
  if (isSensitiveField(key)) return "[REDACTED]";
  return serializeValue(value);
}

function computeDiff(
  original: Record<string, unknown>,
  updated: Record<string, unknown>,
): Array<{ field: string; from?: unknown; to?: unknown }> {
  const keys = new Set([...Object.keys(original), ...Object.keys(updated)]);
  const changes: Array<{ field: string; from?: unknown; to?: unknown }> = [];

  for (const key of keys) {
    if (key === "_id" || key === "__v" || key === "createdAt" || key === "updatedAt") continue;
    const from = redactValue(key, original[key]);
    const to = redactValue(key, updated[key]);
    if (JSON.stringify(from) !== JSON.stringify(to)) {
      changes.push({ field: key, from, to });
    }
  }

  return changes;
}

export interface AuditPluginOptions {
  resourceType: AuditResourceType;
  resourceNameField?: string;
}

function getResourceName(
  doc: Record<string, unknown>,
  resourceNameField?: string,
): string | undefined {
  if (!resourceNameField) return undefined;
  const value = doc[resourceNameField];
  return typeof value === "string" ? value : undefined;
}

function getWorkspaceId(doc: Document | Record<string, unknown>): string | undefined {
  const lean = (doc as Document).toObject
    ? (doc as Document).toObject()
    : (doc as Record<string, unknown>);
  const value = lean.workspaceId;
  if (value) {
    if (typeof value === "string") return value;
    if (value && typeof value === "object" && (value as any)._bsontype) {
      return (value as Types.ObjectId).toString();
    }
  }
  // For Workspace documents, the workspaceId is the document's own _id.
  const idValue = lean._id;
  if (idValue && typeof idValue === "object" && (idValue as any)._bsontype) {
    return (idValue as Types.ObjectId).toString();
  }
  if (typeof idValue === "string") return idValue;
  return undefined;
}

function getResourceId(doc: Document | Record<string, unknown>): string | undefined {
  const lean = (doc as Document).toObject
    ? (doc as Document).toObject()
    : (doc as Record<string, unknown>);
  const value = lean._id;
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && (value as any)._bsontype) {
    return (value as Types.ObjectId).toString();
  }
  return undefined;
}

function buildEvent(
  action: AuditAction,
  resourceType: AuditResourceType,
  doc: Document | Record<string, unknown>,
  changes: Array<{ field: string; from?: unknown; to?: unknown }>,
  ctx: AuditContextLike,
  resourceNameField?: string,
): AuditEventPayload {
  const lean = (doc as Document).toObject
    ? (doc as Document).toObject()
    : (doc as Record<string, unknown>);
  const workspaceId = getWorkspaceId(doc) ?? ctx.workspaceId ?? "";
  const resourceId = getResourceId(doc);
  const resourceName = getResourceName(lean, resourceNameField);

  return {
    workspaceId,
    userId: ctx.userId ?? null,
    userName: ctx.userName ?? null,
    userEmail: ctx.userEmail ?? null,
    action,
    resourceType,
    resourceId: resourceId ?? null,
    resourceName: resourceName ?? null,
    changes,
    metadata: {},
    ipAddress: ctx.ipAddress ?? null,
    userAgent: ctx.userAgent ?? null,
  };
}

export function auditPlugin(options: AuditPluginOptions) {
  return (schema: Schema) => {
    const { resourceType, resourceNameField } = options;

    // CREATE
    schema.post("save", (doc) => {
      const ctx = getAuditContext();
      const lean = normalizeDoc(doc);
      const changes: Array<{ field: string; from?: unknown; to?: unknown }> = [];
      for (const [key, value] of Object.entries(lean)) {
        if (key === "_id" || key === "createdAt" || key === "updatedAt") continue;
        changes.push({ field: key, from: null, to: redactValue(key, value) });
      }
      dispatchAuditEvent(buildEvent("create", resourceType, doc, changes, ctx, resourceNameField));
    });

    // UPDATE
    schema.pre("findOneAndUpdate", async function (this: any) {
      const query = this.getQuery();
      const model = this.model;
      const original = await model.findOne(query).lean();
      (this as any)._auditOriginal = original;
    });

    schema.post("findOneAndUpdate", async function (doc: any) {
      const ctx = getAuditContext();
      const original = (this as any)._auditOriginal;
      if (!original) return;
      const updated = doc
        ? normalizeDoc(doc)
        : normalizeDoc(await (this.model as any).findById(original._id).lean());
      const changes = computeDiff(normalizeDoc(original), updated);
      if (changes.length === 0) return;
      dispatchAuditEvent(
        buildEvent("update", resourceType, doc || original, changes, ctx, resourceNameField),
      );
    });

    // DELETE
    schema.pre("findOneAndDelete", async function (this: any) {
      const query = this.getQuery();
      const model = this.model;
      const original = await model.findOne(query).lean();
      (this as any)._auditOriginal = original;
    });

    schema.post("findOneAndDelete", function (doc: any) {
      const ctx = getAuditContext();
      const original = (this as any)._auditOriginal || doc;
      if (!original) return;
      const lean = normalizeDoc(original);
      const changes: Array<{ field: string; from?: unknown; to?: unknown }> = [];
      for (const [key, value] of Object.entries(lean)) {
        if (key === "_id" || key === "createdAt" || key === "updatedAt") continue;
        changes.push({ field: key, from: redactValue(key, value), to: null });
      }
      dispatchAuditEvent(
        buildEvent("delete", resourceType, original, changes, ctx, resourceNameField),
      );
    });
  };
}

export { getAuditContext, setAuditContextProvider } from "./audit-dispatcher.js";
