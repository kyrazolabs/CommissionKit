import { baseTemplate, btn, cardSection, divider, h1, muted, p } from "./base.js";

export interface InvitationTemplateProps {
  /** Name of the person being invited */
  inviteeName?: string;
  /** Name of the person sending the invite */
  inviterName: string;
  /** Workspace / org name */
  workspaceName: string;
  /** Role being granted */
  role: "admin" | "member";
  /** Magic acceptance URL */
  acceptUrl: string;
  /** When the invitation expires */
  expiresAt?: Date;
}

const ROLE_LABELS: Record<string, { label: string; description: string }> = {
  admin: {
    label: "Admin",
    description: "You'll be able to manage reps, plans, deals, and calculation runs.",
  },
  member: {
    label: "Member",
    description: "You'll have read access to dashboards and commission reports.",
  },
};

export function invitationTemplate(props: InvitationTemplateProps): string {
  const { inviteeName, inviterName, workspaceName, role, acceptUrl, expiresAt } = props;

  const roleMeta = ROLE_LABELS[role] ?? ROLE_LABELS.member;
  const greeting = inviteeName ? `Hi ${inviteeName},` : "Hi there,";
  const expiry = expiresAt
    ? expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  const body = `
    ${h1("You've been invited to join a workspace")}
    ${p(greeting)}
    ${p(`<strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on CommissionKit as a <strong>${roleMeta.label}</strong>.`)}

    ${cardSection(`
      <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6B7280;text-transform:uppercase;letter-spacing:0.05em;">Your role</p>
      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111827;">${roleMeta.label}</p>
      <p style="margin:0;font-size:13px;color:#6B7280;">${roleMeta.description}</p>
    `)}

    ${btn(acceptUrl, "Accept Invitation")}

    ${expiry ? muted(`This invitation expires on ${expiry}.`) : ""}
    ${muted("If you weren't expecting this invitation, you can safely ignore this email.")}
    ${divider()}
    ${muted(`Or copy and paste this link into your browser:<br /><span style="color:#0D9488;word-break:break-all;">${acceptUrl}</span>`)}
  `;

  return baseTemplate({
    previewText: `${inviterName} invited you to join ${workspaceName} on CommissionKit`,
    body,
    footerNote: `You received this because ${inviterName} invited you to ${workspaceName}.`,
  });
}
