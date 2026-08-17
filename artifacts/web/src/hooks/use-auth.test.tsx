import { beforeEach, describe, expect, mock, test } from "bun:test";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseSession = mock(() => ({ data: null, isPending: true }));
const mockSignOut = mock(() => Promise.resolve());
const mockSetAuthTokenGetter = mock(() => {});
const mockSetWorkspaceId = mock(() => {});
const mockSetBaseUrl = mock(() => {});

mock.module("@/lib/auth-client", () => ({
  authClient: {
    signOut: mockSignOut,
    signIn: mock(() => Promise.resolve()),
    signUp: mock(() => Promise.resolve()),
  },
  useSession: () => mockUseSession(),
}));

mock.module("@workspace/api-client-react", () => ({
  setAuthTokenGetter: mockSetAuthTokenGetter,
  setWorkspaceId: mockSetWorkspaceId,
  setBaseUrl: mockSetBaseUrl,
}));

describe("useAuth / AuthProvider", () => {
  beforeEach(() => {
    mockUseSession.mockReset();
    mockSignOut.mockReset();
    mockSetAuthTokenGetter.mockReset();
    mockSetWorkspaceId.mockReset();
    mockSetBaseUrl.mockReset();
    mockUseSession.mockReturnValue({ data: null, isPending: true });
  });

  test("AuthProvider renders children", async () => {
    const { AuthProvider } = await import("@/hooks/use-auth");
    const { container } = render(
      React.createElement(
        AuthProvider,
        null,
        React.createElement("div", { "data-testid": "child" }, "Hello"),
      ),
    );
    expect(container.querySelector("[data-testid='child']")).not.toBeNull();
  });

  test("useAuth returns loading true initially", async () => {
    const { AuthProvider, useAuth } = await import("@/hooks/use-auth");

    let state: any = null;
    function Consumer() {
      state = useAuth();
      return null;
    }

    render(React.createElement(AuthProvider, null, React.createElement(Consumer)));

    expect(state).toBeDefined();
    expect(state.loading).toBe(true);
    expect(state.session).toBeNull();
    expect(state.user).toBeNull();
  });

  test("useAuth returns session data when available", async () => {
    mockUseSession.mockReturnValue({
      data: { user: { id: "u1", email: "test@test.com", name: "Test" } },
      isPending: false,
    });

    const { AuthProvider, useAuth } = await import("@/hooks/use-auth");

    let authValue: any = null;
    function Consumer() {
      authValue = useAuth();
      return null;
    }

    render(React.createElement(AuthProvider, null, React.createElement(Consumer)));

    expect(authValue.loading).toBe(false);
    expect(authValue.session).toBeDefined();
    expect(authValue.user.id).toBe("u1");
    expect(authValue.user.name).toBe("Test");
  });

  test("signOut calls authClient.signOut and clears auth token", async () => {
    const { AuthProvider, useAuth } = await import("@/hooks/use-auth");

    let signOutFn: any = null;
    function Consumer() {
      const auth = useAuth();
      signOutFn = auth.signOut;
      return null;
    }

    render(React.createElement(AuthProvider, null, React.createElement(Consumer)));

    await signOutFn!();
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockSetAuthTokenGetter).toHaveBeenLastCalledWith(null);
    expect(mockSetWorkspaceId).toHaveBeenLastCalledWith(null);
  });
});
