import * as zod from "zod";

export * from "./generated/api";

// ─── Manual additions (not auto-generated) ────────────────────────────────────

/**
 * @summary Send (or resend) a portal access link email to a rep
 */
export const SendPortalLinkParams = zod.object({
  id: zod.coerce.string(),
});

/**
 * @summary Get the public portal data for a rep using their access code
 */
export const GetPortalByCodeParams = zod.object({
  accessCode: zod.coerce.string(),
});

export const GetPortalByCodeQueryParams = zod.object({
  period: zod.coerce
    .string()
    .optional()
    .describe("Filter by period (YYYY-MM). Defaults to current period."),
});
