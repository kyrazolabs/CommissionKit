import { baseTemplate, h1, p, divider, cardSection } from "./base.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface LeadNotificationTemplateProps {
  email: string;
  source: string;
  name?: string;
  submittedAt: string;
  ip?: string;
}

export function leadNotificationTemplate(props: LeadNotificationTemplateProps): string {
  const { email, source, name, submittedAt, ip } = props;
  const safeEmail = escapeHtml(email);
  const safeSource = escapeHtml(source);
  const safeName = name ? escapeHtml(name) : "Not provided";
  const safeIp = ip ? escapeHtml(ip) : "Not provided";

  return baseTemplate({
    previewText: `New lead from ${safeSource}: ${safeEmail}`,
    body: `
      ${h1("New Lead Captured")}
      ${p(`A new lead was captured on <strong>${new Date(submittedAt).toLocaleString()}</strong> from the <strong>${safeSource}</strong> source.`)}

      ${divider()}

      ${cardSection(`
        <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin:0 0 8px;"><strong>Source:</strong> ${safeSource}</p>
        <p style="margin:0 0 8px;"><strong>Name:</strong> ${safeName}</p>
        <p style="margin:0;"><strong>IP:</strong> ${safeIp}</p>
      `)}

      ${p(`<small style="color:#6B7280;">This is an internal notification from CommissionKit.</small>`)}
    `,
  });
}
