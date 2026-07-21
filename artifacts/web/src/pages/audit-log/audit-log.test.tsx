import { describe, test, expect, mock, beforeEach } from "bun:test";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuditLogTable } from "@/components/audit-log/audit-log-table";
import type { AuditEvent } from "@/types/audit-log";

// Mock sonner
mock("sonner", () => ({
  toast: { success: () => {}, error: () => {}, info: () => {} },
}));

const MOCK_EVENTS: AuditEvent[] = [
  {
    id: "1",
    workspaceId: "ws1",
    userId: "u1",
    userName: "Alice Smith",
    userEmail: "alice@example.com",
    action: "create",
    resourceType: "plan",
    resourceId: "p1",
    resourceName: "Q1 Bonus Plan",
    changes: [
      { field: "name", from: undefined, to: "Q1 Bonus Plan" },
      { field: "rate", from: undefined, to: "0.05" },
    ],
    ipAddress: "1.1.1.1",
    userAgent: "Mozilla/5.0",
    timestamp: "2025-01-15T10:30:00.000Z",
  },
  {
    id: "2",
    workspaceId: "ws1",
    userId: "u2",
    userName: "Bob Jones",
    userEmail: "bob@example.com",
    action: "update",
    resourceType: "deal",
    resourceId: "d1",
    resourceName: "Acme Corp Deal",
    changes: [{ field: "amount", from: "10000", to: "12000" }],
    ipAddress: "2.2.2.2",
    userAgent: "Mozilla/5.0",
    timestamp: "2025-01-15T11:00:00.000Z",
  },
  {
    id: "3",
    workspaceId: "ws1",
    userId: "u1",
    userName: "Alice Smith",
    userEmail: "alice@example.com",
    action: "delete",
    resourceType: "rep",
    resourceId: "r1",
    resourceName: "Charlie Davis",
    changes: [{ field: "status", from: "active", to: undefined }],
    ipAddress: "1.1.1.1",
    userAgent: "Mozilla/5.0",
    timestamp: "2025-01-15T12:00:00.000Z",
  },
];

describe("AuditLogTable", () => {
  beforeEach(() => {
    cleanup();
  });

  test("renders loading skeletons when isLoading=true", () => {
    const { container } = render(
      React.createElement(AuditLogTable, {
        events: [],
        isLoading: true,
        page: 1,
        totalPages: 1,
        total: 0,
        onPageChange: () => {},
      })
    );
    // Check for animate-pulse class which is what Skeleton uses
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  test("renders empty state when no events", () => {
    render(
      React.createElement(AuditLogTable, {
        events: [],
        isLoading: false,
        page: 1,
        totalPages: 1,
        total: 0,
        onPageChange: () => {},
      })
    );
    expect(screen.getByText(/no audit events found/i)).toBeTruthy();
  });

  test("renders events in table rows", () => {
    const { container } = render(
      React.createElement(AuditLogTable, {
        events: MOCK_EVENTS,
        isLoading: false,
        page: 1,
        totalPages: 1,
        total: 3,
        onPageChange: () => {},
      })
    );

    // Use exact match selector to avoid duplicate matches (title + visible text)
    const aliceCell = container.querySelector(".font-medium[title='Alice Smith']");
    const bobCell = container.querySelector(".font-medium[title='Bob Jones']");
    expect(aliceCell).toBeTruthy();
    expect(bobCell).toBeTruthy();
  });

  test("expands row on chevron click", async () => {
    const user = userEvent.setup();
    render(
      React.createElement(AuditLogTable, {
        events: MOCK_EVENTS,
        isLoading: false,
        page: 1,
        totalPages: 1,
        total: 3,
        onPageChange: () => {},
      })
    );

    // Find expand toggle buttons (first 3 buttons are expand toggles)
    const allButtons = document.querySelectorAll("button");
    const firstExpandButton = allButtons[0];
    await user.click(firstExpandButton!);

    // Expanded panel should be visible with the diff content
    await new Promise((r) => setTimeout(r, 200));
    const panels = document.querySelectorAll('[class*="rounded-md border"]');
    expect(panels.length).toBeGreaterThan(0);
  });

  test("shows pagination when totalPages > 1", () => {
    render(
      React.createElement(AuditLogTable, {
        events: MOCK_EVENTS,
        isLoading: false,
        page: 2,
        totalPages: 5,
        total: 120,
        onPageChange: () => {},
      })
    );

    expect(screen.getByText(/page 2 of 5/i)).toBeTruthy();
    expect(screen.getByText(/120 events/i)).toBeTruthy();
  });

  test("calls onPageChange when prev/next clicked", async () => {
    const user = userEvent.setup();
    const onPageChange = mock(() => {});
    render(
      React.createElement(AuditLogTable, {
        events: MOCK_EVENTS,
        isLoading: false,
        page: 2,
        totalPages: 5,
        total: 120,
        onPageChange: onPageChange,
      })
    );

    // Find pagination buttons - they come after the 3 expand toggle buttons
    const allButtons = document.querySelectorAll("button");
    const prevBtn = allButtons[3]; // 3 expand buttons first
    const nextBtn = allButtons[4];
    await user.click(prevBtn!);
    await user.click(nextBtn!);

    expect(onPageChange).toHaveBeenCalled();
  });

  test("collapses row when chevron clicked again", async () => {
    const user = userEvent.setup();
    render(
      React.createElement(AuditLogTable, {
        events: MOCK_EVENTS,
        isLoading: false,
        page: 1,
        totalPages: 1,
        total: 3,
        onPageChange: () => {},
      })
    );

    // Find expand buttons using data-testid
    const expandButtons = document.querySelectorAll("tbody button");
    expect(expandButtons.length).toBe(3); // 3 rows, 1 expand button each

    // Before expand: all detail rows have opacity 0 (CSS approach keeps them in DOM)
    let allDetailRows = document.querySelectorAll("tbody tr:has(td[colspan='6'])");
    expect(allDetailRows.length).toBe(3);
    const firstDetailRowBefore = allDetailRows[0];
    expect(firstDetailRowBefore.querySelector("div")?.style.opacity).toBe("0");

    // Expand first row using data-testid
    const firstExpandBtn = document.querySelector("[data-testid='expand-1']");
    await user.click(firstExpandBtn!);
    await new Promise((r) => setTimeout(r, 200));

    // After expand: first detail row has opacity 1
    const allDetailRowsAfter = document.querySelectorAll("tbody tr:has(td[colspan='6'])");
    const firstDetailRowAfter = allDetailRowsAfter[0];
    expect(firstDetailRowAfter.querySelector("div")?.style.opacity).toBe("1");

    // Collapse
    await user.click(firstExpandBtn!);
    await new Promise((r) => setTimeout(r, 200));

    // After collapse: first detail row has opacity 0 again
    const allDetailRowsCollapsed = document.querySelectorAll("tbody tr:has(td[colspan='6'])");
    const firstDetailRowCollapsed = allDetailRowsCollapsed[0];
    expect(firstDetailRowCollapsed.querySelector("div")?.style.opacity).toBe("0");
  });
});
