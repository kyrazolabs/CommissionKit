import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import mongoose from "mongoose";
import { setupTestDB, teardownTestDB, clearCollections } from "../../../test/setup-db";
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

mock.module("../../lib/auth", () => {
  // Mock auth to prevent betterAuth init failure in CI
  const authMock = {
    handler: (req: any, res: any, next: any) => next(),
    api: { getSession: mock(() => Promise.resolve(null)) },
  };
  return { auth: authMock, findUserById: mock(() => Promise.resolve(null)) };
}; const _authInit = ({
  auth: {
    api: {
      getSession: mock(() => Promise.resolve(null)),
    },
  },
  findUserById: mock(() => Promise.resolve(null)),
}));

mock.module("../../lib/notify", () => ({
  createNotification: mock(() => Promise.resolve()),
}));

let app: any;
let Deal: any;
let Rep: any;
let Plan: any;
let Workspace: any;
let WorkspaceMember: any;
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

  const authModule = await import("../../lib/auth");
  (authModule.auth.api.getSession as any) = mock(() =>
    Promise.resolve({
      session: { id: "s1" },
      user: { id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "Admin" },
    }),
  );

  const db = await import("@workspace/db");
  await db.connectDB();

  Deal = db.Deal;
  Rep = db.Rep;
  Plan = db.Plan;
  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;

  app = (await import("../../app")).default;
});

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  const ws = await Workspace.create({ slug: "test-ws", name: "Test Workspace", ownerId: TEST_USER_ID });
  workspaceId = ws._id.toString();
  await WorkspaceMember.create({ workspaceId: ws._id, userId: TEST_USER_ID, email: TEST_USER_EMAIL, role: "owner" });
  const rep = await Rep.create({ workspaceId: ws._id, name: "Test Rep", email: "rep@test.com" });
  testRepId = rep._id;
});

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

const validDeal = () => ({
  repId: testRepId.toString(),
  name: "Enterprise Sale",
  amount: 10000,
  closeDate: "2024-03-15",
  period: "2024-03",
  stage: "closed_won" as const,
  currency: "USD",
});

describe("GET /api/deals", () => {
  test("returns empty list when no deals exist", async () => {
    const res = await request(app).get("/api/deals").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns deals with rep names populated", async () => {
    await Deal.create({ workspaceId, repId: testRepId, name: "Deal A", amount: 5000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won" });
    await Deal.create({ workspaceId, repId: testRepId, name: "Deal B", amount: 8000, closeDate: "2024-03-05", period: "2024-03", stage: "closed_won" });

    const res = await request(app).get("/api/deals").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].repName).toBe("Test Rep");
  });

  test("filters by repId query parameter", async () => {
    const otherRep = await Rep.create({ workspaceId, name: "Other Rep", email: "other@test.com" });
    await Deal.create({ workspaceId, repId: testRepId, name: "Rep1 Deal", amount: 1000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won" });
    await Deal.create({ workspaceId, repId: otherRep._id, name: "Rep2 Deal", amount: 2000, closeDate: "2024-03-02", period: "2024-03", stage: "closed_won" });

    const res = await request(app).get(`/api/deals?repId=${testRepId}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Rep1 Deal");
  });

  test("filters by paymentStatus", async () => {
    await Deal.create({ workspaceId, repId: testRepId, name: "Paid Deal", amount: 1000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won", paymentStatus: "paid" });
    await Deal.create({ workspaceId, repId: testRepId, name: "Unpaid Deal", amount: 2000, closeDate: "2024-03-02", period: "2024-03", stage: "closed_won", paymentStatus: "unpaid" });

    const res = await request(app).get("/api/deals?paymentStatus=paid").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Paid Deal");
  });
});

describe("POST /api/deals", () => {
  test("creates a deal with defaults", async () => {
    const res = await request(app)
      .post("/api/deals")
      .set(authHeader())
      .send(validDeal());

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Enterprise Sale");
    expect(res.body.amount).toBe(10000);
    expect(res.body.currency).toBe("USD");
    expect(res.body.paymentStatus).toBe("unpaid");
    expect(res.body.repName).toBe("Test Rep");
  });

  test("accepts custom currency and paymentStatus", async () => {
    const res = await request(app)
      .post("/api/deals")
      .set(authHeader())
      .send({ ...validDeal(), currency: "EUR", paymentStatus: "paid", notes: "Important" });

    expect(res.status).toBe(201);
    expect(res.body.currency).toBe("EUR");
    expect(res.body.paymentStatus).toBe("paid");
    expect(res.body.notes).toBe("Important");
  });

  test("returns 400 for invalid body", async () => {
    const res = await request(app)
      .post("/api/deals")
      .set(authHeader())
      .send({ repId: testRepId.toString() });

    expect(res.status).toBe(400);
  });
});

describe("POST /api/deals/import", () => {
  test("imports deals in bulk", async () => {
    const res = await request(app)
      .post("/api/deals/import")
      .set(authHeader())
      .send({
        period: "2024-03",
        deals: [
          { repId: testRepId.toString(), name: "Import A", amount: 1000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won", currency: "USD" },
          { repId: testRepId.toString(), name: "Import B", amount: 2000, closeDate: "2024-03-02", period: "2024-03", stage: "closed_won", currency: "USD" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(2);
    expect(res.body.skipped).toBe(0);
    expect(res.body.errors).toEqual([]);
  });

  test("skips deals with invalid repId", async () => {
    const res = await request(app)
      .post("/api/deals/import")
      .set(authHeader())
      .send({
        period: "2024-03",
        deals: [
          { repId: testRepId.toString(), name: "Valid", amount: 1000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won", currency: "USD" },
          { repId: new mongoose.Types.ObjectId().toString(), name: "Invalid Rep", amount: 2000, closeDate: "2024-03-02", period: "2024-03", stage: "closed_won", currency: "USD" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.imported).toBe(1);
    expect(res.body.skipped).toBe(1);
    expect(res.body.errors.length).toBe(1);
  });
});

describe("DELETE /api/deals/:id", () => {
  test("deletes deal and returns 204", async () => {
    const deal = await Deal.create({ workspaceId, repId: testRepId, name: "ToDelete", amount: 5000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won" });

    const res = await request(app).delete(`/api/deals/${deal._id}`).set(authHeader());
    expect(res.status).toBe(204);

    expect(await Deal.findById(deal._id)).toBeNull();
  });
});

describe("PUT /api/deals/:id", () => {
  test("updates a deal", async () => {
    const deal = await Deal.create({ workspaceId, repId: testRepId, name: "Old Name", amount: 5000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won" });

    const res = await request(app)
      .put(`/api/deals/${deal._id}`)
      .set(authHeader())
      .send({ repId: testRepId.toString(), name: "New Name", amount: 8000, closeDate: "2024-03-15", period: "2024-03", stage: "closed_won", currency: "USD" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
    expect(res.body.amount).toBe(8000);
  });

  test("blocks editing paid deals", async () => {
    const deal = await Deal.create({ workspaceId, repId: testRepId, name: "Paid Deal", amount: 5000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won", paymentStatus: "paid" });

    const res = await request(app)
      .put(`/api/deals/${deal._id}`)
      .set(authHeader())
      .send({ repId: testRepId.toString(), name: "Edited Paid", amount: 10000, closeDate: "2024-03-15", period: "2024-03", stage: "closed_won", currency: "USD" });

    expect(res.status).toBe(400);
  });

  test("auto-sets stage to closed_won when marking paid", async () => {
    const deal = await Deal.create({ workspaceId, repId: testRepId, name: "Mark Paid", amount: 5000, closeDate: "2024-03-01", period: "2024-03", stage: "pending", paymentStatus: "unpaid" });

    const res = await request(app)
      .put(`/api/deals/${deal._id}`)
      .set(authHeader())
      .send({ repId: testRepId.toString(), name: "Mark Paid", amount: 5000, closeDate: "2024-03-01", period: "2024-03", stage: "pending", currency: "USD", paymentStatus: "paid" });

    expect(res.status).toBe(200);
    expect(res.body.stage).toBe("closed_won");
  });

  test("returns 404 for non-existent deal", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/deals/${fakeId}`)
      .set(authHeader())
      .send({ repId: testRepId.toString(), name: "Ghost", amount: 5000, closeDate: "2024-03-01", period: "2024-03", stage: "closed_won", currency: "USD" });

    expect(res.status).toBe(404);
  });
});
