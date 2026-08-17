import { describe, expect, mock, test } from "bun:test";
import { getAuthHeaders } from "./auth";
import type { AuthConfig } from "./config-parser";

describe("getAuthHeaders", () => {
  test("apiKey auth returns custom header", () => {
    const config: AuthConfig = { type: "apiKey", headerName: "X-API-Key", apiKey: "my-key" };
    expect(getAuthHeaders(config)).toEqual({ "X-API-Key": "my-key" });
  });

  test("bearer auth returns Authorization header", () => {
    const config: AuthConfig = { type: "bearer", token: "tok-123" };
    expect(getAuthHeaders(config)).toEqual({ Authorization: "Bearer tok-123" });
  });

  test("basic auth returns base64-encoded credentials", () => {
    const config: AuthConfig = { type: "basic", username: "user", password: "pass" };
    const headers = getAuthHeaders(config);
    const expected = `Basic ${Buffer.from("user:pass").toString("base64")}`;
    expect(headers).toEqual({ Authorization: expected });
  });

  test("oauth2 returns empty headers (token fetched at init)", () => {
    const config: AuthConfig = {
      type: "oauth2",
      tokenUrl: "https://auth.example.com/token",
      clientId: "cid",
      clientSecret: "cs",
    };
    expect(getAuthHeaders(config)).toEqual({});
  });

  test("default returns empty headers", () => {
    const config: AuthConfig = { type: "apiKey", headerName: "X-Key", apiKey: "k" };
    const headers = getAuthHeaders(config);
    expect(headers).toEqual({ "X-Key": "k" });
  });
});
