import { describe, expect, test } from "bun:test";
import { insertDealSchema } from "./deals";

describe("insertDealSchema", () => {
  const validDeal = {
    workspaceId: "ws1",
    repId: "rep1",
    name: "Enterprise Deal",
    amount: 10000,
    closeDate: "2024-03-15",
    period: "2024-03",
  };

  test("accepts valid input with defaults", () => {
    const result = insertDealSchema.parse(validDeal);
    expect(result.stage).toBe("pending");
    expect(result.currency).toBe("USD");
    expect(result.paymentStatus).toBe("unpaid");
  });

  test("accepts a deal without a close date", () => {
    const { closeDate, ...rest } = validDeal;
    const result = insertDealSchema.parse(rest);
    expect(result.closeDate).toBeUndefined();
  });

  test("accepts all optional fields", () => {
    const result = insertDealSchema.parse({
      ...validDeal,
      stage: "negotiation",
      currency: "EUR",
      paymentStatus: "paid",
      notes: "Important deal",
    });
    expect(result.stage).toBe("negotiation");
    expect(result.currency).toBe("EUR");
    expect(result.paymentStatus).toBe("paid");
    expect(result.notes).toBe("Important deal");
  });

  test("rejects missing workspaceId", () => {
    const { workspaceId, ...rest } = validDeal;
    expect(() => insertDealSchema.parse(rest)).toThrow();
  });

  test("rejects missing repId", () => {
    const { repId, ...rest } = validDeal;
    expect(() => insertDealSchema.parse(rest)).toThrow();
  });

  test("rejects missing name", () => {
    const { name, ...rest } = validDeal;
    expect(() => insertDealSchema.parse(rest)).toThrow();
  });

  test("rejects missing amount", () => {
    const { amount, ...rest } = validDeal;
    expect(() => insertDealSchema.parse(rest)).toThrow();
  });

  test("rejects invalid paymentStatus", () => {
    expect(() => insertDealSchema.parse({ ...validDeal, paymentStatus: "invalid" })).toThrow();
  });

  test("accepts all valid payment statuses", () => {
    for (const status of ["unpaid", "paid", "partial", "on_hold"]) {
      const result = insertDealSchema.parse({ ...validDeal, paymentStatus: status });
      expect(result.paymentStatus).toBe(status);
    }
  });
});
