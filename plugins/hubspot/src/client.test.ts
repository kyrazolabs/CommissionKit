import { describe, test, expect, mock, afterEach } from "bun:test";
import { HubSpotClient } from "./client";

describe("HubSpotClient", () => {
  afterEach(() => { mock.restore(); });

  test("exchanges OAuth code for tokens (static method)", async () => {
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

  test("throws on OAuth code exchange error", async () => {
    globalThis.fetch = (async () => {
      return new Response("Bad Request", { status: 400 });
    }) as any;
    await expect(
      HubSpotClient.exchangeCode("cid", "cs", "cb", "bad-code"),
    ).rejects.toThrow("HTTP 400");
  });

  test("throws on API error", async () => {
    globalThis.fetch = (async () => {
      return new Response("Unauthorized", { status: 401 });
    }) as any;
    const client = new HubSpotClient("bad-token");
    await expect(client.getOwners()).rejects.toThrow("HTTP 401");
  });
});
