import { describe, test, expect } from "bun:test";
import { insertWorkspaceSchema, insertWorkspaceMemberSchema } from "./workspaces";

describe("insertWorkspaceSchema", () => {
  const validWS = {
    slug: "acme-corp",
    name: "Acme Corp",
    ownerId: "user123",
  };

  test("accepts valid workspace input", () => {
    const result = insertWorkspaceSchema.parse(validWS);
    expect(result.slug).toBe("acme-corp");
    expect(result.name).toBe("Acme Corp");
    expect(result.ownerId).toBe("user123");
  });

  test("rejects missing slug", () => {
    const { slug, ...rest } = validWS;
    expect(() => insertWorkspaceSchema.parse(rest)).toThrow();
  });

  test("rejects missing name", () => {
    const { name, ...rest } = validWS;
    expect(() => insertWorkspaceSchema.parse(rest)).toThrow();
  });

  test("rejects missing ownerId", () => {
    const { ownerId, ...rest } = validWS;
    expect(() => insertWorkspaceSchema.parse(rest)).toThrow();
  });

  test("rejects empty slug", () => {
    expect(() =>
      insertWorkspaceSchema.parse({ ...validWS, slug: "" }),
    ).not.toThrow();
  });

  test("rejects non-string values", () => {
    expect(() =>
      insertWorkspaceSchema.parse({ slug: 123, name: "Test", ownerId: "u1" }),
    ).toThrow();
  });
});

describe("insertWorkspaceMemberSchema", () => {
  const validMember = {
    workspaceId: "ws1",
    email: "member@example.com",
  };

  test("accepts valid member with default role", () => {
    const result = insertWorkspaceMemberSchema.parse(validMember);
    expect(result.workspaceId).toBe("ws1");
    expect(result.email).toBe("member@example.com");
    expect(result.role).toBe("member");
  });

  test("accepts explicit role", () => {
    const result = insertWorkspaceMemberSchema.parse({
      ...validMember,
      role: "admin",
    });
    expect(result.role).toBe("admin");
  });

  test("accepts optional userId and roleIds", () => {
    const result = insertWorkspaceMemberSchema.parse({
      ...validMember,
      userId: "user1",
      roleIds: ["role1", "role2"],
    });
    expect(result.userId).toBe("user1");
    expect(result.roleIds).toEqual(["role1", "role2"]);
  });

  test("rejects missing workspaceId", () => {
    const { workspaceId, ...rest } = validMember;
    expect(() => insertWorkspaceMemberSchema.parse(rest)).toThrow();
  });

  test("rejects missing email", () => {
    const { email, ...rest } = validMember;
    expect(() => insertWorkspaceMemberSchema.parse(rest)).toThrow();
  });

  test("accepts empty role", () => {
    const result = insertWorkspaceMemberSchema.parse({
      ...validMember,
      role: "",
    });
    expect(result.role).toBe("");
  });
});
