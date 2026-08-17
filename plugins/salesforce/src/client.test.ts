import { afterEach, describe, expect, mock, test } from "bun:test";
import { SalesforceClient } from "./client";

describe("SalesforceClient OAuth (web-server flow)", () => {
  afterEach(() => {
    mock.restore();
  });

  test("buildAuthorizeUrl encodes the OAuth params", () => {
    const url = SalesforceClient.buildAuthorizeUrl(
      "https://login.salesforce.com",
      "cid",
      "https://x/cb",
      "st",
    );
    expect(url).toContain("https://login.salesforce.com/services/oauth2/authorize?");
    expect(url).toContain("response_type=code");
    expect(url).toContain("scope=api%20refresh_token");
    expect(url).toContain("client_id=cid");
    expect(url).toContain("state=st");
  });

  test("buildAuthorizeUrl uses test.salesforce.com for sandbox instance", () => {
    const url = SalesforceClient.buildAuthorizeUrl(
      "https://mysb.test.salesforce.com",
      "cid",
      "https://x/cb",
      "st",
    );
    expect(url).toContain("https://test.salesforce.com/services/oauth2/authorize?");
  });

  test("buildAuthorizeUrl includes PKCE params when codeChallenge is provided", () => {
    const url = SalesforceClient.buildAuthorizeUrl(
      "https://login.salesforce.com",
      "cid",
      "https://x/cb",
      "st",
      "challenge",
    );
    expect(url).toContain("code_challenge=challenge");
    expect(url).toContain("code_challenge_method=S256");
  });

  test("buildAuthorizeUrl omits PKCE params when no codeChallenge", () => {
    const url = SalesforceClient.buildAuthorizeUrl(
      "https://login.salesforce.com",
      "cid",
      "https://x/cb",
      "st",
    );
    expect(url).not.toContain("code_challenge");
  });

  test("exchangeCode posts authorization_code grant and returns instance_url", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedBody = String(init?.body || "");
      return new Response(
        JSON.stringify({
          access_token: "at",
          refresh_token: "rt",
          instance_url: "https://x.my.salesforce.com",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    });
    const res = await SalesforceClient.exchangeCode(
      "https://login.salesforce.com",
      "cid",
      "csec",
      "https://x/cb",
      "code123",
    );
    expect(capturedUrl).toBe("https://login.salesforce.com/services/oauth2/token");
    expect(capturedBody).toContain("grant_type=authorization_code");
    expect(capturedBody).toContain("code=code123");
    expect(res.accessToken).toBe("at");
    expect(res.refreshToken).toBe("rt");
    expect(res.instanceUrl).toBe("https://x.my.salesforce.com");
  });

  test("exchangeCode includes code_verifier when provided", async () => {
    let capturedBody = "";
    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedBody = String(init?.body || "");
      return new Response(
        JSON.stringify({
          access_token: "at",
          refresh_token: "rt",
          instance_url: "https://x.my.salesforce.com",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    });
    await SalesforceClient.exchangeCode(
      "https://login.salesforce.com",
      "cid",
      "csec",
      "https://x/cb",
      "code123",
      "verifier",
    );
    expect(capturedBody).toContain("code_verifier=verifier");
    expect(capturedBody).toContain("code=code123");
  });

  test("refreshAccessToken posts refresh_token grant", async () => {
    let capturedUrl = "";
    let capturedBody = "";
    globalThis.fetch = mock(async (url: any, init: any) => {
      capturedUrl = String(url);
      capturedBody = String(init?.body || "");
      return new Response(
        JSON.stringify({
          access_token: "new-at",
          refresh_token: "new-rt",
          expires_in: 7200,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    });
    const res = await SalesforceClient.refreshAccessToken(
      "https://x.my.salesforce.com",
      "cid",
      "csec",
      "rt-old",
    );
    expect(capturedUrl).toBe("https://x.my.salesforce.com/services/oauth2/token");
    expect(capturedBody).toContain("grant_type=refresh_token");
    expect(capturedBody).toContain("refresh_token=rt-old");
    expect(res.accessToken).toBe("new-at");
    expect(res.refreshToken).toBe("new-rt");
    expect(res.expiresIn).toBe(7200);
  });
});
