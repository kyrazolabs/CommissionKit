import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { PortalAuth } from "./portal-auth";

const mockSetPortalToken = mock(() => {});
const mockFetch = mock(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        token: "fake-token",
        workspaceName: "Test Workspace",
        mustChangePassword: false,
      }),
  })
);

mock.module("@/lib/portal-fetch", () => ({
  setPortalToken: mockSetPortalToken,
}));

mock.module("node:fetch", () => mockFetch);

mock.module("@/i18n", () => ({
  default: {
    t: (key: string) => {
      const translations: Record<string, string> = {
        "public.securePortal": "Secure Portal",
        "public.portalDescription": "Sign in to view your commission details",
        "public.username": "Username",
        "public.usernamePlaceholder": "Enter your username",
        "public.password": "Password",
        "public.passwordPlaceholder": "Enter your password",
        "public.accessPortal": "Access Portal",
        "public.invalidCredentials": "Invalid credentials",
        "public.loginError": "Login failed. Please try again.",
      };
      return translations[key] ?? key;
    },
    language: "en",
    changeLanguage: mock(() => Promise.resolve()),
  },
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "public.securePortal": "Secure Portal",
        "public.portalDescription": "Sign in to view your commission details",
        "public.username": "Username",
        "public.usernamePlaceholder": "Enter your username",
        "public.password": "Password",
        "public.passwordPlaceholder": "Enter your password",
        "public.accessPortal": "Access Portal",
        "public.invalidCredentials": "Invalid credentials",
        "public.loginError": "Login failed. Please try again.",
      };
      return translations[key] ?? key;
    },
  }),
  loadSavedLang: mock(() => Promise.resolve()),
}));

describe("PortalAuth", () => {
  const mockOnLogin = mock(() => {});

  beforeEach(() => {
    mockSetPortalToken.mockReset();
    mockFetch.mockReset();
    cleanup();
  });

  test("renders login form with username, password, and submit button", () => {
    render(
      React.createElement(PortalAuth, {
        accessCode: "test-code",
        onLogin: mockOnLogin,
      })
    );
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /access portal/i })
    ).toBeInTheDocument();
  });

  test("calls onLogin with credentials on successful submit", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementationOnce(
      () =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              token: "fake-token",
              workspaceName: "Test Workspace",
              mustChangePassword: false,
            }),
        })
    );

    render(
      React.createElement(PortalAuth, {
        accessCode: "test-code",
        onLogin: mockOnLogin,
      })
    );
    await user.type(screen.getByLabelText(/username/i), "rep1");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /access portal/i }));

    // Wait for async submission
    await new Promise((r) => setTimeout(r, 50));
    expect(mockOnLogin).toHaveBeenCalled();
    const [pwd, mustChange, wsName] = mockOnLogin.mock.calls[0] as [
      string,
      boolean,
      string
    ];
    expect(pwd).toBe("password123");
    expect(mustChange).toBe(false);
    expect(wsName).toBe("Test Workspace");
  });

  test("shows error message on failed login", async () => {
    const user = userEvent.setup();
    mockFetch.mockImplementationOnce(
      () =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Invalid credentials" }),
        })
    );

    render(
      React.createElement(PortalAuth, {
        accessCode: "test-code",
        onLogin: mockOnLogin,
      })
    );
    await user.type(screen.getByLabelText(/username/i), "baduser");
    await user.type(screen.getByLabelText(/password/i), "badpass");
    await user.click(screen.getByRole("button", { name: /access portal/i }));

    await new Promise((r) => setTimeout(r, 50));
    expect(screen.queryByText(/invalid credentials/i)).toBeTruthy();
  });

  test("button is disabled while loading", async () => {
    const user = userEvent.setup();
    // Never resolve so button stays disabled
    mockFetch.mockImplementationOnce(() => new Promise(() => {}));

    render(
      React.createElement(PortalAuth, {
        accessCode: "test-code",
        onLogin: mockOnLogin,
      })
    );
    await user.type(screen.getByLabelText(/username/i), "rep1");
    await user.type(screen.getByLabelText(/password/i), "password123");
    await user.click(screen.getByRole("button", { name: /access portal/i }));

    expect(
      screen.getByRole("button", { name: /access portal/i })
    ).toBeDisabled();
  });
});
