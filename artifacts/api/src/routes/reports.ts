import { Router } from "express";
import {
  CommissionRun,
  CommissionResult,
  Deal,
  Rep,
  Workspace,
} from "@workspace/db";
import {
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth";
import { convertCurrency } from "../lib/exchange";

const router = Router();

router.get(
  "/",
  ...requirePermission("reports", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    try {
      const workspaceId = req.workspaceId!;
      const workspace = await Workspace.findById(workspaceId);
      const wsCurrency = (workspace as any)?.currency || "USD";

      const { startDate, endDate, interval } = req.query as { startDate?: string; endDate?: string; interval?: string };
      const aggInterval = interval === "day" ? "day" : "month";

      const getPeriodKey = (dateStr: string) => {
        if (!dateStr) return "Unknown";
        if (aggInterval === "day") return dateStr.substring(0, 10);
        return dateStr.substring(0, 7);
      };

      // Fetch Reps
      const reps = await Rep.find({ workspaceId });
      const repMap = new Map(reps.map(r => [r._id.toString(), r.name]));

      const repStatsMap = new Map<string, { repName: string; commission: number; revenue: number; dealsWon: number; dealsTotal: number }>();

      // 1. Fetch Deals within range
      const dealMatch: any = { workspaceId };
      if (startDate || endDate) {
        dealMatch.closeDate = {};
        if (startDate) dealMatch.closeDate.$gte = startDate;
        if (endDate) dealMatch.closeDate.$lte = endDate;
      }
      const deals = await Deal.find(dealMatch);
      
      let won = 0, lost = 0, pending = 0;
      let totalRevenue = 0;

      const trendsMap = new Map<string, { period: string; revenue: number; commission: number; deals: number }>();
      
      for (const deal of deals) {
        const stage = deal.stage || "closed_won";
        if (stage === "closed_won") won++;
        else if (stage === "closed_lost") lost++;
        else pending++;

        let convertedAmt = 0;
        if (stage === "closed_won") {
          const amt = Number(deal.amount) || 0;
          const dealCurrency = deal.currency || "USD";
          convertedAmt = await convertCurrency(amt, dealCurrency, wsCurrency);
          totalRevenue += convertedAmt;
          
          const pKey = getPeriodKey(deal.closeDate);
          if (!trendsMap.has(pKey)) {
            trendsMap.set(pKey, { period: pKey, revenue: 0, commission: 0, deals: 0 });
          }
          const m = trendsMap.get(pKey)!;
          m.revenue += convertedAmt;
          m.deals++;
        }

        // Aggregate Rep Stats (Revenue/Deals)
        const repIdStr = deal.repId?.toString();
        if (repIdStr && repMap.has(repIdStr)) {
          if (!repStatsMap.has(repIdStr)) {
            repStatsMap.set(repIdStr, { repName: repMap.get(repIdStr)!, commission: 0, revenue: 0, dealsWon: 0, dealsTotal: 0 });
          }
          const rs = repStatsMap.get(repIdStr)!;
          rs.dealsTotal++;
          if (stage === "closed_won") {
            rs.dealsWon++;
            rs.revenue += convertedAmt;
          }
        }
      }

      // 2. Fetch Commission Results for these deals
      const dealIds = deals.map(d => d._id);
      // We populate runId to check the period/status
      const allResults = await CommissionResult.find({ 
        dealId: { $in: dealIds } 
      }).populate({
        path: 'runId',
        match: { status: 'completed' }
      });

      // Group by dealId and pick the result from the latest run (de-duplication)
      const dealCommissionMap = new Map<string, any>();
      for (const resItem of allResults) {
        const run = (resItem as any).runId;
        if (!run) continue; // Skip results from non-completed/deleted runs

        const dealIdStr = (resItem as any).dealId.toString();
        const existing = dealCommissionMap.get(dealIdStr);
        
        // If multiple results for same deal, pick the one from the most recently created run
        if (!existing || new Date(run.createdAt) > new Date(existing.runId.createdAt)) {
          dealCommissionMap.set(dealIdStr, resItem);
        }
      }

      let totalCommission = 0;

      for (const [dealIdStr, r] of dealCommissionMap.entries()) {
        let convertedCommission = 0;
        if (r.convertedCommission !== undefined && r.wsCurrency === wsCurrency) {
          convertedCommission = r.convertedCommission;
        } else {
          const commission = Number(r.commissionAmount) || 0;
          const resCurrency = r.currency || "USD";
          convertedCommission = await convertCurrency(commission, resCurrency, wsCurrency);
        }

        totalCommission += convertedCommission;
        
        // Add to trends
        const deal = deals.find(d => d._id.toString() === dealIdStr);
        if (deal) {
          const pKey = getPeriodKey(deal.closeDate);
          if (!trendsMap.has(pKey)) {
            trendsMap.set(pKey, { period: pKey, revenue: 0, commission: 0, deals: 0 });
          }
          trendsMap.get(pKey)!.commission += convertedCommission;
        }

        // Add to rep stats
        const repIdStr = r.repId?.toString();
        if (repIdStr && repStatsMap.has(repIdStr)) {
          repStatsMap.get(repIdStr)!.commission += convertedCommission;
        }
      }

      const monthlyTrends = Array.from(trendsMap.values())
        .sort((a, b) => a.period.localeCompare(b.period));

      const topPerformers = Array.from(repStatsMap.values())
        .filter(rs => rs.dealsTotal > 0 || rs.commission > 0)
        .map(rs => ({
          name: rs.repName,
          commission: rs.commission,
          revenue: rs.revenue,
          dealsWon: rs.dealsWon,
          winRate: rs.dealsTotal > 0 ? (rs.dealsWon / rs.dealsTotal) * 100 : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      const margin = totalRevenue > 0 ? ((totalRevenue - totalCommission) / totalRevenue) * 100 : 0;
      const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;
      const avgDealSize = won > 0 ? totalRevenue / won : 0;

      res.json({
        executiveSummary: {
          totalRevenue,
          totalCommission,
          margin,
          winRate,
          avgDealSize
        },
        dealStages: [
          { name: "Won", value: won },
          { name: "Lost", value: lost },
          { name: "Pending", value: pending }
        ],
        monthlyTrends,
        topPerformers
      });

    } catch (error) {
      console.error("Reports API Error:", error);
      res.status(500).json({ error: "Failed to generate reports data" });
    }
  }
);

export default router;
