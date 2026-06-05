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

let app: any;
let Plan: any;
let PlanTier: any;
let Workspace: any;
let WorkspaceMember: any;
let workspaceId: string;

const setEnv = () => {
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
};

beforeAll(async () => {
  await setupTestDB();
  setEnv();

  const authModule = await import("../lib/auth");
  (authModule.auth.api.getSession as any) = mock(() =>
    Promise.resolve({
      session: { id: "s1" },
      user: { id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "Admin" },
    }),
  );

  const db = await import("@workspace/db");
  await db.connectDB();

  Plan = db.Plan;
  PlanTier = db.PlanTier;
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

describe("GET /api/plans", () => {
  test("returns empty list when no plans exist", async () => {
    const res = await request(app).get("/api/plans").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns plans with tiers", async () => {
    const plan = await Plan.create({ workspaceId, name: "Gold", type: "flat", flatRate: 10 });
    await PlanTier.create({ planId: plan._id, fromAmount: 0, toAmount: 5000, rate: 5 });
    await PlanTier.create({ planId: plan._id, fromAmount: 5000, toAmount: null, rate: 8 });

    const res = await request(app).get("/api/plans").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Gold");
    expect(res.body[0].tiers.length).toBe(2);
  });

  test("returns plans sorted by name", async () => {
    await Plan.create({ workspaceId, name: "Beta", type: "flat" });
    await Plan.create({ workspaceId, name: "Alpha", type: "flat" });

    const res = await request(app).get("/api/plans").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body[0].name).toBe("Alpha");
    expect(res.body[1].name).toBe("Beta");
  });
});

describe("POST /api/plans", () => {
  test("creates a flat-rate plan", async () => {
    const res = await request(app)
      .post("/api/plans")
      .set(authHeader())
      .send({ name: "Standard", type: "flat", flatRate: 5 });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Standard");
    expect(res.body.flatRate).toBe(5);
    expect(res.body.tiers).toEqual([]);
  });

  test("creates a tiered plan with tiers", async () => {
    const res = await request(app)
      .post("/api/plans")
      .set(authHeader())
      .send({
        name: "Tiered Plan",
        type: "tiered",
        tiers: [
          { fromAmount: 0, toAmount: 5000, rate: 5 },
          { fromAmount: 5000, toAmount: null, rate: 8 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Tiered Plan");
    expect(res.body.tiers.length).toBe(2);
    expect(res.body.tiers[0].rate).toBe(5);
  });

  test("creates plan with accelerator fields", async () => {
    const res = await request(app)
      .post("/api/plans")
      .set(authHeader())
      .send({ name: "Accelerator Plan", type: "flat", flatRate: 3, acceleratorThreshold: 10000, acceleratorRate: 10, clawbackDays: 30 });

    expect(res.status).toBe(201);
    expect(res.body.acceleratorThreshold).toBe(10000);
    expect(res.body.acceleratorRate).toBe(10);
    expect(res.body.clawbackDays).toBe(30);
  });

  test("returns 400 for invalid body", async () => {
    const res = await request(app)
      .post("/api/plans")
      .set(authHeader())
      .send({ name: "Missing Type" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/plans/:id", () => {
  test("returns plan by id with tiers", async () => {
    const plan = await Plan.create({ workspaceId, name: "Specific Plan", type: "tiered" });
    await PlanTier.create({ planId: plan._id, fromAmount: 0, rate: 10 });

    const res = await request(app).get(`/api/plans/${plan._id}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Specific Plan");
    expect(res.body.tiers.length).toBe(1);
  });

  test("returns 404 for non-existent plan", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/plans/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/plans/:id", () => {
  test("updates plan name and type", async () => {
    const plan = await Plan.create({ workspaceId, name: "Old Plan", type: "flat" });

    const res = await request(app)
      .put(`/api/plans/${plan._id}`)
      .set(authHeader())
      .send({ name: "Updated Plan", type: "tiered", tiers: [] });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Plan");
    expect(res.body.type).toBe("tiered");

    const inDb = await Plan.findById(plan._id);
    expect(inDb?.name).toBe("Updated Plan");
  });

  test("replaces tiers on update", async () => {
    const plan = await Plan.create({ workspaceId, name: "Tier Plan", type: "tiered" });
    await PlanTier.create({ planId: plan._id, fromAmount: 0, rate: 5 });

    const res = await request(app)
      .put(`/api/plans/${plan._id}`)
      .set(authHeader())
      .send({ name: "Tier Plan", type: "tiered", tiers: [{ fromAmount: 0, rate: 10 }] });

    expect(res.status).toBe(200);
    expect(res.body.tiers.length).toBe(1);
    expect(res.body.tiers[0].rate).toBe(10);
  });

  test("returns 404 for non-existent plan", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/plans/${fakeId}`)
      .set(authHeader())
      .send({ name: "Ghost", type: "flat", tiers: [] });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/plans/:id", () => {
  test("deletes plan and its tiers", async () => {
    const plan = await Plan.create({ workspaceId, name: "ToDelete", type: "flat" });
    await PlanTier.create({ planId: plan._id, fromAmount: 0, rate: 5 });

    const res = await request(app).delete(`/api/plans/${plan._id}`).set(authHeader());
    expect(res.status).toBe(204);

    expect(await Plan.findById(plan._id)).toBeNull();
    expect(await PlanTier.countDocuments({ planId: plan._id })).toBe(0);
  });

  test("returns 404 for non-existent plan", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/plans/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });
});
