import { describe, test, expect } from "bun:test";
import { resolveFieldValue } from "../connector";

describe("resolveFieldValue — compute fields", () => {
  const item = {
    id: "x",
    name: "Alice",
    price: 42.50,
    zero: 0,
    neg: -500,
    amount: { amountMicros: 999000000 },
    nested: { deep: { value: "found", num: 99 } },
    nullField: null,
  };

  // ─── Plain path ────────────────────────────────────────────────────

  test("plain path returns value as-is", () => {
    expect(resolveFieldValue(item, "name")).toBe("Alice");
    expect(resolveFieldValue(item, "price")).toBe(42.50);
  });

  test("plain nested path returns deep value", () => {
    expect(resolveFieldValue(item, "nested.deep.value")).toBe("found");
    expect(resolveFieldValue(item, "nested.deep.num")).toBe(99);
  });

  test("plain path returns undefined for missing key", () => {
    expect(resolveFieldValue(item, "nonexistent")).toBeUndefined();
  });

  test("plain path returns null for null value", () => {
    expect(resolveFieldValue(item, "nullField")).toBeNull();
  });

  // ─── $div compute fields ───────────────────────────────────────────

  test("$div:1000000 divides by 1,000,000", () => {
    expect(resolveFieldValue(item, "$div:1000000:amount.amountMicros")).toBe(999);
  });

  test("$div:2 divides by 2", () => {
    expect(resolveFieldValue(item, "$div:2:price")).toBe(21.25);
  });

  test("$div:1 divides by 1 (no change)", () => {
    expect(resolveFieldValue(item, "$div:1:price")).toBe(42.5);
  });

  test("$div:100 divides negative number", () => {
    expect(resolveFieldValue(item, "$div:100:neg")).toBe(-5);
  });

  test("$div:1000000:zero returns 0", () => {
    expect(resolveFieldValue(item, "$div:1000000:zero")).toBe(0);
  });

  test("$div:3 on integer yields float", () => {
    expect(resolveFieldValue(item, "$div:3:price")).toBeCloseTo(14.1667, 4);
  });

  test("$div with non-numeric value returns raw value unchanged", () => {
    expect(resolveFieldValue(item, "$div:1000000:name")).toBe("Alice");
  });

  test("$div on missing path returns undefined", () => {
    expect(resolveFieldValue(item, "$div:1000000:nonexistent")).toBeUndefined();
  });

  test("$div:0 uses divisor 1 (division by zero fallback)", () => {
    expect(resolveFieldValue(item, "$div:0:price")).toBe(42.5);
  });

  test("$div with large divisor", () => {
    expect(resolveFieldValue(item, "$div:1e9:amount.amountMicros")).toBe(0.999);
  });

  test("$div formatted with underscore in number (should parse anyway)", () => {
    // "1_000_000" → Number("1_000_000") → NaN → 1, so no division
    // Actually Number("1_000_000") is NaN, so falls back to divisor 1
    expect(resolveFieldValue(item, "$div:1_000_000:amount.amountMicros")).toBe(999000000);
  });

  test("$div with nested computed field", () => {
    expect(resolveFieldValue(item, "$div:10:nested.deep.num")).toBe(9.9);
  });

  test("$div with no path after colon returns undefined", () => {
    const raw = resolveFieldValue(item, "$div:1000:");
    expect(raw).toBeUndefined();
  });
});
