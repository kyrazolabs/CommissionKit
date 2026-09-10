import { describe, expect, test } from "bun:test";
import { parseProductAttributes } from "./products";

describe("parseProductAttributes", () => {
  test("accepts service attributes", () => {
    const result = parseProductAttributes("service", {
      durationHours: 12,
      billingCycle: "monthly",
    });
    expect(result.durationHours).toBe(12);
    expect(result.billingCycle).toBe("monthly");
  });

  test("rejects invalid billing cycle", () => {
    expect(() => parseProductAttributes("service", { billingCycle: "weekly" })).toThrow();
  });

  test("accepts vehicle attributes", () => {
    const result = parseProductAttributes("vehicle", { make: "Toyota", year: 2021 });
    expect(result.make).toBe("Toyota");
    expect(result.year).toBe(2021);
  });

  test("other kind strips extras", () => {
    const result = parseProductAttributes("other", { make: "Nope" });
    expect(result.make).toBeUndefined();
  });
});
