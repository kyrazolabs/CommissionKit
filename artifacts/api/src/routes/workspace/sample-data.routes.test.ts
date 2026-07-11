import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import mongoose from "mongoose";
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
  PRIORITY_QUEUE_MAP: { high: { add: () => Promise.resolve() }, medium: { add: () => Promise.resolve() }, low: { add: () => Promise.resolve() } },
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
let Rep: any;
let Plan: any;
let PlanTier: any;
let Deal: any;
let CommissionRun: any;
let CommissionResult: any;
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

  Rep = db.Rep;
  Plan = db.Plan;
  PlanTier = db.PlanTier;
  Deal = db.Deal;
  CommissionRun = db.CommissionRun;
  CommissionResult = db.CommissionResult;
  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;

  app = (await import("../../app")).default;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  const ws = await Workspace.create({ slug: "test-ws", name: "Test Workspace", ownerId: TEST_USER_ID, currency: "USD" });
  workspaceId = ws._id.toString();
  await WorkspaceMember.create({
    workspaceId: ws._id,
    userId: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    role: "owner",
  });
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

describe("POST /api/workspace/sample-data", () => {
  test("seeds correct counts and marks workspace", async () => {
    const res = await request(app).post("/api/workspace/sample-data").set(authHeader()).send();

    expect(res.status).toBe(201);
    expect(res.body.seeded).toBe(true);
    expect(res.body.counts).toEqual({ reps: 6, plans: 1, deals: 18, runs: 1, results: 15 });

    const reps = await Rep.find({ workspaceId });
    expect(reps.length).toBe(6);
    expect(reps.every((r: any) => r.isSampleData)).toBe(true);

    const plans = await Plan.find({ workspaceId });
    expect(plans.length).toBe(1);
    expect(plans[0].isSampleData).toBe(true);

    const tiers = await PlanTier.find({ planId: plans[0]._id });
    expect(tiers.length).toBe(3);

    const deals = await Deal.find({ workspaceId });
    expect(deals.length).toBe(18);
    expect(deals.every((d: any) => d.isSampleData)).toBe(true);

    const runs = await CommissionRun.find({ workspaceId });
    expect(runs.length).toBe(1);
    expect(runs[0].isSampleData).toBe(true);
    expect(runs[0].status).toBe("completed");
    expect(runs[0].totalDeals).toBe(15);

    const results = await CommissionResult.find({ runId: runs[0]._id });
    expect(results.length).toBe(15);
    expect(results.every((r: any) => r.isSampleData)).toBe(true);

    const workspace = await Workspace.findById(workspaceId);
    expect(workspace?.sampleDataLoaded).toBe(true);
  });

  test("double seed returns 409", async () => {
    const first = await request(app).post("/api/workspace/sample-data").set(authHeader()).send();
    expect(first.status).toBe(201);

    const second = await request(app).post("/api/workspace/sample-data").set(authHeader()).send();
    expect(second.status).toBe(409);
    expect(second.body.alreadySeeded).toBe(true);
  });

  test("returns 401 when unauthenticated", async () => {
    const authLib = await import("../../lib/auth");
    (authLib.auth.api.getSession as any).mockResolvedValueOnce(null);

    const res = await request(app).post("/api/workspace/sample-data").set(authHeader()).send();
    expect(res.status).toBe(401);
  });

  test("requires admin role or higher", async () => {
    const memberWs = await Workspace.create({ slug: "member-ws", name: "Member Workspace", ownerId: "other-owner" });
    await WorkspaceMember.create({
      workspaceId: memberWs._id,
      userId: TEST_USER_ID,
      email: TEST_USER_EMAIL,
      role: "member",
    });

    const res = await request(app)
      .post("/api/workspace/sample-data")
      .set({ "X-Workspace-ID": memberWs._id.toString() })
      .send();

    expect(res.status).toBe(403);
  });

  test("rolls back on partial failure", async () => {
    const { StandardEngine } = await import("../../workers/engines/standard.engine");
    const originalCalculate = StandardEngine.prototype.calculate;
    StandardEngine.prototype.calculate = mock(() => Promise.reject(new Error("engine failure")));

    try {
      const res = await request(app).post("/api/workspace/sample-data").set(authHeader()).send();
      expect(res.status).toBe(500);

      const reps = await Rep.find({ workspaceId });
      expect(reps.length).toBe(0);

      const plans = await Plan.find({ workspaceId });
      expect(plans.length).toBe(0);

      const deals = await Deal.find({ workspaceId });
      expect(deals.length).toBe(0);

      const runs = await CommissionRun.find({ workspaceId });
      expect(runs.length).toBe(0);

      const workspace = await Workspace.findById(workspaceId);
      expect(workspace?.sampleDataLoaded).toBe(false);
    } finally {
      StandardEngine.prototype.calculate = originalCalculate;
    }
  });

  test("commission results are mathematically correct", async () => {
    await request(app).post("/api/workspace/sample-data").set(authHeader()).send();

    const plan = await Plan.findOne({ workspaceId });
    const sarah = await Rep.findOne({ workspaceId, name: "Sarah Chen" });
    const deal = await Deal.findOne({ workspaceId, repId: sarah?._id, name: "Acme Corp — Enterprise License" });
    const run = await CommissionRun.findOne({ workspaceId });

    const result = await CommissionResult.findOne({ runId: run?._id, dealId: deal?._id });
    expect(result).not.toBeNull();

    // $32,000 tiered:
    // $0-$10,000 @ 5% = $500
    // $10,000-$25,000 @ 8% = $1,200
    // $25,000-$32,000 @ 12% = $840
    // Total = $2,540
    expect(Number(result!.commissionAmount)).toBeCloseTo(2540, 2);
    expect(Number(result!.rateApplied)).toBeCloseTo(2540 / 32000, 4);
    expect(result!.calculationNote).toContain("Tiered");
  });

  test("generates portal access codes for reps", async () => {
    await request(app).post("/api/workspace/sample-data").set(authHeader()).send();

    const reps = await Rep.find({ workspaceId });
    expect(reps.length).toBe(6);
    for (const rep of reps) {
      expect(rep.portalAccessCode).toBeTruthy();
      expect(rep.portalAccessCode.length).toBe(24);
    }
  });
});

describe("DELETE /api/workspace/sample-data", () => {
  test("clears only sample data and leaves real data intact", async () => {
    // Seed sample data
    const seedRes = await request(app).post("/api/workspace/sample-data").set(authHeader()).send();
    expect(seedRes.status).toBe(201);

    // Create real records
    const realPlan = await Plan.create({ workspaceId, name: "Real Plan", type: "flat", flatRate: 0.1, isSampleData: false });
    const realRep = await Rep.create({ workspaceId, name: "Real Rep", email: "real@test.com", planId: realPlan._id, isSampleData: false });
    const realDeal = await Deal.create({
      workspaceId,
      repId: realRep._id,
      name: "Real Deal",
      amount: 5000,
      period: "2026-07",
      stage: "Closed Won",
      currency: "USD",
      isSampleData: false,
    });
    const realRun = await CommissionRun.create({
      workspaceId,
      period: "2026-07",
      totalCommission: 500,
      totalDeals: 1,
      skippedDeals: 0,
      repsCount: 1,
      status: "completed",
      isSampleData: false,
    });

    const clearRes = await request(app).delete("/api/workspace/sample-data").set(authHeader()).send();
    expect(clearRes.status).toBe(200);
    expect(clearRes.body.cleared).toBe(true);
    expect(clearRes.body.removed).toEqual({ reps: 6, plans: 1, deals: 18, runs: 1 });

    expect(await Rep.findById(realRep._id)).not.toBeNull();
    expect(await Plan.findById(realPlan._id)).not.toBeNull();
    expect(await Deal.findById(realDeal._id)).not.toBeNull();
    expect(await CommissionRun.findById(realRun._id)).not.toBeNull();

    const sampleReps = await Rep.find({ workspaceId, isSampleData: true });
    expect(sampleReps.length).toBe(0);

    const workspace = await Workspace.findById(workspaceId);
    expect(workspace?.sampleDataLoaded).toBe(false);
  });
});
