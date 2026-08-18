import { beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import { pluginRegistry } from "@workspace/plugins-core";
import { SalesforceConnector } from "@workspace/plugins-salesforce";

let updateOneMock: any;
let findOneAndUpdateMock: any;
let enqueueAuditEventMock: any;
let pluginInitMock: any;

mock.module("@workspace/queue", () => ({
  syncRepsQueue: { add: mock(() => Promise.resolve()) },
  syncDealsQueue: { add: mock(() => Promise.resolve()) },
  getRedisClient: () => ({}),
  enqueueAuditEvent: (...args: any[]) => enqueueAuditEventMock(...args),
}));

mock.module("@workspace/db", () => ({
  IntegrationConnection: {
    updateOne: (...args: any[]) => updateOneMock(...args),
    findOneAndUpdate: (...args: any[]) => findOneAndUpdateMock(...args),
  },
}));

const oauthMod: typeof import("./oauth") = {} as any;
const cryptoMod: typeof import("../crypto") = {} as any;

beforeAll(async () => {
  process.env.SESSION_SECRET = "test-session-secret-for-oauth";
  enqueueAuditEventMock = mock(() => Promise.resolve());
  pluginInitMock = mock(async () => {});
  pluginRegistry.register({ name: "hubspot", init: pluginInitMock } as any);
  Object.assign(oauthMod, await import("./oauth"));
  Object.assign(cryptoMod, await import("../crypto"));
});

beforeEach(() => {
  updateOneMock = mock(() => Promise.resolve());
  findOneAndUpdateMock = mock(() => Promise.resolve());
  pluginInitMock.mockClear();
  enqueueAuditEventMock.mockClear();
});

describe("OAuth state signing", () => {
  test("signState/verifyState round-trips", () => {
    const state = oauthMod.signState("ws-123", "hubspot");
    const parsed = oauthMod.verifyState(state);
    expect(parsed.workspaceId).toBe("ws-123");
    expect(parsed.connector).toBe("hubspot");
  });

  test("signState/verifyState round-trips a codeVerifier", () => {
    const state = oauthMod.signState("ws-123", "salesforce", "verifier-abc");
    const parsed = oauthMod.verifyState(state);
    expect(parsed.workspaceId).toBe("ws-123");
    expect(parsed.connector).toBe("salesforce");
    expect(parsed.codeVerifier).toBe("verifier-abc");
  });

  test("generateCodeVerifier/computeCodeChallenge are base64url", () => {
    const verifier = oauthMod.generateCodeVerifier();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    const challenge = oauthMod.computeCodeChallenge(verifier);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge.length).toBe(43);
  });

  test("verifyState rejects tampered state", () => {
    const state = oauthMod.signState("ws-123", "hubspot");
    const tampered = state.replace(/^ws-123/, "ws-999");
    expect(() => oauthMod.verifyState(tampered)).toThrow("Invalid OAuth state");
  });

  test("verifyState rejects tampered codeVerifier", () => {
    const state = oauthMod.signState("ws-123", "salesforce", "verifier-abc");
    const tampered = state.replace("verifier-abc", "verifier-zzz");
    expect(() => oauthMod.verifyState(tampered)).toThrow("Invalid OAuth state");
  });

  test("verifyState rejects garbage", () => {
    expect(() => oauthMod.verifyState("garbage")).toThrow("Invalid OAuth state");
  });
});

describe("ensureFreshConfig", () => {
  test("returns config untouched for non-oauth authType", async () => {
    const conn = {
      _id: "conn-1",
      workspaceId: "ws-1",
      connectorName: "hubspot",
      config: cryptoMod.encryptConfig({ authType: "token", accessToken: "x" }),
      metadata: { stageMapping: { a: "b" } },
    };
    const plugin = { refreshTokens: mock(async () => ({ accessToken: "new" })) };

    const result = await oauthMod.ensureFreshConfig(conn as any, plugin as any);
    expect(result.authType).toBe("token");
    expect(result.accessToken).toBe("x");
    expect(updateOneMock).not.toHaveBeenCalled();
  });

  test("refreshes when expired and persists new encrypted config", async () => {
    const conn = {
      _id: "conn-1",
      workspaceId: "ws-1",
      connectorName: "hubspot",
      config: cryptoMod.encryptConfig({
        authType: "oauth",
        accessToken: "old",
        refreshToken: "rt",
        expiresAt: Date.now() - 1000,
      }),
      metadata: {},
    };
    const plugin = {
      refreshTokens: mock(async () => ({
        accessToken: "new",
        refreshToken: "new-rt",
        expiresAt: Date.now() + 3_600_000,
      })),
    };

    const result = await oauthMod.ensureFreshConfig(conn as any, plugin as any);
    expect(result.accessToken).toBe("new");
    expect(plugin.refreshTokens).toHaveBeenCalled();
    expect(updateOneMock).toHaveBeenCalled();

    const [, update] = updateOneMock.mock.calls[0];
    const persisted = cryptoMod.decryptConfig(update.config);
    expect(persisted?.accessToken).toBe("new");
    expect(persisted?.refreshToken).toBe("new-rt");
  });

  test("does not refresh when token is still fresh", async () => {
    const conn = {
      _id: "conn-1",
      workspaceId: "ws-1",
      connectorName: "hubspot",
      config: cryptoMod.encryptConfig({
        authType: "oauth",
        accessToken: "current",
        refreshToken: "rt",
        expiresAt: Date.now() + 3_600_000,
      }),
      metadata: {},
    };
    const plugin = { refreshTokens: mock(async () => ({ accessToken: "new" })) };

    const result = await oauthMod.ensureFreshConfig(conn as any, plugin as any);
    expect(result.accessToken).toBe("current");
    expect(plugin.refreshTokens).not.toHaveBeenCalled();
    expect(updateOneMock).not.toHaveBeenCalled();
  });

  test("returns manual oauth config untouched when no refreshToken is present", async () => {
    const conn = {
      _id: "conn-1",
      workspaceId: "ws-1",
      connectorName: "salesforce",
      config: cryptoMod.encryptConfig({
        authType: "oauth",
        clientId: "cid",
        clientSecret: "csec",
        username: "u@example.com",
        password: "pw",
        securityToken: "tok",
        instanceUrl: "https://x.my.salesforce.com",
      }),
      metadata: {},
    };
    const plugin = { refreshTokens: mock(async () => ({ accessToken: "new" })) };

    const result = await oauthMod.ensureFreshConfig(conn as any, plugin as any);
    expect(result.authType).toBe("oauth");
    expect(result.clientId).toBe("cid");
    expect(result.clientSecret).toBe("csec");
    expect(result.refreshToken).toBeUndefined();
    expect(plugin.refreshTokens).not.toHaveBeenCalled();
    expect(updateOneMock).not.toHaveBeenCalled();
  });

  test("returns non-oauth bearer config untouched", async () => {
    const conn = {
      _id: "conn-1",
      workspaceId: "ws-1",
      connectorName: "custom",
      config: cryptoMod.encryptConfig({ authType: "bearer", token: "t" }),
      metadata: {},
    };
    const plugin = { refreshTokens: mock(async () => ({ accessToken: "new" })) };

    const result = await oauthMod.ensureFreshConfig(conn as any, plugin as any);
    expect(result.authType).toBe("bearer");
    expect(result.token).toBe("t");
    expect(plugin.refreshTokens).not.toHaveBeenCalled();
    expect(updateOneMock).not.toHaveBeenCalled();
  });

  test("throws when oauth token expired and plugin has no refreshTokens", async () => {
    const conn = {
      _id: "conn-1",
      workspaceId: "ws-1",
      connectorName: "salesforce",
      config: cryptoMod.encryptConfig({
        authType: "oauth",
        accessToken: "old",
        refreshToken: "rt",
        expiresAt: Date.now() - 1000,
      }),
      metadata: {},
    };
    const plugin = {}; // no refreshTokens

    await expect(oauthMod.ensureFreshConfig(conn as any, plugin as any)).rejects.toThrow(
      "Connector does not support token refresh",
    );
    expect(updateOneMock).not.toHaveBeenCalled();
  });
});

describe("worker call sequence (manual Salesforce connection)", () => {
  test("ensureFreshConfig does not throw and fetchReps proceeds for a manual config", async () => {
    const connector = new SalesforceConnector();

    globalThis.fetch = mock(async (url: string, init?: RequestInit) => {
      const urlStr = String(url);
      if (urlStr.includes("oauth2/token")) {
        return new Response(
          JSON.stringify({
            access_token: "authed-token",
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
    });

    const conn = {
      _id: "conn-1",
      workspaceId: "ws-1",
      connectorName: "salesforce",
      config: cryptoMod.encryptConfig({
        authType: "oauth",
        clientId: "cid",
        clientSecret: "csec",
        username: "u@example.com",
        password: "pw",
        securityToken: "tok",
        instanceUrl: "https://x.my.salesforce.com",
      }),
      metadata: {},
    };

    // Mirrors sync-reps-worker.ts lines 53-59.
    const pluginConfig = await oauthMod.ensureFreshConfig(conn as any, connector as any);
    expect(pluginConfig.clientId).toBe("cid");
    expect(pluginConfig.refreshToken).toBeUndefined();
    expect(updateOneMock).not.toHaveBeenCalled();

    const reps = await connector.fetchReps("ws-1", pluginConfig, {});
    expect(reps).toHaveLength(1);
    expect(reps[0].name).toBe("Alice");
  });
});

describe("buildOAuthStartUrl", () => {
  beforeEach(() => {
    process.env.HUBSPOT_CLIENT_ID = "hs-cid";
    process.env.SALESFORCE_CLIENT_ID = "sf-cid";
  });

  test("builds hubspot authorize URL", () => {
    const url = oauthMod.buildOAuthStartUrl("hubspot", "https://x/cb", "st");
    expect(url).toContain("https://app.hubspot.com/oauth/authorize?");
    expect(url).toContain("client_id=hs-cid");
  });

  test("builds salesforce authorize URL", () => {
    const url = oauthMod.buildOAuthStartUrl("salesforce", "https://x/cb", "st");
    expect(url).toContain("https://login.salesforce.com/services/oauth2/authorize?");
    expect(url).toContain("client_id=sf-cid");
  });

  test("throws for unknown connector", () => {
    expect(() => oauthMod.buildOAuthStartUrl("nope", "https://x/cb", "st")).toThrow(
      "Unknown OAuth connector",
    );
  });
});

describe("handleOAuthCallback", () => {
  beforeEach(() => {
    process.env.HUBSPOT_CLIENT_ID = "hs-cid";
    process.env.HUBSPOT_CLIENT_SECRET = "hs-secret";
  });

  test("exchanges code and persists oauth connection", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({ access_token: "at", refresh_token: "rt", expires_in: 1800 }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
    );

    const state = oauthMod.signState("ws-1", "hubspot");
    await oauthMod.handleOAuthCallback("hubspot", "code123", state, "https://x/cb");

    expect(findOneAndUpdateMock).toHaveBeenCalled();
    const [filter, update] = findOneAndUpdateMock.mock.calls[0];
    expect(filter.connectorName).toBe("hubspot");
    const persisted = cryptoMod.decryptConfig(update.config);
    expect(persisted?.authType).toBe("oauth");
    expect(persisted?.accessToken).toBe("at");
    expect(persisted?.refreshToken).toBe("rt");
    expect(update.status).toBe("connected");
  });

  test("rejects invalid state", async () => {
    await expect(
      oauthMod.handleOAuthCallback("hubspot", "code", "bad-state", "https://x/cb"),
    ).rejects.toThrow("Invalid OAuth state");
  });

  test("calls plugin.init and writes an audit event", async () => {
    globalThis.fetch = mock(
      async () =>
        new Response(
          JSON.stringify({ access_token: "at", refresh_token: "rt", expires_in: 1800 }),
          {
            headers: { "Content-Type": "application/json" },
          },
        ),
    );

    const state = oauthMod.signState("ws-1", "hubspot");
    await oauthMod.handleOAuthCallback("hubspot", "code123", state, "https://x/cb");

    expect(pluginInitMock).toHaveBeenCalled();
    expect(enqueueAuditEventMock).toHaveBeenCalled();

    const payload = enqueueAuditEventMock.mock.calls[0][0];
    expect(payload.action).toBe("integration_connected");
    expect(payload.resourceType).toBe("integration");
    expect(payload.workspaceId).toBe("ws-1");
    expect(payload.metadata).toEqual({ connectorName: "hubspot", viaOAuth: true });
  });
});
