import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import mongoose from "mongoose";
import { setupTestDB, teardownTestDB, clearCollections } from "../../test-setup-db";
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
  enqueueCommissionCalc: mock(() => Promise.resolve()),
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
let CommissionRun: any;
let CommissionResult: any;
let Workspace: any;
let WorkspaceMember: any;
let workspaceId: string;

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

  CommissionRun = db.CommissionRun;
  CommissionResult = db.CommissionResult;
  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;

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
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

describe("GET /api/runs", () => {
  test("returns empty list when no runs exist", async () => {
    const res = await request(app).get("/api/runs").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns runs sorted by creation date", async () => {
    await CommissionRun.create({ workspaceId, period: "2024-01", totalCommission: 1000, totalDeals: 5, repsCount: 2, status: "completed" });
    await CommissionRun.create({ workspaceId, period: "2024-02", totalCommission: 2000, totalDeals: 8, repsCount: 3, status: "completed" });

    const res = await request(app).get("/api/runs").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].period).toBe("2024-02");
  });
});

describe("POST /api/runs", () => {
  test("creates a run and enqueues calculation", async () => {
    const res = await request(app)
      .post("/api/runs")
      .set(authHeader())
      .send({ period: "2024-03" });

    expect(res.status).toBe(201);
    expect(res.body.period).toBe("2024-03");
    expect(res.body.status).toBe("pending");
    expect(res.body.id).toBeDefined();

    const queueMock = await import("@workspace/queue");
    expect(queueMock.enqueueCommissionCalc).toHaveBeenCalled();
  });

  test("returns 409 for duplicate period with active run", async () => {
    await CommissionRun.create({ workspaceId, period: "2024-04", totalCommission: 0, totalDeals: 0, repsCount: 0, status: "processing" });

    const res = await request(app)
      .post("/api/runs")
      .set(authHeader())
      .send({ period: "2024-04" });

    expect(res.status).toBe(409);
  });

  test("returns 400 for invalid body", async () => {
    const res = await request(app)
      .post("/api/runs")
      .set(authHeader())
      .send({});

    expect(res.status).toBe(400);
  });
});

describe("GET /api/runs/:id", () => {
  test("returns run with results", async () => {
    const run = await CommissionRun.create({ workspaceId, period: "2024-03", totalCommission: 500, totalDeals: 1, repsCount: 1, status: "completed" });
    await CommissionResult.create({ runId: run._id, repId: new mongoose.Types.ObjectId(), dealId: new mongoose.Types.ObjectId(), rateApplied: 5, commissionAmount: 500, calculationNote: "5% of 10000 = 500", currency: "USD" });

    const res = await request(app).get(`/api/runs/${run._id}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.period).toBe("2024-03");
    expect(res.body.results.length).toBe(1);
    expect(res.body.results[0].commissionAmount).toBe(500);
  });

  test("returns 404 for non-existent run", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/runs/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });
});
