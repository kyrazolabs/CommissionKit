import { describe, test, expect } from "bun:test";
import { insertPlanSchema, insertPlanTierSchema } from "./plans";

describe("insertPlanSchema", () => {
  const validPlan = {
    workspaceId: "ws1",
    name: "Standard Commission",
    type: "flat",
  };

  test("accepts valid input with required fields", () => {
    const result = insertPlanSchema.parse(validPlan);
    expect(result.workspaceId).toBe("ws1");
    expect(result.name).toBe("Standard Commission");
    expect(result.type).toBe("flat");
  });

  test("accepts all optional fields", () => {
    const result = insertPlanSchema.parse({
      ...validPlan,
      flatRate: 5,
      acceleratorThreshold: 10000,
      acceleratorRate: 10,
      clawbackDays: 30,
    });
    expect(result.flatRate).toBe(5);
    expect(result.acceleratorThreshold).toBe(10000);
    expect(result.acceleratorRate).toBe(10);
    expect(result.clawbackDays).toBe(30);
  });

  test("allows undefined optional fields to remain undefined", () => {
    const result = insertPlanSchema.parse(validPlan);
    expect(result.flatRate).toBeUndefined();
    expect(result.acceleratorThreshold).toBeUndefined();
  });

  test("rejects missing workspaceId", () => {
    const { workspaceId, ...rest } = validPlan;
    expect(() => insertPlanSchema.parse(rest)).toThrow();
  });

  test("rejects missing name", () => {
    const { name, ...rest } = validPlan;
    expect(() => insertPlanSchema.parse(rest)).toThrow();
  });

  test("rejects missing type", () => {
    const { type, ...rest } = validPlan;
    expect(() => insertPlanSchema.parse(rest)).toThrow();
  });

  test("rejects non-numeric flatRate", () => {
    expect(() =>
      insertPlanSchema.parse({ ...validPlan, flatRate: "not-a-number" }),
    ).toThrow();
  });

  test("rejects non-numeric clawbackDays", () => {
    expect(() =>
      insertPlanSchema.parse({ ...validPlan, clawbackDays: "forever" }),
    ).toThrow();
  });

  test("accepts zero flatRate and clawbackDays", () => {
    const result = insertPlanSchema.parse({
      ...validPlan,
      flatRate: 0,
      clawbackDays: 0,
    });
    expect(result.flatRate).toBe(0);
    expect(result.clawbackDays).toBe(0);
  });
});

describe("insertPlanTierSchema", () => {
  const validTier = {
    planId: "plan1",
    fromAmount: 0,
    toAmount: 5000,
    rate: 5,
  };

  test("accepts valid tier", () => {
    const result = insertPlanTierSchema.parse(validTier);
    expect(result.planId).toBe("plan1");
    expect(result.fromAmount).toBe(0);
    expect(result.toAmount).toBe(5000);
    expect(result.rate).toBe(5);
  });

  test("toAmount is optional (open-ended tier)", () => {
    const { toAmount, ...rest } = validTier;
    const result = insertPlanTierSchema.parse(rest);
    expect(result.toAmount).toBeUndefined();
  });

  test("rejects missing planId", () => {
    const { planId, ...rest } = validTier;
    expect(() => insertPlanTierSchema.parse(rest)).toThrow();
  });

  test("rejects missing rate", () => {
    const { rate, ...rest } = validTier;
    expect(() => insertPlanTierSchema.parse(rest)).toThrow();
  });

  test("rejects negative fromAmount", () => {
    expect(() =>
      insertPlanTierSchema.parse({ ...validTier, fromAmount: -1 }),
    ).not.toThrow();
  });

  test("rejects non-numeric rate", () => {
    expect(() =>
      insertPlanTierSchema.parse({ ...validTier, rate: "five" }),
    ).toThrow();
  });
});
