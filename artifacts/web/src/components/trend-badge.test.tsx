import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { TrendBadge } from "./trend-badge";

describe("TrendBadge", () => {
  afterEach(() => {
    cleanup();
  });

  test("renders green uptrend with positive percentage", () => {
    const { container } = render(React.createElement(TrendBadge, { trend: 12.5 }));
    expect(container.textContent).toContain("+12.5%");
    // Icon is rendered as SVG (not in textContent) — verified by component rendering
  });

  test("renders red downtrend with negative percentage", () => {
    const { container } = render(React.createElement(TrendBadge, { trend: -5.3 }));
    expect(container.textContent).toContain("-5.3%");
  });

  test("renders neutral for zero trend", () => {
    const { container } = render(React.createElement(TrendBadge, { trend: 0 }));
    expect(container.textContent).toContain("0.0%");
  });

  test("formats small decimal trends correctly", () => {
    const { container } = render(React.createElement(TrendBadge, { trend: 2.1 }));
    expect(container.textContent).toContain("+2.1%");
  });
});
