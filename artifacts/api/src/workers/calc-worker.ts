import { CommissionResult, CommissionRun, Workspace, WorkspaceMember } from "@workspace/db";
import { commissionRunTemplate } from "@workspace/email-templates";
import type { CommissionCalcPayload } from "@workspace/queue";
import { COMMISSION_CALC_QUEUE, getRedisClient, sendMediumPriorityEmail } from "@workspace/queue";
import { Worker } from "bullmq";
import { Types } from "mongoose";
import { logger } from "../lib/logger";
import { createNotification } from "../lib/notify";
import { getEngine } from "./engines/registry";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
  defaultJobOptions: {
    removeOnComplete: {
      age: 60 * 60 * 24 * 7, // 7 days
      count: 10000,
    },

    removeOnFail: {
      age: 60 * 60 * 24 * 30, // 30 days
      count: 5000,
    },

    attempts: 5,

    backoff: {
      type: "exponential",
      delay: 5000,
    },
  },
};

/**
 * Worker to handle commission calculation jobs.
 * Dispatches to the correct engine based on workspace configuration.
 */
export const calcWorker = new Worker<CommissionCalcPayload>(
  COMMISSION_CALC_QUEUE,
  async (job) => {
    const { workspaceId, runId, period } = job.data;
    const { connectDB } = await import("@workspace/db");
    await connectDB();
    logger.info(`[Worker:Calc] Processing run ${runId} for workspace ${workspaceId}`);

    const run = await CommissionRun.findById(runId);
    if (!run) throw new Error("Run not found");

    try {
      await CommissionRun.findByIdAndUpdate(runId, { status: "processing" });
      logger.info(`[Worker:Calc] Run ${runId} status set to processing`);

      const workspace = await Workspace.findById(workspaceId);
      const engineName = (workspace as any)?.commissionEngine || "standard";
      const wsCurrency = (workspace as any)?.currency || "USD";

      logger.info(`[Worker:Calc] Dispatching to engine "${engineName}"`);

      const engine = getEngine(engineName);
      const output = await engine.calculate({
        workspaceId,
        runId,
        period,
        paymentStatuses: job.data.paymentStatuses,
        wsCurrency,
      });

      // Save results
      await CommissionResult.deleteMany({ runId: run._id });
      if (output.results.length > 0) {
        await CommissionResult.insertMany(
          output.results.map((r) => ({
            runId: run._id,
            repId: new Types.ObjectId(r.repId),
            dealId: new Types.ObjectId(r.dealId),
            rateApplied: r.rateApplied,
            commissionAmount: r.commissionAmount,
            currency: r.currency,
            calculationNote: r.calculationNote,
            wsCurrency: r.wsCurrency,
            convertedDealAmount: r.convertedDealAmount,
            convertedCommission: r.convertedCommission,
            exchangeRateSnapshot: r.exchangeRateSnapshot,
            rateSnapshotDate: r.rateSnapshotDate,
            meta: r.meta,
          })),
        );
      }

      const { totalCommission, totalItems, skippedItems, involvedReps } = output.summary;

      await CommissionRun.findByIdAndUpdate(runId, {
        totalCommission,
        totalDeals: totalItems,
        skippedDeals: skippedItems,
        repsCount: involvedReps.size,
        status: "completed",
        error: null,
      });
      logger.info(`[Worker:Calc] Saved completed run ${runId} with ${totalItems} results`);

      // Notify admins
      const adminMembers = await WorkspaceMember.find({
        workspaceId: new Types.ObjectId(workspaceId),
        role: { $in: ["owner", "admin"] },
        userId: { $ne: null },
      });

      const totalPaid = `${wsCurrency} ${totalCommission.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
      const [py, pm] = period.split("-");
      const periodLabel = new Date(Number(py), Number(pm) - 1).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      const APP_URL = process.env.APP_URL || "http://localhost:3000";
      const runUrl = `${APP_URL}/runs/${run._id}`;

      // Get top earner
      let topEarner: { name: string; amount: string } | undefined;
      if (output.results.length > 0) {
        const top = output.results.reduce((a, b) =>
          a.commissionAmount > b.commissionAmount ? a : b,
        );
        topEarner = {
          name: "Unknown",
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
              totalDeals: totalItems,
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
            }).catch((e) => logger.error({ err: e }, "[Worker:Calc] Notification error"));
          }
        }
      } catch (notifyErr) {
        logger.error({ err: notifyErr }, "[Worker:Calc] Notification loop error");
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
  { ...WORKER_OPTS, concurrency: 5 },
);
