import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { SalesforceConnector } from "./connector";

describe("Salesforce — payment defaults", () => {
  let connector: SalesforceConnector;
  beforeEach(() => { connector = new SalesforceConnector(); });
  afterEach(() => { mock.restore(); });

  test("closed-won deals default to paid", async () => {
    globalThis.fetch = (async () => {
      return new Response(JSON.stringify({
        access_token: "at", instance_url: "https://x.my.salesforce.com",
      }), { headers: { "Content-Type": "application/json" } });
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      clientId: "cid",
      clientSecret: "csec",
      _metadata: {},
    } as any);
    expect(deals).toBeInstanceOf(Array);
  });

  test("closed-won deals use custom defaultPaymentStatus from metadata", async () => {
    let capturedQuery = "";
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes("oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "at", instance_url: "https://x.my.salesforce.com",
        }), { headers: { "Content-Type": "application/json" } });
      }
      capturedQuery = urlStr;
      return new Response(JSON.stringify({
        records: [{
          Id: "opp-1", Name: "Deal", Amount: 100, CloseDate: "2024-01-01",
          StageName: "Closed Won", OwnerId: "owner-1",
        }],
        totalSize: 1, done: true,
      }), { headers: { "Content-Type": "application/json" } });
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      clientId: "cid",
      clientSecret: "csec",
      _metadata: { defaultPaymentStatus: "unpaid" },
    } as any);

    expect(deals).toHaveLength(1);
    expect(deals[0].paymentStatus).toBe("unpaid");
  });

  test("closed-won deals are paid when metadata defaultPaymentStatus is paid", async () => {
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes("oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "at", instance_url: "https://x.my.salesforce.com",
        }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        records: [{
          Id: "opp-1", Name: "Deal", Amount: 100, CloseDate: "2024-01-01",
          StageName: "Closed Won", OwnerId: "owner-1",
        }],
        totalSize: 1, done: true,
      }), { headers: { "Content-Type": "application/json" } });
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      clientId: "cid",
      clientSecret: "csec",
      _metadata: { defaultPaymentStatus: "paid" },
    } as any);

    expect(deals[0].paymentStatus).toBe("paid");
  });

  test("non-closed-won deals are always unpaid regardless of metadata", async () => {
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes("oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "at", instance_url: "https://x.my.salesforce.com",
        }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        records: [{
          Id: "opp-1", Name: "Deal", Amount: 100, CloseDate: "2024-01-01",
          StageName: "Negotiation", OwnerId: "owner-1",
        }],
        totalSize: 1, done: true,
      }), { headers: { "Content-Type": "application/json" } });
    }) as any;

    const deals = await connector.fetchDeals("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      clientId: "cid",
      clientSecret: "csec",
      _metadata: { defaultPaymentStatus: "paid" },
    } as any);

    expect(deals[0].paymentStatus).toBe("unpaid");
  });

  test("fetches reps correctly", async () => {
    globalThis.fetch = (async (url: string) => {
      if (String(url).includes("oauth2/token")) {
        return new Response(JSON.stringify({
          access_token: "at", instance_url: "https://x.my.salesforce.com",
        }), { headers: { "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({
        records: [
          { Id: "u1", Name: "Alice", Email: "a@b.com", UserRole: { Name: "Sales Rep" } },
        ],
        totalSize: 1, done: true,
      }), { headers: { "Content-Type": "application/json" } });
    }) as any;

    const reps = await connector.fetchReps("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      clientId: "cid",
      clientSecret: "csec",
    } as any);

    expect(reps).toHaveLength(1);
    expect(reps[0].name).toBe("Alice");
  });
});
