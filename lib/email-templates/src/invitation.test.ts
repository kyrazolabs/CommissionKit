import { describe, expect, test } from "bun:test";
import { invitationTemplate } from "./invitation";

describe("invitationTemplate", () => {
  const baseProps = {
    inviterName: "Charlie",
    workspaceName: "Charlie Co",
    role: "admin" as const,
    acceptUrl: "https://app.example.com/accept-invite/xyz",
  };

  test("contains inviter name", () => {
    const html = invitationTemplate(baseProps);
    expect(html).toContain("Charlie");
  });

  test("contains workspace name", () => {
    const html = invitationTemplate(baseProps);
    expect(html).toContain("Charlie Co");
  });

  test("contains accept URL", () => {
    const html = invitationTemplate(baseProps);
    expect(html).toContain("https://app.example.com/accept-invite/xyz");
  });

  test("contains invitee name when provided", () => {
    const html = invitationTemplate({ ...baseProps, inviteeName: "Diana" });
    expect(html).toContain("Diana");
  });

  test("contains role label for admin", () => {
    const html = invitationTemplate(baseProps);
    expect(html).toContain("Admin");
  });

  test("contains role label for member", () => {
    const html = invitationTemplate({ ...baseProps, role: "member" });
    expect(html).toContain("Member");
  });

  test("contains expiry date when provided", () => {
    const expiry = new Date("2025-12-31");
    const html = invitationTemplate({ ...baseProps, expiresAt: expiry });
    expect(html).toContain("December 31, 2025");
  });

  test("shows 'Accept Invitation' button", () => {
    const html = invitationTemplate(baseProps);
    expect(html).toContain("Accept Invitation");
  });
});
