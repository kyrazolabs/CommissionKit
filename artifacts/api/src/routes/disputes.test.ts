import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import mongoose from "mongoose";
import { setupTestDB, teardownTestDB, clearCollections } from "../../test/setup-db";
import request from "supertest";

const TEST_USER_ID = "test-user-001";
const TEST_USER_EMAIL = "admin@test.com";

// ── Mock heavy dependencies ────────────────────────────────────────────────────
mock.module("@workspace/queue", () => ({
  getRedisClient: () => ({
    get: async () => null, setex: async () => "OK", del: async () => 1,
    scan: async () => ["0", []], on: () => {}, quit: async () => "OK",
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
  PRIORITY_QUEUE_MAP: { high: { add: () => Promise.resolve() }, medium: { add: () => Promise.resolve() }, low: { add: () => Promise.resolve() } },
}));

mock.module("../lib/bull-board", () => ({
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

mock.module("../lib/rbac", () => ({
  getUserPermissions: mock(() => Promise.resolve(new Set(["*"]))),
  hasPermission: mock(() => true),
  invalidateUserPermissions: mock(() => Promise.resolve()),
  invalidateWorkspaceRoles: mock(() => Promise.resolve()),
  getUsersWithPermission: mock(() => Promise.resolve([])),
}));

mock.module("../lib/notify", () => ({
  createNotification: mock(() => Promise.resolve()),
}));

let app: any;
let Dispute: any;
let Payout: any;
let Rep: any;
let Workspace: any;
let WorkspaceMember: any;
let WorkspaceSubscription: any;
let workspaceId: string;
let testRepId: any;

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

  const authModule = await import("../lib/auth");
  (authModule.auth.api.getSession as any) = mock(() =>
    Promise.resolve({
      session: { id: "s1" },
      user: { id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "Admin" },
    }),
  );

  const db = await import("@workspace/db");
  await db.connectDB();

  Dispute = db.Dispute;
  Payout = db.Payout;
  Rep = db.Rep;
  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;
  WorkspaceSubscription = db.WorkspaceSubscription;

  app = (await import("../app")).default;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  const ws = await Workspace.create({ slug: "test-ws", name: "Test Workspace", ownerId: TEST_USER_ID });
  workspaceId = ws._id.toString();
  await WorkspaceMember.create({ workspaceId: ws._id, userId: TEST_USER_ID, email: TEST_USER_EMAIL, role: "owner" });
  await WorkspaceSubscription.create({ workspaceId: ws._id, plan: "growth", status: "active", isLifetime: true });
  const rep = await Rep.create({ workspaceId: ws._id, name: "Test Rep", email: TEST_USER_EMAIL });
  testRepId = rep._id;
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

describe("POST /api/disputes", () => {
  test("creates a dispute for a pending payout", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .post("/api/disputes")
      .set(authHeader())
      .send({ payoutId: payout._id.toString(), reason: "The commission calculation seems incorrect based on my records." });

    expect(res.status).toBe(201);
    expect(res.body.reason).toBe("The commission calculation seems incorrect based on my records.");
    expect(res.body.status).toBe("open");
  });

  test("returns 409 for duplicate dispute on same payout", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    // Create first dispute directly so payout status stays "pending"
    await Dispute.create({
      workspaceId, payoutId: payout._id, repId: testRepId,
      reason: "First dispute reason here with enough chars.",
      status: "open",
    });

    const res = await request(app)
      .post("/api/disputes")
      .set(authHeader())
      .send({ payoutId: payout._id.toString(), reason: "Second dispute should be rejected as duplicate." });

    expect(res.status).toBe(409);
  });

  test("returns 400 for reason shorter than 10 characters", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .post("/api/disputes")
      .set(authHeader())
      .send({ payoutId: payout._id.toString(), reason: "Short" });

    expect(res.status).toBe(400);
  });

  test("returns 400 for paid payout", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "paid",
      statusHistory: [{ status: "paid", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .post("/api/disputes")
      .set(authHeader())
      .send({ payoutId: payout._id.toString(), reason: "This is a valid dispute reason for testing." });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/disputes", () => {
  test("returns empty list when no disputes exist", async () => {
    const res = await request(app).get("/api/disputes").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns disputes with rep and payout details", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "disputed",
      statusHistory: [{ status: "disputed", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    await Dispute.create({
      workspaceId, payoutId: payout._id, repId: testRepId,
      reason: "Commission amount does not match expected calculation.",
      status: "open",
    });

    const res = await request(app).get("/api/disputes").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].repName).toBe("Test Rep");
    expect(res.body[0].reason).toBe("Commission amount does not match expected calculation.");
  });

  test("filters by status", async () => {
    const payout1 = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 1000, finalAmount: 1000,
      currency: "USD", status: "disputed",
      statusHistory: [{ status: "disputed", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });
    const payout2 = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-02-01"),
      periodEnd: new Date("2024-02-28"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "disputed",
      statusHistory: [{ status: "disputed", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    await Dispute.create({
      workspaceId, payoutId: payout1._id, repId: testRepId,
      reason: "Dispute number one with sufficient text.",
      status: "resolved",
    });
    await Dispute.create({
      workspaceId, payoutId: payout2._id, repId: testRepId,
      reason: "Dispute number two with sufficient text as well.",
      status: "open",
    });

    const res = await request(app).get("/api/disputes?status=resolved").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe("resolved");
  });
});

describe("PATCH /api/disputes/:id", () => {
  test("updates dispute to under_review", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "disputed",
      statusHistory: [{ status: "disputed", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const dispute = await Dispute.create({
      workspaceId, payoutId: payout._id, repId: testRepId,
      reason: "Commission amount seems off, requesting review.",
      status: "open",
    });

    const res = await request(app)
      .patch(`/api/disputes/${dispute._id}`)
      .set(authHeader())
      .send({ status: "under_review", adminNotes: "Investigating" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("under_review");
  });

  test("resolves dispute and auto-approves payout", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "disputed",
      statusHistory: [{ status: "disputed", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const dispute = await Dispute.create({
      workspaceId, payoutId: payout._id, repId: testRepId,
      reason: "Commission amount should be recalculated.",
      status: "open",
    });

    const res = await request(app)
      .patch(`/api/disputes/${dispute._id}`)
      .set(authHeader())
      .send({ status: "resolved", adminNotes: "Adjustment applied." });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("resolved");
    expect(res.body.resolvedAt).not.toBeNull();

    const updatedPayout = await Payout.findById(payout._id);
    expect(updatedPayout?.status).toBe("approved");
  });

  test("returns 404 for non-existent dispute", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/disputes/${fakeId}`)
      .set(authHeader())
      .send({ status: "under_review" });

    expect(res.status).toBe(404);
  });

  test("returns 400 for invalid status", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "disputed",
      statusHistory: [{ status: "disputed", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });
    const dispute = await Dispute.create({
      workspaceId, payoutId: payout._id, repId: testRepId,
      reason: "Commission miscalculation found in system records.",
      status: "open",
    });

    const res = await request(app)
      .patch(`/api/disputes/${dispute._id}`)
      .set(authHeader())
      .send({ status: "closed" });

    expect(res.status).toBe(400);
  });
});
