import { Worker } from "bullmq";
import { Types } from "mongoose";
import {
  CommissionRun,
  CommissionResult,
  Deal,
  Rep,
  Plan,
  PlanTier,
  Workspace,
  WorkspaceMember,
} from "@workspace/db";
import {
  getRedisClient,
  COMMISSION_CALC_QUEUE,
  sendMediumPriorityEmail,
} from "@workspace/queue";
import { commissionRunTemplate } from "@workspace/email-templates";
import { createNotification } from "../lib/notify";
import type { CommissionCalcPayload } from "@workspace/queue";
import { convertCurrency, convertCurrencyAt } from "../lib/exchange";
import { logger } from "../lib/logger";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
};

/**
 * Core commission calculation logic.
 */
function calculateCommission(
  amount: number,
  currency: string,
  planType: string,
  flatRate: number | null,
  acceleratorThreshold: number | null,
  acceleratorRate: number | null,
  tiers: { fromAmount: number; toAmount: number | null; rate: number }[],
): { rate: number; commission: number; note: string } {
  if (planType === "flat" && flatRate !== null) {
    const commission = amount * flatRate;
    return {
      rate: flatRate,
      commission,
      note: `Flat rate ${(flatRate * 100).toFixed(2)}% on ${currency} ${amount.toFixed(2)}`,
    };
  }

  if (planType === "accelerator" && flatRate !== null) {
    if (
      acceleratorThreshold !== null &&
      acceleratorRate !== null &&
      amount > acceleratorThreshold
    ) {
      const baseCommission = acceleratorThreshold * flatRate;
      const accelCommission = (amount - acceleratorThreshold) * acceleratorRate;
      const total = baseCommission + accelCommission;
      const effectiveRate = total / amount;
      return {
        rate: effectiveRate,
        commission: total,
        note: `Base ${(flatRate * 100).toFixed(2)}% up to ${currency} ${acceleratorThreshold}, then ${(acceleratorRate * 100).toFixed(2)}% above`,
      };
    }
    const commission = amount * flatRate;
    return {
      rate: flatRate,
      commission,
      note: `Base rate ${(flatRate * 100).toFixed(2)}% (below threshold of ${currency} ${acceleratorThreshold})`,
    };
  }

  if (planType === "tiered" && tiers.length > 0) {
    let remaining = amount;
    let totalCommission = 0;
    const notes: string[] = [];
    let lastRate = 0;

    for (const tier of tiers) {
      if (remaining <= 0) break;
      const tierTop = tier.toAmount !== null ? tier.toAmount : Infinity;
      const tierBottom = tier.fromAmount;
      const applicable = Math.min(remaining, tierTop - tierBottom);
      if (applicable <= 0) continue;
      const commission = applicable * tier.rate;
      totalCommission += commission;
      notes.push(
        `${(tier.rate * 100).toFixed(2)}% on ${currency} ${applicable.toFixed(2)}`,
      );
      lastRate = tier.rate;
      remaining -= applicable;
    }

    const effectiveRate = amount > 0 ? totalCommission / amount : lastRate;
    return {
      rate: effectiveRate,
      commission: totalCommission,
      note: `Tiered: ${notes.join(", ")}`,
    };
  }

  return { rate: 0, commission: 0, note: "No plan or rate configured" };
}

/**
 * Worker to handle commission calculation jobs.
 */
export const calcWorker = new Worker<CommissionCalcPayload>(
  COMMISSION_CALC_QUEUE,
  async (job) => {
    const { workspaceId, runId, period } = job.data;
    const { connectDB } = await import("@workspace/db");
    await connectDB();
    logger.info(
      `[Worker:Calc] Processing run ${runId} for workspace ${workspaceId}`,
    );

    const run = await CommissionRun.findById(runId);
    if (!run) throw new Error("Run not found");

    try {
      await CommissionRun.findByIdAndUpdate(runId, { status: "processing" });
      logger.info(`[Worker:Calc] Run ${runId} status set to processing`);

      // 1. Fetch all required data
      const deals = await Deal.find({
        workspaceId: new Types.ObjectId(workspaceId),
        period,
        stage: { $in: ["closed_won", "Closed Won", "Won", "won"] },
      });
      logger.info(
        `[Worker:Calc] Found ${deals.length} deals for period ${period}`,
      );

      const reps = await Rep.find({
        workspaceId: new Types.ObjectId(workspaceId),
      });
      const plans = await Plan.find({
        workspaceId: new Types.ObjectId(workspaceId),
      });
      const tiers = await PlanTier.find({
        planId: { $in: plans.map((p) => p._id) },
      }).sort({ fromAmount: 1 });

      const planMap = new Map(plans.map((p) => [p._id.toString(), p]));
      const tierMap = new Map<
        string,
        { fromAmount: number; toAmount: number | null; rate: number }[]
      >();
      for (const t of tiers) {
        const planIdStr = t.planId.toString();
        if (!tierMap.has(planIdStr)) tierMap.set(planIdStr, []);
        tierMap
          .get(planIdStr)!
          .push({
            fromAmount: Number(t.fromAmount),
            toAmount: t.toAmount !== null ? Number(t.toAmount) : null,
            rate: Number(t.rate),
          });
      }
      const repMap = new Map(reps.map((r) => [r._id.toString(), r]));

      // Hoist workspace fetch — done once, not per-deal
      const workspace = await Workspace.findById(workspaceId);
      const wsCurrency = (workspace as any)?.currency || "USD";

      // 2. Perform calculations
      let totalCommission = 0;
      let skippedDeals = 0;
      const resultRows = [];
      const involvedReps = new Set<string>();

      for (const deal of deals) {
        const rep = repMap.get(deal.repId.toString());
        if (!rep) {
          logger.warn(`[Worker:Calc] Deal ${deal._id} has no rep found`);
          skippedDeals++;
          continue;
        }

        if (!rep.planId) {
          logger.warn(
            `[Worker:Calc] Rep ${rep.name} has no plan assigned. Skipping deal ${deal.name}`,
          );
          skippedDeals++;
          continue;
        }

        const plan = planMap.get(rep.planId.toString());
        if (!plan) {
          logger.warn(
            `[Worker:Calc] Plan ${rep.planId} not found for rep ${rep.name}`,
          );
          skippedDeals++;
          continue;
        }
        // ... (calculation logic remains same)

        // Convert deal amount to workspace currency, anchored to deal creation time
        // This produces the rate snapshot that will be stored permanently with the result.
        const dealCreatedAt = (deal as any).createdAt instanceof Date
          ? (deal as any).createdAt
          : new Date((deal as any).createdAt || Date.now());

        const { converted: normalizedAmount, rate: snapshotRate, snapshotDate } =
          await convertCurrencyAt(Number(deal.amount), deal.currency || "USD", wsCurrency, dealCreatedAt);

        // Perform calculation on the workspace-currency normalized amount
        const { rate, commission: commissionInWsCurrency, note } = calculateCommission(
          normalizedAmount,
          wsCurrency,
          plan.type,
          plan.flatRate !== null ? Number(plan.flatRate) : null,
          plan.acceleratorThreshold !== null ? Number(plan.acceleratorThreshold) : null,
          plan.acceleratorRate !== null ? Number(plan.acceleratorRate) : null,
          tierMap.get(plan._id.toString()) ?? [],
        );

        // Commission in original deal currency (rate applied to original amount)
        const commissionInOriginalCurrency = Number(deal.amount) * rate;
        // Commission in workspace currency at snapshot rate
        const commissionConverted = commissionInOriginalCurrency * snapshotRate;

        totalCommission += commissionInWsCurrency;
        involvedReps.add(rep._id.toString());
        resultRows.push({
          runId: run._id,
          repId: rep._id,
          dealId: deal._id,
          rateApplied: rate,
          commissionAmount: commissionInOriginalCurrency,
          currency: deal.currency || "USD",
          calculationNote: note,
          // Snapshot fields
          wsCurrency,
          convertedDealAmount: normalizedAmount,
          convertedCommission: commissionConverted,
          exchangeRateSnapshot: snapshotRate,
          rateSnapshotDate: snapshotDate,
        });
      }

      // 3. Save results
      await CommissionResult.deleteMany({ runId: run._id }); // Clear any previous attempts
      if (resultRows.length > 0) {
        await CommissionResult.insertMany(resultRows);
      }

      await CommissionRun.findByIdAndUpdate(runId, {
        totalCommission,
        totalDeals: resultRows.length,
        skippedDeals,
        repsCount: involvedReps.size,
        status: "completed",
        error: null,
      });
      logger.info(
        `[Worker:Calc] Saved completed run ${runId} with ${resultRows.length} results`,
      );

      // 4. Notify admins
      const adminMembers = await WorkspaceMember.find({
        workspaceId: new Types.ObjectId(workspaceId),
        role: { $in: ["owner", "admin"] },
        userId: { $ne: null },
      });

      const totalPaid = `${wsCurrency} ${totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      const [py, pm] = period.split("-");
      const periodLabel = new Date(
        Number(py),
        Number(pm) - 1,
      ).toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const APP_URL = process.env.APP_URL || "http://localhost:3000";
      const runUrl = `${APP_URL}/runs/${run._id}`;

      // Get top earner
      let topEarner: { name: string; amount: string } | undefined;
      if (resultRows.length > 0) {
        const top = resultRows.reduce((a, b) =>
          a.commissionAmount > b.commissionAmount ? a : b,
        );
        const topRep = repMap.get(top.repId.toString());
        topEarner = {
          name: topRep?.name || "Unknown",
          amount: `${top.currency} ${top.commissionAmount.toFixed(2)}`,
        };
      }

      try {
        for (const member of adminMembers) {
          await sendMediumPriorityEmail({
            to: member.email,
            subject: `Commission run complete — ${period}`,
            html: commissionRunTemplate({
              recipientName: member.email.split("@")[0],
              workspaceName: workspaceId,
              period,
              totalPaid,
              totalDeals: resultRows.length,
              totalReps: involvedReps.size,
              topEarner,
              runUrl,
            }),
          }).catch((e) => logger.error({ err: e }, "[Worker:Calc] Email error"));

          if (member.userId) {
            await createNotification({
              workspaceId,
              userId: member.userId,
              type: "commission_run_completed",
              title: "Commission run completed",
              message: `${periodLabel} run finished — ${totalPaid} across ${involvedReps.size} reps.`,
              href: runUrl,
              meta: { runId: String(run._id), period },
            }).catch((e) =>
              logger.error({ err: e }, "[Worker:Calc] Notification error"),
            );
          }
        }
      } catch (notifyErr) {
        logger.error({ err: notifyErr }, "[Worker:Calc] Notification loop error");
        // Don't rethrow, the calculation itself is finished and saved
      }

      logger.info(`[Worker:Calc] Completed run ${runId}`);
    } catch (err: any) {
      logger.error({ err }, `[Worker:Calc] Failed run ${runId}`);
      await CommissionRun.findByIdAndUpdate(runId, {
        status: "failed",
        error: err.message || "Unknown error during calculation",
      });
      throw err;
    }
  },
  { ...WORKER_OPTS, concurrency: 2 },
);
