import { Workspace } from "@workspace/db/schema";
import { type IRouter, Router } from "express";
import { z } from "zod";
import { logger } from "../../lib/logger";
import { type AuthenticatedRequest, requireWorkspaceMember } from "../../middleware/auth";

const WEBHOOK_URL =
  "https://crm.commissionk.it/webhooks/workflows/2c2c7e35-cb52-45e6-8d5f-6003f7935901/7a05d911-c30f-4e5a-ab76-6b55c3bd46ab";

const TicketSchema = z.object({
  subject: z.string().min(1),
  description: z.string().min(1),
  category: z.enum(["BUG", "FEATURE_REQUEST", "QUESTION", "ACCOUNT_ISSUE", "OTHER"]),
});

const router: IRouter = Router();

router.post(
  "/support/tickets",
  ...requireWorkspaceMember("member"),
  async (req: AuthenticatedRequest, res) => {
    const parsed = TicketSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: "ValidationError",
        details: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const { subject, description, category } = parsed.data;
    const workspaceId = req.workspaceId;

    try {
      const workspace = await Workspace.findById(workspaceId)
        .select("name")
        .lean<{ name: string }>();
      const workspaceName = workspace?.name ?? "Unknown Workspace";

      const payload = {
        userEmail: req.userEmail ?? "unknown",
        workspaceId: workspaceId ?? "unknown",
        workspaceName,
        subject,
        description,
        category,
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      try {
        await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      if (err.name === "AbortError") {
        logger.warn({ workspaceId }, "[Support] Webhook request timed out — returning success");
        res.status(200).json({ success: true });
        return;
      }

      logger.error(
        { err, workspaceId },
        "[Support] Failed to submit support ticket — returning success",
      );
      res.status(200).json({ success: true });
    }
  },
);

export default router;
