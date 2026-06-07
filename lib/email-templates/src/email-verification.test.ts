import { describe, test, expect } from "bun:test";
import { emailVerificationTemplate } from "./email-verification";

describe("emailVerificationTemplate", () => {
  test("contains verification URL", () => {
    const html = emailVerificationTemplate({
      verificationUrl: "https://app.example.com/api/auth/verify-email?token=abc",
    });
    expect(html).toContain("https://app.example.com/api/auth/verify-email?token=abc");
  });

  test("contains name when provided", () => {
    const html = emailVerificationTemplate({
      name: "Judy",
      verificationUrl: "https://app.example.com/api/auth/verify-email?token=abc",
    });
    expect(html).toContain("Judy");
  });

  test("contains default expiry", () => {
    const html = emailVerificationTemplate({
      verificationUrl: "https://app.example.com/api/auth/verify-email?token=abc",
    });
    expect(html).toContain("24 hours");
  });

  test("contains custom expiry", () => {
    const html = emailVerificationTemplate({
      verificationUrl: "https://app.example.com/api/auth/verify-email?token=abc",
      expiresIn: "48 hours",
    });
    expect(html).toContain("48 hours");
  });

  test("'Verify Email Address' button present", () => {
    const html = emailVerificationTemplate({
      verificationUrl: "https://app.example.com/api/auth/verify-email?token=abc",
    });
    expect(html).toContain("Verify Email Address");
  });
});
