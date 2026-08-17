import { describe, expect, test } from "bun:test";
import { commissionRunTemplate } from "./commission-run";

describe("commissionRunTemplate", () => {
  const props = {
    recipientName: "Eve",
    workspaceName: "Eve Inc",
    period: "2024-03",
    totalPaid: "$42,350.00",
    totalDeals: 15,
    totalReps: 5,
    runUrl: "https://app.example.com/runs/r1",
  };

  test("contains recipient name", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("Eve");
  });

  test("contains workspace name", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("Eve Inc");
  });

  test("contains period label", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("March 2024");
  });

  test("contains total paid amount", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("$42,350.00");
  });

  test("contains total deals count", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("15");
  });

  test("contains total reps count", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("5");
  });

  test("contains run URL", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("https://app.example.com/runs/r1");
  });

  test("contains top earner when provided", () => {
    const html = commissionRunTemplate({
      ...props,
      topEarner: { name: "Frank", amount: "$12,000" },
    });
    expect(html).toContain("Frank");
    expect(html).toContain("$12,000");
  });

  test("'View Full Run Report' button present", () => {
    const html = commissionRunTemplate(props);
    expect(html).toContain("View Full Run Report");
  });
});
