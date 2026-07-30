import { CommissionRun, CommissionResult, Rep, Workspace } from "@workspace/db";
import { Types } from "mongoose";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { WorkspaceContext } from "../context";
import { convertCurrency } from "../../../lib/exchange";

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

class DashboardTools {
  private static instance: DashboardTools;

  private constructor() {}

  static getInstance(): DashboardTools {
    if (!DashboardTools.instance) {
      DashboardTools.instance = new DashboardTools();
    }
    return DashboardTools.instance;
  }

  register(server: McpServer, ctx: WorkspaceContext): void {
    const wsObjectId = new Types.ObjectId(ctx.workspaceId);

    server.tool("get_dashboard_summary", "Get a dashboard summary with KPIs for the current period", {},
    async () => {
      const period = currentPeriod();

      const [workspace, totalReps, latestRun] = await Promise.all([
        Workspace.findById(ctx.workspaceId).select("currency").lean(),
        Rep.countDocuments({ workspaceId: wsObjectId }),
        CommissionRun.findOne({ workspaceId: wsObjectId, period }).sort({ createdAt: -1 }).lean(),
      ]);

      const wsCurrency = (workspace as any)?.currency || "USD";

      let totalCommission = 0;
      let totalDeals = 0;
      let totalRevenue = 0;
      const earningsMap = new Map<string, {
        repId: string; repName: string; totalCommission: number; totalDeals: number; totalRevenue: number;
      }>();

      if (latestRun) {
        const results = await CommissionResult.find({ runId: (latestRun as any)._id })
          .populate("repId", "name").populate("dealId", "amount currency").lean();

        for (const r of results) {
          const commission = Number((r as any).commissionAmount);
          const deal = (r as any).dealId as any;
          const dealAmt = deal?.amount ? Number(deal.amount) : 0;
          const dealCurrency = deal?.currency || "USD";
          const resCurrency = (r as any).currency || dealCurrency;

          const convertedCommission = await convertCurrency(commission, resCurrency, wsCurrency);
          const convertedRevenue = await convertCurrency(dealAmt, dealCurrency, wsCurrency);

          totalCommission += convertedCommission;
          totalDeals++;
          totalRevenue += convertedRevenue;

          const repIdStr = (r as any).repId?._id?.toString() || "unknown";
          if (!earningsMap.has(repIdStr)) {
            earningsMap.set(repIdStr, {
              repId: repIdStr, repName: (r as any).repId?.name ?? "Unknown",
              totalCommission: 0, totalDeals: 0, totalRevenue: 0,
            });
          }
          const entry = earningsMap.get(repIdStr)!;
          entry.totalCommission += convertedCommission;
          entry.totalDeals++;
          entry.totalRevenue += convertedRevenue;
        }
      }

      const topEarners = [...earningsMap.values()]
        .sort((a, b) => b.totalCommission - a.totalCommission)
        .slice(0, 10);

      return {
        content: [{ type: "text", text: JSON.stringify({
          period, workspaceCurrency: wsCurrency,
          totalCommission, totalRevenue, totalDeals, totalReps,
          runStatus: (latestRun as any)?.status ?? "no_run",
          topEarners,
        }, null, 2) }],
      };
    });
  }
}

export const dashboardTools = DashboardTools.getInstance();
