import { describe, expect, mock, spyOn, test } from "bun:test";
import { WorkspaceMember } from "@workspace/db";

const VALID_WS_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";

mock.module("../lib/auth", () => ({
  auth: {
    api: {
      getSession: mock(() => Promise.resolve(null)),
    },
  },
  findUserById: mock(() => Promise.resolve(null)),
}));

mock.module("../lib/rbac", () => ({
  getUserPermissions: mock(() => Promise.resolve(new Set<string>())),
  hasPermission: mock(() => false),
  invalidateUserPermissions: mock(() => Promise.resolve()),
  invalidateWorkspaceRoles: mock(() => Promise.resolve()),
  getUsersWithPermission: mock(() => Promise.resolve([])),
}));

describe("requireAuth", () => {
  test("returns 401 when no session", async () => {
    const { requireAuth } = await import("./auth");
    const req = { headers: {} } as any;
    let statusCode = 0;
    const res = {
      status: (s: number) => {
        statusCode = s;
        return { json: () => {} };
      },
    } as any;
    const next = mock(() => {});

    await requireAuth(req, res, next);
    expect(statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  test("returns 401 when session exists but no user", async () => {
    const mockModule = await import("../lib/auth");
    (mockModule.auth.api.getSession as any).mockResolvedValueOnce({
      session: { id: "s1" },
      user: null,
    });

    const { requireAuth } = await import("./auth");
    const req = { headers: {} } as any;
    let statusCode = 0;
    const res = {
      status: (s: number) => {
        statusCode = s;
        return { json: () => {} };
      },
    } as any;
    const next = mock(() => {});

    await requireAuth(req, res, next);
    expect(statusCode).toBe(401);
  });
});

describe("requireWorkspaceMember", () => {
  test("returns 400 when X-Workspace-ID header is missing", async () => {
    const { requireWorkspaceMember } = await import("./auth");
    const [_, memberCheck] = requireWorkspaceMember("member");

    const req = { headers: {}, userId: "u1" } as any;
    let statusCode = 0;
    const res = {
      status: (s: number) => {
        statusCode = s;
        return { json: (body: any) => {} };
      },
    } as any;
    const next = mock(() => {});

    await memberCheck(req, res, next);
    expect(statusCode).toBe(400);
  });

  test("returns 403 when user is not a workspace member", async () => {
    const findOneSpy = spyOn(WorkspaceMember, "findOne").mockResolvedValue(null);

    const { requireWorkspaceMember } = await import("./auth");
    const [requireAuth_, memberCheck] = requireWorkspaceMember("member");

    const req = {
      headers: { "x-workspace-id": VALID_WS_ID },
      userId: "u1",
      userEmail: "test@test.com",
    } as any;
    let statusCode = 0;
    let errorBody: any;
    const res = {
      status: (s: number) => {
        statusCode = s;
        return {
          json: (body: any) => {
            errorBody = body;
          },
        };
      },
    } as any;
    const next = mock(() => {});

    await memberCheck(req, res, next);
    expect(statusCode).toBe(403);

    findOneSpy.mockRestore();
  });
});

describe("requirePermission", () => {
  test("returns 400 when X-Workspace-ID header is missing", async () => {
    const { requirePermission } = await import("./auth");
    const [_, permissionCheck] = requirePermission("deals", "read");

    const req = { headers: {}, userId: "u1" } as any;
    let statusCode = 0;
    const res = {
      status: (s: number) => {
        statusCode = s;
        return { json: (body: any) => {} };
      },
    } as any;
    const next = mock(() => {});

    await permissionCheck(req, res, next);
    expect(statusCode).toBe(400);
  });

  test("returns 403 when no membership found", async () => {
    const findOneSpy = spyOn(WorkspaceMember, "findOne").mockResolvedValue(null);

    const { requirePermission } = await import("./auth");
    const [requireAuth_, permissionCheck] = requirePermission("deals", "read");

    const req = {
      headers: { "x-workspace-id": VALID_WS_ID },
      userId: "u1",
      userEmail: "test@test.com",
    } as any;
    let statusCode = 0;
    let errorBody: any;
    const res = {
      status: (s: number) => {
        statusCode = s;
        return {
          json: (body: any) => {
            errorBody = body;
          },
        };
      },
    } as any;
    const next = mock(() => {});

    await permissionCheck(req, res, next);
    expect(statusCode).toBe(403);

    findOneSpy.mockRestore();
  });
});
