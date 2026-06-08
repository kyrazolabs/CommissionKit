import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSingle, mockFetchSequence, SAMPLE_OPPORTUNITIES, FLAT_DEALS, originalFetch } from "./setup";

describe("CustomConnector — stage filters", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseDeals = {
    baseUrl: "https://api.example.com", auth: { type: "bearer" as const, token: "t" },
    responsePath: "data.opportunities.edges",
    entities: { deals: { enabled: true, endpoint: "/graphql",
      fields: { externalId: "node.id", name: "node.name", stage: "node.stage" } } },
  };

  test("filters to single stage", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals, stageFilter: { field: "stage", include: ["closed_won"] } } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals).toHaveLength(1);
    expect(deals[0].externalId).toBe("deal-1");
  });

  test("filters to multiple stages", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals, stageFilter: { field: "stage", include: ["closed_won", "closed_lost"] } } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals).toHaveLength(2);
  });

  test("filtering everything yields empty result", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals, stageFilter: { field: "stage", include: ["banana"] } } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals).toHaveLength(0);
  });

  test("filtering with empty include array yields empty result", async () => {
    mockFetchSequence({ body: SAMPLE_OPPORTUNITIES });
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals, stageFilter: { field: "stage", include: [] } } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals).toHaveLength(0);
  });
});

describe("CustomConnector — query filters", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseReps = {
    baseUrl: "https://api.example.com", auth: { type: "bearer" as const, token: "t" },
    entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } } },
  };

  test("single filter added as query param", async () => {
    let url = "";
    globalThis.fetch = (async (u: string | URL | Request) => {
      url = String(u); return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      ...baseReps, entities: { reps: { ...baseReps.entities.reps, filters: [{ key: "dept", value: "sales" }] } },
    });
    expect(url).toContain("dept=sales");
  });

  test("multiple filters", async () => {
    let url = "";
    globalThis.fetch = (async (u: string | URL | Request) => {
      url = String(u); return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      ...baseReps, entities: { reps: { ...baseReps.entities.reps, filters: [
        { key: "dept", value: "sales" }, { key: "active", value: "true" },
      ] } },
    });
    expect(url).toContain("dept=sales");
    expect(url).toContain("active=true");
  });

  test("filter with special characters", async () => {
    let url = "";
    globalThis.fetch = (async (u: string | URL | Request) => {
      url = String(u); return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      ...baseReps, entities: { reps: { ...baseReps.entities.reps, filters: [{ key: "name", value: "John Doe" }] } },
    });
    expect(url).toContain("name=John+Doe");
  });

  test("filter with empty value", async () => {
    let url = "";
    globalThis.fetch = (async (u: string | URL | Request) => {
      url = String(u); return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      ...baseReps, entities: { reps: { ...baseReps.entities.reps, filters: [{ key: "tag", value: "" }] } },
    });
    expect(url).toContain("tag=");
  });
});

describe("CustomConnector — modifiedAfter", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  test("sends modifiedAfter as ISO string in query param", async () => {
    let url = "";
    globalThis.fetch = (async (u: string | URL | Request) => {
      url = String(u); return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" },
      entities: { reps: { enabled: true, endpoint: "/users", modifiedAfterParam: "updated_since", fields: { externalId: "id", name: "name", email: "id" } } },
    }, { modifiedAfter: new Date("2024-01-01") });
    expect(url).toContain("updated_since=");
  });

  test("no modifiedAfter param when options is missing", async () => {
    let url = "";
    globalThis.fetch = (async (u: string | URL | Request) => {
      url = String(u); return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" },
      entities: { reps: { enabled: true, endpoint: "/users", modifiedAfterParam: "updated_since", fields: { externalId: "id", name: "name", email: "id" } } },
    });
    expect(url).not.toContain("updated_since");
  });

  test("no modifiedAfter param when param name is not configured", async () => {
    let url = "";
    globalThis.fetch = (async (u: string | URL | Request) => {
      url = String(u); return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    });
    await connector.fetchReps("ws", {
      baseUrl: "https://api.example.com", auth: { type: "bearer", token: "t" },
      entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } } },
    }, { modifiedAfter: new Date("2024-01-01") });
    expect(url).not.toContain("2024-01-01");
  });
});

describe("CustomConnector — payment status mapping", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseDeals = {
    baseUrl: "https://api.example.com", auth: { type: "bearer" as const, token: "t" },
    entities: { deals: { enabled: true, endpoint: "/deals", fields: {
      externalId: "id", name: "name", paymentStatus: "paymentState",
    } } },
  };

  test("default mapping: paid → paid", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", paymentState: "paid" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].paymentStatus).toBe("paid");
  });

  test("default mapping: outstanding → unpaid", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", paymentState: "outstanding" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].paymentStatus).toBe("unpaid");
  });

  test("default mapping: partially_paid → partial", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", paymentState: "partially_paid" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].paymentStatus).toBe("partial");
  });

  test("default mapping: cancelled → on_hold", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", paymentState: "cancelled" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].paymentStatus).toBe("on_hold");
  });

  test("custom mapping overrides default", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", paymentState: "outstanding" }]);
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals,
      paymentStatusMapping: { on_hold: ["outstanding"] },
    } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].paymentStatus).toBe("on_hold");
  });

  test("custom mapping: multiple raw values map to one CKit status", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal", paymentState: "SETTLED" }]);
    const cfg = { ...baseDeals, entities: { deals: { ...baseDeals.entities.deals,
      paymentStatusMapping: { paid: ["PAID", "SETTLED"] },
    } } };
    const deals = await connector.fetchDeals("ws", cfg);
    expect(deals[0].paymentStatus).toBe("paid");
  });

  test("paymentStatus is undefined when raw field is missing", async () => {
    mockFetchSingle([{ id: "d1", name: "Deal" }]);
    const deals = await connector.fetchDeals("ws", baseDeals);
    expect(deals[0].paymentStatus).toBeUndefined();
  });
});
