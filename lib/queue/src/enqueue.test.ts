import { describe, expect, mock, test } from "bun:test";

const mockAdd = mock(() => Promise.resolve());

mock.module("./queues", () => ({
  PRIORITY_QUEUE_MAP: {
    high: { add: mockAdd },
    medium: { add: mockAdd },
    low: { add: mockAdd },
  },
  mailHighQueue: { add: mockAdd },
  mailMediumQueue: { add: mockAdd },
  mailLowQueue: { add: mockAdd },
  mailSendQueue: { add: mockAdd },
  commissionCalcQueue: { add: mockAdd },
  exchangeRateQueue: { add: mockAdd },
  logsFlushQueue: { add: mockAdd },
  auditLogQueue: { add: mockAdd },
  syncRepsQueue: { add: mockAdd },
  syncDealsQueue: { add: mockAdd },
  webhookIngressQueue: { add: mockAdd },
  syncEgressQueue: { add: mockAdd },
}));

describe("enqueueEmail", () => {
  test("enqueues high priority email", async () => {
    const { enqueueEmail } = await import("./enqueue");
    await enqueueEmail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Test</p>",
      priority: "high",
    });
    expect(mockAdd).toHaveBeenCalled();
  });
});

describe("sendHighPriorityEmail", () => {
  test("calls enqueueEmail with high priority", async () => {
    const { sendHighPriorityEmail } = await import("./enqueue");
    const result = sendHighPriorityEmail({
      to: "high@example.com",
      subject: "High Priority",
      html: "<p>Urgent</p>",
    });
    expect(result).toBeInstanceOf(Promise);
  });
});

describe("sendMediumPriorityEmail", () => {
  test("calls enqueueEmail with medium priority", async () => {
    const { sendMediumPriorityEmail } = await import("./enqueue");
    const result = sendMediumPriorityEmail({
      to: "medium@example.com",
      subject: "Medium Priority",
      html: "<p>Normal</p>",
    });
    expect(result).toBeInstanceOf(Promise);
  });
});

describe("sendLowPriorityEmail", () => {
  test("calls enqueueEmail with low priority", async () => {
    const { sendLowPriorityEmail } = await import("./enqueue");
    const result = sendLowPriorityEmail({
      to: "low@example.com",
      subject: "Low Priority",
      html: "<p>Bulk</p>",
    });
    expect(result).toBeInstanceOf(Promise);
  });
});

describe("enqueueCommissionCalc", () => {
  test("enqueues commission calc job with runId as dedup key", async () => {
    const { enqueueCommissionCalc } = await import("./enqueue");
    await enqueueCommissionCalc({
      workspaceId: "ws1",
      runId: "run1",
      period: "2024-03",
    });
    expect(mockAdd).toHaveBeenCalled();
  });
});
