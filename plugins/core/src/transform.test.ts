import { describe, expect, test } from "bun:test";
import {
  derivePaymentStatus,
  derivePeriod,
  generateAccessCode,
  normalizeCurrency,
} from "./transform";

describe("normalizeCurrency", () => {
  test("returns 3-letter code as-is", () => {
    expect(normalizeCurrency("USD")).toBe("USD");
    expect(normalizeCurrency("eur")).toBe("EUR");
  });

  test("maps known currency names to ISO codes", () => {
    expect(normalizeCurrency("US Dollar")).toBe("USD");
    expect(normalizeCurrency("Euro")).toBe("EUR");
    expect(normalizeCurrency("Saudi Riyal")).toBe("SAR");
  });

  test("falls back to uppercase of input if not 3-letter", () => {
    expect(normalizeCurrency("bitcoin")).toBe("BITCOIN");
  });

  test("falls back to USD for empty input", () => {
    expect(normalizeCurrency("")).toBe("USD");
  });
});

describe("derivePeriod", () => {
  test("formats date as YYYY-MM", () => {
    expect(derivePeriod(new Date("2024-03-15"))).toBe("2024-03");
    expect(derivePeriod(new Date("2025-11-01"))).toBe("2025-11");
  });

  test("pads single-digit months", () => {
    expect(derivePeriod(new Date("2024-01-01"))).toBe("2024-01");
  });
});

describe("derivePaymentStatus", () => {
  test("maps known unpaid statuses", () => {
    expect(derivePaymentStatus("not_paid")).toBe("unpaid");
    expect(derivePaymentStatus("outstanding")).toBe("unpaid");
    expect(derivePaymentStatus("to_invoice")).toBe("unpaid");
    expect(derivePaymentStatus("no")).toBe("unpaid");
  });

  test("maps known paid statuses", () => {
    expect(derivePaymentStatus("paid")).toBe("paid");
    expect(derivePaymentStatus("fully_paid")).toBe("paid");
    expect(derivePaymentStatus("completed")).toBe("paid");
    expect(derivePaymentStatus("in_payment")).toBe("paid");
  });

  test("maps known partial statuses", () => {
    expect(derivePaymentStatus("partial")).toBe("partial");
    expect(derivePaymentStatus("partially_paid")).toBe("partial");
    expect(derivePaymentStatus("invoiced")).toBe("partial");
  });

  test("maps reversed/cancelled to on_hold", () => {
    expect(derivePaymentStatus("reversed")).toBe("on_hold");
    expect(derivePaymentStatus("cancelled")).toBe("on_hold");
    expect(derivePaymentStatus("on_hold")).toBe("on_hold");
  });

  test("uses custom mappings when provided", () => {
    expect(derivePaymentStatus("gelince_odendi", { gelince_odendi: "paid" })).toBe("paid");
  });

  test("falls back to unpaid for unknown statuses", () => {
    expect(derivePaymentStatus("banana")).toBe("unpaid");
  });

  test("handles empty input", () => {
    expect(derivePaymentStatus("")).toBe("unpaid");
  });
});

describe("generateAccessCode", () => {
  test("generates 14-character code with hyphens (12 alphanum + 2 dashes)", () => {
    const code = generateAccessCode();
    expect(code.length).toBe(14);
    expect(code[4]).toBe("-");
    expect(code[9]).toBe("-");
  });

  test("does not include ambiguous characters", () => {
    const code = generateAccessCode();
    expect(code).not.toMatch(/[0O1I]/);
  });

  test("generates different codes on successive calls", () => {
    const codes = new Set(Array.from({ length: 100 }, () => generateAccessCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
