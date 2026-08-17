import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSingle, originalFetch } from "./setup";

describe("CustomConnector — config parsing", () => {
  let connector: CustomConnector;
  beforeEach(() => {
    connector = new CustomConnector();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("testConnection", () => {
    test("success with valid bearer config", async () => {
      mockFetchSingle({ ok: true }, 200);
      const r = await connector.testConnection({
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
      });
      expect(r.success).toBe(true);
      expect(r.message).toBe("Successfully connected");
      expect(r.details?.endpoint).toBe("https://api.example.com");
      expect(typeof r.details?.latency).toBe("number");
    });

    test("failure with missing baseUrl", async () => {
      const r = await connector.testConnection({ auth: { type: "bearer", token: "t" } });
      expect(r.success).toBe(false);
      expect(r.message).toContain("Invalid config");
    });

    test("failure with missing auth", async () => {
      const r = await connector.testConnection({ baseUrl: "https://api.example.com" });
      expect(r.success).toBe(false);
      expect(r.message).toContain("Invalid config");
    });

    test("failure with invalid baseUrl (not a URL)", async () => {
      const r = await connector.testConnection({
        baseUrl: "not-a-url",
        auth: { type: "bearer", token: "t" },
      });
      expect(r.success).toBe(false);
    });

    test("failure with empty config", async () => {
      const r = await connector.testConnection({});
      expect(r.success).toBe(false);
    });

    test("failure with HTTP 404", async () => {
      mockFetchSingle({}, 404);
      const r = await connector.testConnection({
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
      });
      expect(r.success).toBe(false);
      expect(r.message).toContain("HTTP 404");
    });

    test("failure with HTTP 403", async () => {
      mockFetchSingle({}, 403);
      const r = await connector.testConnection({
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
      });
      expect(r.success).toBe(false);
      expect(r.message).toContain("HTTP 403");
    });

    test("failure with network error", async () => {
      globalThis.fetch = () => Promise.reject(new Error("Connection refused"));
      const r = await connector.testConnection({
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
      });
      expect(r.success).toBe(false);
      expect(r.message).toContain("Connection refused");
    });
  });

  describe("fetchReps — invalid config", () => {
    test("returns [] for missing baseUrl", async () => {
      const r = await connector.fetchReps("ws", { auth: { type: "bearer", token: "t" } });
      expect(r).toEqual([]);
    });

    test("returns [] for invalid baseUrl", async () => {
      const r = await connector.fetchReps("ws", {
        baseUrl: "ftp://bad",
        auth: { type: "bearer", token: "t" },
      });
      expect(r).toEqual([]);
    });

    test("returns [] for empty config", async () => {
      const r = await connector.fetchReps("ws", {});
      expect(r).toEqual([]);
    });
  });

  describe("fetchDeals — invalid config", () => {
    test("returns [] for missing auth", async () => {
      const r = await connector.fetchDeals("ws", { baseUrl: "https://api.example.com" });
      expect(r).toEqual([]);
    });

    test("returns [] for completely empty config", async () => {
      const r = await connector.fetchDeals("ws", {});
      expect(r).toEqual([]);
    });
  });

  describe("disabled entities", () => {
    test("fetchReps returns [] when reps.enabled is false", async () => {
      const r = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
        entities: { reps: { enabled: false, endpoint: "/users" } },
      });
      expect(r).toEqual([]);
    });

    test("fetchDeals returns [] when deals.enabled is false", async () => {
      const r = await connector.fetchDeals("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
        entities: { deals: { enabled: false, endpoint: "/orders" } },
      });
      expect(r).toEqual([]);
    });

    test("fetchReps returns [] when reps entity is missing entirely", async () => {
      const r = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
        entities: {},
      });
      expect(r).toEqual([]);
    });

    test("fetchReps returns [] when entities is missing entirely", async () => {
      mockFetchSingle([]);
      const r = await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "t" },
      });
      expect(r).toEqual([]);
    });
  });
});
