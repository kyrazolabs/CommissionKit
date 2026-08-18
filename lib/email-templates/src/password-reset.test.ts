import { describe, expect, test } from "bun:test";
import { passwordResetTemplate } from "./password-reset";

describe("passwordResetTemplate", () => {
  test("contains reset URL", () => {
    const html = passwordResetTemplate({
      resetUrl: "https://app.example.com/reset-password?token=abc",
    });
    expect(html).toContain("https://app.example.com/reset-password?token=abc");
  });

  test("contains name when provided", () => {
    const html = passwordResetTemplate({
      name: "Grace",
      resetUrl: "https://app.example.com/reset-password?token=abc",
    });
    expect(html).toContain("Grace");
  });

  test("contains default expiry when not provided", () => {
    const html = passwordResetTemplate({
      resetUrl: "https://app.example.com/reset-password?token=abc",
    });
    expect(html).toContain("1 hour");
  });

  test("contains custom expiry when provided", () => {
    const html = passwordResetTemplate({
      resetUrl: "https://app.example.com/reset-password?token=abc",
      expiresIn: "30 minutes",
    });
    expect(html).toContain("30 minutes");
  });

  test("contains 'Reset Password' button", () => {
    const html = passwordResetTemplate({
      resetUrl: "https://app.example.com/reset-password?token=abc",
    });
    expect(html).toContain("Reset Password");
  });
});
