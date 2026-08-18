import { describe, expect, test } from "bun:test";
import {
  AuthConfigSchema,
  CustomConnectorConfigSchema,
  EntityFieldMappingSchema,
  EntityMappingSchema,
  PaginationConfigSchema,
  StageFilterSchema,
} from "./config-parser";

describe("AuthConfigSchema", () => {
  test("parses valid bearer auth", () => {
    const result = AuthConfigSchema.safeParse({ type: "bearer", token: "tok" });
    expect(result.success).toBe(true);
  });

  test("parses valid apiKey auth", () => {
    const result = AuthConfigSchema.safeParse({ type: "apiKey", apiKey: "key" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.headerName).toBe("X-API-Key");
    }
  });

  test("parses valid basic auth", () => {
    const result = AuthConfigSchema.safeParse({ type: "basic", username: "u", password: "p" });
    expect(result.success).toBe(true);
  });

  test("parses valid oauth2 auth", () => {
    const result = AuthConfigSchema.safeParse({
      type: "oauth2",
      tokenUrl: "https://a.com",
      clientId: "c",
      clientSecret: "s",
    });
    expect(result.success).toBe(true);
  });

  test("rejects unknown auth type", () => {
    const result = AuthConfigSchema.safeParse({ type: "magic", secret: "x" });
    expect(result.success).toBe(false);
  });

  test("rejects bearer without token", () => {
    const result = AuthConfigSchema.safeParse({ type: "bearer" });
    expect(result.success).toBe(false);
  });
});

describe("PaginationConfigSchema", () => {
  test("applies defaults for empty object", () => {
    const result = PaginationConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("offset");
      expect(result.data.limitValue).toBe(100);
    }
  });

  test("parses cursor pagination with optional cursorPath", () => {
    const result = PaginationConfigSchema.safeParse({
      type: "cursor",
      limitValue: 50,
      cursorPath: "next",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursorPath).toBe("next");
    }
  });
});

describe("EntityFieldMappingSchema", () => {
  test("applies defaults for empty fields", () => {
    const result = EntityFieldMappingSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.externalId).toBe("id");
    }
  });

  test("parses all field names", () => {
    const result = EntityFieldMappingSchema.safeParse({
      externalId: "uid",
      name: "fullName",
      email: "emailAddress",
      amount: "amount.amountMicros",
      closeDate: "closedAt",
      stage: "status",
      currency: "currencyCode",
      repExternalId: "salesRep.id",
      paymentStatus: "paymentState",
      notes: "description",
    });
    expect(result.success).toBe(true);
  });
});

describe("EntityMappingSchema", () => {
  test("requires endpoint", () => {
    const result = EntityMappingSchema.safeParse({ enabled: true });
    expect(result.success).toBe(false);
  });

  test("parses with endpoint and defaults", () => {
    const result = EntityMappingSchema.safeParse({ endpoint: "/api/users" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(false);
      expect(result.data.method).toBe("GET");
    }
  });

  test("parses stageFilter", () => {
    const result = EntityMappingSchema.safeParse({
      endpoint: "/api/orders",
      stageFilter: { field: "status", include: ["confirmed", "delivered"] },
    });
    expect(result.success).toBe(true);
  });

  test("parses paymentStatusMapping", () => {
    const result = EntityMappingSchema.safeParse({
      endpoint: "/api/orders",
      paymentStatusMapping: { paid: ["PAID", "SETTLED"], unpaid: ["PENDING"] },
    });
    expect(result.success).toBe(true);
  });
});

describe("CustomConnectorConfigSchema", () => {
  test("parses minimal valid config", () => {
    const result = CustomConnectorConfigSchema.safeParse({
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
    });
    expect(result.success).toBe(true);
  });

  test("rejects invalid baseUrl", () => {
    const result = CustomConnectorConfigSchema.safeParse({
      baseUrl: "not-a-url",
      auth: { type: "bearer", token: "tok" },
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing baseUrl", () => {
    const result = CustomConnectorConfigSchema.safeParse({
      auth: { type: "bearer", token: "tok" },
    });
    expect(result.success).toBe(false);
  });

  test("rejects missing auth", () => {
    const result = CustomConnectorConfigSchema.safeParse({
      baseUrl: "https://api.example.com",
    });
    expect(result.success).toBe(false);
  });

  test("parses full config with entities", () => {
    const result = CustomConnectorConfigSchema.safeParse({
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      pagination: { type: "cursor", limitValue: 50 },
      responsePath: "data.items",
      entities: {
        reps: { enabled: true, endpoint: "/users" },
        deals: { enabled: true, endpoint: "/orders" },
      },
    });
    expect(result.success).toBe(true);
  });
});
