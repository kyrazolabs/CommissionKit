import { describe, test, expect } from "bun:test";
import { insertRepSchema } from "./reps";

describe("insertRepSchema", () => {
  test("accepts valid input", () => {
    const result = insertRepSchema.parse({
      workspaceId: "ws1",
      name: "John Doe",
      email: "john@example.com",
    });
    expect(result.workspaceId).toBe("ws1");
    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john@example.com");
    expect(result.role).toBe("Sales Rep");
  });

  test("applies default role", () => {
    const result = insertRepSchema.parse({
      workspaceId: "ws1",
      name: "Jane",
      email: "jane@example.com",
    });
    expect(result.role).toBe("Sales Rep");
  });

  test("accepts optional planId", () => {
    const result = insertRepSchema.parse({
      workspaceId: "ws1",
      name: "Bob",
      email: "bob@example.com",
      planId: "plan1",
    });
    expect(result.planId).toBe("plan1");
  });

  test("rejects missing workspaceId", () => {
    expect(() =>
      insertRepSchema.parse({ name: "No WS", email: "test@test.com" })
    ).toThrow();
  });

  test("rejects missing name", () => {
    expect(() =>
      insertRepSchema.parse({ workspaceId: "ws1", email: "test@test.com" })
    ).toThrow();
  });

  test("rejects missing email", () => {
    expect(() =>
      insertRepSchema.parse({ workspaceId: "ws1", name: "No Email" })
    ).toThrow();
  });

  test("accepts any string as email (schema does not validate format)", () => {
    const result = insertRepSchema.parse({ workspaceId: "ws1", name: "Bad Email", email: "not-an-email" });
    expect(result.email).toBe("not-an-email");
  });
});
