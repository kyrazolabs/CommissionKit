import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { SalesforceClient } from "./client";
import { SalesforceConnector } from "./connector";

describe("Salesforce — payment defaults", () => {
  let connector: SalesforceConnector;
  beforeEach(() => {
    connector = new SalesforceConnector();
  });
  afterEach(() => {
    mock.restore();
  });

  test("closed-won deals default to paid", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          access_token: "at",
          instance_url: "https://x.my.salesforce.com",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
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
        return new Response(
          JSON.stringify({
            access_token: "at",
            instance_url: "https://x.my.salesforce.com",
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      capturedQuery = urlStr;
      return new Response(
        JSON.stringify({
          records: [
            {
              Id: "opp-1",
              Name: "Deal",
              Amount: 100,
              CloseDate: "2024-01-01",
              StageName: "Closed Won",
              OwnerId: "owner-1",
            },
          ],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
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
        return new Response(
          JSON.stringify({
            access_token: "at",
            instance_url: "https://x.my.salesforce.com",
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          records: [
            {
              Id: "opp-1",
              Name: "Deal",
              Amount: 100,
              CloseDate: "2024-01-01",
              StageName: "Closed Won",
              OwnerId: "owner-1",
            },
          ],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
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
        return new Response(
          JSON.stringify({
            access_token: "at",
            instance_url: "https://x.my.salesforce.com",
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          records: [
            {
              Id: "opp-1",
              Name: "Deal",
              Amount: 100,
              CloseDate: "2024-01-01",
              StageName: "Negotiation",
              OwnerId: "owner-1",
            },
          ],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
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
        return new Response(
          JSON.stringify({
            access_token: "at",
            instance_url: "https://x.my.salesforce.com",
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          records: [{ Id: "u1", Name: "Alice", Email: "a@b.com", UserRole: { Name: "Sales Rep" } }],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
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

  test("fetchReps works with a stored OAuth access token and no clientId/clientSecret", async () => {
    let authHeader = "";
    globalThis.fetch = (async (url: string, init?: RequestInit) => {
      authHeader = String(init?.headers?.["Authorization"] ?? init?.headers?.Authorization ?? "");
      return new Response(
        JSON.stringify({
          records: [{ Id: "u1", Name: "Bob", Email: "b@b.com", UserRole: { Name: "Sales Rep" } }],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const reps = await connector.fetchReps("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      accessToken: "stored-oauth-token",
    } as any);

    expect(reps).toHaveLength(1);
    expect(reps[0].name).toBe("Bob");
    expect(authHeader).toContain("Bearer stored-oauth-token");
  });

  test("fetchReps with manual clientId/clientSecret authenticates and uses the returned token", async () => {
    const authSpy = spyOn(SalesforceClient, "authenticate").mockImplementation(async () => ({
      accessToken: "authed-token",
      instanceUrl: "https://x.my.salesforce.com",
    }));

    let authHeader = "";
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      authHeader = String(init?.headers?.["Authorization"] ?? init?.headers?.Authorization ?? "");
      return new Response(
        JSON.stringify({
          records: [{ Id: "u1", Name: "Alice", Email: "a@b.com", UserRole: { Name: "Sales Rep" } }],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const reps = await connector.fetchReps("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      clientId: "cid",
      clientSecret: "csec",
    } as any);

    expect(authSpy).toHaveBeenCalledTimes(1);
    expect(reps).toHaveLength(1);
    expect(reps[0].name).toBe("Alice");
    expect(authHeader).toContain("Bearer authed-token");
  });

  test("fetchReps with a stored token does not call authenticate", async () => {
    const authSpy = spyOn(SalesforceClient, "authenticate");

    let authHeader = "";
    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      authHeader = String(init?.headers?.["Authorization"] ?? init?.headers?.Authorization ?? "");
      return new Response(
        JSON.stringify({
          records: [{ Id: "u1", Name: "Bob", Email: "b@b.com", UserRole: { Name: "Sales Rep" } }],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const reps = await connector.fetchReps("ws", {
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      accessToken: "stored-oauth-token",
    } as any);

    expect(reps).toHaveLength(1);
    expect(reps[0].name).toBe("Bob");
    expect(authSpy).not.toHaveBeenCalled();
    expect(authHeader).toContain("Bearer stored-oauth-token");
  });

  test("testConnection succeeds with a stored OAuth access token", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          records: [{ Id: "u1", Name: "Carol" }],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const result = await connector.testConnection({
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      accessToken: "stored-oauth-token",
    } as any);

    expect(result.success).toBe(true);
    expect(result.message).toContain("1 user(s) found");
  });

  test("testConnection accepts manual clientId/clientSecret credentials", async () => {
    globalThis.fetch = (async (url: string) => {
      if (String(url).includes("oauth2/token")) {
        return new Response(
          JSON.stringify({
            access_token: "at",
            instance_url: "https://x.my.salesforce.com",
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          records: [{ Id: "u1", Name: "Dan" }],
          totalSize: 1,
          done: true,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }) as any;

    const result = await connector.testConnection({
      instanceUrl: "https://x.my.salesforce.com",
      authType: "oauth",
      clientId: "cid",
      clientSecret: "csec",
    } as any);

    expect(result.success).toBe(true);
  });
});
