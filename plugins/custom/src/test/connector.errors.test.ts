import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { CustomConnector } from "../connector";
import { originalFetch } from "./setup";

describe("CustomConnector — error handling", () => {
  let connector: CustomConnector;
  beforeEach(() => { connector = new CustomConnector(); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  const baseReps = {
    baseUrl: "https://api.example.com", auth: { type: "bearer" as const, token: "t" },
    entities: { reps: { enabled: true, endpoint: "/users", fields: { externalId: "id", name: "name", email: "id" } } },
  };

  describe("HTTP errors", () => {
    test("HTTP 500 — throws after retries", async () => {
      globalThis.fetch = (() => Promise.resolve(new Response("Internal Error", { status: 500 })));
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow();
    }, 15000);

    test("HTTP 502 — throws after retries", async () => {
      globalThis.fetch = (() => Promise.resolve(new Response("Bad Gateway", { status: 502 })));
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow();
    }, 15000);

    test("HTTP 429 — throws after retries", async () => {
      globalThis.fetch = (() => Promise.resolve(new Response("Rate Limited", { status: 429 })));
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow();
    }, 15000);
  });

  describe("network errors", () => {
    test("connection refused — throws after retries", async () => {
      globalThis.fetch = (() => Promise.reject(new Error("Connection refused")));
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow("Connection refused");
    }, 15000);

    test("DNS resolution failure — throws after retries", async () => {
      globalThis.fetch = (() => Promise.reject(new Error("ENOTFOUND")));
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow("ENOTFOUND");
    }, 15000);

    test("timeout — throws after retries", async () => {
      globalThis.fetch = (() => Promise.reject(new Error("The operation was aborted")));
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow();
    }, 15000);
  });

  describe("malformed responses", () => {
    test("response is not JSON — throws", async () => {
      globalThis.fetch = (() => Promise.resolve(new Response("not json", {
        status: 200, headers: { "Content-Type": "text/plain" },
      })));
      // PluginHttpClient will try to parse JSON and fail
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow();
    }, 15000);

    test("response is HTML error page", async () => {
      globalThis.fetch = (async () => {
        return new Response("<html>Error 500</html>", {
          status: 500, headers: { "Content-Type": "text/html" },
        });
      }) as any;
      await expect(connector.fetchReps("ws", baseReps)).rejects.toThrow();
    }, 15000);
  });

  describe("webhooks", () => {
    test("parseWebhook returns empty array for any payload", () => {
      expect(connector.parseWebhook({ type: "deal.created" })).toEqual([]);
      expect(connector.parseWebhook(null)).toEqual([]);
      expect(connector.parseWebhook({})).toEqual([]);
    });

    test("verifyWebhook resolves silently", async () => {
      await expect(connector.verifyWebhook(
        { method: "POST", path: "/wh", headers: {}, body: {}, rawBody: Buffer.from("") }, "s",
      )).resolves.toBeUndefined();
    });
  });
});
