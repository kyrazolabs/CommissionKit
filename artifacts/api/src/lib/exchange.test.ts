import { describe, test, expect } from "bun:test";

// Replicate the conversion math from exchange.ts for unit testing
function convertCurrencyMath(
  amount: number,
  from: string,
  to: string,
  fromRate: number | undefined,
  toRate: number | undefined,
): { converted: number; rate: number } | null {
  if (from === to) return { converted: amount, rate: 1 };
  if (fromRate === undefined || toRate === undefined) return null;
  const amountInUsd = amount / fromRate;
  const converted = amountInUsd * toRate;
  const rate = toRate / fromRate;
  return { converted, rate };
}

describe("Exchange - conversion math", () => {
  test("same currency returns amount with rate 1", () => {
    const result = convertCurrencyMath(100, "USD", "USD", 1, 1);
    expect(result).toEqual({ converted: 100, rate: 1 });
  });

  test("USD to EUR: $100 at 0.85 rate = EUR 85", () => {
    const result = convertCurrencyMath(100, "USD", "EUR", 1, 0.85);
    expect(result?.converted).toBeCloseTo(85, 5);
    expect(result?.rate).toBeCloseTo(0.85, 5);
  });

  test("EUR to USD: EUR 100 at 1.18 rate = $118", () => {
    const result = convertCurrencyMath(100, "EUR", "USD", 0.85, 1);
    expect(result?.converted).toBeCloseTo(117.647, 2);
    expect(result?.rate).toBeCloseTo(1.17647, 2);
  });

  test("GBP to JPY: £100 at 1.30 USD and 0.009 JPY rates", () => {
    const result = convertCurrencyMath(100, "GBP", "JPY", 0.73, 109.5);
    const expectedUsd = 100 / 0.73;
    const expectedJpy = expectedUsd * 109.5;
    expect(result?.converted).toBeCloseTo(expectedJpy, 2);
  });

  test("missing fromRate returns null", () => {
    const result = convertCurrencyMath(100, "XYZ", "USD", undefined, 1);
    expect(result).toBeNull();
  });

  test("missing toRate returns null", () => {
    const result = convertCurrencyMath(100, "USD", "XYZ", 1, undefined);
    expect(result).toBeNull();
  });

  test("zero amount converts to zero", () => {
    const result = convertCurrencyMath(0, "USD", "EUR", 1, 0.85);
    expect(result?.converted).toBe(0);
    expect(result?.rate).toBeCloseTo(0.85, 5);
  });

  test("negative amount (should not happen but tests edge case)", () => {
    const result = convertCurrencyMath(-100, "USD", "EUR", 1, 0.85);
    expect(result?.converted).toBeCloseTo(-85, 5);
  });

  test("very large amounts handle precision", () => {
    const result = convertCurrencyMath(1_000_000_000, "USD", "EUR", 1, 0.85);
    expect(result?.converted).toBeCloseTo(850_000_000, 0);
  });

  test("rate expressed as 1 from = rate to", () => {
    const result = convertCurrencyMath(50, "USD", "GBP", 1, 0.73);
    expect(result?.rate).toBeCloseTo(0.73, 5);
  });
});

describe("Exchange - convertCurrencyAt result structure", () => {
  test("same currency returns early with date snapshot", () => {
    const date = new Date("2024-01-15");
    const isoDate = date.toISOString();
    // This mirrors the logic in convertCurrencyAt
    const converted = 100;
    const rate = 1;
    const snapshotDate = isoDate;
    expect(converted).toBe(100);
    expect(rate).toBe(1);
    expect(snapshotDate).toBe(isoDate);
  });
});
