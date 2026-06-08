import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSingle, originalFetch } from "./setup";

describe("CustomConnector — responsePath auto-detection", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseReps = {
    baseUrl: "https://api.example.com", auth: { type: "bearer" as const, token: "t" },
    entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } } },
  };

  test("direct array response (no auto-detection needed)", async () => {
    mockFetchSingle([{ id: "r1", name: "Alice" }]);
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toHaveLength(1);
    expect(reps[0].name).toBe("Alice");
  });

  test("auto-detects array in 'data' key", async () => {
    mockFetchSingle({ data: [{ id: "r1", name: "Alice" }] });
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toHaveLength(1);
  });

  test("auto-detects array in 'results' key", async () => {
    mockFetchSingle({ count: 1, results: [{ id: "r1", name: "Alice" }] });
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toHaveLength(1);
  });

  test("auto-detects array in 'items' key", async () => {
    mockFetchSingle({ items: [{ id: "r1", name: "Alice" }] });
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toHaveLength(1);
  });

  test("auto-detects array in 'records' key", async () => {
    mockFetchSingle({ records: [{ id: "r1", name: "Alice" }] });
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toHaveLength(1);
  });

  test("auto-detects array in nested wrapper (two levels deep)", async () => {
    mockFetchSingle({ success: true, data: { customers: [{ id: "c1", name: "Alice" }] } });
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toHaveLength(1);
  });

  test("returns empty when no array found in object", async () => {
    mockFetchSingle({ status: "ok", message: "no data here" });
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toEqual([]);
  });

  test("returns empty when response is null", async () => {
    mockFetchSingle(null);
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toEqual([]);
  });

  test("returns empty when response is not an object", async () => {
    mockFetchSingle({ message: "just a string value" });
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toEqual([]);
  });

  test("explicit responsePath overrides auto-detection", async () => {
    // API returns { envelope: { payload: [...] } } but responsePath says "envelope.payload"
    mockFetchSingle({ envelope: { payload: [{ id: "r1", name: "Alice" }] }, data: { other: [] } });
    const cfg = { ...baseReps, responsePath: "envelope.payload" };
    const reps = await connector.fetchReps("ws", cfg);
    expect(reps).toHaveLength(1);
  });

  test("explicit responsePath resolves JSONPath with dot notation", async () => {
    mockFetchSingle({ wrapper: { list: [{ id: "r1", name: "Alice" }] } });
    const cfg = { ...baseReps, responsePath: "wrapper.list" };
    const reps = await connector.fetchReps("ws", cfg);
    expect(reps).toHaveLength(1);
  });

  test("explicit responsePath with array index", async () => {
    mockFetchSingle({ pages: [[{ id: "r1", name: "Alice" }], [{ id: "r2", name: "Bob" }]] });
    const cfg = { ...baseReps, responsePath: "pages[0]" };
    const reps = await connector.fetchReps("ws", cfg);
    expect(reps).toHaveLength(1);
    expect(reps[0].externalId).toBe("r1");
  });

  test("responsePath pointing to non-array yields empty", async () => {
    mockFetchSingle({ meta: { count: 5 } });
    const cfg = { ...baseReps, responsePath: "meta" };
    const reps = await connector.fetchReps("ws", cfg);
    expect(reps).toEqual([]);
  });
});
