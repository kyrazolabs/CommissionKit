import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
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
let CommissionRun: any;
let CommissionResult: any;
let Payout: any;
let Rep: any;
let Workspace: any;
let WorkspaceMember: any;
let WorkspaceSubscription: any;
let workspaceId: string;
let testRepId1: any;
let testRepId2: any;

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

  CommissionRun = db.CommissionRun;
  CommissionResult = db.CommissionResult;
  Payout = db.Payout;
  Rep = db.Rep;
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
    currency: "USD",
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
  testRepId1 = (await Rep.create({ workspaceId: ws._id, name: "Rep One", email: "rep1@test.com" }))
    ._id;
  testRepId2 = (await Rep.create({ workspaceId: ws._id, name: "Rep Two", email: "rep2@test.com" }))
    ._id;
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

// ─── Helper: create a completed run with results ──────────────────────────────
async function createRunWithResults(
  results: Array<{ repId: any; commissionAmount: number; currency?: string }>,
) {
  const run = await CommissionRun.create({
    workspaceId,
    period: "2024-03",
    totalCommission: results.reduce((sum, r) => sum + r.commissionAmount, 0),
    totalDeals: results.length,
    repsCount: new Set(results.map((r) => r.repId.toString())).size,
    status: "completed",
  });

  for (const r of results) {
    await CommissionResult.create({
      runId: run._id,
      repId: r.repId,
      dealId: new mongoose.Types.ObjectId(),
      rateApplied: 10,
      commissionAmount: r.commissionAmount,
      currency: r.currency ?? "USD",
      calculationNote: "Flat 10%",
    });
  }

  return run;
}

// ─── Helper: create a payout directly (for testing existing-payout scenarios) ──
async function createPayout(overrides: any = {}) {
  return Payout.create({
    workspaceId,
    repId: overrides.repId ?? testRepId1,
    runIds: overrides.runIds ?? [],
    periodStart: overrides.periodStart ?? new Date("2024-03-01"),
    periodEnd: overrides.periodEnd ?? new Date("2024-03-31T23:59:59.999Z"),
    commissionAmount: overrides.commissionAmount ?? 1000,
    adjustments: overrides.adjustments ?? 0,
    finalAmount: (overrides.commissionAmount ?? 1000) + (overrides.adjustments ?? 0),
    currency: "USD",
    status: overrides.status ?? "pending",
    statusHistory: [
      { status: overrides.status ?? "pending", changedAt: new Date(), changedBy: TEST_USER_ID },
    ],
  });
}

describe("POST /api/runs/:id/generate-payouts", () => {
  // ─── Scenario 1: No existing payouts → create new ───────────────────────────
  test("creates new payouts when none exist", async () => {
    const run = await createRunWithResults([
      { repId: testRepId1, commissionAmount: 1000 },
      { repId: testRepId2, commissionAmount: 2000 },
    ]);

    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(2);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.skipped).toHaveLength(0);
    expect(res.body.flagged).toHaveLength(0);

    // Verify runIds are populated
    const payouts = await Payout.find({});
    expect(payouts).toHaveLength(2);
    for (const p of payouts) {
      expect(p.runIds.map((id: any) => id.toString())).toContain(run._id.toString());
    }
  });

  // ─── Scenario 2: Pending existing + increase → update ──────────────────────
  test("updates existing pending payout when commission increases", async () => {
    // First run at $1000
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    // Verify first payout created
    let payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(1000);
    expect(payouts[0].status).toBe("pending");

    // Second run — same rep, higher commission ($1500)
    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1500 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(0);
    expect(res.body.updated).toHaveLength(1);
    expect(res.body.skipped).toHaveLength(0);
    expect(res.body.flagged).toHaveLength(0);

    // Payout should be updated to $1500 — NOT duplicated
    payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(1500);
    expect(payouts[0].finalAmount).toBe(1500);
    expect(payouts[0].status).toBe("pending");
    // runIds should include BOTH runs
    expect(payouts[0].runIds).toHaveLength(2);
  });

  // ─── Scenario 3: Pending existing + decrease → flag ────────────────────────
  test("flags decrease when existing pending payout has higher commission", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 2000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    // Second run — lower commission ($1200)
    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1200 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(0);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.flagged).toHaveLength(1);
    expect(res.body.flagged[0].reason).toContain("decreased");

    // Payout should NOT be changed — still $2000
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(2000);
    // runIds should still get updated though
    expect(payouts[0].runIds).toHaveLength(2);
  });

  // ─── Scenario 4: Pending existing + same → skip ────────────────────────────
  test("skips when commission hasn't changed and payout is pending", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(0);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.skipped).toHaveLength(1);
    expect(res.body.skipped[0].reason).toBe("no change");

    // Still 1 payout, still $1000
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
  });

  // ─── Scenario 5: Approved existing + increase → update + flag ──────────────
  test("updates but flags when approved payout gets higher commission", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    // Mark as approved
    await Payout.findOneAndUpdate(
      { repId: testRepId1 },
      {
        status: "approved",
        $push: {
          statusHistory: { status: "approved", changedAt: new Date(), changedBy: TEST_USER_ID },
        },
      },
    );

    // Second run — higher commission
    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1800 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.updated).toHaveLength(1);
    expect(res.body.flagged).toHaveLength(1);
    expect(res.body.flagged[0].reason).toContain("updated approved payout");

    // Payout updated to $1800
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(1800);
    expect(payouts[0].status).toBe("approved");
  });

  // ─── Scenario 6: Approved existing + decrease → skip ───────────────────────
  test("skips when approved payout would get lower commission", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 2000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate({ repId: testRepId1 }, { status: "approved" });

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1500 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.created).toHaveLength(0);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.flagged).toHaveLength(1);
    expect(res.body.flagged[0].reason).toContain("decreased");

    // Amount unchanged
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts[0].commissionAmount).toBe(2000);
  });

  // ─── Scenario 7: Approved existing + same → skip ───────────────────────────
  test("skips when approved payout amount hasn't changed", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate({ repId: testRepId1 }, { status: "approved" });

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.skipped).toHaveLength(1);
    expect(res.body.skipped[0].reason).toBe("no change");

    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
  });

  // ─── Scenario 8: Paid existing + increase → create delta ───────────────────
  test("creates delta payout when paid payout gets higher commission", async () => {
    // Run 1: $1000 → paid
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate(
      { repId: testRepId1 },
      {
        status: "paid",
        $push: {
          statusHistory: { status: "paid", changedAt: new Date(), changedBy: TEST_USER_ID },
        },
      },
    );

    // Run 2: $1500 total → delta of $500
    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1500 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(1);
    expect(res.body.created[0].commissionAmount).toBe(500); // delta only
    expect(res.body.created[0].notes).toContain("Delta");

    // Two payouts: original ($1000, paid) + delta ($500, pending)
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(2);

    const paidPayout = payouts.find((p: any) => p.status === "paid");
    const deltaPayout = payouts.find((p: any) => p.status === "pending");
    expect(paidPayout!.commissionAmount).toBe(1000);
    expect(deltaPayout!.commissionAmount).toBe(500);
  });

  // ─── Scenario 9: Paid existing + decrease → skip ───────────────────────────
  test("skips when paid payout would decrease — no auto-clawback", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 2000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate({ repId: testRepId1 }, { status: "paid" });

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1500 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.created).toHaveLength(0);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.skipped).toHaveLength(1);
    expect(res.body.skipped[0].reason).toContain("cannot auto-clawback");

    // Still 1 payout
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(2000);
  });

  // ─── Scenario 10: Paid existing + same → skip ──────────────────────────────
  test("skips when paid payout amount hasn't changed", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate({ repId: testRepId1 }, { status: "paid" });

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.skipped).toHaveLength(1);
    expect(res.body.skipped[0].reason).toContain("no change");

    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
  });

  // ─── Scenario 11: Disputed existing → skip always ──────────────────────────
  test("skips disputed payouts entirely", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate(
      { repId: testRepId1 },
      {
        status: "disputed",
        $push: {
          statusHistory: { status: "disputed", changedAt: new Date(), changedBy: TEST_USER_ID },
        },
      },
    );

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 2000 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.skipped).toHaveLength(1);
    expect(res.body.skipped[0].reason).toBe("payout is disputed");

    // Amount unchanged
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(1000);
    expect(payouts[0].status).toBe("disputed");
  });

  // ─── Scenario 12: On Hold + increase → update + flag ───────────────────────
  test("updates on-hold payout but flags for review when commission increases", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate(
      { repId: testRepId1 },
      {
        status: "on_hold",
        $push: {
          statusHistory: { status: "on_hold", changedAt: new Date(), changedBy: TEST_USER_ID },
        },
      },
    );

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 2500 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.updated).toHaveLength(1);
    expect(res.body.flagged).toHaveLength(1);

    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(2500);
  });

  // ─── Scenario 13: On Hold + decrease → skip ────────────────────────────────
  test("skips on-hold payout when commission decreases", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 2000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    await Payout.findOneAndUpdate({ repId: testRepId1 }, { status: "on_hold" });

    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1500 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.created).toHaveLength(0);
    expect(res.body.flagged).toHaveLength(1);
    expect(res.body.flagged[0].reason).toContain("decreased");

    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts[0].commissionAmount).toBe(2000);
  });

  // ─── Scenario 15: Preserve existing manual adjustments ─────────────────────
  test("preserves existing manual adjustments when updating payout", async () => {
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());

    // Admin adds a $200 bonus
    await Payout.findOneAndUpdate({ repId: testRepId1 }, { adjustments: 200, finalAmount: 1200 });

    // Second run — commission goes up to $1500
    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1500 }]);

    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    expect(res.body.updated).toHaveLength(1);

    // finalAmount = newCommissionAmount + existingAdjustments = 1500 + 200 = 1700
    const payouts = await Payout.find({ repId: testRepId1 });
    expect(payouts).toHaveLength(1);
    expect(payouts[0].commissionAmount).toBe(1500);
    expect(payouts[0].adjustments).toBe(200);
    expect(payouts[0].finalAmount).toBe(1700);
  });

  // ─── Scenario 16: Same run, double-click → dedup by runIds ─────────────────
  test("re-generating from same run skips all (runId already in runIds)", async () => {
    const run = await createRunWithResults([
      { repId: testRepId1, commissionAmount: 1000 },
      { repId: testRepId2, commissionAmount: 2000 },
    ]);

    // First call
    await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    // Second call — all should be "no change" since same amounts
    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(0);
    expect(res.body.updated).toHaveLength(0);
    expect(res.body.skipped).toHaveLength(2);

    // Still 2 payouts, runIds not duplicated
    const payouts = await Payout.find({});
    expect(payouts).toHaveLength(2);
    for (const p of payouts) {
      expect(p.runIds).toHaveLength(1); // not duplicated
    }
  });

  // ─── Scenario 18: $0 commission → skip ─────────────────────────────────────
  test("skips reps with zero commission", async () => {
    const run = await createRunWithResults([
      { repId: testRepId1, commissionAmount: 0 },
      { repId: testRepId2, commissionAmount: 500 },
    ]);

    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    expect(res.body.created).toHaveLength(1);
    expect(res.body.created[0].repId).toBe(testRepId2.toString());
    expect(res.body.skipped).toHaveLength(1);
    expect(res.body.skipped[0].reason).toBe("zero commission");
  });

  // ─── Edge case: real-world mid-month + end-of-month ────────────────────────
  test("handles mid-month pay + end-of-month recalculation correctly", async () => {
    // Mid-month run #1: $1000 → generate → mark as paid
    const run1 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);
    await request(app).post(`/api/runs/${run1._id}/generate-payouts`).set(authHeader());
    await Payout.findOneAndUpdate({ repId: testRepId1 }, { status: "paid" });

    // End-of-month run #2: $1500 (rep closed another deal)
    const run2 = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1500 }]);
    const res = await request(app).post(`/api/runs/${run2._id}/generate-payouts`).set(authHeader());

    // Should create delta payout of $500 (not duplicate full $1500)
    expect(res.body.created).toHaveLength(1);
    expect(res.body.created[0].commissionAmount).toBe(500);

    const payouts = await Payout.find({ repId: testRepId1 }).sort({ createdAt: 1 });
    expect(payouts).toHaveLength(2);
    expect(payouts[0].commissionAmount).toBe(1000); // original, paid
    expect(payouts[0].status).toBe("paid");
    expect(payouts[1].commissionAmount).toBe(500); // delta, pending
    expect(payouts[1].status).toBe("pending");
  });

  // ─── Edge case: return 400 for non-completed runs ──────────────────────────
  test("returns 400 if run is not completed", async () => {
    const run = await CommissionRun.create({
      workspaceId,
      period: "2024-03",
      totalCommission: 0,
      totalDeals: 0,
      repsCount: 0,
      status: "pending",
    });

    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("completed");
  });

  test("returns 400 if run is processing", async () => {
    const run = await CommissionRun.create({
      workspaceId,
      period: "2024-03",
      totalCommission: 0,
      totalDeals: 0,
      repsCount: 0,
      status: "processing",
    });

    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(400);
  });

  // ─── Edge case: 404 for non-existent run ──────────────────────────────────
  test("returns 404 for non-existent run", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).post(`/api/runs/${fakeId}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(404);
  });

  // ─── Edge case: custom period params ───────────────────────────────────────
  test("respects custom periodStart and periodEnd query params", async () => {
    const run = await createRunWithResults([{ repId: testRepId1, commissionAmount: 1000 }]);

    const res = await request(app)
      .post(
        `/api/runs/${run._id}/generate-payouts?periodStart=2024-03-15T00:00:00.000Z&periodEnd=2024-03-31T23:59:59.999Z`,
      )
      .set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(1);
    expect(res.body.created[0].periodStart).toContain("2024-03-15");
  });

  // ─── Edge case: default period from run.period ─────────────────────────────
  test("uses run.period as default if no query params provided", async () => {
    const run = await CommissionRun.create({
      workspaceId,
      period: "2024-06",
      totalCommission: 1000,
      totalDeals: 1,
      repsCount: 1,
      status: "completed",
    });

    await CommissionResult.create({
      runId: run._id,
      repId: testRepId1,
      dealId: new mongoose.Types.ObjectId(),
      rateApplied: 10,
      commissionAmount: 1000,
      currency: "USD",
      calculationNote: "Flat 10%",
    });

    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(1);
    expect(res.body.created[0].periodStart).toContain("2024-06-01");
    expect(res.body.created[0].periodEnd).toContain("2024-06-30");
  });

  // ─── Edge case: selective generation by repIds ─────────────────────────────
  test("selectively generates payouts for specified repIds only", async () => {
    const run = await createRunWithResults([
      { repId: testRepId1, commissionAmount: 1000 },
      { repId: testRepId2, commissionAmount: 2000 },
    ]);

    const res = await request(app)
      .post(`/api/runs/${run._id}/generate-payouts`)
      .set(authHeader())
      .send({ repIds: [testRepId1.toString()] });

    expect(res.status).toBe(200);
    expect(res.body.created).toHaveLength(1);
    expect(res.body.created[0].repId).toBe(testRepId1.toString());

    const payouts = await Payout.find({});
    expect(payouts).toHaveLength(1);
  });

  // ─── Edge case: requires authentication ────────────────────────────────────
  test("requires authentication", async () => {
    const authModule = await import("../../lib/auth");
    const originalGetSession = (authModule.auth.api.getSession as any).getMockImplementation();
    (authModule.auth.api.getSession as any) = mock(() => Promise.resolve(null));

    const run = await CommissionRun.create({
      workspaceId,
      period: "2024-03",
      totalCommission: 0,
      totalDeals: 0,
      repsCount: 0,
      status: "completed",
    });

    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`);

    expect(res.status).toBe(401);

    (authModule.auth.api.getSession as any) = mock(() =>
      Promise.resolve(
        originalGetSession
          ? originalGetSession()
          : {
              session: { id: "s1" },
              user: { id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "Admin" },
            },
      ),
    );
  });

  // ─── Aggregate: multiple reps with mixed statuses ──────────────────────────
  test("handles mixed rep statuses correctly in a single run", async () => {
    // Rep 1: already has a paid payout from a prior run
    const priorRun = await createRunWithResults([{ repId: testRepId1, commissionAmount: 500 }]);
    await request(app).post(`/api/runs/${priorRun._id}/generate-payouts`).set(authHeader());
    await Payout.findOneAndUpdate({ repId: testRepId1 }, { status: "paid" });

    // Rep 2: no existing payout

    // New run: Rep1=$1200 (delta=$700), Rep2=$800 (new)
    const run = await createRunWithResults([
      { repId: testRepId1, commissionAmount: 1200 },
      { repId: testRepId2, commissionAmount: 800 },
    ]);

    const res = await request(app).post(`/api/runs/${run._id}/generate-payouts`).set(authHeader());

    expect(res.body.created).toHaveLength(2); // Rep1 delta + Rep2 new
    expect(res.body.skipped).toHaveLength(0);

    // Rep1: 2 payouts (original $500 + delta $700)
    const rep1Payouts = await Payout.find({ repId: testRepId1 }).sort({ createdAt: 1 });
    expect(rep1Payouts).toHaveLength(2);
    expect(rep1Payouts[0].commissionAmount).toBe(500);
    expect(rep1Payouts[1].commissionAmount).toBe(700);

    // Rep2: 1 payout ($800)
    const rep2Payouts = await Payout.find({ repId: testRepId2 });
    expect(rep2Payouts).toHaveLength(1);
    expect(rep2Payouts[0].commissionAmount).toBe(800);
  });
});
