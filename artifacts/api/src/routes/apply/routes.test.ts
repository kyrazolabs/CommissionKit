import { describe, test, expect, beforeAll, mock } from "bun:test";
import request from "supertest";

const sendEmailMock = mock(() => Promise.resolve());
mock.module("@workspace/queue", () => ({
  sendMediumPriorityEmail: sendEmailMock,
  // NOTE: getRedisClient mock here does not exercise the real rate-limiter-flexible
  // Redis commands. The test runs with rate limiting effectively disabled,
  // which is acceptable for testing route logic in isolation.
  getRedisClient: () => ({
    get: async () => null,
    setex: async () => "OK",
    del: async () => 1,
    scan: async () => ["0", []],
    on: () => {},
    quit: async () => "OK",
  }),
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

describe("POST /api/apply", () => {
  let app: any;

  beforeAll(async () => {
    process.env.REDIS_URL = "redis://localhost:6379";
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_USER = "test";
    process.env.SMTP_PASS = "test";
    process.env.SENTRY_ENABLED = "false";
    const mod = await import("../../app");
    app = mod.default || mod;
  });

  test("returns 400 for invalid body", async () => {
    const res = await request(app).post("/api/apply").send({
      fullName: "A",
      email: "not-an-email",
      phone: "1",
      location: "",
      experience: "",
      pitch: "hi",
      agreedToTerms: false,
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("ValidationError");
  });

  test("returns 200 and enqueues email for valid body", async () => {
    sendEmailMock.mockClear();

    const res = await request(app).post("/api/apply").send({
      fullName: "Jane Doe",
      email: "jane@example.com",
      phone: "+971 50 123 4567",
      linkedinUrl: "https://linkedin.com/in/janedoe",
      location: "Dubai, UAE",
      experience: "5 years of B2B SaaS sales in the GCC region.",
      pitch: "I know many HR and finance leaders who struggle with commission tracking. I can introduce them to CommissionKit and run demos.",
      agreedToTerms: true,
      position: "sales-representative",
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(sendEmailMock).toHaveBeenCalledTimes(1);

    const callArgs = sendEmailMock.mock.calls[0][0];
    expect(callArgs.to).toBe("abdullah@commissionk.it");
    expect(callArgs.bcc).toBe("sales@commissionk.it");
    expect(callArgs.subject).toContain("Jane Doe");
    expect(callArgs.subject).toContain("sales-representative");
    expect(callArgs.html).toContain("jane@example.com");
    expect(callArgs.html).toContain("sales-representative");
  });
});
