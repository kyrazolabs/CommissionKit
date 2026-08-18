import { describe, expect, test } from "bun:test";
import { Types } from "mongoose";
import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES, AuditEvent } from "./auditEvents";

describe("AuditEvent schema", () => {
  test("constants are defined", () => {
    expect(AUDIT_ACTIONS).toContain("create");
    expect(AUDIT_ACTIONS).toContain("update");
    expect(AUDIT_RESOURCE_TYPES).toContain("deal");
    expect(AUDIT_RESOURCE_TYPES).toContain("workspace");
  });

  test("indexes are registered", () => {
    const indexes = AuditEvent.schema.indexes();
    const keys = indexes.map((idx) => Object.keys(idx[0]).join(","));
    const sortedKeys = indexes.map((idx) => Object.keys(idx[0]).sort().join(","));

    expect(sortedKeys).toContain("action");
    expect(sortedKeys).toContain("resourceId");
    expect(sortedKeys).toContain("resourceType");
    expect(sortedKeys).toContain("timestamp");
    expect(sortedKeys).toContain("userId");
    expect(sortedKeys).toContain("workspaceId");
    expect(keys).toContain("workspaceId,timestamp");
    expect(keys).toContain("workspaceId,resourceType,timestamp");
    expect(keys).toContain("workspaceId,userId,timestamp");
    expect(keys).toContain("workspaceId,resourceId");
    expect(keys).toContain("workspaceId,action,timestamp");
  });

  test("validates required fields", () => {
    const invalid = new AuditEvent({});
    const error = invalid.validateSync();
    expect(error).toBeTruthy();
    expect(error?.errors.workspaceId).toBeTruthy();
    expect(error?.errors.action).toBeTruthy();
    expect(error?.errors.resourceType).toBeTruthy();
  });

  test("accepts a valid audit event", () => {
    const event = new AuditEvent({
      workspaceId: new Types.ObjectId(),
      userId: "u1",
      userEmail: "admin@test.com",
      action: "create",
      resourceType: "deal",
      resourceId: new Types.ObjectId(),
      resourceName: "Acme Deal",
      changes: [{ field: "name", from: null, to: "Acme Deal" }],
      metadata: { source: "api" },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });
    const error = event.validateSync();
    expect(error).toBeFalsy();
  });
});
