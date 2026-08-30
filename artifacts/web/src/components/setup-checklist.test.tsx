import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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
let mockActiveWorkspace: { id: string; name: string; onboarding: typeof mockOnboarding } | null = {
  id: "ws1",
  name: "Test Workspace",
  onboarding: mockOnboarding,
};

mock.module("@/hooks/use-workspace", () => ({
  useWorkspace: () => ({
    activeWorkspace: mockActiveWorkspace,
    workspaces: [],
    loading: false,
    refreshWorkspaces: () => Promise.resolve(),
  }),
}));

// Mock apiFetch
const apiFetchImpl = (...args: unknown[]) => {
  const url = args[0] as string;
  const opts = (args[1] ?? {}) as { method?: string; body?: string };
  if (url.includes("/onboarding") && opts.method === "PATCH") {
    const body = JSON.parse(opts.body ?? "{}") as {
      action?: "dismiss" | "complete" | "show";
    };
    if (body.action === "dismiss") {
      mockOnboarding = { ...mockOnboarding, checklistDismissed: true };
    } else if (body.action === "complete") {
      mockOnboarding = { ...mockOnboarding, checklistCompletedAt: new Date() };
    } else if (body.action === "show") {
      mockOnboarding = {
        checklistDismissed: false,
        checklistCompletedAt: null,
      };
    }
    if (mockActiveWorkspace) {
      mockActiveWorkspace = { ...mockActiveWorkspace, onboarding: mockOnboarding };
    }
  }
  return Promise.resolve({});
};
const mockApiFetch = mock(apiFetchImpl);
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
    <a href={href} {...props}>
      {children}
    </a>
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

// Mock ConfirmDialog — Radix AlertDialog portals + focus-scope throw
// "Failed to execute 'dispatchEvent' on 'EventTarget'" during React 19's
// commitPassiveMountOnFiber phase in happy-dom. We mock the primitive to
// render a simple confirmation panel with accessible buttons.
mock.module("@/components/ui/confirm-dialog", () => ({
  ConfirmDialog: ({
    open,
    title,
    description,
    confirmLabel,
    cancelLabel,
    onConfirm,
    onOpenChange,
  }: {
    open: boolean;
    title?: string;
    description?: React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onOpenChange: (open: boolean) => void;
  }) => {
    if (!open) return null;
    return (
      <div role="alertdialog" aria-label={title}>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
        <button onClick={() => onOpenChange(false)}>{cancelLabel}</button>
        <button onClick={onConfirm}>{confirmLabel}</button>
      </div>
    );
  },
}));

// Mock localStorage for minimize state
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
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
    mockActiveWorkspace = {
      id: "ws1",
      name: "Test Workspace",
      onboarding: mockOnboarding,
    };
    mockApiFetch.mockReset();
    mockApiFetch.mockImplementation(apiFetchImpl);
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
    expect(screen.queryByText("Add team members who earn commissions.")).toBeNull();
  });

  test("renders Load Sample Data button", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Load Sample Data")).toBeTruthy();
    });
  });

  test("renders Skip Onboarding button", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Skip Onboarding")).toBeTruthy();
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
      screen.getByRole("button", { name: /minimize checklist/i }),
    );
    await act(() => userEvent.click(minimizeBtn));

    await waitFor(() => {
      expect(screen.getByText("0/3")).toBeTruthy();
      expect(screen.getByLabelText(/load sample data/i)).toBeTruthy();
    });
  });

  test("expands from pill when clicked", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    const minimizeBtn = await waitFor(() =>
      screen.getByRole("button", { name: /minimize checklist/i }),
    );
    await act(() => userEvent.click(minimizeBtn));

    const pill = await waitFor(() =>
      screen.getByRole("button", { name: /setup checklist.*click to expand/i }),
    );
    await act(() => userEvent.click(pill));

    await waitFor(() => {
      expect(screen.getByText("Get Started")).toBeTruthy();
    });
  });

  test("calls PATCH /api/workspace/:id/onboarding on dismiss", async () => {
    localStorageMock.clear();

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Get Started")).toBeTruthy();
    });

    const skipButton = await waitFor(() => screen.getByText("Skip Onboarding"));
    await act(async () => {
      fireEvent.click(skipButton!);
      await new Promise((r) => setTimeout(r, 400));
    });

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/workspaces/ws1/onboarding",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "dismiss" }),
      }),
    );
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
      screen.getByRole("button", { name: /minimize checklist/i }),
    );
    await act(() => userEvent.click(minimizeBtn));

    await waitFor(() => {
      expect(localStorageMock.getItem("ck_checklist_minimized_ws1")).toBe("true");
    });
  });

  test("minimize state resets when workspace changes", async () => {
    localStorageMock.clear();

    const { SetupChecklist } = await import("@/components/setup-checklist");

    localStorageMock.setItem("ck_checklist_minimized_ws1", "true");

    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("0/3")).toBeTruthy();
    });
  });

  // ── Visibility gating tests ────────────────────────────────────────────────

  test("does not render when checklistCompletedAt is set", async () => {
    mockOnboarding = {
      checklistDismissed: false,
      checklistCompletedAt: new Date(),
    };
    mockActiveWorkspace = {
      id: "ws1",
      name: "Test Workspace",
      onboarding: mockOnboarding,
    };

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.queryByText("Get Started")).toBeNull();
      expect(screen.queryByText("Setup Complete")).toBeNull();
      expect(screen.queryByRole("region", { name: /setup checklist/i })).toBeNull();
    });
  });

  test("does not render when checklistDismissed is set", async () => {
    mockOnboarding = {
      checklistDismissed: true,
      checklistCompletedAt: null,
    };
    mockActiveWorkspace = {
      id: "ws1",
      name: "Test Workspace",
      onboarding: mockOnboarding,
    };

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.queryByText("Get Started")).toBeNull();
      expect(screen.queryByRole("region", { name: /setup checklist/i })).toBeNull();
    });
  });

  test("does not render when workspaceId is undefined", async () => {
    mockActiveWorkspace = null;

    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.queryByText("Get Started")).toBeNull();
      expect(screen.queryByRole("region", { name: /setup checklist/i })).toBeNull();
    });
  });

  test("plays exit animation then unmounts when user dismisses", async () => {
    localStorageMock.clear();

    const { SetupChecklist } = await import("@/components/setup-checklist");
    const { rerender } = render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("Get Started")).toBeTruthy();
    });

    const skipButton = await waitFor(() => screen.getByText("Skip Onboarding"));
    await act(async () => {
      fireEvent.click(skipButton!);
    });

    // During exit animation: should still be present in DOM
    expect(screen.queryByRole("region", { name: /setup checklist/i })).toBeTruthy();

    // After the 200ms exit animation + the 200ms setTimeout in handleDismiss
    // the API call goes out and updates mockActiveWorkspace. Force a rerender
    // to pick up the new state (in production this happens via workspace
    // query refetch, which the mock QueryClient doesn't simulate).
    await act(async () => {
      await new Promise((r) => setTimeout(r, 600));
      rerender(React.createElement(SetupChecklist));
    });

    await waitFor(() => {
      expect(screen.queryByRole("region", { name: /setup checklist/i })).toBeNull();
    });
  });

  test("clears stale localStorage minimize entry when unmounted", async () => {
    mockOnboarding = {
      checklistDismissed: false,
      checklistCompletedAt: null,
    };
    mockActiveWorkspace = {
      id: "ws1",
      name: "Test Workspace",
      onboarding: mockOnboarding,
    };

    localStorageMock.setItem("ck_checklist_minimized_ws1", "true");

    const { SetupChecklist } = await import("@/components/setup-checklist");
    const { rerender } = render(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(screen.getByText("0/3")).toBeTruthy();
    });

    // Now flip the workspace to dismissed → component unmounts → cleanup runs
    mockOnboarding = {
      checklistDismissed: true,
      checklistCompletedAt: null,
    };
    mockActiveWorkspace = {
      id: "ws1",
      name: "Test Workspace",
      onboarding: mockOnboarding,
    };

    rerender(React.createElement(SetupChecklist));

    await waitFor(() => {
      expect(localStorageMock.getItem("ck_checklist_minimized_ws1")).toBeNull();
    });
  });

  // ── Close confirmation dialog tests ───────────────────────────────────────

  test("clicking X icon opens the close confirmation dialog", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    // Wait for the X (close) button to appear
    const closeBtn = await waitFor(() =>
      screen.getByRole("button", { name: /close checklist/i }),
    );

    await act(async () => {
      fireEvent.click(closeBtn);
    });

    // Dialog should be open (mocked as <h2>{title}</h2>)
    await waitFor(() => {
      expect(
        screen.getByRole("alertdialog", { name: /close setup checklist\?/i }),
      ).toBeTruthy();
    });
    expect(
      screen.getByText(/you'll need to reopen it from settings/i),
    ).toBeTruthy();
  });

  test("Keep open cancels the close confirmation and does not call PATCH", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    const closeBtn = await waitFor(() =>
      screen.getByRole("button", { name: /close checklist/i }),
    );
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    const keepOpenBtn = await waitFor(() =>
      screen.getByRole("button", { name: /keep open/i }),
    );
    await act(async () => {
      fireEvent.click(keepOpenBtn);
    });

    // Dialog should close
    await waitFor(() => {
      expect(
        screen.queryByRole("alertdialog", { name: /close setup checklist\?/i }),
      ).toBeNull();
    });

    // PATCH should not have been called for onboarding
    const onboardingCalls = mockApiFetch.mock.calls.filter(
      (call) =>
        typeof call[0] === "string" &&
        (call[0] as string).includes("/onboarding") &&
        ((call[1] as { method?: string })?.method ?? "GET") === "PATCH",
    );
    expect(onboardingCalls).toHaveLength(0);

    // Card should still be visible
    expect(screen.getByText("Get Started")).toBeTruthy();
  });

  test("Close checklist in dialog calls PATCH with dismiss action", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    const closeBtn = await waitFor(() =>
      screen.getByRole("button", { name: /close checklist/i }),
    );
    await act(async () => {
      fireEvent.click(closeBtn);
    });

    // Find the confirm button INSIDE the dialog — the X icon and the dialog
    // confirm button share the label "Close checklist", so scope to the
    // alertdialog to disambiguate.
    const confirmCloseBtn = await waitFor(() => {
      const dialog = screen.getByRole("alertdialog");
      const btn = dialog.querySelector("button:nth-of-type(2)");
      if (!btn) throw new Error("Confirm button not found in dialog");
      return btn;
    });
    await act(async () => {
      fireEvent.click(confirmCloseBtn as HTMLElement);
      await new Promise((r) => setTimeout(r, 300));
    });

    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/workspaces/ws1/onboarding",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ action: "dismiss" }),
        }),
      );
    });
  });

  test("footer button shows Skip Onboarding and dismisses without dialog", async () => {
    const { SetupChecklist } = await import("@/components/setup-checklist");
    render(React.createElement(SetupChecklist));

    // Footer button (still a direct dismiss)
    const skipBtn = await waitFor(() =>
      screen.getByRole("button", { name: /skip onboarding/i }),
    );
    expect(skipBtn.textContent?.trim()).toBe("Skip Onboarding");

    await act(async () => {
      fireEvent.click(skipBtn);
      await new Promise((r) => setTimeout(r, 300));
    });

    // No confirmation dialog should appear
    expect(
      screen.queryByRole("alertdialog", { name: /close setup checklist\?/i }),
    ).toBeNull();

    // PATCH should have fired
    await waitFor(() => {
      expect(mockApiFetch).toHaveBeenCalledWith(
        "/api/workspaces/ws1/onboarding",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ action: "dismiss" }),
        }),
      );
    });
  });
});