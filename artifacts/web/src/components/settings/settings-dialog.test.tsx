import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { useSettingsDialog } from "@/hooks/use-settings-dialog";

mock.module("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

mock.module("@/pages/settings/settings", () => ({
  SettingsPage: () => React.createElement("div", { "data-testid": "settings-page" }, "page"),
}));

mock.module("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? React.createElement("div", { role: "dialog" }, children) : null,
  DialogContent: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogHeader: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", null, children),
  DialogTitle: ({ children }: { children: React.ReactNode }) =>
    React.createElement("h2", null, children),
  DialogDescription: ({ children }: { children: React.ReactNode }) =>
    React.createElement("p", null, children),
}));

describe("SettingsDialog", () => {
  beforeEach(() => {
    useSettingsDialog.setState({ isOpen: false });
  });
  afterEach(() => cleanup());

  test("does not render content when closed", async () => {
    const { SettingsDialog } = await import("./settings-dialog");
    render(React.createElement(SettingsDialog));
    expect(screen.queryByTestId("settings-page")).toBeNull();
  });

  test("renders title and page when open", async () => {
    useSettingsDialog.setState({ isOpen: true });
    const { SettingsDialog } = await import("./settings-dialog");
    render(React.createElement(SettingsDialog));
    expect(screen.getByText("settings.title")).not.toBeNull();
    expect(screen.getByTestId("settings-page")).not.toBeNull();
  });
});
