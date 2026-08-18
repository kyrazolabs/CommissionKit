import { describe, expect, test } from "bun:test";
import { applySort, computeNextSort } from "./use-table-sort";

describe("computeNextSort", () => {
  test("starts with null state", () => {
    const result = computeNextSort({ column: null, direction: null }, "name");
    expect(result).toEqual({ column: "name", direction: "desc" });
  });

  test("same column: desc -> asc", () => {
    const result = computeNextSort({ column: "name", direction: "desc" }, "name");
    expect(result).toEqual({ column: "name", direction: "asc" });
  });

  test("same column: asc -> null", () => {
    const result = computeNextSort({ column: "name", direction: "asc" }, "name");
    expect(result).toEqual({ column: null, direction: null });
  });

  test("different column: always desc", () => {
    const result = computeNextSort({ column: "name", direction: "asc" }, "revenue");
    expect(result).toEqual({ column: "revenue", direction: "desc" });
  });

  test("different column from null state: desc", () => {
    const result = computeNextSort({ column: null, direction: null }, "revenue");
    expect(result).toEqual({ column: "revenue", direction: "desc" });
  });
});

describe("applySort", () => {
  const data = [
    { name: "Alice", revenue: 5000 },
    { name: "Charlie", revenue: 3000 },
    { name: "Bob", revenue: 7000 },
  ];

  test("returns unsorted array when no sort is active", () => {
    const result = applySort(data, { column: null, direction: null }, (r) => r.name);
    expect(result).toEqual(data);
  });

  test("sorts strings ascending", () => {
    const result = applySort(data, { column: "name", direction: "asc" }, (r) => r.name);
    expect(result.map((r) => r.name)).toEqual(["Alice", "Bob", "Charlie"]);
  });

  test("sorts strings descending", () => {
    const result = applySort(data, { column: "name", direction: "desc" }, (r) => r.name);
    expect(result.map((r) => r.name)).toEqual(["Charlie", "Bob", "Alice"]);
  });

  test("sorts numbers ascending", () => {
    const result = applySort(data, { column: "revenue", direction: "asc" }, (r) => r.revenue);
    expect(result.map((r) => r.revenue)).toEqual([3000, 5000, 7000]);
  });

  test("sorts numbers descending", () => {
    const result = applySort(data, { column: "revenue", direction: "desc" }, (r) => r.revenue);
    expect(result.map((r) => r.revenue)).toEqual([7000, 5000, 3000]);
  });

  test("does not mutate original array", () => {
    const original = [...data];
    applySort(data, { column: "name", direction: "asc" }, (r) => r.name);
    expect(data).toEqual(original);
  });

  test("handles empty array", () => {
    const result = applySort([], { column: "name", direction: "asc" }, (r) => r.name);
    expect(result).toEqual([]);
  });

  test("handles single item array", () => {
    const result = applySort(
      [{ name: "Alice", revenue: 100 }],
      { column: "name", direction: "asc" },
      (r) => r.name,
    );
    expect(result.map((r) => r.name)).toEqual(["Alice"]);
  });
});
