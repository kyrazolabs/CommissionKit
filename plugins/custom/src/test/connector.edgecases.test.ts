import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSingle, mockFetchSequence, generateDataset, makePaginatedPages, SAMPLE_MEMBERS, originalFetch } from "./setup";

describe("CustomConnector — edge cases", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseReps = {
    baseUrl: "https://api.example.com", auth: { type: "bearer" as const, token: "t" },
    entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } } },
  };

  const baseDeals = {
    baseUrl: "https://api.example.com", auth: { type: "bearer" as const, token: "t" },
    entities: { deals: { enabled: true, endpoint: "/deals", fields: {
      externalId: "id", name: "name", amount: "amount", closeDate: "closeDate", stage: "stage", repExternalId: "repId",
    } } },
  };

  // ─── Null / undefined / missing fields ────────────────────────────

  test("null name becomes empty string", async () => {
    mockFetchSingle([{ id: "x", name: null }]);
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps[0].name).toBe("");
  });

  test("undefined name becomes empty string", async () => {
    mockFetchSingle([{ id: "x" }]);
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps[0].name).toBe("");
  });

  test("all fields missing in response still produces valid record", async () => {
    mockFetchSingle([{ id: "x" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals).toHaveLength(1);
    expect(deals[0].externalId).toBe("x");
    expect(deals[0].name).toBe("");
    expect(deals[0].amount).toBe(0);
    expect(deals[0].repExternalId).toBe("");
  });

  // ─── Zero / boundary values ────────────────────────────────────────

  test("zero amount", async () => {
    mockFetchSingle([{ id: "d", name: "Free", amount: 0, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].amount).toBe(0);
  });

  test("very large amount", async () => {
    mockFetchSingle([{ id: "d", name: "Big", amount: 1e12, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].amount).toBe(1e12);
  });

  test("very small fractional amount", async () => {
    mockFetchSingle([{ id: "d", name: "Small", amount: 0.01, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].amount).toBe(0.01);
  });

  test("date edge: epoch", async () => {
    mockFetchSingle([{ id: "d", name: "Epoch", closeDate: "1970-01-01T00:00:00.000Z" }]);
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals, fields: { externalId: "id", name: "name", closeDate: "closeDate" } } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].closeDate.getTime()).toBe(0);
  });

  test("date edge: far future", async () => {
    mockFetchSingle([{ id: "d", name: "Future", closeDate: "2099-12-31T23:59:59.000Z" }]);
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals, fields: { externalId: "id", name: "name", closeDate: "closeDate" } } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].closeDate.getFullYear()).toBe(2099);
  });

  // ─── Large datasets ────────────────────────────────────────────────

  test("250 records across 3 pages", async () => {
    const all = generateDataset(250, "deal");
    const pages = makePaginatedPages(all, 100);
    mockFetchSequence(...pages);
    const deals = await connector.fetchDeals("ws", {
      ...baseDeals, pagination: { type: "cursor", limitParam: "l", offsetParam: "o", cursorParam: "c", pageParam: "p", limitValue: 100, cursorPath: "nextCursor" }, responsePath: "data",
    });
    expect(deals).toHaveLength(250);
    expect(deals[0].externalId).toBe("deal-0");
    expect(deals[249].externalId).toBe("deal-249");
  });

  test("1000 records with small pages (limit=50)", async () => {
    const all = generateDataset(1000, "big");
    const pages = makePaginatedPages(all, 50);
    mockFetchSequence(...pages);
    const reps = await connector.fetchReps("ws", {
      ...baseReps, pagination: { type: "cursor", limitParam: "l", offsetParam: "o", cursorParam: "c", pageParam: "p", limitValue: 50, cursorPath: "nextCursor" }, responsePath: "data",
    });
    expect(reps).toHaveLength(1000);
    expect(reps[0].externalId).toBe("big-0");
    expect(reps[999].externalId).toBe("big-999");
  });

  // ─── Duplicate records ─────────────────────────────────────────────

  test("duplicate records in a single page are both returned", async () => {
    mockFetchSingle([
      { id: "dup-1", name: "Alice" },
      { id: "dup-1", name: "Alice" }, // duplicate externalId
    ]);
    const reps = await connector.fetchReps("ws", baseReps);
    expect(reps).toHaveLength(2);
    expect(reps[0].externalId).toBe("dup-1");
    expect(reps[1].externalId).toBe("dup-1");
  });

  test("duplicate records across pages", async () => {
    const page1 = [{ id: "cross-1", name: "Alice" }];
    const page2 = [{ id: "cross-1", name: "Alice" }];
    mockFetchSequence({ body: { data: page1, pageInfo: { hasNextPage: true }, nextCursor: "p2" } }, { body: { data: page2, pageInfo: { hasNextPage: false }, nextCursor: null } });
    const reps = await connector.fetchReps("ws", {
      ...baseReps, pagination: { type: "cursor", limitParam: "l", offsetParam: "o", cursorParam: "c", pageParam: "p", limitValue: 10, cursorPath: "nextCursor" }, responsePath: "data",
    });
    expect(reps).toHaveLength(2);
    expect(reps[0].externalId).toBe("cross-1");
    expect(reps[1].externalId).toBe("cross-1");
  });

  // ─── GET vs POST method ────────────────────────────────────────────

  test("uses POST when configured", async () => {
    let method = "";
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      method = init?.method || "GET"; return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      ...baseReps, entities: { reps: { ...baseReps.entities.reps, method: "POST" } },
    });
    expect(method).toBe("POST");
  });

  test("uses GET by default", async () => {
    let method = "";
    globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
      method = init?.method || "GET"; return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", baseReps);
    expect(method).toBe("GET");
  });

  // ─── Mixed entity types ────────────────────────────────────────────

  test("both reps and deals can be fetched from same config", async () => {
    mockFetchSingle([
      { id: "r1", name: "Alice" },
    ]);
    const reps = await connector.fetchReps("ws", {
      baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" },
      entities: {
        reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } },
        deals: { enabled: true, endpoint: "/orders", fields: { externalId: "id", name: "name", amount: "amount", closeDate: "closeDate", stage: "stage", repExternalId: "repId" } },
      },
    });
    expect(reps).toHaveLength(1);
  });

  // ─── String-to-number coercion cases ──────────────────────────────

  test("amount is numeric string with decimals", async () => {
    mockFetchSingle([{ id: "d", name: "Deal", amount: "1234.56", closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].amount).toBe(1234.56);
  });

  test("amount field is an object (should become NaN → 0)", async () => {
    mockFetchSingle([{ id: "d", name: "Deal", amount: { value: 500 }, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].amount).toBe(0);
  });

  test("amount field is boolean true", async () => {
    mockFetchSingle([{ id: "d", name: "Deal", amount: true, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].amount).toBe(1);
  });

  test("amount field is boolean false", async () => {
    mockFetchSingle([{ id: "d", name: "Deal", amount: false, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].amount).toBe(0);
  });
});
