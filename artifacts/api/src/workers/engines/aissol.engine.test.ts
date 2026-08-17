import { describe, expect, test } from "bun:test";

// Replicate pure functions from aissol.engine.ts for unit testing
function determineSlab(value: number, slabs: { index: number; max: number | null }[]): number {
  for (const slab of slabs) {
    if (slab.max === null) return slab.index;
    if (value < slab.max) return slab.index;
  }
  return slabs[slabs.length - 1]?.index ?? 0;
}

function determineGmBracket(
  gmPercent: number,
  brackets: { key: string; max: number | null }[],
): string {
  for (const bracket of brackets) {
    if (bracket.max === null) return bracket.key;
    if (gmPercent < bracket.max) return bracket.key;
  }
  return brackets[brackets.length - 1]?.key ?? "";
}

describe("AissolEngine - determineSlab", () => {
  const slabs = [
    { index: 0, max: 100_000 },
    { index: 1, max: 500_000 },
    { index: 2, max: 1_000_000 },
    { index: 3, max: null },
  ];

  test("value below first slab max returns index 0", () => {
    expect(determineSlab(50_000, slabs)).toBe(0);
  });

  test("value equal to slab max goes to next slab", () => {
    expect(determineSlab(100_000, slabs)).toBe(1);
  });

  test("value within second slab returns index 1", () => {
    expect(determineSlab(300_000, slabs)).toBe(1);
  });

  test("value above all finite slabs returns last slab index", () => {
    expect(determineSlab(2_000_000, slabs)).toBe(3);
  });

  test("null max catches all remaining values", () => {
    const singleSlab = [{ index: 0, max: null }];
    expect(determineSlab(Infinity, singleSlab)).toBe(0);
  });

  test("zero value returns first slab", () => {
    expect(determineSlab(0, slabs)).toBe(0);
  });

  test("negative value returns first slab", () => {
    expect(determineSlab(-100, slabs)).toBe(0);
  });

  test("empty slabs returns 0", () => {
    expect(determineSlab(100, [])).toBe(0);
  });
});

describe("AissolEngine - determineGmBracket", () => {
  const brackets = [
    { key: "negative", max: 0 },
    { key: "low", max: 20 },
    { key: "medium", max: 40 },
    { key: "high", max: null },
  ];

  test("negative GM returns 'negative'", () => {
    expect(determineGmBracket(-5, brackets)).toBe("negative");
  });

  test("0% GM returns 'low' (max 0 is exclusive)", () => {
    expect(determineGmBracket(0, brackets)).toBe("low");
  });

  test("15% GM returns 'low'", () => {
    expect(determineGmBracket(15, brackets)).toBe("low");
  });

  test("20% GM returns 'medium' (max 20 is exclusive)", () => {
    expect(determineGmBracket(20, brackets)).toBe("medium");
  });

  test("30% GM returns 'medium'", () => {
    expect(determineGmBracket(30, brackets)).toBe("medium");
  });

  test("50% GM returns 'high'", () => {
    expect(determineGmBracket(50, brackets)).toBe("high");
  });

  test("100% GM returns 'high' (null max catches all)", () => {
    expect(determineGmBracket(100, brackets)).toBe("high");
  });

  test("empty brackets returns empty string", () => {
    expect(determineGmBracket(50, [])).toBe("");
  });

  test("single bracket with null max catches everything", () => {
    const single = [{ key: "all", max: null }];
    expect(determineGmBracket(0, single)).toBe("all");
    expect(determineGmBracket(100, single)).toBe("all");
  });
});

describe("AissolEngine - combined slab + GM matrix logic", () => {
  test("matrix rate lookup correctness", () => {
    const slabs = [
      { index: 0, max: 100_000 },
      { index: 1, max: 500_000 },
      { index: 2, max: null },
    ];
    const gmBrackets = [
      { key: "low", max: 20 },
      { key: "medium", max: 40 },
      { key: "high", max: null },
    ];
    const rates = {
      "0": { low: 0.02, medium: 0.03, high: 0.04 },
      "1": { low: 0.03, medium: 0.04, high: 0.05 },
      "2": { low: 0.04, medium: 0.05, high: 0.06 },
    };

    const slabIdx = determineSlab(50_000, slabs);
    const gmPct = 25;
    const gmBracket = determineGmBracket(gmPct, gmBrackets);
    const commissionPct = (rates as any)[String(slabIdx)]?.[gmBracket];

    expect(slabIdx).toBe(0);
    expect(gmBracket).toBe("medium");
    expect(commissionPct).toBe(0.03);
  });
});
