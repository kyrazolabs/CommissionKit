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

// Mock API client hooks - return COMPLETE data (existing workspace with all steps done)
mock.module("@workspace/api-client-react", () => ({
  // Simulate existing workspace: reps, plans, and deals all have data
  useListReps: () => ({ data: [{ id: "r1", name: "Rep 1" }], isLoading: false }),
  useListPlans: () => ({ data: [{ id: "p1", name: "Plan 1" }], isLoading: false }),
  useListDeals: () => ({ data: [{ id: "d1", name: "Deal 1" }], isLoading: false }),
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

// Mock wouter useLocation
mock.module("wouter", () => ({
  useLocation: () => {
    const [loc, setLoc] = React.useState("/dash");
    return [loc, setLoc] as const;
  },
  Link: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

// Mock toast
mock.module("@/hooks/use-toast", () => ({
  toast: mock(() => {}),
  useToast: () => ({ toast: mock(() => {}) }),
}));

describe("SetupChecklist - Existing Account (All Complete)", () => {
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

  test("does NOT show checklist overlay when all steps are complete", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    // Wait for any potential renders
    await waitFor(() => {
      // Checklist overlay should NOT be visible
      expect(screen.queryByText("Get Started")).toBeNull();
    });
  });

  test("does NOT show success animation when all steps are complete", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    // Wait for any potential renders
    await waitFor(() => {
      // Success overlay should NOT be visible
      expect(screen.queryByText("All set!")).toBeNull();
    });
  });

  test("does NOT show Setup Guide button when all steps are complete", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    // Wait for any potential renders
    await waitFor(() => {
      // Setup Guide button should NOT be visible
      expect(screen.queryByText("Setup Guide")).toBeNull();
    });
  });
});
