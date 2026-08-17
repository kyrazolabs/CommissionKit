import { beforeEach, describe, expect, mock, test } from "bun:test";
import type { Request, Response } from "express";

let getSessionMock = mock(() => Promise.resolve(null));

mock.module("../lib/auth", () => ({
  auth: {
    api: { getSession: (...args: any[]) => getSessionMock(...args) },
  },
}));

describe("auditContextMiddleware", () => {
  beforeEach(() => {
    getSessionMock.mockClear();
    getSessionMock = mock(() => Promise.resolve(null));
  });

  test("sets context with IP and user agent", async () => {
    const { auditContextMiddleware } = await import("./audit-context");
    const { getAuditContext } = await import("../lib/audit-context");

    const req = {
      headers: {
        "x-forwarded-for": "203.0.113.1",
        "user-agent": "TestAgent/1.0",
      },
      socket: {},
      ip: "127.0.0.1",
    } as unknown as Request;

    const res = {} as Response;
    let context: any;
    const next = mock(() => {
      context = getAuditContext();
    });

    await auditContextMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(context.userId).toBeUndefined();
    expect(context.userEmail).toBeUndefined();
    expect(context.userName).toBeUndefined();
    expect(context.ipAddress).toBe("203.0.113.1");
    expect(context.userAgent).toBe("TestAgent/1.0");
  });

  test("extracts first IP from comma-separated x-forwarded-for", async () => {
    const { auditContextMiddleware } = await import("./audit-context");
    const { getAuditContext } = await import("../lib/audit-context");

    const req = {
      headers: {
        "x-forwarded-for": "10.0.0.1, 172.16.0.1, 192.168.0.1",
      },
      socket: {},
      ip: "127.0.0.1",
    } as unknown as Request;

    const res = {} as Response;
    let context: any;
    const next = mock(() => {
      context = getAuditContext();
    });

    await auditContextMiddleware(req, res, next);

    expect(context.ipAddress).toBe("10.0.0.1");
  });

  test("extracts first IP from array x-forwarded-for", async () => {
    const { auditContextMiddleware } = await import("./audit-context");
    const { getAuditContext } = await import("../lib/audit-context");

    const req = {
      headers: {
        "x-forwarded-for": ["10.0.0.1", "172.16.0.1"],
      },
      socket: {},
      ip: "127.0.0.1",
    } as unknown as Request;

    const res = {} as Response;
    let context: any;
    const next = mock(() => {
      context = getAuditContext();
    });

    await auditContextMiddleware(req, res, next);

    expect(context.ipAddress).toBe("10.0.0.1");
  });

  test("falls back to req.ip when header is missing", async () => {
    const { auditContextMiddleware } = await import("./audit-context");
    const { getAuditContext } = await import("../lib/audit-context");

    const req = {
      headers: {},
      socket: { remoteAddress: "192.168.1.1" },
      ip: "127.0.0.1",
    } as unknown as Request;

    const res = {} as Response;
    let context: any;
    const next = mock(() => {
      context = getAuditContext();
    });

    await auditContextMiddleware(req, res, next);

    expect(context.ipAddress).toBe("192.168.1.1");
  });

  test("populates user info from Better Auth session", async () => {
    getSessionMock = mock(() =>
      Promise.resolve({
        session: { id: "s1" },
        user: { id: "u1", email: "admin@test.com", name: "Admin" },
      }),
    );

    const { auditContextMiddleware } = await import("./audit-context");
    const { getAuditContext } = await import("../lib/audit-context");

    const req = {
      headers: { cookie: "session=token" },
      socket: {},
      ip: "127.0.0.1",
    } as unknown as Request;

    const res = {} as Response;
    let context: any;
    const next = mock(() => {
      context = getAuditContext();
    });

    await auditContextMiddleware(req, res, next);

    expect(context.userId).toBe("u1");
    expect(context.userEmail).toBe("admin@test.com");
    expect(context.userName).toBe("Admin");
  });
});
