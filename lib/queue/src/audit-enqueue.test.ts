import { describe, expect, mock, test } from "bun:test";

const mockAdd = mock(() => Promise.resolve());

mock.module("./queues", () => ({
  auditLogQueue: { add: mockAdd },
  PRIORITY_QUEUE_MAP: { high: { add: mockAdd }, medium: { add: mockAdd }, low: { add: mockAdd } },
  mailHighQueue: { add: mockAdd },
  mailMediumQueue: { add: mockAdd },
  mailLowQueue: { add: mockAdd },
  mailSendQueue: { add: mockAdd },
  commissionCalcQueue: { add: mockAdd },
  exchangeRateQueue: { add: mockAdd },
  logsFlushQueue: { add: mockAdd },
  syncRepsQueue: { add: mockAdd },
  syncDealsQueue: { add: mockAdd },
  webhookIngressQueue: { add: mockAdd },
  syncEgressQueue: { add: mockAdd },
}));

describe("enqueueAuditEvent", () => {
  test("enqueues a valid audit event", async () => {
    const { enqueueAuditEvent } = await import("./enqueue");
    await enqueueAuditEvent({
      workspaceId: "ws1",
      userId: "u1",
      userName: "Admin",
      userEmail: "admin@test.com",
      action: "create",
      resourceType: "deal",
      resourceId: "deal1",
      resourceName: "Acme Deal",
      changes: [{ field: "name", from: null, to: "Acme Deal" }],
      metadata: { source: "test" },
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0",
    });
    expect(mockAdd).toHaveBeenCalled();
  });

  test("rejects invalid payload", async () => {
    const { enqueueAuditEvent } = await import("./enqueue");
    await expect(() =>
      enqueueAuditEvent({
        workspaceId: "ws1",
        userId: "u1",
        userName: "Admin",
        userEmail: "admin@test.com",
        action: "invalid_action",
        resourceType: "deal",
        resourceId: "deal1",
        resourceName: "Acme Deal",
        changes: [{ field: "name", from: null, to: "Acme Deal" }],
        metadata: {},
        ipAddress: "127.0.0.1",
        userAgent: "Mozilla/5.0",
      } as any),
    ).toThrow();
  });
});
