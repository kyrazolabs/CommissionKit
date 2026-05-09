import { baseTemplate, btn, h1, p, muted, divider, warningBox, statRow } from "./base.js";
export function clawbackAlertTemplate(props) {
    const { recipientName, workspaceName, repName, dealName, originalAmount, clawbackAmount, reason, detailsUrl, } = props;
    const body = `
    ${h1("Clawback triggered")}
    ${p(`Hi ${recipientName},`)}
    ${p(`A commission clawback has been triggered in <strong>${workspaceName}</strong>. Please review the details below.`)}

    ${warningBox("A clawback means a previously paid commission is being reversed due to a deal cancellation or refund within the clawback window.")}

    <div style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:18px 22px;margin:20px 0;">
      ${statRow("Rep", repName)}
      ${statRow("Deal", dealName)}
      ${statRow("Original commission", originalAmount)}
      ${statRow("Clawback amount", clawbackAmount)}
      ${reason ? statRow("Reason", reason) : ""}
    </div>

    ${btn(detailsUrl, "View Deal Details")}

    ${divider()}
    ${muted("This clawback will be reflected in the next commission run.")}
  `;
    return baseTemplate({
        previewText: `Clawback alert: ${dealName} — ${clawbackAmount}`,
        body,
        footerNote: `You received this because you're an admin of ${workspaceName}.`,
    });
}
