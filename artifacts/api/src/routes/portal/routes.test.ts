import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { clearCollections, setupTestDB, teardownTestDB } from "../../../test/setup-db";

const TEST_USER_ID = "test-user-001";
const TEST_USER_EMAIL = "admin@test.com";

// ── Mock heavy dependencies ────────────────────────────────────────────────────
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
  exchangeRateQueue: { add: () => Promise.resolve() },
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

mock.module("../../lib/notify", () => ({
  createNotification: mock(() => Promise.resolve()),
}));

let app: any;
let Rep: any;
let CommissionResult: any;
let CommissionRun: any;
let Payout: any;
let Workspace: any;
let WorkspaceMember: any;
let WorkspaceSubscription: any;
let workspaceId: string;
let testRep: any;
let portalToken: string;

const PORTAL_JWT_SECRET = "test-portal-jwt-secret";

function signPortalToken(repId: string, accessCode: string, mustChangePassword = false) {
  return jwt.sign({ repId, accessCode, mustChangePassword }, PORTAL_JWT_SECRET, {
    expiresIn: "24h",
  });
}

beforeAll(async () => {
  await setupTestDB();
  process.env.REDIS_URL = "redis://localhost:6379";
  process.env.BETTER_AUTH_SECRET = "test-secret-long-enough";
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
  process.env.PORTAL_JWT_SECRET = PORTAL_JWT_SECRET;

  const authModule = await import("../../lib/auth");
  (authModule.auth.api.getSession as any) = mock(() =>
    Promise.resolve({
      session: { id: "s1" },
      user: { id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "Admin" },
    }),
  );

  const db = await import("@workspace/db");
  await db.connectDB();

  Rep = db.Rep;
  CommissionResult = db.CommissionResult;
  CommissionRun = db.CommissionRun;
  Payout = db.Payout;
  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;
  WorkspaceSubscription = db.WorkspaceSubscription;

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
  await WorkspaceSubscription.create({
    workspaceId: ws._id,
    plan: "growth",
    status: "active",
    isLifetime: true,
  });

  testRep = await Rep.create({
    workspaceId: ws._id,
    name: "Portal Rep",
    email: "portalrep@test.com",
    portalAccessCode: "test-access-code-abc123",
    portalUsername: "portalrep",
  });

  const db = mongoose.connection.db;
  const userCol = db.collection("user");
  await userCol.insertOne({
    email: "portalrep@portal.commissionkit.io",
    name: "Portal Rep",
    mustChangePassword: false,
    repId: testRep._id.toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const accountCol = db.collection("account");
  const { hashPassword } = await import("better-auth/crypto");
  const passwordHash = await hashPassword("testpassword12");

  // Find the user we just inserted
  const authUser = await userCol.findOne({ email: "portalrep@portal.commissionkit.io" });

  await accountCol.insertOne({
    userId: authUser?._id,
    providerId: "credential",
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  portalToken = signPortalToken(testRep._id.toString(), "test-access-code-abc123");
});

const portalAuth = () => ({ Authorization: `Bearer ${portalToken}` });

describe("GET /api/portal/:accessCode", () => {
  test("returns 404 for invalid access code", async () => {
    const res = await request(app).get("/api/portal/invalid-code").set(portalAuth());

    expect(res.status).toBe(404);
  });

  test("returns 401 when no authorization header", async () => {
    const res = await request(app).get(`/api/portal/${testRep.portalAccessCode}`);

    expect(res.status).toBe(401);
  });

  test("returns rep commission summary when authenticated", async () => {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const run = await CommissionRun.create({
      workspaceId,
      period,
      totalCommission: 500,
      totalDeals: 1,
      repsCount: 1,
      status: "completed",
    });
    await CommissionResult.create({
      runId: run._id,
      repId: testRep._id,
      dealId: new mongoose.Types.ObjectId(),
      rateApplied: 5,
      commissionAmount: 500,
      calculationNote: "5% of 10000 = 500",
      currency: "USD",
    });

    const res = await request(app).get(`/api/portal/${testRep.portalAccessCode}`).set(portalAuth());

    expect(res.status).toBe(200);
    expect(res.body.repName).toBe("Portal Rep");
    expect(res.body.workspaceName).toBe("Test Workspace");
    expect(res.body.totalCommission).toBe(500);
    expect(res.body.dealBreakdown.length).toBe(1);
    expect(res.body.currency).toBe("USD");
  });

  test("returns 403 when mustChangePassword is true in token", async () => {
    const mustChangeToken = signPortalToken(
      testRep._id.toString(),
      "test-access-code-abc123",
      true,
    );

    const res = await request(app)
      .get(`/api/portal/${testRep.portalAccessCode}`)
      .set({ Authorization: `Bearer ${mustChangeToken}` });

    expect(res.status).toBe(403);
    expect(res.body.mustChangePassword).toBe(true);
  });
});

describe("GET /api/portal/:accessCode/payouts", () => {
  test("returns rep payouts", async () => {
    await Payout.create({
      workspaceId,
      repId: testRep._id,
      periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"),
      commissionAmount: 2500,
      finalAmount: 2500,
      currency: "USD",
      status: "approved",
      statusHistory: [{ status: "approved", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .get(`/api/portal/${testRep.portalAccessCode}/payouts`)
      .set(portalAuth());

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].commissionAmount).toBe(2500);
    expect(res.body[0].status).toBe("approved");
  });

  test("returns 401 without auth", async () => {
    const res = await request(app).get(`/api/portal/${testRep.portalAccessCode}/payouts`);

    expect(res.status).toBe(401);
  });
});

describe("POST /api/portal/:accessCode/login", () => {
  test("returns token with correct credentials", async () => {
    const res = await request(app)
      .post(`/api/portal/${testRep.portalAccessCode}/login`)
      .send({ username: "portalrep", password: "testpassword12" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.repName).toBe("Portal Rep");
    expect(res.body.workspaceName).toBe("Test Workspace");
  });

  test("returns 401 with wrong password", async () => {
    const res = await request(app)
      .post(`/api/portal/${testRep.portalAccessCode}/login`)
      .send({ username: "portalrep", password: "wrongpassword" });

    expect(res.status).toBe(401);
  });

  test("returns 401 with wrong username", async () => {
    const res = await request(app)
      .post(`/api/portal/${testRep.portalAccessCode}/login`)
      .send({ username: "wronguser", password: "testpassword12" });

    expect(res.status).toBe(401);
  });

  test("returns 400 when credentials missing", async () => {
    const res = await request(app).post(`/api/portal/${testRep.portalAccessCode}/login`).send({});

    expect(res.status).toBe(400);
  });

  test("returns 404 for invalid access code", async () => {
    const res = await request(app)
      .post("/api/portal/invalid-code/login")
      .send({ username: "someone", password: "testpassword12" });

    expect(res.status).toBe(404);
  });
});

describe("POST /api/portal/:accessCode/change-password", () => {
  test("changes password and returns new token", async () => {
    const res = await request(app)
      .post(`/api/portal/${testRep.portalAccessCode}/change-password`)
      .set(portalAuth())
      .send({ currentPassword: "testpassword12", newPassword: "newpassword123" });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.success).toBe(true);
  });

  test("returns 401 without auth header", async () => {
    const res = await request(app)
      .post(`/api/portal/${testRep.portalAccessCode}/change-password`)
      .send({ currentPassword: "testpassword12", newPassword: "newpassword123" });

    expect(res.status).toBe(401);
  });

  test("returns 400 for short new password", async () => {
    const res = await request(app)
      .post(`/api/portal/${testRep.portalAccessCode}/change-password`)
      .set(portalAuth())
      .send({ currentPassword: "testpassword12", newPassword: "short" });

    expect(res.status).toBe(400);
  });
});
