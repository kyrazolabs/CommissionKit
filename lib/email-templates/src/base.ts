/**
 * Base email layout — wraps all templates with consistent branding.
 * Uses inline CSS for maximum email client compatibility.
 */
export interface BaseTemplateProps {
  /** Preview text shown in email client before opening */
  previewText?: string;
  /** Main body content (HTML) */
  body: string;
  /** Footer note override */
  footerNote?: string;
}

const BRAND_COLOR  = "#0D9488"; // CommissionKit teal
const BG_COLOR     = "#F9FAFB";
const CARD_COLOR   = "#FFFFFF";
const TEXT_COLOR   = "#111827";
const MUTED_COLOR  = "#6B7280";
const BORDER_COLOR = "#E5E7EB";

export function baseTemplate({
  previewText = "",
  body,
  footerNote = "You're receiving this because you have an account on CommissionKit.",
}: BaseTemplateProps): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>CommissionKit</title>
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a { color: ${BRAND_COLOR}; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Preview text (hidden) -->
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}&nbsp;‌​‍‎‏﻿‌​‍‎‏</div>` : ""}

  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${BG_COLOR};">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:${CARD_COLOR};border-radius:16px;border:1px solid ${BORDER_COLOR};box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="padding:28px 36px 20px;border-bottom:1px solid ${BORDER_COLOR};">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td>
                    <!-- Logo mark -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color:#111827;border-radius:10px;padding:8px 12px;">
                          <span style="color:${BRAND_COLOR};font-size:15px;font-weight:700;letter-spacing:-0.3px;">Commission<span style="color:#FFFFFF;">Kit</span></span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;color:${TEXT_COLOR};font-size:15px;line-height:1.6;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px 28px;border-top:1px solid ${BORDER_COLOR};color:${MUTED_COLOR};font-size:12px;line-height:1.5;">
              ${footerNote}<br />
              <span style="color:${BORDER_COLOR};">—</span><br />
              CommissionKit · Commission tracking made simple
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Shared primitive components ──────────────────────────────────────────────

export const btn = (href: string, label: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
    <tr>
      <td style="background-color:${BRAND_COLOR};border-radius:10px;">
        <a href="${href}" target="_blank" style="display:inline-block;padding:13px 28px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;border-radius:10px;">${label}</a>
      </td>
    </tr>
  </table>`;

export const h1 = (text: string) =>
  `<h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.4px;">${text}</h1>`;

export const h2 = (text: string) =>
  `<h2 style="margin:0 0 6px;font-size:17px;font-weight:600;color:#111827;">${text}</h2>`;

export const p = (text: string) =>
  `<p style="margin:0 0 16px;color:#374151;font-size:15px;line-height:1.65;">${text}</p>`;

export const muted = (text: string) =>
  `<p style="margin:0 0 12px;color:#6B7280;font-size:13px;line-height:1.5;">${text}</p>`;

export const divider = () =>
  `<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />`;

export const infoBox = (text: string) =>
  `<div style="background-color:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 18px;margin:16px 0;color:#166534;font-size:14px;line-height:1.5;">${text}</div>`;

export const warningBox = (text: string) =>
  `<div style="background-color:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 18px;margin:16px 0;color:#92400E;font-size:14px;line-height:1.5;">${text}</div>`;

export const statRow = (label: string, value: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
    <tr>
      <td style="color:#6B7280;font-size:13px;">${label}</td>
      <td align="right" style="color:#111827;font-size:13px;font-weight:600;">${value}</td>
    </tr>
  </table>`;

export const badge = (text: string, color: string = BRAND_COLOR) => `
  <span style="display:inline-block;padding:2px 8px;border-radius:12px;background-color:${color}15;color:${color};font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;border:1px solid ${color}30;">${text}</span>`;
