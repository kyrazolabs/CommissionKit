import { describe, test, expect } from "bun:test";
import { resolveFieldValue } from "./connector";

describe("resolveFieldValue", () => {
  const item = {
    name: "Alice",
    amount: { amountMicros: 999000000 },
    price: 42.50,
    zero: 0,
    nested: { deep: { value: "found" } },
  };

  test("plain field path returns value as-is", () => {
    expect(resolveFieldValue(item, "name")).toBe("Alice");
    expect(resolveFieldValue(item, "price")).toBe(42.50);
  });

  test("nested path returns deep value", () => {
    expect(resolveFieldValue(item, "nested.deep.value")).toBe("found");
  });

  test("$div:1000000:path divides the value by 1,000,000", () => {
    expect(resolveFieldValue(item, "$div:1000000:amount.amountMicros")).toBe(999);
  });

  test("$div:2:path divides by 2", () => {
    expect(resolveFieldValue(item, "$div:2:price")).toBe(21.25);
  });

  test("$div:0:path returns raw value (division by 0 → divisor becomes 1)", () => {
    const val = resolveFieldValue(item, "$div:0:price");
    // divisor 0 → Number('0') || 1 → 1, so divides by 1
    expect(val).toBe(42.5);
  });

  test("$div:1000000:path with non-numeric value returns raw value", () => {
    expect(resolveFieldValue(item, "$div:1000000:name")).toBe("Alice");
  });

  test("$div:N: with missing path returns undefined", () => {
    expect(resolveFieldValue(item, "$div:1000000:nonexistent")).toBeUndefined();
  });

  test("zero value divided keeps zero", () => {
    expect(resolveFieldValue(item, "$div:1000000:zero")).toBe(0);
  });
});
