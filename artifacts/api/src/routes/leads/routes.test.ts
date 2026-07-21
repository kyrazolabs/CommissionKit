import { describe, test, expect, beforeAll, afterAll, beforeEach, mock } from "bun:test";
import request from "supertest";
import express from "express";
import { Lead } from "@workspace/db/schema";
import { setupTestDB, teardownTestDB } from "../../../test/setup-db";

const sendEmailMock = mock(() => Promise.resolve());

// In-memory mock of the rate-limiter middleware so the lead rate limit can be exercised
// without depending on a real Redis server or rate-limiter-flexible internals.
let leadRateLimitPoints = 5;
const rateLimiterPath = "/root/workspaces/CommissionKit/artifacts/api/src/middleware/rate-limiter.ts";
mock.module(rateLimiterPath, () => ({
  defaultRateLimit: (_req: any, _res: any, next: any) => next(),
  authRateLimit: (_req: any, _res: any, next: any) => next(),
  webhookRateLimit: (_req: any, _res: any, next: any) => next(),
  applyRateLimit: (_req: any, _res: any, next: any) => next(),
  leadRateLimit: (_req: any, res: any, next: any) => {
    if (leadRateLimitPoints <= 0) {
      res.setHeader("X-RateLimit-Limit", 5);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("Retry-After", "3600");
      res.status(429).json({ error: "TooManyRequests", message: "Rate limit exceeded. Please slow down." });
      return;
    }
    leadRateLimitPoints--;
    next();
  },
}));

mock.module("@workspace/queue", () => ({
  sendHighPriorityEmail: () => Promise.resolve(),
  sendMediumPriorityEmail: sendEmailMock,
  sendLowPriorityEmail: () => Promise.resolve(),
  enqueueEmail: () => Promise.resolve(),
  enqueueCommissionCalc: () => Promise.resolve(),
  enqueueExchangeRateSync: () => Promise.resolve(),
  enqueueLogsFlush: () => Promise.resolve(),
  enqueueAuditEvent: () => Promise.resolve(),
  fetchAndSaveRates: () => Promise.resolve(),
  closeRedis: () => Promise.resolve(),
  getRedisClient: () => ({
    get: async () => null,
    setex: async () => "OK",
    del: async () => 1,
    scan: async () => ["0", []],
    on: () => {},
    quit: async () => "OK",
  }),
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
  PRIORITY_QUEUE_MAP: { high: { add: () => Promise.resolve() }, medium: { add: () => Promise.resolve() }, low: { add: () => Promise.resolve() } },
}));



describe("POST /api/leads", () => {
  let app: any;

  beforeAll(async () => {
    await setupTestDB();
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_USER = "test";
    process.env.SMTP_PASS = "test";
    process.env.SENTRY_ENABLED = "false";

    // Build a minimal app with only the leads route so mocks for the
    // rate-limiter middleware are applied fresh, regardless of other test files.
    const { default: leadsRouter } = await import("./routes");
    app = express();
    app.use(express.json());
    app.use("/api", leadsRouter);
  });

  afterAll(async () => {
    await teardownTestDB();
  });

  beforeEach(async () => {
    sendEmailMock.mockClear();
    leadRateLimitPoints = 5;
    await Lead.deleteMany({});
  });

  test("returns 400 for invalid email", async () => {
    const res = await request(app).post("/api/leads").send({
      email: "not-an-email",
      source: "hero",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
    expect(res.body.details).toHaveProperty("email");
  });

  test("returns 400 when source is missing or invalid", async () => {
    const missing = await request(app).post("/api/leads").send({
      email: "test@example.com",
    });
    expect(missing.status).toBe(400);
    expect(missing.body.error).toBe("ValidationError");
    expect(missing.body.details).toHaveProperty("source");

    const invalid = await request(app).post("/api/leads").send({
      email: "test@example.com",
      source: "newsletter",
    });
    expect(invalid.status).toBe(400);
    expect(invalid.body.error).toBe("ValidationError");
    expect(invalid.body.details).toHaveProperty("source");
  });

  test("returns 200 and enqueues email for valid body", async () => {
    const res = await request(app).post("/api/leads").send({
      email: "jane@example.com",
      source: "hero",
      name: "Jane Doe",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const callArgs = sendEmailMock.mock.calls[0][0];
    expect(callArgs.to).toBe("sales@commissionk.it");
    expect(callArgs.subject).toBe("New Lead — hero");
    expect(callArgs.html).toContain("jane@example.com");
    expect(callArgs.html).toContain("hero");
    expect(callArgs.html).toContain("Jane Doe");

    const lead = await Lead.findOne({ email: "jane@example.com" });
    expect(lead).not.toBeNull();
    expect(lead?.source).toBe("hero");
    expect(lead?.name).toBe("Jane Doe");
    expect(lead?.status).toBe("new");
  });

  test("updates existing lead on duplicate email instead of erroring", async () => {
    const first = await request(app).post("/api/leads").send({
      email: "dup@example.com",
      source: "hero",
      name: "First",
    });
    expect(first.status).toBe(200);

    const before = await Lead.findOne({ email: "dup@example.com" });
    const firstUpdatedAt = before?.updatedAt;

    // Small delay so updatedAt is guaranteed to change.
    await new Promise((r) => setTimeout(r, 10));

    const second = await request(app).post("/api/leads").send({
      email: "dup@example.com",
      source: "calculator",
      name: "Second",
    });
    expect(second.status).toBe(200);
    expect(second.body.success).toBe(true);

    const after = await Lead.findOne({ email: "dup@example.com" });
    expect(after).not.toBeNull();
    expect(after?.source).toBe("calculator");
    expect(after?.name).toBe("Second");
    expect(after?.status).toBe("new");
    expect(after?.updatedAt.getTime()).toBeGreaterThan(firstUpdatedAt!.getTime());

    // Only one lead document should exist.
    const count = await Lead.countDocuments({ email: "dup@example.com" });
    expect(count).toBe(1);
  });

  test("rate limits after 5 submissions from the same IP", async () => {
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post("/api/leads").send({
        email: `lead${i}@example.com`,
        source: "calculator",
      });
      expect(res.status).toBe(200);
    }

    const blocked = await request(app).post("/api/leads").send({
      email: "blocked@example.com",
      source: "calculator",
    });

    expect(blocked.status).toBe(429);
    expect(blocked.body.error).toBe("TooManyRequests");
  });
});
