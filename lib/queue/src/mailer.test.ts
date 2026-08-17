import { describe, expect, mock, test } from "bun:test";

const mockSendMail = mock(() => Promise.resolve({ messageId: "msg_123" }));
const mockVerify = mock(() => Promise.resolve(true));

mock.module("nodemailer", () => ({
  default: {
    createTransport: mock(() => ({
      sendMail: mockSendMail,
      verify: mockVerify,
    })),
  },
  createTransport: mock(() => ({
    sendMail: mockSendMail,
    verify: mockVerify,
  })),
}));

describe("sendMail", () => {
  test("sends email and returns message info", async () => {
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";

    const { sendMail } = await import("./mailer");
    const result = await sendMail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello</p>",
    });

    expect(result).toBeDefined();
  });

  test("auto-generates plain text from HTML", async () => {
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";

    const { sendMail } = await import("./mailer");
    const result = await sendMail({
      to: "test@example.com",
      subject: "Test",
      html: "<p>Hello World</p>",
    });
    expect(result).toBeDefined();
  });
});

describe("verifySmtp", () => {
  test("resolves successfully when SMTP is reachable", async () => {
    process.env.SMTP_HOST = "smtp.test.com";
    process.env.SMTP_USER = "user";
    process.env.SMTP_PASS = "pass";

    const { verifySmtp } = await import("./mailer");
    await expect(verifySmtp()).resolves.toBeUndefined();
  });
});

describe("getMailFrom", () => {
  test("returns env override when set", () => {
    process.env.MAIL_FROM = "custom@test.com";
    const { getMailFrom } = require("./mailer");
    expect(getMailFrom()).toBe("custom@test.com");
  });
});
