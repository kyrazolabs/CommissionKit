import { baseTemplate, h1, p, muted, divider, warningBox, cardSection } from "./base.js";

export interface VerificationCodeTemplateProps {
  code: string;
  expiresIn?: string;
}

export function verificationCodeTemplate(props: VerificationCodeTemplateProps): string {
  const { code, expiresIn = "15 minutes" } = props;

  const body = `
    ${h1("Verify your email address")}
    ${p("To finish setting up your account, please enter the 6-digit verification code below:")}

    ${cardSection(`
      <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;text-align:center;">Verification code</p>
      <div class="ck-code" style="font-size:36px;font-weight:700;text-align:center;letter-spacing:6px;color:#111827;font-family:monospace;">
        ${code}
      </div>
    `)}

    ${warningBox(`This verification code is valid for <strong>${expiresIn}</strong>. If you did not create a CommissionKit account, you can safely ignore this email.`)}

    ${divider()}
  `;

  return baseTemplate({
    previewText: `Your verification code is ${code}`,
    body,
    footerNote: "You received this because you are verifying your email address on CommissionKit.",
  });
}
