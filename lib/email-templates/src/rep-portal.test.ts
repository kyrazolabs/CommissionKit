import { describe, expect, test } from "bun:test";
import { repPortalTemplate } from "./rep-portal";

describe("repPortalTemplate", () => {
  const props = {
    repName: "Alice",
    workspaceName: "Acme Corp",
    portalUrl: "https://app.example.com/portal/abc123",
    portalUsername: "alice123",
    portalPassword: "temp-pass-xyz",
  };

  test("contains rep name", () => {
    const html = repPortalTemplate(props);
    expect(html).toContain("Alice");
  });

  test("contains workspace name", () => {
    const html = repPortalTemplate(props);
    expect(html).toContain("Acme Corp");
  });

  test("contains portal URL", () => {
    const html = repPortalTemplate(props);
    expect(html).toContain("https://app.example.com/portal/abc123");
  });

  test("contains portal username", () => {
    const html = repPortalTemplate(props);
    expect(html).toContain("alice123");
  });

  test("contains portal password when provided", () => {
    const html = repPortalTemplate(props);
    expect(html).toContain("temp-pass-xyz");
  });

  test("does not show password section when not provided", () => {
    const html = repPortalTemplate({ ...props, portalPassword: undefined });
    expect(html).not.toContain("temp-pass-xyz");
  });

  test("returns valid HTML with doctype", () => {
    const html = repPortalTemplate(props);
    expect(html).toContain("<!DOCTYPE html>");
  });

  test("contains CommissionKit branding", () => {
    const html = repPortalTemplate(props);
    expect(html).toContain("CommissionKit");
  });
});
