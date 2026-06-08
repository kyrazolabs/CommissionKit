import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { HubSpotClient } from "./client";

describe("HubSpotClient", () => {
  afterEach(() => { mock.restore(); });

  describe("exchangeCode", () => {
    test("exchanges code for tokens", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({
          access_token: "at-123",
          refresh_token: "rt-456",
          expires_in: 1800,
        }), { headers: { "Content-Type": "application/json" } });
      }) as any;

      const tokens = await HubSpotClient.exchangeCode("cid", "csecret", "https://example.com/cb", "auth-code");
      expect(tokens.accessToken).toBe("at-123");
      expect(tokens.refreshToken).toBe("rt-456");
      expect(tokens.expiresIn).toBe(1800);
    });

    test("throws on HTTP error", async () => {
      globalThis.fetch = (async () => {
        return new Response("Bad Request", { status: 400 });
      }) as any;

      await expect(
        HubSpotClient.exchangeCode("cid", "cs", "cb", "bad-code"),
      ).rejects.toThrow("HTTP 400");
    });
  });

  describe("auto token refresh", () => {
    test("refreshAccessToken calls the token endpoint", async () => {
      let refreshCalled = false;
      globalThis.fetch = (async () => {
        refreshCalled = true;
        return new Response(JSON.stringify({
          access_token: "new-at",
          refresh_token: "new-rt",
          expires_in: 1800,
        }), { headers: { "Content-Type": "application/json" } });
      }) as any;

      const client = new HubSpotClient("expired-at", "old-rt", "cid", "csecret");
      // Set token as already expired
      (client as any).tokenExpiresAt = 0;
      await client.refreshAccessToken();
      expect(refreshCalled).toBe(true);
    });

    test("throws when refresh credentials are missing", async () => {
      const client = new HubSpotClient("at");
      await expect(client.refreshAccessToken()).rejects.toThrow("Cannot refresh token");
    });
  });
});
