import { describe, test, expect } from "bun:test";
import { sampleReps, samplePlan, sampleTiers, sampleDeals } from "./sample-data";

describe("sample-data definitions", () => {
  test("sample reps have required shape", () => {
    expect(sampleReps.length).toBe(6);
    for (const rep of sampleReps) {
      expect(rep.name).toBeTruthy();
      expect(rep.email).toContain("@");
      expect(rep.role).toBeTruthy();
      expect(rep.region).toBeTruthy();
    }
  });

  test("sample plan has tiered type and three tiers", () => {
    expect(samplePlan.name).toBe("Standard Commission Plan");
    expect(samplePlan.type).toBe("tiered");
    expect(sampleTiers.length).toBe(3);
    expect(sampleTiers[0].fromAmount).toBe(0);
    expect(sampleTiers[0].toAmount).toBe(10000);
    expect(sampleTiers[0].rate).toBe(0.05);
    expect(sampleTiers[1].fromAmount).toBe(10000);
    expect(sampleTiers[1].toAmount).toBe(25000);
    expect(sampleTiers[1].rate).toBe(0.08);
    expect(sampleTiers[2].fromAmount).toBe(25000);
    expect(sampleTiers[2].toAmount).toBeNull();
    expect(sampleTiers[2].rate).toBe(0.12);
  });

  test("sample deals reference known reps", () => {
    expect(sampleDeals.length).toBe(18);
    const repNames = new Set(sampleReps.map((r) => r.name));
    for (const deal of sampleDeals) {
      expect(repNames.has(deal.repName)).toBe(true);
      expect(deal.amount).toBeGreaterThan(0);
      expect(deal.stage).toBeTruthy();
    }
  });

  test("sample deals use valid snake_case stage values", () => {
    const validStages = new Set(["closed_won", "closed_lost", "pending"]);
    for (const deal of sampleDeals) {
      expect(validStages.has(deal.stage)).toBe(true);
    }
  });

  test("all sample deals are distributed across reps", () => {
    const dealsByRep = new Map<string, number>();
    for (const deal of sampleDeals) {
      dealsByRep.set(deal.repName, (dealsByRep.get(deal.repName) ?? 0) + 1);
    }
    for (const rep of sampleReps) {
      expect(dealsByRep.get(rep.name)).toBe(3);
    }
  });

  test("pending deals map to unpaid payment status and closed_won deals map to paid", () => {
    for (const deal of sampleDeals) {
      const expectedPaymentStatus = deal.stage === "pending" ? "unpaid" : "paid";
      if (deal.stage === "pending") {
        expect(expectedPaymentStatus).toBe("unpaid");
      } else {
        expect(expectedPaymentStatus).toBe("paid");
      }
    }
  });
});
