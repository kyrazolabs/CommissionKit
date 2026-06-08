import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSingle, mockFetchSequence, SAMPLE_MEMBERS, SAMPLE_OPPORTUNITIES, FLAT_DEALS, originalFetch } from "./setup";

describe("CustomConnector — fetchReps", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseConfig = (overrides?: any) => ({
    baseUrl: "https://api.example.com",
    auth: { type: "bearer" as const, token: "t" },
    entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "email" }, ...overrides } },
  });

  test("extracts fields via JSONPaths", async () => {
    mockFetchSingle([{ id: "r1", name: "Alice", email: "a@b.com", role: "manager" }]);
    const cfg = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer" as const, token: "t" },
      entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "email", role: "role" } } },
    };
    const reps = await connector.fetchReps("ws", cfg);
    expect(reps[0]).toMatchObject({ externalId: "r1", name: "Alice", email: "a@b.com", role: "manager" });
  });

  test("defaults missing name to empty string", async () => {
    mockFetchSingle([{ id: "r1", email: "a@b.com" }]);
    const reps = await connector.fetchReps("ws", baseConfig());
    expect(reps[0].name).toBe("");
  });

  test("defaults missing email to empty string", async () => {
    mockFetchSingle([{ id: "r1", name: "Alice" }]);
    const reps = await connector.fetchReps("ws", baseConfig());
    expect(reps[0].email).toBe("");
  });

  test("converts numeric id to string", async () => {
    mockFetchSingle([{ id: 42, name: "Alice", email: "a@b.com" }]);
    const reps = await connector.fetchReps("ws", baseConfig());
    expect(reps[0].externalId).toBe("42");
  });

  test("handles null name and email gracefully", async () => {
    mockFetchSingle([{ id: "r1", name: null, email: null }]);
    const reps = await connector.fetchReps("ws", baseConfig());
    expect(reps[0].name).toBe("");
    expect(reps[0].email).toBe("");
  });

  test("role is undefined when not configured in fields", async () => {
    mockFetchSingle([{ id: "r1", name: "Alice", email: "a@b.com" }]);
    const reps = await connector.fetchReps("ws", baseConfig());
    expect(reps[0].role).toBeUndefined();
  });

  test("returns multiple reps", async () => {
    mockFetchSingle([
      { id: "r1", name: "Alice", email: "a@b.com" },
      { id: "r2", name: "Bob", email: "b@b.com" },
    ]);
    const reps = await connector.fetchReps("ws", baseConfig());
    expect(reps).toHaveLength(2);
  });
});

describe("CustomConnector — fetchDeals", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseDealConfig = (overrides?: any) => ({
    baseUrl: "https://api.example.com",
    auth: { type: "bearer" as const, token: "t" },
    entities: { deals: { enabled: true, endpoint: "/deals", fields: {
      externalId: "id", name: "name", amount: "amount", closeDate: "closeDate", stage: "stage", repExternalId: "repId",
    }, ...overrides } },
  });

  test("maps all standard fields", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal 1", amount: 5000, closeDate: "2024-06-01T00:00:00.000Z", stage: "closed_won", repId: "rep-1" }]);
    const deals = await connector.fetchDeals("ws", baseDealConfig());
    expect(deals[0]).toMatchObject({ externalId: "d1", name: "Deal 1", amount: 5000, stage: "closed_won", repExternalId: "rep-1" });
  });

  test("parses closeDate correctly", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", closeDate: "2024-03-15T12:30:00.000Z" }]);
    const cfg = baseDealConfig({ fields: { externalId: "id", name: "name", closeDate: "closeDate" } });
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].closeDate).toBeInstanceOf(Date);
    expect(deals[0].closeDate.toISOString()).toBe("2024-03-15T12:30:00.000Z");
  });

  test("missing closeDate defaults to current time", async () => {
    const before = Date.now();
    mockFetchSingle([{ id: "d1", name: "Deal" }]);
    const cfg = baseDealConfig({ fields: { externalId: "id", name: "name" } });
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].closeDate.getTime()).toBeGreaterThanOrEqual(before);
  });

  test("amount of 0 is preserved", async () => {
    mockFetchSingle([{ id: "d1", name: "Free", amount: 0, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDealConfig());
    expect(deals[0].amount).toBe(0);
  });

  test("negative amount is preserved", async () => {
    mockFetchSingle([{ id: "d1", name: "Refund", amount: -100, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDealConfig());
    expect(deals[0].amount).toBe(-100);
  });

  test("string amount is converted to number", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", amount: "5000", closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDealConfig());
    expect(deals[0].amount).toBe(5000);
    expect(typeof deals[0].amount).toBe("number");
  });

  test("non-numeric amount becomes 0", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", amount: "banana", closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const deals = await connector.fetchDeals("ws", baseDealConfig());
    expect(deals[0].amount).toBe(0);
  });

  test("missing amount defaults to 0", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const cfg = baseDealConfig({ fields: { externalId: "id", name: "name", closeDate: "closeDate", stage: "stage", repExternalId: "repId" } });
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].amount).toBe(0);
  });

  test("missing repExternalId defaults to empty string", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", amount: 100, closeDate: "2024-01-01", stage: "closed_won" }]);
    const cfg = baseDealConfig();
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].repExternalId).toBe("");
  });

  test("notes field is extracted when configured", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", amount: 100, closeDate: "2024-01-01", stage: "closed_won", repId: "r1", description: "Important deal" }]);
    const cfg = baseDealConfig({ fields: { externalId: "id", name: "name", amount: "amount", closeDate: "closeDate", stage: "stage", repExternalId: "repId", notes: "description" } });
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].notes).toBe("Important deal");
  });

  test("notes is undefined when not configured", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", amount: 100, closeDate: "2024-01-01" }]);
    const deals = await connector.fetchDeals("ws", baseDealConfig());
    expect(deals[0].notes).toBeUndefined();
  });

  test("currency field is extracted when configured", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", amount: 100, closeDate: "2024-01-01", stage: "closed_won", repId: "r1", currency: "SAR" }]);
    const cfg = baseDealConfig({ fields: { externalId: "id", name: "name", amount: "amount", closeDate: "closeDate", stage: "stage", repExternalId: "repId", currency: "currency" } });
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].currency).toBe("SAR");
  });

  test("returns empty array for empty response", async () => {
    mockFetchSingle([]);
    const deals = await connector.fetchDeals("ws", baseDealConfig());
    expect(deals).toEqual([]);
  });
});

describe("CustomConnector — nested responses", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  test("fetchReps from Twenty-style nested GraphQL response", async () => {
    mockFetchSequence({ body: SAMPLE_MEMBERS });
    const cfg = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer" as const, token: "t" },
      responsePath: "data.workspaceMembers.edges",
      entities: { reps: { enabled: true, endpoint: "/graphql", method: "POST" as const,
        fields: { externalId: "node.id", name: "node.name.firstName", email: "node.userEmail" } } },
    };
    const reps = await connector.fetchReps("ws", cfg);
    expect(reps).toHaveLength(3);
    expect(reps[0]).toMatchObject({ externalId: "member-1", name: "Abdullah", email: "abdullah@example.com" });
  });

  test("fetchDeals from Twenty-style nested GraphQL response with $div", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const cfg = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer" as const, token: "t" },
      responsePath: "data.opportunities.edges",
      entities: { deals: { enabled: true, endpoint: "/graphql", method: "POST" as const,
        fields: {
          externalId: "node.id", name: "node.name",
          amount: "$div:1000000:node.amount.amountMicros",
          closeDate: "node.closeDate", stage: "node.stage",
          repExternalId: "node.createdBy.workspaceMemberId", currency: "node.currencyCode",
        } } },
    };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals).toHaveLength(3);
    expect(deals[0]).toMatchObject({ externalId: "deal-1", amount: 999, stage: "closed_won", repExternalId: "member-1", currency: "USD" });
    expect(deals[1]).toMatchObject({ amount: 49, currency: "EUR" });
    expect(deals[2]).toMatchObject({ amount: 149, stage: "closed_lost" });
  });
});
