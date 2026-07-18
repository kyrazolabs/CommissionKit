import { z } from "zod";
import { Router, type IRouter } from "express";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { applicationTemplate } from "@workspace/email-templates";
import { logger } from "../../lib/logger";
import { applyRateLimit } from "../../middleware/rate-limiter";

const ApplySchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(5).max(30),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  location: z.string().min(2).max(100),
  experience: z.string().min(1).max(500),
  pitch: z.string().min(10).max(2000),
  agreedToTerms: z.boolean().refine((v) => v === true, {
    message: "You must agree to the terms",
  }),
  position: z.string().min(1).optional(),
});

const router: IRouter = Router();

const APPLY_NOTIFICATION_TO = process.env.APPLY_NOTIFICATION_TO ?? "abdullah@commissionk.it";
const APPLY_NOTIFICATION_BCC = process.env.APPLY_NOTIFICATION_BCC ?? "sales@commissionk.it";

router.post("/apply", applyRateLimit, async (req, res) => {
  const parsed = ApplySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "ValidationError",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const data = parsed.data;

  const html = applicationTemplate({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    linkedinUrl: data.linkedinUrl || "Not provided",
    location: data.location,
    experience: data.experience,
    pitch: data.pitch,
    position: data.position || "Unknown position",
    submittedAt: new Date().toISOString(),
  });

  try {
    await sendMediumPriorityEmail({
      to: APPLY_NOTIFICATION_TO,
      toName: "Hiring Team",
      subject: `New Application — ${data.position ? `[${data.position}] ` : ""}${data.fullName}`,
      html,
      meta: {
        event: "application",
        applicantEmail: data.email,
        applicantName: data.fullName,
        position: data.position,
      },
      bcc: APPLY_NOTIFICATION_BCC,
    });

    res.status(200).json({ success: true, message: "Application received" });
  } catch (err: any) {
    logger.error({ err, applicant: data.email }, "[Apply] Failed to send email");
    res.status(500).json({ error: "Failed to process application. Please try again later." });
  }
});

export default router;
