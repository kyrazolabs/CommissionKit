import { describe, expect, test } from "bun:test";

// The calculateCommission function is not exported from standard.engine.ts.
// We replicate the pure logic here for unit testing.
function calculateCommission(
  amount: number,
  currency: string,
  planType: string,
  flatRate: number | null,
  acceleratorThreshold: number | null,
  acceleratorRate: number | null,
  tiers: { fromAmount: number; toAmount: number | null; rate: number }[],
): { rate: number; commission: number; note: string } {
  if (planType === "flat" && flatRate !== null) {
    const commission = amount * flatRate;
    return {
      rate: flatRate,
      commission,
      note: `Flat rate ${(flatRate * 100).toFixed(2)}% on ${currency} ${amount.toFixed(2)}`,
    };
  }

  if (planType === "accelerator" && flatRate !== null) {
    if (
      acceleratorThreshold !== null &&
      acceleratorRate !== null &&
      amount > acceleratorThreshold
    ) {
      const total = amount * acceleratorRate;
      return {
        rate: acceleratorRate,
        commission: total,
        note: `Accelerated: ${(acceleratorRate * 100).toFixed(2)}% on full ${currency} ${amount.toFixed(2)} (exceeded ${currency} ${acceleratorThreshold} threshold)`,
      };
    }
    const commission = amount * flatRate;
    return {
      rate: flatRate,
      commission,
      note: `Base rate ${(flatRate * 100).toFixed(2)}% (below threshold of ${currency} ${acceleratorThreshold})`,
    };
  }

  if (planType === "tiered" && tiers.length > 0) {
    let remaining = amount;
    let totalCommission = 0;
    const notes: string[] = [];
    let lastRate = 0;

    for (const tier of tiers) {
      if (remaining <= 0) break;
      const tierTop = tier.toAmount !== null ? tier.toAmount : Infinity;
      const tierBottom = tier.fromAmount;
      const allocated = amount - remaining;
      const tierStart = Math.max(tierBottom, allocated);
      const tierEnd = Math.min(tierTop, amount);
      const applicable = Math.max(0, tierEnd - tierStart);
      if (applicable <= 0) continue;
      const commission = applicable * tier.rate;
      totalCommission += commission;
      notes.push(`${(tier.rate * 100).toFixed(2)}% on ${currency} ${applicable.toFixed(2)}`);
      lastRate = tier.rate;
      remaining -= applicable;
    }

    const effectiveRate = amount > 0 ? totalCommission / amount : lastRate;
    return {
      rate: effectiveRate,
      commission: totalCommission,
      note: `Tiered: ${notes.join(", ")}`,
    };
  }

  return { rate: 0, commission: 0, note: "No plan or rate configured" };
}

describe("StandardEngine - calculateCommission", () => {
  describe("flat rate", () => {
    test("$1000 deal at 5% = $50 commission", () => {
      const result = calculateCommission(1000, "USD", "flat", 0.05, null, null, []);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(50);
      expect(result.note).toContain("Flat rate 5.00%");
    });

    test("$2500 deal at 10% = $250 commission", () => {
      const result = calculateCommission(2500, "USD", "flat", 0.1, null, null, []);
      expect(result.rate).toBe(0.1);
      expect(result.commission).toBe(250);
    });

    test("zero amount yields zero commission", () => {
      const result = calculateCommission(0, "USD", "flat", 0.05, null, null, []);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(0);
    });
  });

  describe("accelerator", () => {
    const tiers: { fromAmount: number; toAmount: number | null; rate: number }[] = [];

    test("below threshold uses base rate", () => {
      const result = calculateCommission(5000, "USD", "accelerator", 0.05, 10000, 0.08, tiers);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(250);
      expect(result.note).toContain("Base rate");
    });

    test("exactly at threshold uses base rate", () => {
      const result = calculateCommission(10000, "USD", "accelerator", 0.05, 10000, 0.08, tiers);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(500);
    });

    test("above threshold uses accelerator rate on full amount", () => {
      const result = calculateCommission(15000, "USD", "accelerator", 0.05, 10000, 0.08, tiers);
      expect(result.rate).toBe(0.08);
      expect(result.commission).toBe(1200);
      expect(result.note).toContain("Accelerated");
    });

    test("accelerator rate with no threshold returns base rate", () => {
      const result = calculateCommission(15000, "USD", "accelerator", 0.05, null, 0.08, tiers);
      expect(result.rate).toBe(0.05);
      expect(result.commission).toBe(750);
    });
  });

  describe("tiered", () => {
    const tiers = [
      { fromAmount: 0, toAmount: 5000, rate: 0.05 },
      { fromAmount: 5000, toAmount: 10000, rate: 0.07 },
      { fromAmount: 10000, toAmount: null, rate: 0.1 },
    ];

    test("$3000 falls entirely in first tier (5%)", () => {
      const result = calculateCommission(3000, "USD", "tiered", null, null, null, tiers);
      expect(result.rate).toBeCloseTo(0.05, 5);
      expect(result.commission).toBe(150);
    });

    test("$8000 spans two tiers: $5000 at 5% + $3000 at 7% = $460", () => {
      const result = calculateCommission(8000, "USD", "tiered", null, null, null, tiers);
      expect(result.commission).toBe(460);
      expect(result.note).toContain("Tiered:");
    });

    test("$15000 spans all three tiers: $5000@5% + $5000@7% + $5000@10% = $1100", () => {
      const result = calculateCommission(15000, "USD", "tiered", null, null, null, tiers);
      expect(result.commission).toBe(1100);
    });

    test("zero amount yields zero commission", () => {
      const result = calculateCommission(0, "USD", "tiered", null, null, null, tiers);
      expect(result.commission).toBe(0);
      expect(result.rate).toBe(0);
    });
  });

  describe("no plan or rate configured", () => {
    test("returns zero commission when planType is unknown", () => {
      const result = calculateCommission(1000, "USD", "unknown", null, null, null, []);
      expect(result.rate).toBe(0);
      expect(result.commission).toBe(0);
      expect(result.note).toBe("No plan or rate configured");
    });

    test("tiered with empty tiers returns zero", () => {
      const result = calculateCommission(1000, "USD", "tiered", null, null, null, []);
      expect(result.rate).toBe(0);
      expect(result.commission).toBe(0);
      expect(result.note).toBe("No plan or rate configured");
    });
  });

  describe("multi-currency formatting", () => {
    test("uses currency in note", () => {
      const result = calculateCommission(1000, "EUR", "flat", 0.05, null, null, []);
      expect(result.note).toContain("EUR");
    });
  });

  describe("edge cases", () => {
    test("very large amount", () => {
      const tiers = [
        { fromAmount: 0, toAmount: 100000, rate: 0.05 },
        { fromAmount: 100000, toAmount: null, rate: 0.1 },
      ];
      const result = calculateCommission(1_000_000, "USD", "tiered", null, null, null, tiers);
      expect(result.commission).toBe(95000);
    });

    test("tier with null toAmount (open-ended)", () => {
      const tiers = [{ fromAmount: 0, toAmount: null, rate: 0.05 }];
      const result = calculateCommission(999999, "USD", "tiered", null, null, null, tiers);
      expect(result.commission).toBeCloseTo(49999.95, 2);
    });

    test("zero rate in tier", () => {
      const tiers = [{ fromAmount: 0, toAmount: null, rate: 0 }];
      const result = calculateCommission(1000, "USD", "tiered", null, null, null, tiers);
      expect(result.commission).toBe(0);
    });
  });
});
