import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { render, waitFor, cleanup, screen, act } from "@testing-library/react";
import React from "react";

// Mock localStorage
const store: Record<string, string> = {};
function clearStore() {
  Object.keys(store).forEach((k) => delete store[k]);
}
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: clearStore,
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  },
  writable: true,
  configurable: true,
});

// Mock QueryClient
const queryClientMock = {
  invalidateQueries: mock(() => Promise.resolve()),
};
mock.module("@tanstack/react-query", () => ({
  useQueryClient: () => queryClientMock,
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: () => ({ data: [], isLoading: false }),
}));

// Mock API client hooks
mock.module("@workspace/api-client-react", () => ({
  useListReps: () => ({ data: [], isLoading: false }),
  useListPlans: () => ({ data: [], isLoading: false }),
  useListDeals: () => ({ data: [], isLoading: false }),
  setWorkspaceId: mock(() => {}),
  setAuthTokenGetter: mock(() => {}),
  setBaseUrl: mock(() => {}),
}));

// Mock auth
mock.module("@/hooks/use-auth", () => ({
  useAuth: () => ({
    session: { user: { id: "u1", email: "test@test.com" } },
    user: { id: "u1", email: "test@test.com" },
    loading: false,
    signOut: () => Promise.resolve(),
  }),
}));

// Mock workspace
mock.module("@/hooks/use-workspace", () => ({
  useWorkspace: () => ({
    activeWorkspace: { id: "ws1", name: "Test Workspace" },
    workspaces: [],
    loading: false,
  }),
}));

// Mock apiFetch
const mockApiFetch = mock(() => Promise.resolve({ seeded: true }));
mock.module("@/lib/api", () => ({
  apiFetch: mockApiFetch,
}));

describe("useSetupChecklist", () => {
  beforeEach(() => {
    clearStore();
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue({ seeded: true });
    queryClientMock.invalidateQueries.mockReset();
    queryClientMock.invalidateQueries.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  test("completedCount = 0 when no data", async () => {
    const { useSetupChecklist } = await import("@/hooks/use-setup-checklist");
    let captured: any = null;

    function TestComp() {
      const hook = useSetupChecklist();
      captured = hook;
      return null;
    }

    render(React.createElement(TestComp));

    expect(captured.completedCount).toBe(0);
    expect(captured.steps.reps).toBe(false);
    expect(captured.steps.plans).toBe(false);
    expect(captured.steps.deals).toBe(false);
    expect(captured.allComplete).toBe(false);
  });

  test("dismiss calls API PATCH with dismiss action", async () => {
    const { useSetupChecklist } = await import("@/hooks/use-setup-checklist");
    let hookRef: any = null;

    function TestComp() {
      const hook = useSetupChecklist();
      hookRef = hook;
      return null;
    }

    render(React.createElement(TestComp));

    await act(async () => {
      await hookRef.dismiss();
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/workspaces/ws1/onboarding",
      { method: "PATCH", body: JSON.stringify({ action: "dismiss" }) },
    );
  });

  test("complete calls API PATCH with complete action", async () => {
    const { useSetupChecklist } = await import("@/hooks/use-setup-checklist");
    let hookRef: any = null;

    function TestComp() {
      const hook = useSetupChecklist();
      hookRef = hook;
      return null;
    }

    render(React.createElement(TestComp));

    await act(async () => {
      await hookRef.complete();
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/workspaces/ws1/onboarding",
      { method: "PATCH", body: JSON.stringify({ action: "complete" }) },
    );
  });

  test("loadSampleData calls API and invalidates queries", async () => {
    const { useSetupChecklist } = await import("@/hooks/use-setup-checklist");
    let hookRef: any = null;

    function TestComp() {
      const hook = useSetupChecklist();
      hookRef = hook;
      return null;
    }

    render(React.createElement(TestComp));

    expect(hookRef.isSeeding).toBe(false);

    let loadPromise: Promise<void>;
    act(() => {
      loadPromise = hookRef.loadSampleData();
    });

    expect(hookRef.isSeeding).toBe(true);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/workspace/sample-data", { method: "POST" });

    await act(async () => {
      await loadPromise!;
    });

    expect(hookRef.isSeeding).toBe(false);
    expect(queryClientMock.invalidateQueries).toHaveBeenCalled();
  });
});
