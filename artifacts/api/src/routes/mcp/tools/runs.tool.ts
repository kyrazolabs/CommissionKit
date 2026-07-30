import { CommissionRun, CommissionResult } from "@workspace/db";
import { Types } from "mongoose";
import { z } from "zod/v4";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceContext } from "../context";
import { requirePermission } from "../guard";
import { enqueueCommissionCalc } from "@workspace/queue";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

class RunTools {
  private static instance: RunTools;

  private constructor() {}

  static getInstance(): RunTools {
    if (!RunTools.instance) {
      RunTools.instance = new RunTools();
    }
    return RunTools.instance;
  }

  register(server: McpServer, ctx: WorkspaceContext): void {
    const wsObjectId = new Types.ObjectId(ctx.workspaceId);

    server.tool("list_runs", "List commission calculation runs", {
      status: z.enum(["pending", "processing", "completed", "failed"]).optional().describe("Filter by run status"),
      page: z.number().int().min(1).optional().default(1),
      limit: z.number().int().min(1).max(100).optional().default(50),
    }, async ({ status, page, limit }) => {
      requirePermission(ctx, "read:runs", "list_runs");
      const conditions: any = { workspaceId: wsObjectId };
      if (status) conditions.status = status;

      const [runs, total] = await Promise.all([
        CommissionRun.find(conditions).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
        CommissionRun.countDocuments(conditions),
      ]);

      return {
        content: [{ type: "text", text: JSON.stringify({
          data: runs.map((r: any) => ({
            id: r._id, period: r.period, totalCommission: Number(r.totalCommission),
            totalDeals: r.totalDeals, repsCount: r.repsCount, status: r.status,
            error: r.error ?? null, createdAt: r.createdAt,
          })),
          pagination: { page, limit, total },
        }, null, 2) }],
      };
    });

    server.tool("get_run", "Get details of a commission calculation run including results", {
      runId: z.string().describe("The run ID"),
    }, async ({ runId }) => {
      requirePermission(ctx, "read:runs", "get_run");
      const run = await CommissionRun.findOne({ _id: new Types.ObjectId(runId), workspaceId: wsObjectId }).lean();
      if (!run) return { content: [{ type: "text", text: JSON.stringify({ error: "Run not found" }) }] };

      const results = await CommissionResult.find({ runId: (run as any)._id })
        .populate("repId", "name").populate("dealId", "name amount currency").lean();

      return {
        content: [{ type: "text", text: JSON.stringify({
          run: {
            id: (run as any)._id, period: (run as any).period,
            totalCommission: Number((run as any).totalCommission), totalDeals: (run as any).totalDeals,
            repsCount: (run as any).repsCount, status: (run as any).status,
            error: (run as any).error ?? null, createdAt: (run as any).createdAt,
          },
          results: results.map((r: any) => ({
            id: r._id, repName: r.repId?.name ?? "Unknown", repId: r.repId?._id,
            dealName: r.dealId?.name ?? "Unknown", dealId: r.dealId?._id,
            dealAmount: r.dealId?.amount ?? 0, dealCurrency: r.dealId?.currency ?? "USD",
            commissionAmount: Number(r.commissionAmount), rateApplied: Number(r.rateApplied),
            calculationNote: r.calculationNote ?? null, currency: r.currency ?? null,
            wsCurrency: r.wsCurrency ?? null, convertedDealAmount: r.convertedDealAmount ?? null,
            convertedCommission: r.convertedCommission ?? null,
          })),
        }, null, 2) }],
      };
    });

    server.tool("create_run", "Trigger a commission calculation for a given period", {
      period: z.string().optional().describe("Period in YYYY-MM format (default: current month)"),
      paymentStatuses: z.array(z.enum(["unpaid", "paid", "partial", "on_hold"])).optional().describe("Filter deals by payment status"),
    }, async ({ period, paymentStatuses }) => {
      requirePermission(ctx, "write:runs", "create_run");

      const runPeriod = period || currentPeriod();

      const existing = await CommissionRun.findOne({
        workspaceId: wsObjectId, period: runPeriod, status: { $in: ["pending", "processing"] },
      });
      if (existing) {
        return { content: [{ type: "text", text: JSON.stringify({
          error: `A calculation for ${runPeriod} is already in progress.`, existingRunId: existing._id,
        }) }] };
      }

      const run = await CommissionRun.create({
        workspaceId: wsObjectId, period: runPeriod, totalCommission: 0, totalDeals: 0, repsCount: 0, status: "pending",
      });

      const payload: any = { workspaceId: ctx.workspaceId, runId: run._id.toString(), period: runPeriod };
      if (paymentStatuses) payload.paymentStatuses = paymentStatuses;
      await enqueueCommissionCalc(payload);

      return {
        content: [{ type: "text", text: JSON.stringify({
          id: run._id, period: runPeriod, status: "pending",
          message: "Calculation enqueued. Check the run status to see results.",
        }, null, 2) }],
      };
    });
  }
}

export const runTools = RunTools.getInstance();
