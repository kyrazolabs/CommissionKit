import { describe, test, expect } from "bun:test";
import { disputeUpdateTemplate } from "./dispute-update";

describe("disputeUpdateTemplate", () => {
  const props = {
    repName: "Ivan",
    workspaceName: "Ivan Group",
    payoutPeriod: "Feb 1–Feb 28, 2024",
    status: "resolved",
    adminNotes: "Reviewed and resolved in your favor.",
    portalUrl: "https://app.example.com/portal/def",
  };

  test("contains rep name", () => {
    const html = disputeUpdateTemplate(props);
    expect(html).toContain("Ivan");
  });

  test("contains workspace name", () => {
    const html = disputeUpdateTemplate(props);
    expect(html).toContain("Ivan Group");
  });

  test("contains payout period", () => {
    const html = disputeUpdateTemplate(props);
    expect(html).toContain("Feb 1–Feb 28, 2024");
  });

  test("contains status as resolved", () => {
    const html = disputeUpdateTemplate(props);
    expect(html).toContain("resolved");
  });

  test("contains admin notes", () => {
    const html = disputeUpdateTemplate(props);
    expect(html).toContain("Reviewed and resolved in your favor.");
  });

  test("contains portal URL", () => {
    const html = disputeUpdateTemplate(props);
    expect(html).toContain("https://app.example.com/portal/def");
  });

  test("shows fallback note when adminNotes not provided", () => {
    const html = disputeUpdateTemplate({ ...props, adminNotes: "" });
    expect(html).toContain("No notes provided");
  });

  test("'View Resolution in Portal' button present", () => {
    const html = disputeUpdateTemplate(props);
    expect(html).toContain("View Resolution in Portal");
  });
});
