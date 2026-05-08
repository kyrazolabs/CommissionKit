import { baseTemplate, btn, h1, p, muted, divider } from "./base.js";

export interface WelcomeTemplateProps {
  name?: string;
  workspaceName?: string;
  dashboardUrl: string;
}

export function welcomeTemplate(props: WelcomeTemplateProps): string {
  const { name, workspaceName, dashboardUrl } = props;
  const greeting = name ? `Welcome, ${name}!` : "Welcome to CommissionKit!";

  const body = `
    ${h1(greeting)}
    ${p("You're all set. CommissionKit makes commission tracking effortless — from plans and deals to automated calculations.")}

    ${workspaceName
      ? p(`Your workspace <strong>${workspaceName}</strong> is ready. Here's what you can do next:`)
      : p("Here's what you can do to get started:")}

    <ul style="padding-left:20px;color:#374151;font-size:15px;line-height:2;">
      <li>Set up your first <strong>Commission Plan</strong></li>
      <li>Add your <strong>Sales Reps</strong></li>
      <li>Import <strong>Deals</strong> via CSV</li>
      <li>Run your first <strong>Commission Calculation</strong></li>
    </ul>

    ${btn(dashboardUrl, "Go to Dashboard")}

    ${divider()}
    ${muted("Questions? Reply to this email — we're happy to help.")}
  `;

  return baseTemplate({
    previewText: `Welcome to CommissionKit${workspaceName ? ` — ${workspaceName}` : ""}`,
    body,
    footerNote: "You received this because you created a CommissionKit account.",
  });
}
