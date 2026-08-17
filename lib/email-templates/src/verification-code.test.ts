import { describe, expect, test } from "bun:test";
import { verificationCodeTemplate } from "./verification-code";

describe("verificationCodeTemplate", () => {
  test("contains the verification code", () => {
    const html = verificationCodeTemplate({ code: "123456" });
    expect(html).toContain("123456");
  });

  test("contains default expiry", () => {
    const html = verificationCodeTemplate({ code: "123456" });
    expect(html).toContain("15 minutes");
  });

  test("contains custom expiry", () => {
    const html = verificationCodeTemplate({ code: "123456", expiresIn: "30 minutes" });
    expect(html).toContain("30 minutes");
  });

  test("contains preview text with code", () => {
    const html = verificationCodeTemplate({ code: "654321" });
    expect(html).toContain("654321");
  });
});
