import { badge, baseTemplate, btn, cardSection, divider, h1, infoBox, p } from "./base.js";

export interface PayoutUpdateTemplateProps {
  repName: string;
  workspaceName: string;
  status: string;
  amount: string;
  currency: string;
  period: string;
  portalUrl: string;
  notes?: string;
}

export function payoutUpdateTemplate(props: PayoutUpdateTemplateProps): string {
  const { repName, workspaceName, status, amount, currency, period, portalUrl, notes } = props;

  const statusColors: Record<string, string> = {
    approved: "#3B82F6",
    paid: "#10B981",
    on_hold: "#6B7280",
    disputed: "#EF4444",
  };
  const color = statusColors[status.toLowerCase()] ?? "#3B82F6";

  const body = `
    ${h1("Payout status update 💸")}
    ${p(`Hi ${repName},`)}
    ${p(`Your commission payout for <strong>${period}</strong> has been updated by <strong>${workspaceName}</strong>.`)}

    ${cardSection(`
      <table width="100%" cellpadding="0" cellspacing="0" class="ck-stack">
        <tr>
          <td style="padding-bottom:12px;">
            <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:600;">Status</p>
            <p style="margin:4px 0 0;font-size:16px;color:${color};font-weight:700;">${status.toUpperCase()}</p>
          </td>
          <td style="padding-bottom:12px;text-align:right;">
            <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:600;">Final Amount</p>
            <p style="margin:4px 0 0;font-size:20px;color:#111827;font-weight:800;">${amount} ${currency}</p>
          </td>
        </tr>
      </table>
      ${
        notes
          ? `
        <div style="border-top:1px solid #E5E7EB;margin-top:12px;padding-top:12px;">
          <p style="margin:0;font-size:12px;color:#6B7280;text-transform:uppercase;font-weight:600;">Admin Notes</p>
          <p style="margin:6px 0 0;font-size:14px;color:#374151;font-style:italic;">"${notes}"</p>
        </div>
      `
          : ""
      }
    `)}

    ${btn(portalUrl, "View Portal Details")}

    ${infoBox(`You can track the status of all your payouts and submitted disputes in your personal commission portal.`)}

    ${divider()}
    ${p(`Regards,<br><strong>${workspaceName} Team</strong>`)}
  `;

  return baseTemplate({
    previewText: `Your payout for ${period} is now ${status.toUpperCase()}`,
    body,
    footerNote: `This notification was sent by ${workspaceName} via CommissionKit.`,
  });
}
