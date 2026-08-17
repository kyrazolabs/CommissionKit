import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import request from "supertest";
import { clearCollections, setupTestDB, teardownTestDB } from "../../../test/setup-db";

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
  syncRepsQueue: { add: () => Promise.resolve() },
  syncDealsQueue: { add: () => Promise.resolve() },
  webhookIngressQueue: { add: () => Promise.resolve() },
  syncEgressQueue: { add: () => Promise.resolve() },
  auditLogQueue: { add: () => Promise.resolve() },
  PRIORITY_QUEUE_MAP: {
    high: { add: () => Promise.resolve() },
    medium: { add: () => Promise.resolve() },
    low: { add: () => Promise.resolve() },
  },
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
  serverAdapter: { getRouter: () => (() => {}) as any },
}));

mock.module("stripe", () => ({
  default: class StripeMock {
    constructor() {}
    subscriptions = { create: () => Promise.resolve({ id: "sub_123", status: "active" }) };
    checkout = {
      sessions: {
        create: () => Promise.resolve({ url: "https://checkout.stripe.com/test", id: "cs_test" }),
      },
    };
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
let AuditEvent: any;
let workspaceId: string;

beforeAll(async () => {
  await setupTestDB();
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
  process.env.OPR_APP_KEY = "test";
  process.env.PORTAL_JWT_SECRET = "test-portal-jwt-secret";

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
  AuditEvent = db.AuditEvent;

  app = (await import("../../app")).default;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  const ws = await Workspace.create({
    slug: "test-ws",
    name: "Test Workspace",
    ownerId: TEST_USER_ID,
  });
  workspaceId = ws._id.toString();
  await WorkspaceMember.create({
    workspaceId: ws._id,
    userId: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    role: "owner",
  });
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

async function seedEvents() {
  await AuditEvent.create([
    {
      workspaceId,
      userId: TEST_USER_ID,
      userEmail: TEST_USER_EMAIL,
      action: "create",
      resourceType: "deal",
      resourceId: "deal1",
      resourceName: "Acme Corp",
      changes: [{ field: "name", from: null, to: "Acme Corp" }],
      timestamp: new Date("2026-01-01T00:00:00Z"),
    },
    {
      workspaceId,
      userId: "other-user",
      userEmail: "other@test.com",
      action: "update",
      resourceType: "plan",
      resourceId: "plan1",
      resourceName: "Standard Plan",
      changes: [{ field: "name", from: "Old", to: "Standard Plan" }],
      timestamp: new Date("2026-01-02T00:00:00Z"),
    },
    {
      workspaceId,
      userId: TEST_USER_ID,
      userEmail: TEST_USER_EMAIL,
      action: "delete",
      resourceType: "rep",
      resourceId: "rep1",
      resourceName: "Deleted Rep",
      changes: [{ field: "name", from: "Deleted Rep", to: null }],
      timestamp: new Date("2026-01-03T00:00:00Z"),
    },
  ]);
}

describe("GET /api/audit-log", () => {
  test("lists events for workspace with pagination", async () => {
    await seedEvents();

    const res = await request(app).get("/api/audit-log").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data).toBeArray();
    expect(res.body.data.length).toBe(3);
    expect(res.body.pagination.total).toBe(3);
    expect(res.body.pagination.totalPages).toBe(1);
    expect(res.body.data[0].action).toBe("delete"); // default desc sort
  });

  test("filters by action", async () => {
    await seedEvents();

    const res = await request(app).get("/api/audit-log?action=create").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].action).toBe("create");
  });

  test("filters by userId", async () => {
    await seedEvents();

    const res = await request(app).get(`/api/audit-log?userId=${TEST_USER_ID}`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
  });

  test("filters by search on resourceName", async () => {
    await seedEvents();

    const res = await request(app).get("/api/audit-log?search=acme").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].resourceName).toBe("Acme Corp");
  });

  test("sorts ascending", async () => {
    await seedEvents();

    const res = await request(app).get("/api/audit-log?sort=asc").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data[0].action).toBe("create");
    expect(res.body.data[2].action).toBe("delete");
  });

  test("respects limit", async () => {
    await seedEvents();

    const res = await request(app).get("/api/audit-log?limit=2").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.limit).toBe(2);
    expect(res.body.pagination.totalPages).toBe(2);
  });

  test("filters by date range", async () => {
    await seedEvents();

    const res = await request(app)
      .get("/api/audit-log?startDate=2026-01-02T00:00:00Z&endDate=2026-01-02T23:59:59Z")
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].action).toBe("update");
  });
});

describe("GET /api/audit-log/:id", () => {
  test("returns event detail", async () => {
    await seedEvents();
    const event = await AuditEvent.findOne({ action: "create" });

    const res = await request(app).get(`/api/audit-log/${event._id}`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(event._id.toString());
    expect(res.body.action).toBe("create");
  });

  test("returns 404 for unknown event", async () => {
    const fakeId = "000000000000000000000000";
    const res = await request(app).get(`/api/audit-log/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });
});

describe("GET /api/audit-log/export", () => {
  test("exports matching events as CSV", async () => {
    await seedEvents();

    const res = await request(app).get("/api/audit-log/export?action=create").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toContain("text/csv");
    expect(res.headers["content-disposition"]).toContain("audit-log.csv");
    expect(res.text).toContain(
      "timestamp,userEmail,action,resourceType,resourceId,resourceName,changes,ipAddress,userAgent",
    );
    expect(res.text).toContain("create,deal");
  });
});
