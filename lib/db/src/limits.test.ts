import { describe, expect, test } from "bun:test";
import { getPlanLimits, PLAN_LIMITS } from "./limits";

describe("PLAN_LIMITS", () => {
  test("defines all plan types", () => {
    expect(PLAN_LIMITS).toHaveProperty("free");
    expect(PLAN_LIMITS).toHaveProperty("lite");
    expect(PLAN_LIMITS).toHaveProperty("starter");
    expect(PLAN_LIMITS).toHaveProperty("growth");
    expect(PLAN_LIMITS).toHaveProperty("pro");
    expect(PLAN_LIMITS).toHaveProperty("annual");
    expect(PLAN_LIMITS).toHaveProperty("flex");
  });
});

describe("getPlanLimits()", () => {
  test("returns free limits for 'free'", () => {
    const limits = getPlanLimits("free");
    expect(limits).toEqual({ maxMembers: 1, maxReps: 3, maxPlans: 1 });
  });

  test("returns lite limits for 'lite'", () => {
    const limits = getPlanLimits("lite");
    expect(limits).toEqual({ maxMembers: 3, maxReps: 5, maxPlans: 2 });
  });

  test("returns starter limits for 'starter'", () => {
    const limits = getPlanLimits("starter");
    expect(limits).toEqual({ maxMembers: 3, maxReps: 10, maxPlans: 3 });
  });

  test("returns growth limits for 'growth'", () => {
    const limits = getPlanLimits("growth");
    expect(limits.maxMembers).toBe(15);
    expect(limits.maxReps).toBe(50);
    expect(limits.maxPlans).toBe(1_000_000);
  });

  test("returns pro limits for 'pro'", () => {
    const limits = getPlanLimits("pro");
    expect(limits.maxMembers).toBe(50);
    expect(limits.maxReps).toBe(100);
    expect(limits.maxPlans).toBe(1_000_000);
  });

  test("returns annual limits for 'annual'", () => {
    const limits = getPlanLimits("annual");
    expect(limits.maxMembers).toBe(15);
    expect(limits.maxReps).toBe(50);
    expect(limits.maxPlans).toBe(1_000_000);
  });

  test("returns flex limits for 'flex'", () => {
    const limits = getPlanLimits("flex");
    expect(limits.maxMembers).toBe(1000);
    expect(limits.maxReps).toBe(1_000_000);
    expect(limits.maxPlans).toBe(1000);
  });

  test("returns free limits for unknown plan", () => {
    const limits = getPlanLimits("nonexistent");
    expect(limits).toEqual(PLAN_LIMITS.free);
  });

  test("is case-insensitive", () => {
    const lower = getPlanLimits("GROWTH");
    const upper = getPlanLimits("Growth");
    expect(lower).toEqual(getPlanLimits("growth"));
    expect(upper).toEqual(getPlanLimits("growth"));
  });

  test("returns free limits when called with no argument", () => {
    const limits = getPlanLimits();
    expect(limits).toEqual(PLAN_LIMITS.free);
  });
});
