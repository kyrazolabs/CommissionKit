import { describe, test, expect } from "bun:test";

// Replicate the pure function from rbac.ts for unit testing
function hasPermission(permissions: Set<string>, resource: string, action: string): boolean {
  if (permissions.has("*")) return true;
  if (permissions.has(`${resource}:*`)) return true;
  return permissions.has(`${resource}:${action}`);
}

describe("RBAC - hasPermission", () => {
  test("wildcard '*' grants all access", () => {
    const perms = new Set(["*"]);
    expect(hasPermission(perms, "deals", "read")).toBe(true);
    expect(hasPermission(perms, "deals", "write")).toBe(true);
    expect(hasPermission(perms, "reps", "delete")).toBe(true);
    expect(hasPermission(perms, "anything", "anything")).toBe(true);
  });

  test("resource wildcard 'deals:*' grants all actions on that resource", () => {
    const perms = new Set(["deals:*"]);
    expect(hasPermission(perms, "deals", "read")).toBe(true);
    expect(hasPermission(perms, "deals", "write")).toBe(true);
    expect(hasPermission(perms, "deals", "delete")).toBe(true);
  });

  test("specific permission 'deals:read' only allows that action", () => {
    const perms = new Set(["deals:read"]);
    expect(hasPermission(perms, "deals", "read")).toBe(true);
    expect(hasPermission(perms, "deals", "write")).toBe(false);
    expect(hasPermission(perms, "deals", "delete")).toBe(false);
  });

  test("different resources are isolated", () => {
    const perms = new Set(["deals:read"]);
    expect(hasPermission(perms, "deals", "read")).toBe(true);
    expect(hasPermission(perms, "reps", "read")).toBe(false);
  });

  test("empty permissions set denies everything", () => {
    const perms = new Set<string>();
    expect(hasPermission(perms, "deals", "read")).toBe(false);
  });

  test("multiple permissions work correctly", () => {
    const perms = new Set(["deals:read", "reps:write", "plans:*"]);
    expect(hasPermission(perms, "deals", "read")).toBe(true);
    expect(hasPermission(perms, "deals", "write")).toBe(false);
    expect(hasPermission(perms, "reps", "write")).toBe(true);
    expect(hasPermission(perms, "plans", "read")).toBe(true);
    expect(hasPermission(perms, "plans", "delete")).toBe(true);
  });

  test("does not match prefix-like permissions", () => {
    const perms = new Set(["deals:"]);
    expect(hasPermission(perms, "deals", "read")).toBe(false);
  });

  test("mixed wildcard and specific — wildcard takes precedence", () => {
    const perms = new Set(["*", "deals:read"]);
    expect(hasPermission(perms, "anything", "anything")).toBe(true);
  });
});
