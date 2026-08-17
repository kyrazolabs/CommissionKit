import {
  CreateDealBody,
  DeleteDealParams,
  ImportDealsBody,
  ListDealsQueryParams,
  UpdateDealBody,
} from "@workspace/api-zod";
import { Deal, Plan, Rep, WorkspaceMember } from "@workspace/db";
import { clawbackAlertTemplate } from "@workspace/email-templates";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { Router } from "express";
import { Types } from "mongoose";
import { logAudit } from "../../lib/audit";
import { logger } from "../../lib/logger";
import { createNotification } from "../../lib/notify";
import { type AuthenticatedRequest, requirePermission } from "../../middleware/auth";

const router = Router();

function formatDeal(deal: any, repName: string) {
  return {
    id: deal._id,
    repId: deal.repId ? (deal.repId._id ?? deal.repId).toString() : null,
    repName,
    name: deal.name,
    amount: deal.amount,
    closeDate: deal.closeDate ?? "",
    period: deal.period,
    stage: deal.stage,
    paymentStatus: deal.paymentStatus ?? "unpaid",
    currency: deal.currency ?? "USD",
    notes: deal.notes ?? null,
    clawbackApplied: (deal as any).clawbackApplied ?? false,
    clawbackAmount: (deal as any).clawbackAmount ?? 0,
    createdAt: deal.createdAt.toISOString(),
  };
}

function validateCloseDateForStage(stage: string, closeDate?: string) {
  const closedStages = ["closed_won", "closed_lost"];
  if (closedStages.includes(stage) && (!closeDate || closeDate.trim() === "")) {
    return "Close date is required when stage is Closed Won or Closed Lost.";
  }
  return null;
}

router.get(
  "/deals",
  ...requirePermission("deals", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const query = ListDealsQueryParams.parse(req.query);
    const conditions: any = { workspaceId: new Types.ObjectId(workspaceId) };

    if (query.search !== undefined && query.search.trim() !== "") {
      const searchRegex = new RegExp(query.search.trim(), "i");
      conditions.$or = [{ name: searchRegex }, { repId: { $exists: true } }];
      // We'll filter rep name in memory after populate
    }
    if (query.repId !== undefined) conditions.repId = new Types.ObjectId(query.repId);
    if (query.period !== undefined) conditions.period = query.period;
    if (query.paymentStatus !== undefined) conditions.paymentStatus = query.paymentStatus;

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const [deals, total] = await Promise.all([
      Deal.find(conditions).populate("repId").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Deal.countDocuments(conditions),
    ]);

    let formatted = deals
      .filter((d) => d.repId != null)
      .map((d) => formatDeal(d, (d.repId as any).name ?? "Unknown"));

    // Filter by rep name client-side when search is used (after populate)
    if (query.search !== undefined && query.search.trim() !== "") {
      const searchRegex = new RegExp(query.search.trim(), "i");
      formatted = formatted.filter(
        (d) => searchRegex.test(d.name) || (d.repName && searchRegex.test(d.repName)),
      );
    }

    res.json({
      data: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

router.post(
  "/deals",
  ...requirePermission("deals", "create"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const body = CreateDealBody.parse(req.body);
    const closeDateError = validateCloseDateForStage(body.stage, body.closeDate);
    if (closeDateError) {
      res.status(400).json({ error: closeDateError });
      return;
    }
    const deal = await Deal.create({
      workspaceId: new Types.ObjectId(workspaceId),
      repId: new Types.ObjectId(body.repId),
      name: body.name,
      amount: body.amount,
      closeDate: body.closeDate,
      period: body.period,
      stage: body.stage,
      paymentStatus: body.paymentStatus ?? "unpaid",
      currency: body.currency ?? "USD",
      notes: body.notes ?? null,
    });

    const rep = await Rep.findById(body.repId);
    res.status(201).json(formatDeal(deal, rep?.name ?? "Unknown"));
  },
);

router.post(
  "/deals/import",
  ...requirePermission("deals", "create"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const body = ImportDealsBody.parse(req.body);
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;

    for (const d of body.deals) {
      try {
        const closeDateError = validateCloseDateForStage(d.stage, d.closeDate);
        if (closeDateError) {
          errors.push(`Deal "${d.name}": ${closeDateError}`);
          skipped++;
          continue;
        }
        const rep = await Rep.findOne({
          _id: d.repId,
          workspaceId: new Types.ObjectId(workspaceId),
        });
        if (!rep) {
          errors.push(`Deal "${d.name}": rep ID ${d.repId} not found`);
          skipped++;
          continue;
        }
        await Deal.create({
          workspaceId: new Types.ObjectId(workspaceId),
          repId: new Types.ObjectId(d.repId),
          name: d.name,
          amount: d.amount,
          closeDate: d.closeDate,
          period: body.period,
          stage: d.stage,
          paymentStatus: (d as any).paymentStatus ?? "unpaid",
          currency: d.currency ?? "USD",
          notes: d.notes ?? null,
        });
        imported++;
      } catch (err) {
        errors.push(`Deal "${d.name}": ${err instanceof Error ? err.message : String(err)}`);
        skipped++;
      }
    }

    logAudit("bulk_create", "deal", {
      workspaceId: req.workspaceId,
      metadata: { imported, skipped, errors: errors.length },
    }).catch(() => {});

    res.json({ imported, skipped, errors });
  },
);

router.delete(
  "/deals/:id",
  ...requirePermission("deals", "delete"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = DeleteDealParams.parse(req.params);
    await Deal.deleteOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    res.status(204).send();
  },
);

router.put(
  "/deals/:id",
  ...requirePermission("deals", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = req.params;
    const body = UpdateDealBody.parse(req.body);

    const closeDateError = validateCloseDateForStage(body.stage, body.closeDate);
    if (closeDateError) {
      res.status(400).json({ error: closeDateError });
      return;
    }

    // Fetch the old deal to detect stage changes (clawback detection)
    const oldDeal = await Deal.findById(id);
    if (!oldDeal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    const update: any = {
      repId: new Types.ObjectId(body.repId),
      name: body.name,
      amount: body.amount,
      closeDate: body.closeDate,
      period: body.period,
      stage: body.stage,
      currency: body.currency,
      notes: body.notes ?? null,
    };
    if (body.paymentStatus !== undefined) update.paymentStatus = body.paymentStatus;

    // Paid deals: auto-set stage to closed_won, lock from further edits
    if (body.paymentStatus === "paid" && (oldDeal as any).paymentStatus !== "paid") {
      update.stage = "closed_won";
    }

    // Block editing paid deals
    if ((oldDeal as any).paymentStatus === "paid") {
      res.status(400).json({ error: "Paid deals cannot be edited." });
      return;
    }

    const deal = await Deal.findOneAndUpdate(
      { _id: new Types.ObjectId(id as string), workspaceId: new Types.ObjectId(workspaceId) },
      update,
      { new: true },
    );

    if (!deal) {
      res.status(404).json({ error: "Deal not found" });
      return;
    }

    // ── Clawback enforcement ────────────────────────────────────────────────
    const oldStage = oldDeal.stage || "";
    const newStage = deal.stage || "";
    const wasWon = oldStage === "closed_won" || oldStage === "won";
    const isNowLost = newStage === "closed_lost" || newStage === "lost";
    const clawbackAmount = Number(oldDeal.amount) || 0;

    if (wasWon && isNowLost && clawbackAmount > 0) {
      // Check the rep's plan for clawbackDays
      const rep = await Rep.findById(deal.repId);
      if (rep?.planId) {
        const plan = await Plan.findById(rep.planId);
        const clawbackDays = plan?.clawbackDays ? Number(plan.clawbackDays) : 0;

        if (clawbackDays > 0) {
          const closeDate = oldDeal.closeDate ? new Date(oldDeal.closeDate) : null;
          const now = new Date();
          const daysSinceClose = closeDate
            ? Math.floor((now.getTime() - closeDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

          if (daysSinceClose <= clawbackDays) {
            logger.info(
              `[Clawback] Deal ${deal.name} (${deal._id}): ${oldDeal.amount} clawed back (${daysSinceClose}d since close, window ${clawbackDays}d)`,
            );

            // Record clawback on the deal
            await Deal.findByIdAndUpdate(deal._id, {
              $set: { clawbackApplied: true, clawbackAmount },
            });

            // Notify admins
            try {
              const adminMembers = await WorkspaceMember.find({
                workspaceId: new Types.ObjectId(workspaceId),
                role: { $in: ["owner", "admin"] },
                userId: { $ne: null },
              });
              for (const member of adminMembers) {
                await sendMediumPriorityEmail({
                  to: member.email,
                  subject: `Clawback triggered — ${deal.name}`,
                  html: clawbackAlertTemplate({
                    recipientName: member.email.split("@")[0],
                    workspaceName: req.workspaceId ?? "",
                    repName: rep.name || "Unknown",
                    dealName: deal.name,
                    originalAmount: `${deal.currency || "USD"} ${(oldDeal.amount || 0).toFixed(2)}`,
                    clawbackAmount: `${deal.currency || "USD"} ${clawbackAmount.toFixed(2)}`,
                    reason:
                      "Deal status changed from closed won to closed lost within the clawback window.",
                    detailsUrl: `${process.env.APP_URL || "http://localhost:3000"}/dash/deals`,
                  }),
                }).catch((e) => logger.error({ err: e }, "[Clawback] Email error"));

                if (member.userId) {
                  await createNotification({
                    workspaceId,
                    userId: member.userId,
                    type: "clawback_triggered",
                    title: "Clawback triggered",
                    message: `${clawbackAmount.toFixed(2)} clawed back for ${deal.name} (rep: ${rep.name})`,
                    href: `/dash/deals`,
                    meta: {
                      dealId: String(deal._id),
                      repId: String(rep._id),
                      amount: clawbackAmount,
                    },
                  });
                }
              }
            } catch (notifyErr) {
              logger.error({ err: notifyErr }, "[Clawback] Notification error");
            }
          }
        }
      }
    }

    const updatedRep = await Rep.findById(body.repId);
    res.json(formatDeal(deal, updatedRep?.name ?? "Unknown"));
  },
);

export default router;
