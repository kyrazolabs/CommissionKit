import { baseTemplate, btn, divider, h1, infoBox, muted, p } from "./base.js";

export interface EmailVerificationTemplateProps {
  name?: string;
  verificationUrl: string;
  expiresIn?: string;
}

export function emailVerificationTemplate(props: EmailVerificationTemplateProps): string {
  const { name, verificationUrl, expiresIn = "24 hours" } = props;

  const body = `
    ${h1("Verify your email address")}
    ${name ? p(`Hi ${name},`) : ""}
    ${p("Thank you for signing up for CommissionKit! To complete your registration and activate your account, please verify your email address by clicking the button below.")}

    ${btn(verificationUrl, "Verify Email Address")}

    ${infoBox(`This verification link is valid for <strong>${expiresIn}</strong>. If you did not sign up for a CommissionKit account, you can safely ignore this email.`)}

    ${divider()}
    ${muted(`Or copy and paste this link into your browser:<br /><span style="color:#0D9488;word-break:break-all;">${verificationUrl}</span>`)}
  `;

  return baseTemplate({
    previewText: "Verify your email address for CommissionKit",
    body,
    footerNote: "You received this because you signed up for a CommissionKit account.",
  });
}
