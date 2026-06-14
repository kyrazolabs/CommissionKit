import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { SalesforceConnector } from "./connector";

describe("Salesforce — stage filter", () => {
  let connector: SalesforceConnector;
  beforeEach(() => { connector = new SalesforceConnector(); });
  afterEach(() => { mock.restore(); });

  const mockFetch = (stageName: string) => {
    globalThis.fetch = (async (url: string) => {
      if (String(url).includes("oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "at", instance_url: "https://x.my.salesforce.com" }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        records: [
          { Id: "o1", Name: "Deal 1", Amount: 100, CloseDate: "2024-01-01", StageName: stageName, OwnerId: "owner-1" },
        ],
        totalSize: 1, done: true,
      }), { headers: { "Content-Type": "application/json" } });
    }) as any;
  };

  test("stage filter includes only selected stages", async () => {
    mockFetch("Closed Won");
    const deals = await connector.fetchDeals("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth", clientId: "cid", clientSecret: "csec",
      _metadata: { stageFilter: ["Closed Won"] },
    } as any);
    expect(deals).toHaveLength(1);
  });

  test("stage filter excludes non-selected stages", async () => {
    mockFetch("Prospecting");
    const deals = await connector.fetchDeals("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth", clientId: "cid", clientSecret: "csec",
      _metadata: { stageFilter: ["Closed Won"] },
    } as any);
    expect(deals).toHaveLength(0);
  });

  test("empty stage filter includes all stages", async () => {
    mockFetch("Prospecting");
    const deals = await connector.fetchDeals("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth", clientId: "cid", clientSecret: "csec",
      _metadata: { stageFilter: [] },
    } as any);
    expect(deals).toHaveLength(1);
  });
});
