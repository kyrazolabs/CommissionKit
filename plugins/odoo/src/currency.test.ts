import { describe, expect, test } from "bun:test";
import { normalizeOdooCurrency } from "./currency";

describe("normalizeOdooCurrency", () => {
  test("returns 3-letter ISO codes as-is", () => {
    expect(normalizeOdooCurrency("USD")).toBe("USD");
    expect(normalizeOdooCurrency("EUR")).toBe("EUR");
    expect(normalizeOdooCurrency("AED")).toBe("AED");
  });

  test("falls back to USD for null/undefined/empty", () => {
    expect(normalizeOdooCurrency(null)).toBe("USD");
    expect(normalizeOdooCurrency(undefined)).toBe("USD");
    expect(normalizeOdooCurrency("")).toBe("USD");
  });

  test("maps currency symbols to ISO codes", () => {
    expect(normalizeOdooCurrency("$")).toBe("USD");
    expect(normalizeOdooCurrency("€")).toBe("EUR");
    expect(normalizeOdooCurrency("£")).toBe("GBP");
    expect(normalizeOdooCurrency("¥")).toBe("JPY");
    expect(normalizeOdooCurrency("₹")).toBe("INR");
    expect(normalizeOdooCurrency("R$")).toBe("BRL");
    expect(normalizeOdooCurrency("C$")).toBe("CAD");
    expect(normalizeOdooCurrency("A$")).toBe("AUD");
    expect(normalizeOdooCurrency("S$")).toBe("SGD");
    expect(normalizeOdooCurrency("HK$")).toBe("HKD");
  });

  test("maps full currency names (case-insensitive)", () => {
    expect(normalizeOdooCurrency("US Dollar")).toBe("USD");
    expect(normalizeOdooCurrency("us dollar")).toBe("USD");
    expect(normalizeOdooCurrency("Euro")).toBe("EUR");
    expect(normalizeOdooCurrency("SaUdI RiYaL")).toBe("SAR");
  });

  test("uppercases unknown currency names", () => {
    expect(normalizeOdooCurrency("bitcoin")).toBe("BITCOIN");
  });

  test("trims whitespace", () => {
    expect(normalizeOdooCurrency("  USD  ")).toBe("USD");
  });
});
