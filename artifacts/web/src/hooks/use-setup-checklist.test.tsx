import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";

// Mock localStorage
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

// Mock QueryClient
const queryClientMock = {
  invalidateQueries: mock(() => Promise.resolve()),
};
mock.module("@tanstack/react-query", () => ({
  useQueryClient: () => queryClientMock,
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: () => ({ data: [], isLoading: false }),
}));

// Mock API client hooks — return values are controllable per-test via these mocks.
const mockUseListReps = mock(() => ({ data: [], isLoading: false }));
const mockUseListPlans = mock(() => ({ data: [], isLoading: false }));
const mockUseListDeals = mock(() => ({ data: [], isLoading: false }));
mock.module("@workspace/api-client-react", () => ({
  useListReps: (...args: unknown[]) => mockUseListReps(...args),
  useListPlans: (...args: unknown[]) => mockUseListPlans(...args),
  useListDeals: (...args: unknown[]) => mockUseListDeals(...args),
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
    mockUseListReps.mockReset();
    mockUseListReps.mockReturnValue({ data: [], isLoading: false });
    mockUseListPlans.mockReset();
    mockUseListPlans.mockReturnValue({ data: [], isLoading: false });
    mockUseListDeals.mockReset();
    mockUseListDeals.mockReturnValue({ data: [], isLoading: false });
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

    expect(mockApiFetch).toHaveBeenCalledWith("/api/workspaces/ws1/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ action: "dismiss" }),
    });
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

    expect(mockApiFetch).toHaveBeenCalledWith("/api/workspaces/ws1/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ action: "complete" }),
    });
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

  test("detects all steps complete from paginated reps/deals and array plans", async () => {
    mockUseListReps.mockReturnValue({
      data: { data: [{ id: "r1" }], pagination: { total: 1 } },
      isLoading: false,
    });
    mockUseListDeals.mockReturnValue({
      data: { data: [{ id: "d1" }], pagination: { total: 1 } },
      isLoading: false,
    });
    mockUseListPlans.mockReturnValue({ data: [{ id: "p1" }], isLoading: false });

    const { useSetupChecklist } = await import("@/hooks/use-setup-checklist");
    let captured: any = null;

    function TestComp() {
      const hook = useSetupChecklist();
      captured = hook;
      return null;
    }

    render(React.createElement(TestComp));

    expect(captured.steps.reps).toBe(true);
    expect(captured.steps.plans).toBe(true);
    expect(captured.steps.deals).toBe(true);
    expect(captured.completedCount).toBe(3);
    expect(captured.allComplete).toBe(true);
  });
});
