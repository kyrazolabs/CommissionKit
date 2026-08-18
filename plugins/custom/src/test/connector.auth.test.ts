import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { CustomConnector } from "../connector";
import { mockFetchSingle, originalFetch } from "./setup";

describe("CustomConnector — auth headers", () => {
  let connector: CustomConnector;
  beforeEach(() => {
    connector = new CustomConnector();
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe("bearer token", () => {
    test("sends Authorization: Bearer header", async () => {
      let headers: Record<string, string> = {};
      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        headers = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      };
      await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "sk-abc123" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      expect(headers).toHaveProperty("Authorization", "Bearer sk-abc123");
    });

    test("sends empty string token", async () => {
      let headers: Record<string, string> = {};
      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        headers = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      };
      await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      expect(headers).toHaveProperty("Authorization", "Bearer ");
    });
  });

  describe("API key", () => {
    test("sends custom header with API key", async () => {
      let headers: Record<string, string> = {};
      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        headers = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      };
      await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "apiKey", headerName: "X-API-Key", apiKey: "key-secret" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      expect(headers).toHaveProperty("X-API-Key", "key-secret");
      expect(headers).not.toHaveProperty("Authorization");
    });

    test("uses default header name when not specified", async () => {
      let headers: Record<string, string> = {};
      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        headers = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      };
      // Schema default is "X-API-Key" — but config must pass explicitly
      await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "apiKey", headerName: "X-API-Key", apiKey: "def-key" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      expect(headers).toHaveProperty("X-API-Key", "def-key");
    });
  });

  describe("basic auth", () => {
    test("sends Authorization: Basic header", async () => {
      let headers: Record<string, string> = {};
      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        headers = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      };
      await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "basic", username: "admin", password: "secret" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      expect(headers).toHaveProperty("Authorization");
      expect(headers.Authorization).toStartWith("Basic ");
      // Base64 of "admin:secret"
      const encoded = Buffer.from("admin:secret").toString("base64");
      expect(headers.Authorization).toBe(`Basic ${encoded}`);
    });

    test("encodes special characters in basic auth", async () => {
      let headers: Record<string, string> = {};
      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        headers = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      };
      await connector.fetchReps("ws", {
        baseUrl: "https://api.example.com",
        auth: { type: "basic", username: "user@domain.com", password: "p@ss:word" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      const encoded = Buffer.from("user@domain.com:p@ss:word").toString("base64");
      expect(headers.Authorization).toBe(`Basic ${encoded}`);
    });
  });

  describe("mixed auth types across workspaces", () => {
    test("different workspaces can use different auth", async () => {
      let capturedHeaders: Record<string, string> = {};
      globalThis.fetch = async (_url: string | URL | Request, init?: RequestInit) => {
        capturedHeaders = (init?.headers as Record<string, string>) || {};
        return new Response(JSON.stringify([]), {
          headers: { "Content-Type": "application/json" },
        });
      };
      // First call with bearer
      await connector.fetchReps("ws-1", {
        baseUrl: "https://api.example.com",
        auth: { type: "bearer", token: "tok1" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      expect(capturedHeaders).toHaveProperty("Authorization", "Bearer tok1");

      // Second call with API key
      await connector.fetchReps("ws-2", {
        baseUrl: "https://api.example.com",
        auth: { type: "apiKey", headerName: "X-Key", apiKey: "key2" },
        entities: { reps: { enabled: true, endpoint: "/users" } },
      });
      expect(capturedHeaders).toHaveProperty("X-Key", "key2");
    });
  });
});
