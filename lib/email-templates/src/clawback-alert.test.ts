import { describe, expect, test } from "bun:test";
import { clawbackAlertTemplate } from "./clawback-alert";

describe("clawbackAlertTemplate", () => {
  const props = {
    recipientName: "Karen",
    workspaceName: "Karen Co",
    repName: "Leo",
    dealName: "Big Deal",
    originalAmount: "$10,000.00",
    clawbackAmount: "$10,000.00",
    detailsUrl: "https://app.example.com/dash/deals/deal1",
  };

  test("contains recipient name", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("Karen");
  });

  test("contains workspace name", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("Karen Co");
  });

  test("contains rep name", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("Leo");
  });

  test("contains deal name", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("Big Deal");
  });

  test("contains original amount", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("$10,000.00");
  });

  test("contains clawback amount", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("$10,000.00");
  });

  test("contains details URL", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("https://app.example.com/dash/deals/deal1");
  });

  test("contains reason when provided", () => {
    const html = clawbackAlertTemplate({
      ...props,
      reason: "Deal cancelled within clawback window",
    });
    expect(html).toContain("Deal cancelled within clawback window");
  });

  test("'View Deal Details' button present", () => {
    const html = clawbackAlertTemplate(props);
    expect(html).toContain("View Deal Details");
  });
});
