import { baseTemplate, h1, p, divider, warningBox } from "./base.js";

export interface VerificationCodeTemplateProps {
  code: string;
  expiresIn?: string;
}

export function verificationCodeTemplate(props: VerificationCodeTemplateProps): string {
  const { code, expiresIn = "15 minutes" } = props;

  const body = `
    ${h1("Verify your email address")}
    ${p("To finish setting up your account, please verify your email address by entering the 6-digit verification code below:")}

    <div style="font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 4px; padding: 20px; background-color: #f3f4f6; border-radius: 8px; margin: 20px 0; color: #0f172a; border: 1px solid #e2e8f0;">
      ${code}
    </div>

    ${warningBox(`This verification code is valid for <strong>${expiresIn}</strong>. If you did not create a CommissionKit account, you can safely ignore this email.`)}

    ${divider()}
  `;

  return baseTemplate({
    previewText: `Your verification code is ${code}`,
    body,
    footerNote: "You received this because you are verifying your email address on CommissionKit.",
  });
}
