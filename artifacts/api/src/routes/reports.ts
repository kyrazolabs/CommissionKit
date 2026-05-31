import { Router } from "express";
import {
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

      const reps = await Rep.find({ workspaceId });
      const repMap = new Map(reps.map(r => [r._id.toString(), r.name]));

      const repStatsMap = new Map<string, { repName: string; commission: number; revenue: number; dealsWon: number; dealsTotal: number }>();

      const dealMatch: any = { workspaceId };
      if (startDate || endDate) {
        dealMatch.closeDate = {};
        if (startDate) dealMatch.closeDate.$gte = startDate;
        if (endDate) dealMatch.closeDate.$lte = endDate;
      }
      const deals = await Deal.find(dealMatch);

      let won = 0, lost = 0, pending = 0;
      let totalRevenue = 0;
      let totalPendingRevenue = 0;
      let totalDaysToClose = 0;
      let wonDealCount = 0;

      const trendsMap = new Map<string, { period: string; revenue: number; commission: number; deals: number }>();

      const dealValueBuckets = [
        { label: "Under $1K", min: 0, max: 1000, count: 0, value: 0 },
        { label: "$1K - $5K", min: 1000, max: 5000, count: 0, value: 0 },
        { label: "$5K - $25K", min: 5000, max: 25000, count: 0, value: 0 },
        { label: "$25K - $100K", min: 25000, max: 100000, count: 0, value: 0 },
        { label: "Over $100K", min: 100000, max: Infinity, count: 0, value: 0 },
      ];

      const paymentStatusCounts: Record<string, number> = {
        unpaid: 0, paid: 0, partial: 0, on_hold: 0
      };

      const topDeals: Array<{ name: string; repName: string; amount: number; closeDate: string }> = [];

      for (const deal of deals) {
        const stage = deal.stage || "closed_won";
        if (stage === "closed_won") won++;
        else if (stage === "closed_lost") lost++;
        else pending++;

        const ps = deal.paymentStatus || "unpaid";
        if (paymentStatusCounts[ps] !== undefined) {
          paymentStatusCounts[ps]++;
        }

        let convertedAmt = 0;
        const amt = Number(deal.amount) || 0;
        const dealCurrency = deal.currency || "USD";

        if (stage !== "closed_lost") {
          convertedAmt = await convertCurrency(amt, dealCurrency, wsCurrency);
        }

        if (stage === "closed_won") {
          totalRevenue += convertedAmt;

          const pendingStatuses = new Set(["unpaid", "on_hold", "partial", undefined]);
          if (pendingStatuses.has(deal.paymentStatus)) {
            totalPendingRevenue += convertedAmt;
          }

          const pKey = getPeriodKey(deal.closeDate);
          if (!trendsMap.has(pKey)) {
            trendsMap.set(pKey, { period: pKey, revenue: 0, commission: 0, deals: 0 });
          }
          const m = trendsMap.get(pKey)!;
          m.revenue += convertedAmt;
          m.deals++;

          if (deal.createdAt) {
            const createdDate = new Date(deal.createdAt);
            const closeDate = new Date(deal.closeDate);
            const diffDays = Math.round((closeDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) {
              totalDaysToClose += diffDays;
              wonDealCount++;
            }
          }

          topDeals.push({
            name: deal.name,
            repName: repMap.get(deal.repId?.toString() || "") || "Unknown",
            amount: convertedAmt,
            closeDate: deal.closeDate
          });
        } else if (stage !== "closed_lost") {
          totalPendingRevenue += convertedAmt;
        }

        if (stage === "closed_won") {
          for (const bucket of dealValueBuckets) {
            if (convertedAmt >= bucket.min && convertedAmt < bucket.max) {
              bucket.count++;
              bucket.value += convertedAmt;
              break;
            }
          }
        }

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

      topDeals.sort((a, b) => b.amount - a.amount);
      const topDealsSlice = topDeals.slice(0, 5);

      const dealIds = deals.map(d => d._id);
      const allResults = await CommissionResult.find({
        dealId: { $in: dealIds }
      }).populate({
        path: 'runId',
        match: { status: 'completed' }
      });

      const dealCommissionMap = new Map<string, any>();
      for (const resItem of allResults) {
        const run = (resItem as any).runId;
        if (!run) continue;

        const dealIdStr = (resItem as any).dealId.toString();
        const existing = dealCommissionMap.get(dealIdStr);

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

        const deal = deals.find(d => d._id.toString() === dealIdStr);
        if (deal) {
          const pKey = getPeriodKey(deal.closeDate);
          if (!trendsMap.has(pKey)) {
            trendsMap.set(pKey, { period: pKey, revenue: 0, commission: 0, deals: 0 });
          }
          trendsMap.get(pKey)!.commission += convertedCommission;
        }

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

      const repCommissionBreakdown = Array.from(repStatsMap.values())
        .filter(rs => rs.commission > 0 || rs.revenue > 0)
        .map(rs => ({
          name: rs.repName,
          commission: rs.commission,
          revenue: rs.revenue
        }))
        .sort((a, b) => b.commission - a.commission)
        .slice(0, 10);

      const margin = totalRevenue > 0 ? ((totalRevenue - totalCommission) / totalRevenue) * 100 : 0;
      const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0;
      const avgDealSize = won > 0 ? totalRevenue / won : 0;
      const avgDaysToClose = wonDealCount > 0 ? Math.round(totalDaysToClose / wonDealCount) : 0;
      const totalDeals = deals.length;
      const commissionRatio = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;

      const monthlyGrowth = (() => {
        if (monthlyTrends.length < 2) return { revenueGrowth: 0, commissionGrowth: 0, dealGrowth: 0 };
        const last = monthlyTrends[monthlyTrends.length - 1];
        const priorPeriods = monthlyTrends.slice(0, -1);
        const avgRevenue = priorPeriods.reduce((s, p) => s + p.revenue, 0) / priorPeriods.length;
        const avgCommission = priorPeriods.reduce((s, p) => s + p.commission, 0) / priorPeriods.length;
        const avgDeals = priorPeriods.reduce((s, p) => s + p.deals, 0) / priorPeriods.length;
        return {
          revenueGrowth: avgRevenue > 0 ? ((last.revenue - avgRevenue) / avgRevenue) * 100 : 0,
          commissionGrowth: avgCommission > 0 ? ((last.commission - avgCommission) / avgCommission) * 100 : 0,
          dealGrowth: avgDeals > 0 ? ((last.deals - avgDeals) / avgDeals) * 100 : 0
        };
      })();

      res.json({
        executiveSummary: {
          totalRevenue,
          totalCommission,
          margin,
          winRate,
          avgDealSize,
          totalDeals,
          pendingRevenue: totalPendingRevenue,
          avgDaysToClose,
          commissionRatio
        },
        dealStages: [
          { name: "Won", value: won },
          { name: "Lost", value: lost },
          { name: "Pending", value: pending }
        ],
        dealValueDistribution: dealValueBuckets.filter(b => b.count > 0),
        paymentStatusBreakdown: Object.entries(paymentStatusCounts)
          .filter(([_, count]) => count > 0)
          .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1).replace("_", " "), value })),
        monthlyTrends,
        monthlyGrowth,
        topPerformers,
        repCommissionBreakdown,
        topDeals: topDealsSlice
      });

    } catch (error) {
      console.error("Reports API Error:", error);
      res.status(500).json({ error: "Failed to generate reports data" });
    }
  }
);

export default router;
