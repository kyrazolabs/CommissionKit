import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, render, waitFor } from "@testing-library/react";
import React from "react";

const STORAGE_KEY = "ck_active_workspace";

// ── localStorage mock ─────────────────────────────────────────────────────────
const store: Record<string, string> = {};
function clearStore() {
  Object.keys(store).forEach((k) => delete store[k]);
}
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: clearStore,
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  },
  writable: true,
  configurable: true,
});

mock.module("@/hooks/use-auth", () => ({
  useAuth: () => ({
    session: { user: { id: "u1", email: "test@test.com" } },
    user: { id: "u1", email: "test@test.com" },
    loading: false,
    signOut: () => Promise.resolve(),
  }),
}));

mock.module("@workspace/api-client-react", () => ({
  setWorkspaceId: mock(() => {}),
  setAuthTokenGetter: mock(() => {}),
  setBaseUrl: mock(() => {}),
}));

describe("useWorkspace context", () => {
  beforeEach(() => {
    clearStore();
  });

  afterEach(() => {
    cleanup();
  });

  test("exports useWorkspace hook", async () => {
    const mod = await import("@/hooks/use-workspace");
    expect(mod.useWorkspace).toBeDefined();
    expect(mod.WorkspaceProvider).toBeDefined();
  });

  test("returns default context (no session)", async () => {
    const { useWorkspace } = await import("@/hooks/use-workspace");
    let captured: any = null;
    function TestComp() {
      captured = useWorkspace();
      return null;
    }
    render(React.createElement(TestComp));
    expect(captured).toEqual({
      workspaces: [],
      activeWorkspace: null,
      loading: true,
      engineNavItems: [],
      setActiveWorkspace: expect.any(Function),
      createWorkspace: expect.any(Function),
      refreshWorkspaces: expect.any(Function),
    });
  });
});
