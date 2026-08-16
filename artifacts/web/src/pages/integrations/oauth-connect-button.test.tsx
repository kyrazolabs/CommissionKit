import { describe, test, expect, mock, afterEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import type { Connector } from "./types";

mock.module("@/hooks/use-workspace", () => ({
  useWorkspace: () => ({ activeWorkspace: { id: "ws1", name: "Test Workspace" } }),
}));

mock.module("./connect-dialog", () => ({
  ConnectDialog: () => React.createElement("div", { "data-testid": "manual-form" }, "MANUAL-FORM"),
}));

const oauthConnector: Connector = {
  name: "hubspot",
  displayName: "HubSpot",
  description: "Sync deals from HubSpot",
  icon: "hubspot",
  category: "crm",
  features: ["sync_reps", "sync_deals", "oauth_support"],
  version: "1.0.0",
};

const manualConnector: Connector = {
  ...oauthConnector,
  name: "odoo",
  displayName: "Odoo",
  features: ["sync_reps", "sync_deals"],
};

describe("OAuthConnectButton", () => {
  afterEach(cleanup);

  test("renders a Connect button for oauth-supported connectors", async () => {
    const { OAuthConnectButton } = await import("./oauth-connect-button");
    render(React.createElement(OAuthConnectButton, { connector: oauthConnector }));
    expect(
      screen.getByRole("button", { name: /connect hubspot/i })
    ).toBeTruthy();
  });

  test("toggles the advanced manual credentials disclosure", async () => {
    const { OAuthConnectButton } = await import("./oauth-connect-button");
    const user = userEvent.setup();
    render(React.createElement(OAuthConnectButton, { connector: oauthConnector }));

    expect(screen.queryByTestId("manual-form")).toBeNull();

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    expect(screen.getByTestId("manual-form")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /advanced/i }));
    expect(screen.queryByTestId("manual-form")).toBeNull();
  });

  test("renders the ConnectDialog (configure) when already connected", async () => {
    const { OAuthConnectButton } = await import("./oauth-connect-button");
    render(
      React.createElement(OAuthConnectButton, {
        connector: oauthConnector,
        isConnected: true,
      })
    );
    expect(screen.getByTestId("manual-form")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /connect hubspot/i })
    ).toBeNull();
  });

  test("renders the ConnectDialog for non-oauth connectors", async () => {
    const { OAuthConnectButton } = await import("./oauth-connect-button");
    render(React.createElement(OAuthConnectButton, { connector: manualConnector }));
    expect(screen.getByTestId("manual-form")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: /connect odoo/i })
    ).toBeNull();
  });
});
