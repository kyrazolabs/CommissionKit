import { describe, test, expect } from "bun:test";
import { welcomeTemplate } from "./welcome";

describe("welcomeTemplate", () => {
  test("contains name when provided", () => {
    const html = welcomeTemplate({
      name: "Bob",
      workspaceName: "Bob Corp",
      dashboardUrl: "https://app.example.com/dash",
    });
    expect(html).toContain("Bob");
  });

  test("contains workspace name", () => {
    const html = welcomeTemplate({
      workspaceName: "Bob Corp",
      dashboardUrl: "https://app.example.com/dash",
    });
    expect(html).toContain("Bob Corp");
  });

  test("contains dashboard URL", () => {
    const html = welcomeTemplate({
      dashboardUrl: "https://app.example.com/dash",
    });
    expect(html).toContain("https://app.example.com/dash");
  });

  test("falls back to generic greeting when no name", () => {
    const html = welcomeTemplate({
      dashboardUrl: "https://app.example.com/dash",
    });
    expect(html).toContain("Welcome to CommissionKit!");
  });

  test("includes 'Go to Dashboard' button", () => {
    const html = welcomeTemplate({
      dashboardUrl: "https://app.example.com/dash",
    });
    expect(html).toContain("Go to Dashboard");
  });
});
