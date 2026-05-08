import { baseTemplate, btn, h1, p, muted, divider, statRow, infoBox } from "./base.js";

export interface CommissionRunTemplateProps {
  recipientName: string;
  workspaceName: string;
  period: string;          // e.g. "2024-03"
  totalPaid: string;       // pre-formatted, e.g. "$42,350.00"
  totalDeals: number;
  totalReps: number;
  topEarner?: { name: string; amount: string };
  runUrl: string;
}

export function commissionRunTemplate(props: CommissionRunTemplateProps): string {
  const {
    recipientName, workspaceName, period, totalPaid, totalDeals,
    totalReps, topEarner, runUrl,
  } = props;

  const [year, month] = period.split("-");
  const periodLabel = new Date(Number(year), Number(month) - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const body = `
    ${h1(`Commission run complete — ${periodLabel}`)}
    ${p(`Hi ${recipientName},`)}
    ${p(`The commission calculation for <strong>${workspaceName}</strong> for <strong>${periodLabel}</strong> has finished. Here's a quick summary:`)}

    <div style="background-color:#F9FAFB;border:1px solid #E5E7EB;border-radius:12px;padding:18px 22px;margin:20px 0;">
      ${statRow("Period", periodLabel)}
      ${statRow("Total commissions paid", totalPaid)}
      ${statRow("Deals processed", String(totalDeals))}
      ${statRow("Reps paid", String(totalReps))}
      ${topEarner ? statRow("Top earner", `${topEarner.name} — ${topEarner.amount}`) : ""}
    </div>

    ${infoBox("All commissions have been calculated. Review the full breakdown and export payroll in the Runs page.")}

    ${btn(runUrl, "View Full Run Report")}

    ${divider()}
    ${muted("This is an automated notification from CommissionKit.")}
  `;

  return baseTemplate({
    previewText: `Commission run complete for ${periodLabel} — ${totalPaid} total`,
    body,
  });
}
