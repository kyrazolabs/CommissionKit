import { describe, expect, test } from "bun:test";
import { insertRoleSchema } from "./roles";

describe("insertRoleSchema", () => {
  const validRole = {
    workspaceId: "ws1",
    name: "Accountant",
  };

  test("accepts valid input with defaults", () => {
    const result = insertRoleSchema.parse(validRole);
    expect(result.workspaceId).toBe("ws1");
    expect(result.name).toBe("Accountant");
    expect(result.isSystem).toBe(false);
    expect(result.permissions).toEqual([]);
  });

  test("accepts custom permissions and description", () => {
    const result = insertRoleSchema.parse({
      ...validRole,
      description: "Handles financial reporting",
      permissions: ["deals:read", "payouts:read", "reports:export"],
      isSystem: false,
    });
    expect(result.description).toBe("Handles financial reporting");
    expect(result.permissions).toEqual(["deals:read", "payouts:read", "reports:export"]);
  });

  test("accepts isSystem true for built-in roles", () => {
    const result = insertRoleSchema.parse({
      ...validRole,
      isSystem: true,
    });
    expect(result.isSystem).toBe(true);
  });

  test("rejects missing workspaceId", () => {
    const { workspaceId, ...rest } = validRole;
    expect(() => insertRoleSchema.parse(rest)).toThrow();
  });

  test("rejects missing name", () => {
    const { name, ...rest } = validRole;
    expect(() => insertRoleSchema.parse(rest)).toThrow();
  });

  test("rejects empty name", () => {
    expect(() => insertRoleSchema.parse({ ...validRole, name: "" })).toThrow();
  });

  test("rejects non-array permissions", () => {
    expect(() =>
      insertRoleSchema.parse({
        ...validRole,
        permissions: "deals:read",
      }),
    ).toThrow();
  });

  test("defaults permissions to empty array when omitted", () => {
    const result = insertRoleSchema.parse(validRole);
    expect(result.permissions).toEqual([]);
  });

  test("rejects non-boolean isSystem", () => {
    expect(() => insertRoleSchema.parse({ ...validRole, isSystem: "yes" })).toThrow();
  });
});
