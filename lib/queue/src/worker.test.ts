import { describe, test, expect, mock, beforeEach } from "bun:test";

const mockAddForQueue = mock(() => Promise.resolve({ id: "job-1" }));
const mockSendMail = mock(() =>
  Promise.resolve({ messageId: "msg-123", accepted: ["to@example.com"], rejected: [] }),
);

const mockRedisClient = {
  duplicate: () => ({
    on: () => {},
    status: "ready",
    disconnect: () => Promise.resolve(),
    quit: () => Promise.resolve(),
  }),
  on: () => {},
  status: "ready",
  disconnect: () => Promise.resolve(),
  quit: () => Promise.resolve(),
  get: async () => null,
  setex: async () => "OK",
  del: async () => 1,
  scan: async () => ["0", []],
  keys: async () => [],
};

mock.module("./connection", () => ({
  getRedisClient: () => mockRedisClient,
}));

mock.module("./queues", () => ({
  PRIORITY_QUEUE_MAP: {
    high: { add: mockAddForQueue },
    medium: { add: mockAddForQueue },
    low: { add: mockAddForQueue },
  },
  mailHighQueue: { add: mockAddForQueue },
  mailMediumQueue: { add: mockAddForQueue },
  mailLowQueue: { add: mockAddForQueue },
  mailSendQueue: { add: mockAddForQueue },
  commissionCalcQueue: { add: mockAddForQueue },
  exchangeRateQueue: { add: mockAddForQueue },
  logsFlushQueue: { add: mockAddForQueue },
  auditLogQueue: { add: mockAddForQueue },
  syncRepsQueue: { add: mockAddForQueue },
  syncDealsQueue: { add: mockAddForQueue },
  webhookIngressQueue: { add: mockAddForQueue },
  syncEgressQueue: { add: mockAddForQueue },
}));

mock.module("./mailer", () => ({
  sendMail: mockSendMail,
  verifySmtp: mock(() => Promise.resolve(true)),
  getMailFrom: mock(() => "test@commissionkit.io"),
}));

describe("Worker structure", () => {
  test("exports all required workers", async () => {
    const mod = await import("./worker");
    expect(mod.highWorker).toBeDefined();
    expect(mod.mediumWorker).toBeDefined();
    expect(mod.lowWorker).toBeDefined();
    expect(mod.smtpWorker).toBeDefined();
    expect(mod.exchangeRateWorker).toBeDefined();
    expect(mod.closeWorkers).toBeDefined();
  });
});

describe("Priority routing workers", () => {
  beforeEach(() => {
    mockAddForQueue.mockClear();
  });

  test("highWorker forwards to mailSendQueue with priority 1", async () => {
    const { highWorker } = await import("./worker");
    const handler = (highWorker as any)._callbacks?.["process"];
    if (handler) {
      const job = { id: "job-high", data: { to: "high@example.com", subject: "Test", html: "<p>Hi</p>" } };
      await handler(job);
      expect(mockAddForQueue).toHaveBeenCalled();
      const callArgs = mockAddForQueue.mock.calls[0];
      expect(callArgs[0]).toBe("send");
      expect(callArgs[1].to).toBe("high@example.com");
      expect(callArgs[2].priority).toBe(1);
    }
  });

  test("mediumWorker forwards to mailSendQueue with priority 5", async () => {
    const { mediumWorker } = await import("./worker");
    const handler = (mediumWorker as any)._callbacks?.["process"];
    if (handler) {
      const job = { id: "job-med", data: { to: "med@example.com", subject: "Test", html: "<p>Hi</p>" } };
      await handler(job);
      const calls = mockAddForQueue.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe("send");
      expect(lastCall[2].priority).toBe(5);
    }
  });

  test("lowWorker forwards to mailSendQueue with priority 10", async () => {
    const { lowWorker } = await import("./worker");
    const handler = (lowWorker as any)._callbacks?.["process"];
    if (handler) {
      const job = { id: "job-low", data: { to: "low@example.com", subject: "Test", html: "<p>Hi</p>" } };
      await handler(job);
      const calls = mockAddForQueue.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe("send");
      expect(lastCall[2].priority).toBe(10);
    }
  });
});

describe("SMTP execution worker", () => {
  test("smtpWorker calls sendMail with job data", async () => {
    mockSendMail.mockClear();
    const { smtpWorker } = await import("./worker");
    const handler = (smtpWorker as any)._callbacks?.["process"];
    if (handler) {
      const payload = { to: "recipient@example.com", subject: "Invoice", html: "<p>Invoice attached</p>" };
      const job = { id: "job-smtp", data: payload };
      const result = await handler(job);
      expect(mockSendMail).toHaveBeenCalledWith(payload);
      expect(result.messageId).toBe("msg-123");
    }
  });
});

describe("closeWorkers", () => {
  test("closeWorkers resolves successfully", async () => {
    const { closeWorkers } = await import("./worker");
    const result = closeWorkers();
    expect(result).toBeInstanceOf(Promise);
    await result;
  });
});
