import { describe, test, expect } from "bun:test";
import { insertCommissionRunSchema, insertCommissionResultSchema } from "./commissionRuns";

describe("insertCommissionRunSchema", () => {
  const validRun = {
    workspaceId: "ws1",
    period: "2024-03",
  };

  test("accepts valid input with defaults", () => {
    const result = insertCommissionRunSchema.parse(validRun);
    expect(result.workspaceId).toBe("ws1");
    expect(result.period).toBe("2024-03");
    expect(result.status).toBe("pending");
    expect(result.totalCommission).toBe(0);
    expect(result.totalDeals).toBe(0);
    expect(result.skippedDeals).toBe(0);
    expect(result.repsCount).toBe(0);
  });

  test("accepts custom status and counts", () => {
    const result = insertCommissionRunSchema.parse({
      ...validRun,
      status: "completed",
      totalCommission: 5000,
      totalDeals: 12,
      skippedDeals: 2,
      repsCount: 5,
      error: "Some warning",
    });
    expect(result.status).toBe("completed");
    expect(result.totalCommission).toBe(5000);
    expect(result.totalDeals).toBe(12);
    expect(result.error).toBe("Some warning");
  });

  test("rejects invalid status", () => {
    expect(() =>
      insertCommissionRunSchema.parse({
        ...validRun,
        status: "invalid_status",
      }),
    ).toThrow();
  });

  test("accepts all valid statuses", () => {
    for (const status of ["pending", "processing", "completed", "failed"]) {
      const result = insertCommissionRunSchema.parse({ ...validRun, status });
      expect(result.status).toBe(status);
    }
  });

  test("rejects missing workspaceId", () => {
    expect(() =>
      insertCommissionRunSchema.parse({ period: "2024-03" }),
    ).toThrow();
  });

  test("rejects missing period", () => {
    expect(() =>
      insertCommissionRunSchema.parse({ workspaceId: "ws1" }),
    ).toThrow();
  });

  test("rejects non-numeric totalCommission", () => {
    expect(() =>
      insertCommissionRunSchema.parse({
        ...validRun,
        totalCommission: "lots",
      }),
    ).toThrow();
  });
});

describe("insertCommissionResultSchema", () => {
  const validResult = {
    runId: "run1",
    repId: "rep1",
    dealId: "deal1",
    rateApplied: 5,
    commissionAmount: 500,
    calculationNote: "Flat rate: 5% of 10000 = 500",
  };

  test("accepts valid result with defaults", () => {
    const result = insertCommissionResultSchema.parse(validResult);
    expect(result.currency).toBe("USD");
    expect(result.runId).toBe("run1");
    expect(result.rateApplied).toBe(5);
    expect(result.commissionAmount).toBe(500);
  });

  test("accepts all optional snapshot fields", () => {
    const result = insertCommissionResultSchema.parse({
      ...validResult,
      currency: "EUR",
      wsCurrency: "SAR",
      convertedDealAmount: 37500,
      convertedCommission: 1875,
      exchangeRateSnapshot: 3.75,
      rateSnapshotDate: "2024-03-15",
    });
    expect(result.currency).toBe("EUR");
    expect(result.wsCurrency).toBe("SAR");
    expect(result.convertedDealAmount).toBe(37500);
    expect(result.convertedCommission).toBe(1875);
    expect(result.exchangeRateSnapshot).toBe(3.75);
    expect(result.rateSnapshotDate).toBe("2024-03-15");
  });

  test("rejects missing runId", () => {
    const { runId, ...rest } = validResult;
    expect(() => insertCommissionResultSchema.parse(rest)).toThrow();
  });

  test("rejects missing repId", () => {
    const { repId, ...rest } = validResult;
    expect(() => insertCommissionResultSchema.parse(rest)).toThrow();
  });

  test("rejects missing dealId", () => {
    const { dealId, ...rest } = validResult;
    expect(() => insertCommissionResultSchema.parse(rest)).toThrow();
  });

  test("rejects non-numeric commissionAmount", () => {
    expect(() =>
      insertCommissionResultSchema.parse({
        ...validResult,
        commissionAmount: "free",
      }),
    ).toThrow();
  });

  test("rejects missing calculationNote", () => {
    const { calculationNote, ...rest } = validResult;
    expect(() => insertCommissionResultSchema.parse(rest)).toThrow();
  });
});
