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
  findUserById: mock(() => Promise.resolve(null)),
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

// ── Helper ─────────────────────────────────────────────────────────────────────
const authHeader = () => ({ "X-Workspace-ID": workspaceId });

describe("PATCH /api/workspaces/:id/onboarding", () => {
  test("dismiss sets checklistDismissed = true", async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/onboarding`)
      .set(authHeader())
      .send({ action: "dismiss" });

    expect(res.status).toBe(200);
    expect(res.body.onboarding.checklistDismissed).toBe(true);
    expect(res.body.onboarding.checklistCompletedAt).toBeNull();
    expect(res.body.onboarding.checklistShownAt).toBeNull();

    const workspace = await Workspace.findById(workspaceId);
    expect(workspace.onboarding.checklistDismissed).toBe(true);
  });

  test("complete sets checklistCompletedAt and checklistDismissed = true", async () => {
    const before = new Date();

    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/onboarding`)
      .set(authHeader())
      .send({ action: "complete" });

    expect(res.status).toBe(200);
    expect(res.body.onboarding.checklistDismissed).toBe(true);
    expect(res.body.onboarding.checklistCompletedAt).not.toBeNull();

    const completedAt = new Date(res.body.onboarding.checklistCompletedAt);
    expect(completedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());

    const workspace = await Workspace.findById(workspaceId);
    expect(workspace.onboarding.checklistDismissed).toBe(true);
    expect(workspace.onboarding.checklistCompletedAt).not.toBeNull();
  });

  test("returns 401 when unauthenticated", async () => {
    const authLib = await import("../../lib/auth");
    (authLib.auth.api.getSession as any).mockResolvedValueOnce(null);

    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/onboarding`)
      .set(authHeader())
      .send({ action: "dismiss" });

    expect(res.status).toBe(401);
  });

  test("returns 403 when user is not a workspace member", async () => {
    const otherWs = await Workspace.create({
      slug: "other-ws",
      name: "Other Workspace",
      ownerId: "other-owner",
    });

    const res = await request(app)
      .patch(`/api/workspaces/${otherWs._id}/onboarding`)
      .set({ "X-Workspace-ID": otherWs._id.toString() })
      .send({ action: "dismiss" });

    expect(res.status).toBe(403);
  });

  test("returns 400 for invalid action", async () => {
    const res = await request(app)
      .patch(`/api/workspaces/${workspaceId}/onboarding`)
      .set(authHeader())
      .send({ action: "invalid" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/workspaces", () => {
  test("includes onboarding field in response", async () => {
    const res = await request(app).get("/api/workspaces").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toBeArray();
    expect(res.body.length).toBe(1);
    expect(res.body[0].onboarding).toEqual({
      checklistDismissed: false,
      checklistCompletedAt: null,
      checklistShownAt: null,
    });
  });
});
