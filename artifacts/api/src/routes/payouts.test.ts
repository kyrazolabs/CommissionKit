import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import { setupTestDB, teardownTestDB, clearCollections } from "../../test/setup-db";
import mongoose from "mongoose";
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
  const rep = await Rep.create({ workspaceId: ws._id, name: "Test Rep", email: "rep@test.com" });
  testRepId = rep._id;
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

describe("GET /api/payouts", () => {
  test("returns empty list when no payouts exist", async () => {
    const res = await request(app).get("/api/payouts").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns payouts with rep names populated", async () => {
    await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2500, finalAmount: 2500,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app).get("/api/payouts").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].repName).toBe("Test Rep");
    expect(res.body[0].commissionAmount).toBe(2500);
  });

  test("filters by status", async () => {
    await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 1000, finalAmount: 1000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });
    await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-02-01"),
      periodEnd: new Date("2024-02-28"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "paid",
      statusHistory: [{ status: "paid", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app).get("/api/payouts?status=paid").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].status).toBe("paid");
  });
});

describe("POST /api/payouts", () => {
  test("creates a single payout", async () => {
    const res = await request(app)
      .post("/api/payouts")
      .set(authHeader())
      .send({
        repId: testRepId.toString(),
        periodStart: "2024-03-01T00:00:00.000Z",
        periodEnd: "2024-03-31T23:59:59.999Z",
        commissionAmount: 3000,
      });

    expect(res.status).toBe(201);
    expect(res.body.created.length).toBe(1);
    expect(res.body.created[0].commissionAmount).toBe(3000);
    expect(res.body.created[0].status).toBe("pending");
  });

  test("creates multiple payouts in bulk", async () => {
    const rep2 = await Rep.create({ workspaceId, name: "Rep Two", email: "rep2@test.com" });

    const res = await request(app)
      .post("/api/payouts")
      .set(authHeader())
      .send([
        { repId: testRepId.toString(), periodStart: "2024-03-01T00:00:00.000Z", periodEnd: "2024-03-31T23:59:59.999Z", commissionAmount: 1000 },
        { repId: rep2._id.toString(), periodStart: "2024-03-01T00:00:00.000Z", periodEnd: "2024-03-31T23:59:59.999Z", commissionAmount: 2000 },
      ]);

    expect(res.status).toBe(201);
    expect(res.body.created.length).toBe(2);
  });

  test("returns 400 for invalid body", async () => {
    const res = await request(app)
      .post("/api/payouts")
      .set(authHeader())
      .send({ repId: testRepId.toString() });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/payouts/:id", () => {
  test("returns payout by id", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 1500, finalAmount: 1500,
      currency: "USD", status: "approved",
      statusHistory: [{ status: "approved", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app).get(`/api/payouts/${payout._id}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.commissionAmount).toBe(1500);
  });

  test("returns 404 for non-existent payout", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/payouts/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/payouts/:id/status", () => {
  test("updates payout status to approved", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}/status`)
      .set(authHeader())
      .send({ status: "approved", notes: "Looks good" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("approved");
  });

  test("returns 400 for invalid status value", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}/status`)
      .set(authHeader())
      .send({ status: "invalid_status" });

    expect(res.status).toBe(400);
  });

  test("blocks modifying already paid payout", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "paid",
      statusHistory: [{ status: "paid", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}/status`)
      .set(authHeader())
      .send({ status: "approved" });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/payouts/:id/adjust", () => {
  test("adds positive adjustment to payout", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}/adjust`)
      .set(authHeader())
      .send({ amount: 500, note: "Bonus" });

    expect(res.status).toBe(200);
    expect(res.body.adjustments).toBe(500);
    expect(res.body.finalAmount).toBe(2500);
  });

  test("applies negative adjustment (clawback)", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}/adjust`)
      .set(authHeader())
      .send({ amount: -200, note: "Clawback" });

    expect(res.status).toBe(200);
    expect(res.body.adjustments).toBe(-200);
    expect(res.body.finalAmount).toBe(1800);
  });

  test("returns 400 for non-numeric amount", async () => {
    const payout = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .patch(`/api/payouts/${payout._id}/adjust`)
      .set(authHeader())
      .send({ amount: "five_hundred" });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/payouts/bulk-approve", () => {
  test("bulk approves pending payouts", async () => {
    const p1 = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-03-01"),
      periodEnd: new Date("2024-03-31"), commissionAmount: 1000, finalAmount: 1000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });
    const p2 = await Payout.create({
      workspaceId, repId: testRepId, periodStart: new Date("2024-02-01"),
      periodEnd: new Date("2024-02-28"), commissionAmount: 2000, finalAmount: 2000,
      currency: "USD", status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: TEST_USER_ID }],
    });

    const res = await request(app)
      .post("/api/payouts/bulk-approve")
      .set(authHeader())
      .send({ ids: [p1._id.toString(), p2._id.toString()] });

    expect(res.status).toBe(200);
    expect(res.body.approved).toBe(2);
  });

  test("returns 400 when no ids provided", async () => {
    const res = await request(app)
      .post("/api/payouts/bulk-approve")
      .set(authHeader())
      .send({});

    expect(res.status).toBe(400);
  });
});
