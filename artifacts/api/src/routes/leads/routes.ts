import { Lead } from "@workspace/db/schema";
import { leadNotificationTemplate } from "@workspace/email-templates";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { type IRouter, type Request, Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/logger";
import { leadRateLimit } from "../../middleware/rate-limiter";

const LeadSchema = z.object({
  email: z.string().email(),
  source: z.enum(["hero", "calculator"]),
  name: z.string().min(1).optional(),
});

const router: IRouter = Router();

const LEAD_NOTIFICATION_TO = process.env.LEAD_NOTIFICATION_TO ?? "sales@commissionkit.co";

function getClientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  if (Array.isArray(forwarded)) return forwarded[0].split(",")[0].trim();
  return req.ip ?? "unknown";
}

router.post("/leads", leadRateLimit, async (req, res) => {
  const parsed = LeadSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: "ValidationError",
      details: parsed.error.flatten().fieldErrors,
    });
    return;
  }

  const data = parsed.data;
  const normalizedEmail = data.email.toLowerCase().trim();
  const ip = getClientIp(req);
  const userAgent = req.headers["user-agent"] ?? "";

  try {
    const now = new Date();
    const lead = await Lead.findOneAndUpdate(
      { email: normalizedEmail },
      {
        $set: {
          email: normalizedEmail,
          source: data.source,
          name: data.name,
          ip,
          userAgent,
          updatedAt: now,
        },
        $setOnInsert: {
          status: "new",
          metadata: {},
          createdAt: now,
        },
      },
      { upsert: true, new: true, runValidators: true },
    );

    const html = leadNotificationTemplate({
      email: lead.email,
      source: lead.source,
      name: lead.name ?? undefined,
      submittedAt: lead.updatedAt.toISOString(),
      ip: lead.ip ?? undefined,
    });

    await sendMediumPriorityEmail({
      to: LEAD_NOTIFICATION_TO,
      toName: "Sales Team",
      subject: `New Lead — ${lead.source}`,
      html,
      meta: {
        event: "lead_capture",
        leadEmail: lead.email,
        leadSource: lead.source,
      },
    });

    res.status(200).json({ success: true });
  } catch (err: any) {
    logger.error({ err, email: normalizedEmail }, "[Leads] Failed to process lead");
    res.status(500).json({ error: "Failed to process lead. Please try again later." });
  }
});

export default router;
