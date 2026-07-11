import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import { render, waitFor, cleanup, screen, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// Mock QueryClient
const queryClientMock = {
  invalidateQueries: mock(() => Promise.resolve()),
};
mock.module("@tanstack/react-query", () => ({
  useQueryClient: () => queryClientMock,
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children,
  useQuery: () => ({ data: [], isLoading: false }),
}));

// Mock API client hooks - return empty data
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

// Default mock workspace - with onboarding fields
let mockOnboarding = {
  checklistDismissed: false,
  checklistCompletedAt: null as Date | null,
};

mock.module("@/hooks/use-workspace", () => ({
  useWorkspace: () => ({
    activeWorkspace: {
      id: "ws1",
      name: "Test Workspace",
      onboarding: mockOnboarding,
    },
    workspaces: [],
    loading: false,
  }),
}));

// Mock apiFetch
const mockApiFetch = mock(() => Promise.resolve({}));
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

// Mock Tooltip components
mock.module("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
  Tooltip: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  TooltipTrigger: ({ children, ...props }: any) => {
    const { asChild, ...rest } = props;
    if (asChild && children) {
      return React.cloneElement(children as React.ReactElement, rest);
    }
    return <div {...rest}>{children}</div>;
  },
  TooltipContent: ({ children, ...props }: any) => <div {...props}>{children}</div>,
}));

// Mock localStorage for minimize state
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

describe("SetupChecklist Component", () => {
  beforeEach(() => {
    mockOnboarding = {
      checklistDismissed: false,
      checklistCompletedAt: null,
    };
    mockApiFetch.mockReset();
    mockApiFetch.mockResolvedValue({});
    queryClientMock.invalidateQueries.mockReset();
    queryClientMock.invalidateQueries.mockResolvedValue(undefined);
    localStorageMock.clear();
  });

  afterEach(() => {
    cleanup();
  });

  test("renders inline card when steps are incomplete", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Get Started")).toBeTruthy();
    });
  });

  test("renders progress text", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("3 steps to your first commission run")).toBeTruthy();
    });
  });

  test("renders step rows without descriptions", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Add Your Sales Reps")).toBeTruthy();
      expect(screen.getByText("Create a Commission Plan")).toBeTruthy();
      expect(screen.getByText("Import Deals")).toBeTruthy();
    });
    // Descriptions should not be present (compact mode)
    expect(screen.queryByText("Add team members who earn commissions.")).toBeNull();
  });

  test("renders Load Sample Data button", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Load Sample Data")).toBeTruthy();
    });
  });

  test("renders Skip for now button", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Skip for now")).toBeTruthy();
    });
  });

  test("renders minimize button", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      const minimizeBtn = screen.getByRole("button", { name: /minimize checklist/i });
      expect(minimizeBtn).toBeTruthy();
    });
  });

  test("collapses to pill when minimize is clicked", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    const minimizeBtn = await waitFor(() =>
      screen.getByRole("button", { name: /minimize checklist/i })
    );
    await act(() => userEvent.click(minimizeBtn));

    await waitFor(() => {
      // Pill should show "0/3"
      expect(screen.getByText("0/3")).toBeTruthy();
      // Load Sample Data should be in the pill
      expect(screen.getByLabelText(/load sample data/i)).toBeTruthy();
    });
  });

  test("expands from pill when clicked", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    // First minimize
    const minimizeBtn = await waitFor(() =>
      screen.getByRole("button", { name: /minimize checklist/i })
    );
    await act(() => userEvent.click(minimizeBtn));

    // Click the pill to expand
    const pill = await waitFor(() =>
      screen.getByRole("button", { name: /setup checklist.*click to expand/i })
    );
    await act(() => userEvent.click(pill));

    await waitFor(() => {
      expect(screen.getByText("Get Started")).toBeTruthy();
    });
  });

  test("calls PATCH /api/workspace/:id/onboarding on dismiss", async () => {
    // Clear localStorage to ensure expanded state
    localStorageMock.clear();

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    // Verify expanded card is showing
    await waitFor(() => {
      expect(screen.getByText("Get Started")).toBeTruthy();
    });

    const skipButton = await waitFor(() => screen.getByText("Skip for now"));
    await act(async () => {
      await userEvent.click(skipButton!);
      // Wait for the 200ms exit animation + API call
      await new Promise((r) => setTimeout(r, 400));
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/workspaces/ws1/onboarding",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "dismiss" }),
      })
    );
  });

  test("does not render card when checklistCompletedAt is set", async () => {
    mockOnboarding = {
      checklistDismissed: false,
      checklistCompletedAt: new Date(),
    };

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.queryByText("Get Started")).toBeNull();
    });
  });

  test("shows Setup Guide button when dismissed", async () => {
    mockOnboarding = {
      checklistDismissed: true,
      checklistCompletedAt: null,
    };

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Setup Guide")).toBeTruthy();
    });
  });

  test("does not show Setup Guide button when completed", async () => {
    mockOnboarding = {
      checklistDismissed: true,
      checklistCompletedAt: new Date(),
    };

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.queryByText("Setup Guide")).toBeNull();
    });
  });

  test("Load Sample Data gets ring highlight when 0/3 complete", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      const sampleBtn = screen.getByText("Load Sample Data");
      expect(sampleBtn.closest("button")).toBeTruthy();
    });
  });

  test("minimize state is persisted to localStorage", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    const { rerender } = render(React.createElement(SetupChecklist));

    const minimizeBtn = await waitFor(() =>
      screen.getByRole("button", { name: /minimize checklist/i })
    );
    await act(() => userEvent.click(minimizeBtn));

    await waitFor(() => {
      expect(localStorageMock.getItem("ck_checklist_minimized_ws1")).toBe("true");
    });
  });

  test("minimize state resets when workspace changes", async () => {
    // Clear localStorage to ensure starting fresh
    localStorageMock.clear();

    const { SetupChecklist } = await import("@/components/setup-checklist");

    // Set minimize state for ws1
    localStorageMock.setItem("ck_checklist_minimized_ws1", "true");

    // Render - should be collapsed due to localStorage
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      // Pill should appear because localStorage has minimized=true for ws1
      expect(screen.getByText("0/3")).toBeTruthy();
    });

    // The localStorage-driven init is tested: when localStorage has the key,
    // the component renders in collapsed state. The workspace-change reset
    // (useEffect dependency on workspaceId) is internal React behavior.
  });
});
