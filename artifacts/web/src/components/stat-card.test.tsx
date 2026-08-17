import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { DollarSign } from "lucide-react";
import React from "react";
import { StatCard } from "./stat-card";

// Mock HelpTooltip
mock.module("@/components/help-tooltip", () => ({
  HelpTooltip: ({ content }: { content: string }) =>
    React.createElement("span", { "data-testid": "help-tooltip" }, content),
}));

describe("StatCard", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders label and formatted value", () => {
    const { container } = render(
      React.createElement(StatCard, {
        label: "Total Revenue",
        value: "$12,500",
        icon: DollarSign,
        tooltip: "Total revenue this period",
      }),
    );
    expect(container.textContent).toContain("Total Revenue");
    expect(container.textContent).toContain("$12,500");
  });

  test("renders icon component", () => {
    const { container } = render(
      React.createElement(StatCard, {
        label: "Deals",
        value: "24",
        icon: DollarSign,
        tooltip: "Deals closed",
      }),
    );
    expect(container.querySelector(".bg-secondary")).not.toBeNull();
  });

  test("renders trend badge when trend is provided", () => {
    const { container } = render(
      React.createElement(StatCard, {
        label: "Commissions",
        value: "$8,000",
        icon: DollarSign,
        tooltip: "Total commissions",
        trend: 15.2,
        trendLabel: "vs last period",
      }),
    );
    expect(container.textContent).toContain("+15.2%");
    expect(container.textContent).toContain("vs last period");
  });

  test("renders without trend when trend is null", () => {
    const { container } = render(
      React.createElement(StatCard, {
        label: "Active Reps",
        value: "10",
        icon: DollarSign,
        tooltip: "Active reps",
        trend: null,
        trendLabel: "This period",
      }),
    );
    expect(container.textContent).toContain("Active Reps");
    expect(container.textContent).toContain("10");
    expect(container.textContent).not.toContain("null");
  });

  test("renders trendLabel text when provided alongside trend", () => {
    const { container } = render(
      React.createElement(StatCard, {
        label: "Revenue",
        value: "$50,000",
        icon: DollarSign,
        tooltip: "Pipeline revenue",
        trend: 8.4,
        trendLabel: "vs last period",
      }),
    );
    expect(container.textContent).toContain("vs last period");
  });

  test("applies custom className", () => {
    const { container } = render(
      React.createElement(StatCard, {
        label: "Test",
        value: "100",
        icon: DollarSign,
        tooltip: "Test tooltip",
        className: "custom-card-class",
      }),
    );
    const card = container.querySelector(".custom-card-class");
    expect(card).not.toBeNull();
  });
});
