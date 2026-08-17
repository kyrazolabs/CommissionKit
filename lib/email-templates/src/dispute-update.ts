import { baseTemplate, btn, cardSection, divider, h1, infoBox, p } from "./base.js";

export interface DisputeUpdateTemplateProps {
  repName: string;
  workspaceName: string;
  payoutPeriod: string;
  status: string;
  adminNotes: string;
  portalUrl: string;
}

export function disputeUpdateTemplate(props: DisputeUpdateTemplateProps): string {
  const { repName, workspaceName, payoutPeriod, status, adminNotes, portalUrl } = props;

  const statusColors: Record<string, string> = {
    under_review: "#F59E0B",
    resolved: "#10B981",
    open: "#EF4444",
  };
  const color = statusColors[status.toLowerCase()] ?? "#3B82F6";

  const body = `
    ${h1("Update on your dispute 💬")}
    ${p(`Hi ${repName},`)}
    ${p(`An administrator from <strong>${workspaceName}</strong> has reviewed the dispute you submitted for the <strong>${payoutPeriod}</strong> payout period.`)}

    ${cardSection(`
      <p style="margin:0 0 8px;font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Current Status</p>
      <div style="margin:0 0 16px;">
        <span style="background-color:${color};color:#fff;padding:4px 12px;border-radius:99px;font-size:12px;font-weight:700;text-transform:uppercase;">
          ${status.replace("_", " ")}
        </span>
      </div>

      <p style="margin:0 0 8px;font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:600;letter-spacing:0.5px;">Resolution Notes</p>
      <div style="padding:12px;background-color:#fff;border:1px solid #E5E7EB;border-radius:8px;font-size:14px;color:#374151;line-height:1.5;">
        ${adminNotes || "<em>No notes provided.</em>"}
      </div>
    `)}

    ${btn(portalUrl, "View Resolution in Portal")}

    ${infoBox(`If you have further questions regarding this resolution, please contact your sales manager directly.`)}

    ${divider()}
    ${p(`Regards,<br><strong>${workspaceName} Team</strong>`)}
  `;

  return baseTemplate({
    previewText: `Dispute Resolution: Your dispute for ${payoutPeriod} is now ${status.toUpperCase().replace("_", " ")}`,
    body,
    footerNote: `This notification was sent by ${workspaceName} via CommissionKit.`,
  });
}
