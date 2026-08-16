import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import { setupTestDB, teardownTestDB, clearCollections } from "../../../test/setup-db";
import request from "supertest";

const TEST_USER_ID = "test-user-001";
const TEST_USER_EMAIL = "admin@test.com";

// ── Mock heavy dependencies BEFORE importing app ──────────────────────────────
mock.module("@workspace/queue", () => ({
  getRedisClient: () => ({
    get: async () => null,
    setex: async () => "OK",
    del: async () => 1,
    scan: async () => ["0", []],
    on: () => {},
    quit: async () => "OK",
  }),
  sendHighPriorityEmail: () => Promise.resolve(),
  sendMediumPriorityEmail: () => Promise.resolve(),
  sendLowPriorityEmail: () => Promise.resolve(),
  enqueueEmail: () => Promise.resolve(),
  enqueueCommissionCalc: () => Promise.resolve(),
  enqueueExchangeRateSync: () => Promise.resolve(),
  enqueueLogsFlush: () => Promise.resolve(),
  enqueueAuditEvent: () => Promise.resolve(),
  fetchAndSaveRates: () => Promise.resolve(),
  closeRedis: () => Promise.resolve(),
  mailHighQueue: { add: () => Promise.resolve() },
  mailMediumQueue: { add: () => Promise.resolve() },
  mailLowQueue: { add: () => Promise.resolve() },
  mailSendQueue: { add: () => Promise.resolve() },
  commissionCalcQueue: { add: () => Promise.resolve() },
  logsFlushQueue: { add: () => Promise.resolve() },
  syncRepsQueue: { add: () => Promise.resolve(), removeRepeatable: () => Promise.resolve() },
  syncDealsQueue: { add: () => Promise.resolve(), removeRepeatable: () => Promise.resolve() },
  webhookIngressQueue: { add: () => Promise.resolve() },
  syncEgressQueue: { add: () => Promise.resolve() },
  auditLogQueue: { add: () => Promise.resolve() },
  PRIORITY_QUEUE_MAP: { high: { add: () => Promise.resolve() }, medium: { add: () => Promise.resolve() }, low: { add: () => Promise.resolve() } },
}));

mock.module("../../lib/auth", () => ({
  auth: {
    handler: (req: any, res: any, next: any) => next(),
    api: { getSession: mock(() => Promise.resolve(null)) },
  },
  findUserById: mock(() => Promise.resolve({ id: "u1", email: "admin@test.com", name: "Admin" })),
}));

mock.module("../../lib/bull-board", () => ({
  secureBullBoard: (req: any, res: any, next: any) => next(),
  serverAdapter: { getRouter: () => ((() => {}) as any) },
}));

mock.module("stripe", () => ({
  default: class StripeMock {
    constructor() {}
    subscriptions = { create: () => Promise.resolve({ id: "sub_123", status: "active" }) };
    checkout = { sessions: { create: () => Promise.resolve({ url: "https://checkout.stripe.com/test", id: "cs_test" }) } };
    webhooks = { constructEvent: () => ({ type: "checkout.session.completed" }) };
  },
}));

mock.module("../../lib/rbac", () => ({
  getUserPermissions: mock(() => Promise.resolve(new Set(["*"]))),
  hasPermission: mock(() => true),
  invalidateUserPermissions: mock(() => Promise.resolve()),
  invalidateWorkspaceRoles: mock(() => Promise.resolve()),
  getUsersWithPermission: mock(() => Promise.resolve([])),
}));

let app: any;
let Workspace: any;
let WorkspaceMember: any;
let IntegrationConnection: any;
let pluginRegistry: any;
let encryptConfig: any;
let decryptConfig: any;
let signState: any;
let workspaceId: string;

beforeAll(async () => {
  await setupTestDB();
  process.env.SESSION_SECRET = "test-session-secret-for-oauth";
  process.env.REDIS_URL = "redis://localhost:6379";
  process.env.BETTER_AUTH_SECRET = "test-secret-that-is-long-enough-for-testing";
  process.env.BETTER_AUTH_URL = "http://localhost:8088";
  process.env.APP_URL = "http://localhost:3000";
  process.env.SMTP_HOST = "smtp.test.com";
  process.env.SMTP_USER = "test";
  process.env.SMTP_PASS = "test";
  process.env.GOOGLE_CLIENT_ID = "test";
  process.env.GOOGLE_CLIENT_SECRET = "test";
  process.env.SENTRY_ENABLED = "false";
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder";
  process.env.BULL_BOARD_USERNAME = "admin";
  process.env.BULL_BOARD_PASSWORD = "admin";
  process.env.LOGS_FLUSH_CRON = "0 0 * * *";
  process.env.PORTAL_JWT_SECRET = "test-portal-jwt-secret";
  process.env.HUBSPOT_CLIENT_ID = "hs-cid";
  process.env.HUBSPOT_CLIENT_SECRET = "hs-secret";
  process.env.SALESFORCE_CLIENT_ID = "sf-cid";
  process.env.SALESFORCE_CLIENT_SECRET = "sf-secret";

  const authModule = await import("../../lib/auth");
  (authModule.auth.api.getSession as any) = mock(() =>
    Promise.resolve({
      session: { id: "s1" },
      user: { id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "Admin" },
    }),
  );

  const db = await import("@workspace/db");
  await db.connectDB();

  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;
  IntegrationConnection = db.IntegrationConnection;

  const core = await import("@workspace/plugins-core");
  pluginRegistry = core.pluginRegistry;

  const cryptoMod = await import("../../lib/crypto");
  encryptConfig = cryptoMod.encryptConfig;
  decryptConfig = cryptoMod.decryptConfig;

  const oauthMod = await import("../../lib/integrations/oauth");
  signState = oauthMod.signState;

  // Register lightweight fake connectors so /connect + /oauth/start work offline
  const makeFake = (name: string, displayName: string) => ({
    name,
    displayName,
    version: "1.0.0",
    description: "fake",
    icon: "plug",
    init: mock(async () => {}),
    destroy: mock(async () => {}),
    testConnection: mock(async () => ({ success: true, message: "ok" })),
    getStatus: mock(async () => "connected"),
    fetchReps: mock(async () => []),
    fetchDeals: mock(async () => []),
    verifyWebhook: mock(async () => {}),
    parseWebhook: () => [],
    getSettingsSchema: () => ({ type: "object", properties: {} }),
    getUIMetadata: () => ({
      name: displayName,
      description: "fake",
      icon: "plug",
      category: "crm",
      features: ["sync_reps", "sync_deals", "oauth_support"],
    }),
  });
  pluginRegistry.register(makeFake("hubspot", "HubSpot CRM") as any);
  pluginRegistry.register(makeFake("salesforce", "Salesforce CRM") as any);

  app = (await import("../../app")).default;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  const ws = await Workspace.create({ slug: "test-ws", name: "Test Workspace", ownerId: TEST_USER_ID });
  workspaceId = ws._id.toString();
  await WorkspaceMember.create({
    workspaceId: ws._id,
    userId: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    role: "owner",
  });
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

async function seedConnection(connectorName: string, config: Record<string, unknown>, status = "connected") {
  return IntegrationConnection.create({
    workspaceId,
    connectorName,
    status,
    config: encryptConfig(config),
    syncSchedule: { reps: "hourly", deals: "hourly" },
  });
}

describe("multi-connector /connect", () => {
  test("two connectors coexist in one workspace", async () => {
    await request(app)
      .post(`/api/integrations/${workspaceId}/connect`)
      .set(authHeader())
      .send({ connectorName: "hubspot", config: { accessToken: "h" } })
      .expect(200);

    await request(app)
      .post(`/api/integrations/${workspaceId}/connect`)
      .set(authHeader())
      .send({ connectorName: "salesforce", config: { instanceUrl: "https://x.salesforce.com" } })
      .expect(200);

    const count = await IntegrationConnection.countDocuments({ workspaceId });
    expect(count).toBe(2);
  });
});

describe("connector-aware status/config/disconnect", () => {
  test("status lists all connected connectors", async () => {
    await seedConnection("hubspot", { syncClosedOnly: true });
    await seedConnection("salesforce", { instanceUrl: "https://x.salesforce.com" });

    const res = await request(app).get(`/api/integrations/${workspaceId}/status`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.connections).toBeArray();
    expect(res.body.connections.length).toBe(2);
    const names = res.body.connections.map((c: any) => c.connectorName).sort();
    expect(names).toEqual(["hubspot", "salesforce"]);
  });

  test("config?connector= returns the right connection", async () => {
    await seedConnection("hubspot", { syncClosedOnly: true, accessToken: "h" });
    await seedConnection("salesforce", { instanceUrl: "https://x.salesforce.com", accessToken: "s" });

    const hub = await request(app).get(`/api/integrations/${workspaceId}/config?connector=hubspot`).set(authHeader());
    const sf = await request(app).get(`/api/integrations/${workspaceId}/config?connector=salesforce`).set(authHeader());

    expect(hub.status).toBe(200);
    expect(hub.body.config.syncClosedOnly).toBe(true);
    expect(sf.status).toBe(200);
    expect(sf.body.config.instanceUrl).toBe("https://x.salesforce.com");
  });

  test("config without connector returns 400", async () => {
    await seedConnection("hubspot", { accessToken: "h" });
    const res = await request(app).get(`/api/integrations/${workspaceId}/config`).set(authHeader());
    expect(res.status).toBe(400);
  });

  test("disconnect removes only the target connector", async () => {
    await seedConnection("hubspot", { accessToken: "h" });
    await seedConnection("salesforce", { instanceUrl: "https://x.salesforce.com" });

    const res = await request(app)
      .delete(`/api/integrations/${workspaceId}/disconnect?connector=hubspot`)
      .set(authHeader());

    expect(res.status).toBe(200);

    const hub = await IntegrationConnection.findOne({ workspaceId, connectorName: "hubspot" });
    const sf = await IntegrationConnection.findOne({ workspaceId, connectorName: "salesforce" });
    expect(hub.status).toBe("disconnected");
    expect(sf.status).toBe("connected");
  });
});

describe("OAuth start + callback routes", () => {
  test("start route redirects to the provider authorize URL", async () => {
    const res = await request(app)
      .get(`/api/integrations/${workspaceId}/oauth/start/hubspot`)
      .set(authHeader());

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("https://app.hubspot.com/oauth/authorize?");
    expect(res.headers.location).toContain("client_id=hs-cid");
  });

  test("start route resolves workspace from path param without X-Workspace-ID header", async () => {
    const res = await request(app)
      .get(`/api/integrations/${workspaceId}/oauth/start/hubspot`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("https://app.hubspot.com/oauth/authorize?");
    expect(res.headers.location).toContain("client_id=hs-cid");
  });

  test("start route 404s for unknown connector", async () => {
    const res = await request(app)
      .get(`/api/integrations/${workspaceId}/oauth/start/nope`)
      .set(authHeader());
    expect(res.status).toBe(404);
  });

  test("callback exchanges code, persists oauth connection, redirects", async () => {
    globalThis.fetch = mock(async () =>
      new Response(JSON.stringify({ access_token: "at", refresh_token: "rt", expires_in: 1800 }), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    const state = signState(workspaceId, "hubspot");
    const res = await request(app).get(`/api/integrations/oauth/hubspot/callback?code=code123&state=${encodeURIComponent(state)}`);

    expect(res.status).toBe(302);
    expect(res.headers.location).toContain("/dash/integrations?connected=hubspot");

    const conn = await IntegrationConnection.findOne({ workspaceId, connectorName: "hubspot" });
    expect(conn).toBeTruthy();
    expect(conn.status).toBe("connected");
    const config = decryptConfig(conn.config);
    expect(config.authType).toBe("oauth");
    expect(config.accessToken).toBe("at");
    expect(config.refreshToken).toBe("rt");

    const hubPlugin = pluginRegistry.get("hubspot");
    expect(hubPlugin).toBeTruthy();
    expect((hubPlugin as any).init).toHaveBeenCalled();
  });

  test("callback rejects tampered state", async () => {
    const res = await request(app).get("/api/integrations/oauth/hubspot/callback?code=code123&state=tampered");
    expect(res.status).toBe(500);
  });

  test("callback rejects state signed for a different connector", async () => {
    globalThis.fetch = mock(async () =>
      new Response(JSON.stringify({ access_token: "at", refresh_token: "rt", expires_in: 1800 }), {
        headers: { "Content-Type": "application/json" },
      }),
    );

    const state = signState(workspaceId, "salesforce");
    const res = await request(app).get(`/api/integrations/oauth/hubspot/callback?code=code123&state=${encodeURIComponent(state)}`);

    expect(res.status).toBe(400);
    const conn = await IntegrationConnection.findOne({ workspaceId, connectorName: "hubspot" });
    expect(conn).toBeFalsy();
  });
});
