import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { CustomConnector } from "./connector";
import type { ConnectionConfig, NormalizedRep, NormalizedDeal } from "@workspace/plugins-core";

// ─── Helpers ──────────────────────────────────────────────────────────

function mockFetchSequence(...responses: Array<{ status?: number; body: any }>) {
  let call = 0;
  globalThis.fetch = mock(async (_url: string | URL | Request, _init?: RequestInit) => {
    const r = responses[call] || responses[responses.length - 1];
    call++;
    const body = typeof r.body === "string" ? r.body : JSON.stringify(r.body);
    return new Response(body, { status: r.status ?? 200, headers: { "Content-Type": "application/json" } });
  });
  return { getCallCount: () => call };
}

function mockFetchSingle(body: any, status = 200) {
  return mockFetchSequence({ body, status });
}

// ─── Sample Reps API Response (Twenty CRM members) ───────────────────

const SAMPLE_MEMBERS = {
  data: {
    workspaceMembers: {
      edges: [
        {
          node: {
            id: "member-1",
            name: { firstName: "Abdullah", lastName: "Alotaibi" },
            userEmail: "abdullah@example.com",
          },
        },
        {
          node: {
            id: "member-2",
            name: { firstName: "Sarah", lastName: "Jones" },
            userEmail: "sarah@example.com",
          },
        },
        {
          node: {
            id: "member-3",
            name: { firstName: "Mike", lastName: "Chen" },
            userEmail: "mike@example.com",
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  },
};

// ─── Sample Deals API Response (Twenty CRM opportunities) ────────────

const SAMPLE_OPPORTUNITIES = {
  data: {
    opportunities: {
      edges: [
        {
          node: {
            id: "deal-1",
            name: "Enterprise Plan — Acme Corp",
            amount: { amountMicros: 999000000 },
            closeDate: "2024-03-15T00:00:00.000Z",
            stage: "closed_won",
            createdBy: { workspaceMemberId: "member-1" },
            currencyCode: "USD",
          },
        },
        {
          node: {
            id: "deal-2",
            name: "Starter Plan — Beta Inc",
            amount: { amountMicros: 49000000 },
            closeDate: "2024-05-20T00:00:00.000Z",
            stage: "pending",
            createdBy: { workspaceMemberId: "member-2" },
            currencyCode: "EUR",
          },
        },
        {
          node: {
            id: "deal-3",
            name: "Pro Plan — Gamma LLC",
            amount: { amountMicros: 149000000 },
            closeDate: "2024-02-01T00:00:00.000Z",
            stage: "closed_lost",
            createdBy: { workspaceMemberId: "member-3" },
            currencyCode: "USD",
          },
        },
      ],
      pageInfo: { hasNextPage: false, endCursor: null },
    },
  },
};

// ─── Flat API Response (like Stripe-style) ───────────────────────────

const FLAT_DEALS = [
  {
    id: "flat-1",
    dealName: "Widget Sale",
    totalAmount: 5000,
    closedAt: "2024-06-01T00:00:00.000Z",
    dealStage: "closed_won",
    salesRepId: "rep-1",
    currencyCode: "USD",
    paymentState: "paid",
  },
  {
    id: "flat-2",
    dealName: "Widget Sale 2",
    totalAmount: 7500,
    closedAt: "2024-06-10T00:00:00.000Z",
    dealStage: "pending",
    salesRepId: "rep-2",
    currencyCode: "EUR",
    paymentState: "outstanding",
  },
];

// ─── Paginated response ──────────────────────────────────────────────

function makePaginatedResponses<T>(data: T[], pageSize: number): Array<{ body: any }> {
  const pages: Array<{ body: any }> = [];
  const totalPages = Math.ceil(data.length / pageSize);
  for (let i = 0; i < totalPages; i++) {
    const chunk = data.slice(i * pageSize, (i + 1) * pageSize);
    pages.push({
      body: {
        data: chunk,
        pageInfo: { hasNextPage: i < totalPages - 1, nextCursor: i < totalPages - 1 ? `cursor-${i + 1}` : null },
        totalCount: data.length,
      },
    });
  }
  return pages;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("CustomConnector — metadata", () => {
  const connector = new CustomConnector();

  test("name is 'custom'", () => {
    expect(connector.name).toBe("custom");
  });

  test("displayName is 'Custom REST API'", () => {
    expect(connector.displayName).toBe("Custom REST API");
  });

  test("description matches the tagline", () => {
    expect(connector.description).toBe(
      "Connect CKit to any ERP or CRM that exposes a REST API. Configure field mappings, authentication, and pagination — no code needed.",
    );
  });

  test("version is 1.0.0", () => {
    expect(connector.version).toBe("1.0.0");
  });

  test("getSettingsSchema requires baseUrl", () => {
    const schema = connector.getSettingsSchema();
    expect(schema.required).toContain("baseUrl");
  });

  test("getUIMetadata has expected features", () => {
    const meta = connector.getUIMetadata();
    expect(meta.features).toContain("sync_reps");
    expect(meta.features).toContain("sync_deals");
  });
});

describe("CustomConnector — lifecycle", () => {
  let connector: CustomConnector;

  beforeEach(async () => {
    connector = new CustomConnector();
    await connector.init("ws-lifecycle", {});
  });

  test("init sets status to connected", async () => {
    expect(await connector.getStatus("ws-lifecycle")).toBe("connected");
  });

  test("destroy removes workspace", async () => {
    await connector.destroy("ws-lifecycle");
    expect(await connector.getStatus("ws-lifecycle")).toBe("disconnected");
  });

  test("getStatus returns disconnected for unknown workspace", async () => {
    expect(await connector.getStatus("unknown-ws")).toBe("disconnected");
  });
});

describe("CustomConnector — testConnection", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("returns success for valid config and reachable URL", async () => {
    mockFetchSingle({ ok: true }, 200);
    const result = await connector.testConnection({
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
    });
    expect(result.success).toBe(true);
    expect(result.message).toBe("Successfully connected");
    expect(result.details?.endpoint).toBe("https://api.example.com");
    expect(typeof result.details?.latency).toBe("number");
  });

  test("returns failure for missing baseUrl", async () => {
    const result = await connector.testConnection({
      auth: { type: "bearer", token: "tok" },
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Invalid config");
  });

  test("returns failure for HTTP error response", async () => {
    mockFetchSingle({ error: "Not Found" }, 404);
    const result = await connector.testConnection({
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("HTTP 404");
  });

  test("returns failure for network error", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("Connection refused")));
    const result = await connector.testConnection({
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
    });
    expect(result.success).toBe(false);
    expect(result.message).toContain("Connection refused");
    mock.restore();
  });
});

describe("CustomConnector — config parsing", () => {
  const connector = new CustomConnector();

  test("returns empty array from fetchReps when config is invalid", async () => {
    const result = await connector.fetchReps("ws-1", { baseUrl: "not-a-url" });
    expect(result).toEqual([]);
  });

  test("returns empty array from fetchDeals when config is invalid", async () => {
    const result = await connector.fetchDeals("ws-1", { baseUrl: "not-a-url" });
    expect(result).toEqual([]);
  });

  test("returns empty array when reps entity is not enabled", async () => {
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: { reps: { enabled: false, endpoint: "/users" } },
    };
    const result = await connector.fetchReps("ws-1", config);
    expect(result).toEqual([]);
  });

  test("returns empty array when deals entity is not enabled", async () => {
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: { deals: { enabled: false, endpoint: "/orders" } },
    };
    const result = await connector.fetchDeals("ws-1", config);
    expect(result).toEqual([]);
  });
});

describe("CustomConnector — fetchReps", () => {
  let connector: CustomConnector;
  const config: ConnectionConfig = {
    baseUrl: "https://api.example.com",
    auth: { type: "bearer", token: "tok-abc" },
    responsePath: "data.workspaceMembers.edges",
    entities: {
      reps: {
        enabled: true,
        endpoint: "/graphql",
        method: "POST",
        fields: {
          externalId: "node.id",
          name: "node.name.firstName",
          email: "node.userEmail",
        },
      },
    },
  };

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("fetches and maps reps from nested response", async () => {
    mockFetchSequence({ body: SAMPLE_MEMBERS });
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(3);
    expect(reps[0]).toMatchObject({
      externalId: "member-1",
      name: "Abdullah",
      email: "abdullah@example.com",
    });
    expect(reps[1]).toMatchObject({
      externalId: "member-2",
      name: "Sarah",
      email: "sarah@example.com",
    });
    expect(reps[2]).toMatchObject({
      externalId: "member-3",
      name: "Mike",
      email: "mike@example.com",
    });
  });

  test("sends bearer token in Authorization header", async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ data: { users: [] } }), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws-1", {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "my-secret-token" },
      entities: { reps: { enabled: true, endpoint: "/users" } },
    });
    expect(capturedHeaders).toHaveProperty("Authorization", "Bearer my-secret-token");
    mock.restore();
  });

  test("sends API key in custom header", async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws-1", {
      baseUrl: "https://api.example.com",
      auth: { type: "apiKey", headerName: "X-API-Key", apiKey: "key-123" },
      entities: { reps: { enabled: true, endpoint: "/users" } },
    });
    expect(capturedHeaders).toHaveProperty("X-API-Key", "key-123");
    mock.restore();
  });

  test("sends basic auth header", async () => {
    let capturedHeaders: Record<string, string> = {};
    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws-1", {
      baseUrl: "https://api.example.com",
      auth: { type: "basic", username: "user", password: "pass" },
      entities: { reps: { enabled: true, endpoint: "/users" } },
    });
    expect(capturedHeaders).toHaveProperty("Authorization");
    expect(capturedHeaders.Authorization).toStartWith("Basic ");
    mock.restore();
  });

  test("applies static filters as query params", async () => {
    let capturedUrl = "";
    globalThis.fetch = mock(async (url: string | URL | Request, _init?: RequestInit) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws-1", {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/users",
          filters: [{ key: "department", value: "sales" }],
        },
      },
    });
    expect(capturedUrl).toContain("department=sales");
    mock.restore();
  });
});

describe("CustomConnector — fetchDeals", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("fetches and maps deals with amount division via $div", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      responsePath: "data.opportunities.edges",
      entities: {
        deals: {
          enabled: true,
          endpoint: "/graphql",
          method: "POST",
          fields: {
            externalId: "node.id",
            name: "node.name",
            amount: "$div:1000000:node.amount.amountMicros",
            closeDate: "node.closeDate",
            stage: "node.stage",
            repExternalId: "node.createdBy.workspaceMemberId",
            currency: "node.currencyCode",
          },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals).toHaveLength(3);
    expect(deals[0]).toMatchObject({
      externalId: "deal-1",
      name: "Enterprise Plan — Acme Corp",
      amount: 999,
      stage: "closed_won",
      repExternalId: "member-1",
      currency: "USD",
    });
    expect(deals[1]).toMatchObject({
      externalId: "deal-2",
      amount: 49,
      stage: "pending",
      currency: "EUR",
    });
    expect(deals[2]).toMatchObject({
      externalId: "deal-3",
      amount: 149,
      stage: "closed_lost",
    });
  });

  test("parses closeDate correctly", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      responsePath: "data.opportunities.edges",
      entities: {
        deals: {
          enabled: true,
          endpoint: "/graphql",
          fields: {
            externalId: "node.id",
            name: "node.name",
            closeDate: "node.closeDate",
          },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals[0].closeDate).toBeInstanceOf(Date);
    expect(deals[0].closeDate.toISOString()).toBe("2024-03-15T00:00:00.000Z");
  });

  test("applies stage filter to exclude non-matching stages", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      responsePath: "data.opportunities.edges",
      entities: {
        deals: {
          enabled: true,
          endpoint: "/graphql",
          fields: {
            externalId: "node.id",
            name: "node.name",
            stage: "node.stage",
          },
          stageFilter: { field: "stage", include: ["closed_won"] },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals).toHaveLength(1);
    expect(deals[0].externalId).toBe("deal-1");
  });

  test("payment status mapping maps raw statuses", async () => {
    mockFetchSequence({ body: FLAT_DEALS });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        deals: {
          enabled: true,
          endpoint: "/deals",
          fields: {
            externalId: "id",
            name: "dealName",
            amount: "totalAmount",
            closeDate: "closedAt",
            stage: "dealStage",
            repExternalId: "salesRepId",
            currency: "currencyCode",
            paymentStatus: "paymentState",
          },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals[0].paymentStatus).toBe("paid");
    expect(deals[1].paymentStatus).toBe("unpaid");
  });

  test("custom payment status mapping overrides defaults", async () => {
    mockFetchSequence({ body: FLAT_DEALS });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        deals: {
          enabled: true,
          endpoint: "/deals",
          fields: {
            externalId: "id",
            name: "dealName",
            paymentStatus: "paymentState",
          },
          paymentStatusMapping: {
            paid: ["paid"],
            on_hold: ["outstanding"],
          },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals[0].paymentStatus).toBe("paid");
    // "outstanding" maps to "on_hold" via custom mapping (overrides default "unpaid")
    expect(deals[1].paymentStatus).toBe("on_hold");
  });

  test("missing closeDate defaults to current time", async () => {
    const before = Date.now();
    mockFetchSingle([{ id: "d1", name: "Test" }]);
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        deals: {
          enabled: true,
          endpoint: "/deals",
          fields: { externalId: "id", name: "name" },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    const after = Date.now();
    expect(deals[0].closeDate.getTime()).toBeGreaterThanOrEqual(before);
    expect(deals[0].closeDate.getTime()).toBeLessThanOrEqual(after);
  });

  test("returns empty array for empty response", async () => {
    mockFetchSingle([]);
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: { deals: { enabled: true, endpoint: "/deals" } },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals).toEqual([]);
  });
});

describe("CustomConnector — pagination", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("offset pagination fetches all pages", async () => {
    const allItems = Array.from({ length: 150 }, (_, i) => ({ id: `item-${i}`, name: `Item ${i}` }));
    const page1 = allItems.slice(0, 100);
    const page2 = allItems.slice(100, 150);
    mockFetchSequence({ body: page1 }, { body: page2 });

    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      pagination: { type: "offset", limitParam: "limit", offsetParam: "offset", limitValue: 100, cursorParam: "cursor", pageParam: "page" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/users",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(150);
    expect(reps[0].externalId).toBe("item-0");
    expect(reps[149].externalId).toBe("item-149");
  });

  test("cursor pagination uses pageInfo.hasNextPage", async () => {
    const allItems = Array.from({ length: 3 }, (_, i) => ({ id: `cursor-item-${i}`, name: `Item ${i}` }));
    const response = {
      data: allItems.slice(0, 2),
      pageInfo: { hasNextPage: true },
      nextCursor: "cursor-next",
    };
    const response2 = {
      data: allItems.slice(2, 3),
      pageInfo: { hasNextPage: false },
      nextCursor: null,
    };
    mockFetchSequence({ body: response }, { body: response2 });

    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      responsePath: "data",
      pagination: { type: "cursor", limitParam: "limit", offsetParam: "offset", cursorParam: "cursor", pageParam: "page", limitValue: 50, cursorPath: "nextCursor" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/users",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(3);
  });

  test("page pagination walks through all pages", async () => {
    const allItems = Array.from({ length: 75 }, (_, i) => ({ id: `page-item-${i}`, name: `Item ${i}` }));
    const page1 = allItems.slice(0, 50);
    const page2 = allItems.slice(50);
    mockFetchSequence({ body: page1 }, { body: page2 });

    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      pagination: { type: "page", limitParam: "perPage", offsetParam: "offset", cursorParam: "cursor", pageParam: "page", limitValue: 50 },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/users",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(75);
  });
});

describe("CustomConnector — auto-detection", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("auto-detects array in nested wrapper when responsePath is omitted", async () => {
    // API returns { success: true, data: { customers: [...] } }
    mockFetchSingle({
      success: true,
      data: { customers: [{ id: "c1", name: "Alice" }] },
    });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/customers",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(1);
    expect(reps[0].externalId).toBe("c1");
  });

  test("auto-detects array in 'data' key", async () => {
    mockFetchSingle({
      data: [{ id: "r1", name: "Rep 1" }],
    });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/reps",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(1);
  });

  test("auto-detects array in 'results' key", async () => {
    mockFetchSingle({
      count: 1,
      results: [{ id: "r1", name: "Rep 1" }],
    });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/reps",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(1);
  });

  test("returns empty list when auto-detection finds no array", async () => {
    mockFetchSingle({ status: "ok", message: "no data" });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/reps",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toEqual([]);
  });

  test("direct array response works without auto-detection", async () => {
    mockFetchSingle([{ id: "d1", name: "Alice", email: "a@b.com" }]);
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/reps",
          fields: { externalId: "id", name: "name", email: "email" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps).toHaveLength(1);
    expect(reps[0].name).toBe("Alice");
  });
});

describe("CustomConnector — error handling", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("fetchReps throws on HTTP 500 (after PluginHttpClient retries)", async () => {
    globalThis.fetch = mock(() => Promise.resolve(new Response("Internal Error", { status: 500 })));
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: { reps: { enabled: true, endpoint: "/users" } },
    };
    await expect(connector.fetchReps("ws-1", config)).rejects.toThrow();
    mock.restore();
  }, 15000);

  test("fetchDeals throws on network error (after PluginHttpClient retries)", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("Network down")));
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: { deals: { enabled: true, endpoint: "/orders" } },
    };
    await expect(connector.fetchDeals("ws-1", config)).rejects.toThrow("Network down");
    mock.restore();
  }, 15000);
});

describe("CustomConnector — webhooks", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  test("parseWebhook returns empty array", () => {
    expect(connector.parseWebhook({})).toEqual([]);
  });

  test("verifyWebhook resolves silently", async () => {
    await expect(
      connector.verifyWebhook(
        { method: "POST", path: "/wh", headers: {}, body: {}, rawBody: Buffer.from("") },
        "secret",
      ),
    ).resolves.toBeUndefined();
  });
});

describe("CustomConnector — GET vs POST", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("uses POST method when configured", async () => {
    let capturedMethod = "";
    let capturedBody = "";
    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedMethod = init?.method || "GET";
      if (init?.body) capturedBody = String(init.body);
      return new Response(JSON.stringify([{ id: "1", name: "Test" }]), { headers: { "Content-Type": "application/json" } });
    });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/graphql",
          method: "POST",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    await connector.fetchReps("ws-1", config);
    expect(capturedMethod).toBe("POST");
    mock.restore();
  });

  test("uses GET method by default", async () => {
    let capturedMethod = "";
    globalThis.fetch = mock(async (url: string | URL | Request, init?: RequestInit) => {
      capturedMethod = init?.method || "GET";
      return new Response(JSON.stringify([{ id: "1", name: "Test" }]), { headers: { "Content-Type": "application/json" } });
    });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } },
      },
    };
    await connector.fetchReps("ws-1", config);
    expect(capturedMethod).toBe("GET");
    mock.restore();
  });
});

describe("CustomConnector — modifiedAfter", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("passes modifiedAfter as query param", async () => {
    let capturedUrl = "";
    globalThis.fetch = mock(async (url: string | URL | Request, _init?: RequestInit) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/users",
          modifiedAfterParam: "updated_since",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    await connector.fetchReps("ws-1", config, { modifiedAfter: new Date("2024-01-01") });
    expect(capturedUrl).toContain("updated_since=2024-01-01T00%3A00%3A00.000Z");
    mock.restore();
  });
});

describe("CustomConnector — currency mapping", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("passes through the currency field from response", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", amount: 1000, closeDate: "2024-01-01", stage: "closed_won", repId: "r1", currency: "SAR" }]);
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        deals: {
          enabled: true,
          endpoint: "/deals",
          fields: {
            externalId: "id",
            name: "name",
            amount: "amount",
            closeDate: "closeDate",
            stage: "stage",
            repExternalId: "repId",
            currency: "currency",
          },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals[0].currency).toBe("SAR");
  });
});

describe("CustomConnector — edge cases", () => {
  let connector: CustomConnector;

  beforeEach(() => {
    connector = new CustomConnector();
  });

  afterEach(() => {
    mock.restore();
  });

  test("handles null values gracefully in field extraction", async () => {
    mockFetchSingle([{ id: "x", name: null, email: null }]);
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/users",
          fields: { externalId: "id", name: "name", email: "email" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(reps[0].name).toBe("");
    expect(reps[0].email).toBe("");
  });

  test("converts externalId to string", async () => {
    mockFetchSingle([{ id: 42, name: "Numeric ID Rep" }]);
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        reps: {
          enabled: true,
          endpoint: "/users",
          fields: { externalId: "id", name: "name", email: "id" },
        },
      },
    };
    const reps = await connector.fetchReps("ws-1", config);
    expect(typeof reps[0].externalId).toBe("string");
    expect(reps[0].externalId).toBe("42");
  });

  test("handles zero amount", async () => {
    mockFetchSingle([{ id: "d1", name: "Free Deal", amount: 0, closeDate: "2024-01-01", stage: "closed_won", repId: "r1" }]);
    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      entities: {
        deals: {
          enabled: true,
          endpoint: "/deals",
          fields: {
            externalId: "id",
            name: "name",
            amount: "amount",
            closeDate: "closeDate",
            stage: "stage",
            repExternalId: "repId",
          },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals[0].amount).toBe(0);
  });

  test("handles large datasets across multiple pages", async () => {
    const largeDataset = Array.from({ length: 250 }, (_, i) => ({
      id: `deal-${i}`,
      name: `Deal ${i}`,
      amount: i * 100,
      closeDate: "2024-01-01",
      stage: "closed_won",
      repId: "r1",
    }));
    const pages = makePaginatedResponses(largeDataset, 100);
    mockFetchSequence(...pages);

    const config: ConnectionConfig = {
      baseUrl: "https://api.example.com",
      auth: { type: "bearer", token: "tok" },
      responsePath: "data",
      pagination: { type: "cursor", limitParam: "limit", offsetParam: "offset", cursorParam: "cursor", pageParam: "page", limitValue: 100, cursorPath: "nextCursor" },
      entities: {
        deals: {
          enabled: true,
          endpoint: "/deals",
          fields: {
            externalId: "id",
            name: "name",
            amount: "amount",
            closeDate: "closeDate",
            stage: "stage",
            repExternalId: "repId",
          },
        },
      },
    };
    const deals = await connector.fetchDeals("ws-1", config);
    expect(deals).toHaveLength(250);
    expect(deals[0].externalId).toBe("deal-0");
    expect(deals[249].externalId).toBe("deal-249");
  });
});
