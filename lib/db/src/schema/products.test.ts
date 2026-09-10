import { describe, expect, test } from "bun:test";
import { insertProductSchema, PRODUCT_KINDS } from "./products";

describe("insertProductSchema", () => {
  const validProduct = {
    workspaceId: "ws1",
    name: "Enterprise Support",
    kind: "service" as const,
  };

  test("accepts valid input with required fields", () => {
    const result = insertProductSchema.parse(validProduct);
    expect(result.workspaceId).toBe("ws1");
    expect(result.name).toBe("Enterprise Support");
    expect(result.kind).toBe("service");
    expect(result.currency).toBe("USD");
    expect(result.status).toBe("active");
  });

  test("accepts all optional fields", () => {
    const result = insertProductSchema.parse({
      ...validProduct,
      description: "Monthly retainer",
      sku: "SVC-001",
      unitPrice: 2500,
      currency: "EUR",
      status: "archived",
    });
    expect(result.description).toBe("Monthly retainer");
    expect(result.sku).toBe("SVC-001");
    expect(result.unitPrice).toBe(2500);
    expect(result.currency).toBe("EUR");
    expect(result.status).toBe("archived");
  });

  test("accepts every product kind", () => {
    for (const kind of PRODUCT_KINDS) {
      const result = insertProductSchema.parse({ ...validProduct, kind });
      expect(result.kind).toBe(kind);
    }
  });

  test("rejects missing workspaceId", () => {
    const { workspaceId, ...rest } = validProduct;
    expect(() => insertProductSchema.parse(rest)).toThrow();
  });

  test("rejects missing name", () => {
    const { name, ...rest } = validProduct;
    expect(() => insertProductSchema.parse(rest)).toThrow();
  });

  test("rejects missing kind", () => {
    const { kind, ...rest } = validProduct;
    expect(() => insertProductSchema.parse(rest)).toThrow();
  });

  test("rejects invalid kind", () => {
    expect(() => insertProductSchema.parse({ ...validProduct, kind: "widget" })).toThrow();
  });

  test("rejects invalid status", () => {
    expect(() => insertProductSchema.parse({ ...validProduct, status: "draft" })).toThrow();
  });

  test("rejects non-numeric unitPrice", () => {
    expect(() => insertProductSchema.parse({ ...validProduct, unitPrice: "free" })).toThrow();
  });

  test("accepts zero unitPrice", () => {
    const result = insertProductSchema.parse({ ...validProduct, unitPrice: 0 });
    expect(result.unitPrice).toBe(0);
  });
});
