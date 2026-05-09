import { baseTemplate, btn, h1, p, muted, divider, warningBox } from "./base.js";
export function passwordResetTemplate(props) {
    const { name, resetUrl, expiresIn = "1 hour" } = props;
    const body = `
    ${h1("Reset your password")}
    ${name ? p(`Hi ${name},`) : ""}
    ${p("We received a request to reset the password for your CommissionKit account. Click the button below to choose a new password.")}

    ${btn(resetUrl, "Reset Password")}

    ${warningBox(`This link expires in <strong>${expiresIn}</strong>. If you didn't request a password reset, no action is needed — your password is unchanged.`)}

    ${divider()}
    ${muted(`Or copy and paste this link into your browser:<br /><span style="color:#0D9488;word-break:break-all;">${resetUrl}</span>`)}
  `;
    return baseTemplate({
        previewText: "Reset your CommissionKit password",
        body,
        footerNote: "You received this because a password reset was requested for your account.",
    });
}
