import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  mock,
  setDefaultTimeout,
  test,
} from "bun:test";

setDefaultTimeout(120000);
import mongoose from "mongoose";
import request from "supertest";
import { clearCollections, setupTestDB, teardownTestDB } from "../../../test/setup-db";

const TEST_USER_ID = "test-user-001";
const TEST_USER_EMAIL = "admin@test.com";

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
let Product: any;
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

  const authModule = await import("../../lib/auth");
  (authModule.auth.api.getSession as any) = mock(() =>
    Promise.resolve({
      session: { id: "s1" },
      user: { id: TEST_USER_ID, email: TEST_USER_EMAIL, name: "Admin" },
    }),
  );

  const db = await import("@workspace/db");
  await db.connectDB();

  Product = db.Product;
  Workspace = db.Workspace;
  WorkspaceMember = db.WorkspaceMember;

  app = (await import("../../app")).default;
}, 120000);

afterAll(async () => {
  await teardownTestDB();
}, 30000);

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

const authHeader = () => ({ "X-Workspace-ID": workspaceId });

describe("GET /api/products", () => {
  test("returns empty list when no products exist", async () => {
    const res = await request(app).get("/api/products").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
    expect(res.body.pagination.total).toBe(0);
  });

  test("returns products newest first", async () => {
    await Product.create({ workspaceId, name: "Alpha", kind: "service" });
    await Product.create({ workspaceId, name: "Beta", kind: "vehicle" });

    const res = await request(app).get("/api/products").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.data[0].name).toBe("Beta");
    expect(res.body.data[1].name).toBe("Alpha");
  });

  test("filters by kind", async () => {
    await Product.create({ workspaceId, name: "Listing", kind: "property" });
    await Product.create({ workspaceId, name: "Policy", kind: "insurance" });

    const res = await request(app).get("/api/products?kind=property").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Listing");
  });

  test("searches by name", async () => {
    await Product.create({ workspaceId, name: "Downtown Condo", kind: "property" });
    await Product.create({ workspaceId, name: "Sedan Lease", kind: "vehicle" });

    const res = await request(app).get("/api/products?search=condo").set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].name).toBe("Downtown Condo");
  });
});

describe("POST /api/products", () => {
  test("creates a product", async () => {
    const res = await request(app).post("/api/products").set(authHeader()).send({
      name: "Retainer",
      kind: "service",
      unitPrice: 1500,
      currency: "USD",
    });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Retainer");
    expect(res.body.kind).toBe("service");
    expect(res.body.unitPrice).toBe(1500);
    expect(res.body.status).toBe("active");
    expect(res.body.sku).toBeNull();
    expect(res.body.hasImage).toBe(false);
    expect(res.body.attributes).toEqual({});
  });

  test("stores kind-specific attributes", async () => {
    const res = await request(app).post("/api/products").set(authHeader()).send({
      name: "Sedan",
      kind: "vehicle",
      attributes: { make: "Toyota", model: "Camry", year: 2022 },
    });

    expect(res.status).toBe(201);
    expect(res.body.attributes.make).toBe("Toyota");
    expect(res.body.attributes.year).toBe(2022);
  });

  test("rejects invalid attributes", async () => {
    const res = await request(app).post("/api/products").set(authHeader()).send({
      name: "Retainer",
      kind: "service",
      attributes: { billingCycle: "weekly" },
    });

    expect(res.status).toBe(400);
  });

  test("returns 400 for invalid kind", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(authHeader())
      .send({ name: "Widget", kind: "gadget" });

    expect(res.status).toBe(400);
  });

  test("returns 400 for missing name", async () => {
    const res = await request(app)
      .post("/api/products")
      .set(authHeader())
      .send({ kind: "service" });

    expect(res.status).toBe(400);
  });

  test("rejects duplicate SKU in the same workspace", async () => {
    await request(app)
      .post("/api/products")
      .set(authHeader())
      .send({ name: "One", kind: "service", sku: "SKU-1" });

    const res = await request(app)
      .post("/api/products")
      .set(authHeader())
      .send({ name: "Two", kind: "service", sku: "SKU-1" });

    expect(res.status).toBe(409);
  });
});

describe("GET /api/products/:id", () => {
  test("returns product by id", async () => {
    const product = await Product.create({
      workspaceId,
      name: "Policy A",
      kind: "insurance",
      sku: "INS-1",
    });

    const res = await request(app).get(`/api/products/${product._id}`).set(authHeader());
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Policy A");
    expect(res.body.sku).toBe("INS-1");
  });

  test("returns 404 for non-existent product", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/products/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/products/:id", () => {
  test("updates product fields", async () => {
    const product = await Product.create({ workspaceId, name: "Old", kind: "other" });

    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set(authHeader())
      .send({ name: "New", kind: "job", unitPrice: 80, currency: "GBP" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("New");
    expect(res.body.kind).toBe("job");
    expect(res.body.unitPrice).toBe(80);
    expect(res.body.currency).toBe("GBP");
  });

  test("returns 404 for non-existent product", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set(authHeader())
      .send({ name: "Ghost", kind: "other" });

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/products/:id", () => {
  test("deletes a product", async () => {
    const product = await Product.create({ workspaceId, name: "Gone", kind: "service" });

    const res = await request(app).delete(`/api/products/${product._id}`).set(authHeader());
    expect(res.status).toBe(204);
    expect(await Product.findById(product._id)).toBeNull();
  });

  test("returns 404 for non-existent product", async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app).delete(`/api/products/${fakeId}`).set(authHeader());
    expect(res.status).toBe(404);
  });
});
