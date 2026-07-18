import {
  baseTemplate,
  h1,
  h2,
  p,
  divider,
  infoBox,
  cardSection,
} from "./base.js";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export interface ApplicationTemplateProps {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  location: string;
  experience: string;
  pitch: string;
  position: string;
  submittedAt: string;
}

export function applicationTemplate(
  props: ApplicationTemplateProps,
): string {
  const {
    fullName,
    email,
    phone,
    linkedinUrl,
    location,
    experience,
    pitch,
    position,
    submittedAt,
  } = props;

  const safeFullName = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeLinkedinUrl = escapeHtml(linkedinUrl);
  const safeLocation = escapeHtml(location);
  const safeExperience = escapeHtml(experience);
  const safePitch = escapeHtml(pitch);
  const safePosition = escapeHtml(position);

  const linkedinLink = safeLinkedinUrl.startsWith("http")
    ? `<a href="${safeLinkedinUrl}">${safeLinkedinUrl}</a>`
    : safeLinkedinUrl;

  return baseTemplate({
    previewText: `Application received from ${safeFullName} (${safeLocation})`,
    body: `
      ${h1("New Application")}
      ${p(`An application was submitted on <strong>${new Date(submittedAt).toLocaleString()}</strong> for the <strong>${safePosition}</strong> position.`)}

      ${divider()}

      ${h2("Applicant Details")}
      ${cardSection(`
        <p style="margin:0 0 8px;"><strong>Position:</strong> ${safePosition}</p>
        <p style="margin:0 0 8px;"><strong>Full Name:</strong> ${safeFullName}</p>
        <p style="margin:0 0 8px;"><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
        <p style="margin:0 0 8px;"><strong>Phone / WhatsApp:</strong> ${safePhone}</p>
        <p style="margin:0 0 8px;"><strong>LinkedIn:</strong> ${linkedinLink}</p>
        <p style="margin:0;"><strong>Location:</strong> ${safeLocation}</p>
      `)}

      ${divider()}

      ${h2("Experience")}
      ${p(safeExperience)}

      ${divider()}

      ${h2("Motivation")}
      ${p(safePitch)}

      ${divider()}

      ${infoBox(`
        <strong>Next Steps</strong><br/>
        1. Review the applicant's LinkedIn and experience.<br/>
        2. Contact them via email or WhatsApp using the details above.<br/>
        3. If qualified, send the relevant agreement and schedule a discovery call.<br/>
        4. After signing, create a CRM user and add them to the team Slack.
      `)}

      ${p(`<small style="color:#6B7280;">This is an internal notification.</small>`)}
    `,
  });
}
