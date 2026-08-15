import { describe, test, expect, mock, afterEach } from "bun:test";
import { HubSpotClient } from "./client";

describe("HubSpotClient", () => {
  afterEach(() => { mock.restore(); });

  test("exchanges OAuth code for tokens (static method)", async () => {
    let capturedUrl = "";
    globalThis.fetch = mock(async (url: any) => {
      capturedUrl = String(url);
      return new Response(JSON.stringify({
        access_token: "at-123",
        refresh_token: "rt-456",
        expires_in: 1800,
      }), { headers: { "Content-Type": "application/json" } });
    });

    const tokens = await HubSpotClient.exchangeCode("cid", "csecret", "https://example.com/cb", "auth-code");
    expect(capturedUrl).toBe("https://api.hubapi.com/oauth/v3/token");
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

  test("refreshAccessToken posts a refresh_token grant", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedBody = String(init?.body || "");
      return new Response(JSON.stringify({
        access_token: "new-at",
        refresh_token: "new-rt",
        expires_in: 1800,
      }), { headers: { "Content-Type": "application/json" } });
    });
    const res = await HubSpotClient.refreshAccessToken("cid", "csec", "rt-old");
    expect(capturedUrl).toBe("https://api.hubapi.com/oauth/v3/token");
    expect(capturedBody).toContain("grant_type=refresh_token");
    expect(capturedBody).toContain("refresh_token=rt-old");
    expect(res.accessToken).toBe("new-at");
    expect(res.refreshToken).toBe("new-rt");
    expect(res.expiresIn).toBe(1800);
  });

  test("buildAuthorizeUrl encodes the OAuth params", () => {
    const url = HubSpotClient.buildAuthorizeUrl("cid", "https://x/cb", "st");
    expect(url).toContain("https://app.hubspot.com/oauth/authorize?");
    expect(url).toContain("response_type=code");
    expect(url).toContain("scope=crm.objects.owners.read%20crm.objects.deals.read");
    expect(url).toContain("client_id=cid");
    expect(url).toContain("state=st");
  });
});
