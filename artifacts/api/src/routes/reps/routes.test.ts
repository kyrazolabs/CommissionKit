import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from "bun:test";
import mongoose from "mongoose";
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

let app: any;
let Rep: any;
let Plan: any;
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
  (authModule.auth.api.signUpEmail as any) = mock(() => Promise.resolve({}));

  const db = await import("@workspace/db");
  await db.connectDB();

  Rep = db.Rep;
  Plan = db.Plan;
  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;

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

describe("GET /api/reps", () => {
  test("returns 401 without auth", async () => {
    const authLib = await import("../../lib/auth");
    (authLib.auth.api.getSession as any).mockResolvedValueOnce(null);

    const res = await request(app).get("/api/reps");
    expect(res.status).toBe(401);
  });

  test("returns empty list when no reps exist", async () => {
    const res = await request(app).get("/api/reps").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("returns list of reps sorted by name", async () => {
    await Rep.create({ workspaceId, name: "Charlie", email: "charlie@test.com" });
    await Rep.create({ workspaceId, name: "Alice", email: "alice@test.com" });
    await Rep.create({ workspaceId, name: "Bob", email: "bob@test.com" });

    const res = await request(app).get("/api/reps").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body[0].name).toBe("Alice");
  });

  test("includes planName when rep has a plan", async () => {
    const plan = await Plan.create({ workspaceId, name: "Gold Plan", type: "flat" });
    const rep = await Rep.create({
      workspaceId,
      name: "Dave",
      email: "dave@test.com",
      planId: plan._id,
    });

    const res = await request(app).get("/api/reps").set(authHeader());
    expect(res.status).toBe(200);
    const found = res.body.find((r: any) => r.name === "Dave");
    expect(found.planName).toBe("Gold Plan");
  });
});

describe("POST /api/reps", () => {
  test("creates a rep and returns 201", async () => {
    const res = await request(app)
      .post("/api/reps")
      .set(authHeader())
      .send({ name: "Eve", email: "eve@test.com", role: "Sales Rep" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Eve");
    expect(res.body.email).toBe("eve@test.com");
    expect(res.body.portalAccessCode).toBeDefined();
    expect(res.body.portalAccessCode.length).toBeGreaterThan(0);

    const inDb = await Rep.findOne({ name: "Eve" });
    expect(inDb).not.toBeNull();
  });

  test("assigns a plan when planId is provided", async () => {
    const plan = await Plan.create({ workspaceId, name: "Silver Plan", type: "tiered" });

    const res = await request(app).post("/api/reps").set(authHeader()).send({
      name: "Frank",
      email: "frank@test.com",
      role: "Sales Rep",
      planId: plan._id.toString(),
    });

    expect(res.status).toBe(201);
    expect(res.body.planName).toBe("Silver Plan");
  });

  test("returns 400 for invalid body (missing name)", async () => {
    const res = await request(app)
      .post("/api/reps")
      .set(authHeader())
      .send({ email: "no-name@test.com" });

    expect(res.status).toBe(400);
  });
});

describe("GET /api/reps/:id", () => {
  test("returns rep by id", async () => {
    const rep = await Rep.create({ workspaceId, name: "Grace", email: "grace@test.com" });

    const res = await request(app).get(`/api/reps/${rep._id}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Grace");
  });

  test("returns 404 for non-existent rep", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/reps/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });

  test("returns 500 for non-hex string id", async () => {
    const res = await request(app).get("/api/reps/not-valid").set(authHeader());
    expect(res.status).toBe(500);
  });
});

describe("PUT /api/reps/:id", () => {
  test("updates rep name and email", async () => {
    const rep = await Rep.create({ workspaceId, name: "Old Name", email: "old@test.com" });

    const res = await request(app)
      .put(`/api/reps/${rep._id}`)
      .set(authHeader())
      .send({ name: "New Name", email: "new@test.com", role: "Account Manager" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New Name");
    expect(res.body.email).toBe("new@test.com");

    const inDb = await Rep.findById(rep._id);
    expect(inDb?.name).toBe("New Name");
  });

  test("returns 404 for non-existent rep", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/reps/${fakeId}`)
      .set(authHeader())
      .send({ name: "Ghost", email: "ghost@test.com", role: "Sales Rep" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/reps/:id", () => {
  test("deletes rep and returns 204", async () => {
    const rep = await Rep.create({ workspaceId, name: "ToDelete", email: "del@test.com" });

    const res = await request(app).delete(`/api/reps/${rep._id}`).set(authHeader());
    expect(res.status).toBe(204);

    const inDb = await Rep.findById(rep._id);
    expect(inDb).toBeNull();
  });
});

describe("POST /api/reps/:id/send-portal-link", () => {
  test("sends portal link for existing rep", async () => {
    const rep = await Rep.create({
      workspaceId,
      name: "Portal User",
      email: "portal@test.com",
      portalAccessCode: "existing-code",
      portalUsername: "portal.user",
    });

    const res = await request(app).post(`/api/reps/${rep._id}/send-portal-link`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.portalAccessCode).toBe("existing-code");
  });

  test("generates access code if rep has none", async () => {
    const rep = await Rep.create({ workspaceId, name: "No Code Rep", email: "nocode@test.com" });

    const res = await request(app).post(`/api/reps/${rep._id}/send-portal-link`).set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body.portalAccessCode).toBeDefined();
    expect(res.body.portalAccessCode.length).toBeGreaterThan(0);
  });

  test("returns 404 for non-existent rep", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).post(`/api/reps/${fakeId}/send-portal-link`).set(authHeader());

    expect(res.status).toBe(404);
  });
});
