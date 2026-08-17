import { describe, expect, test } from "bun:test";
import { payoutUpdateTemplate } from "./payout-update";

describe("payoutUpdateTemplate", () => {
  const props = {
    repName: "Heidi",
    workspaceName: "Heidi LLC",
    status: "approved",
    amount: "1,500.00",
    currency: "USD",
    period: "Jan 1–Jan 31, 2024",
    portalUrl: "https://app.example.com/portal/abc",
  };

  test("contains rep name", () => {
    const html = payoutUpdateTemplate(props);
    expect(html).toContain("Heidi");
  });

  test("contains workspace name", () => {
    const html = payoutUpdateTemplate(props);
    expect(html).toContain("Heidi LLC");
  });

  test("contains status", () => {
    const html = payoutUpdateTemplate(props);
    expect(html).toContain("APPROVED");
  });

  test("contains amount in currency", () => {
    const html = payoutUpdateTemplate(props);
    expect(html).toContain("1,500.00");
    expect(html).toContain("USD");
  });

  test("contains period", () => {
    const html = payoutUpdateTemplate(props);
    expect(html).toContain("Jan 1–Jan 31, 2024");
  });

  test("contains portal URL", () => {
    const html = payoutUpdateTemplate(props);
    expect(html).toContain("https://app.example.com/portal/abc");
  });

  test("contains admin notes when provided", () => {
    const html = payoutUpdateTemplate({ ...props, notes: "Great work!" });
    expect(html).toContain("Great work!");
  });

  test("'View Portal Details' button present", () => {
    const html = payoutUpdateTemplate(props);
    expect(html).toContain("View Portal Details");
  });
});
