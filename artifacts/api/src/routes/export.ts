import { Router } from "express";
import { Deal, CommissionResult, Rep } from "@workspace/db";
import { Types } from "mongoose";
import {
  requirePermission,
  requireGrowthPlan,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

function toCSV(data: any[], fields: Record<string, string>) {
  const fieldKeys = Object.keys(fields);
  const header = Object.values(fields).join(",");
  
  const rows = data.map(row => 
    fieldKeys.map(key => {
      const val = row[key];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") || str.includes('"') ? `"${str}"` : str;
    }).join(",")
  );
  
  return [header, ...rows].join("\n");
}

/**
 * GET /api/export/deals
 * Exports all deals for the workspace as CSV.
 * Restricted to Growth plan.
 */
router.get(
  "/export/deals",
  ...requirePermission("deals", "export_csv"),
  requireGrowthPlan,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    
    const deals = await Deal.find({ workspaceId: new Types.ObjectId(workspaceId) })
      .populate("repId")
      .sort({ closeDate: -1 });

    const fields = {
      dealName: "Deal Name",
      repName: "Sales Rep",
      repEmail: "Rep Email",
      amount: "Amount",
      currency: "Currency",
      closeDate: "Close Date",
      period: "Period",
      stage: "Stage",
      notes: "Notes",
      createdAt: "Created At"
    };

    const data = deals.map(d => ({
      dealName: d.name,
      repName: (d.repId as any)?.name ?? "Unknown",
      repEmail: (d.repId as any)?.email ?? "Unknown",
      amount: d.amount,
      currency: d.currency ?? "USD",
      closeDate: d.closeDate,
      period: d.period,
      stage: d.stage,
      notes: d.notes ?? "",
      createdAt: d.createdAt.toISOString()
    }));

    const csv = toCSV(data, fields);
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=deals-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  }
);

/**
 * GET /api/export/commissions
 * Exports all commission results for the workspace as CSV.
 * Restricted to Growth plan.
 */
router.get(
  "/export/commissions",
  ...requirePermission("runs", "export_csv"),
  requireGrowthPlan,
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    
    // Find all results for this workspace (via their runs)
    const { CommissionRun } = await import("@workspace/db");
    const runs = await CommissionRun.find({ workspaceId: new Types.ObjectId(workspaceId) });
    const runIds = runs.map(r => r._id);

    const results = await CommissionResult.find({ runId: { $in: runIds } })
      .populate("repId")
      .populate("dealId")
      .sort({ createdAt: -1 });

    const fields = {
      period: "Period",
      repName: "Sales Rep",
      repEmail: "Rep Email",
      dealName: "Deal Name",
      dealAmount: "Deal Amount",
      currency: "Currency",
      commissionAmount: "Commission",
      rateApplied: "Rate Applied",
      calculationNote: "Note",
      createdAt: "Calculated At"
    };

    const data = results.map(r => ({
      period: (runs.find(run => run._id.toString() === r.runId.toString()))?.period ?? "Unknown",
      repName: (r.repId as any)?.name ?? "Unknown",
      repEmail: (r.repId as any)?.email ?? "Unknown",
      dealName: (r.dealId as any)?.name ?? "Unknown",
      dealAmount: (r.dealId as any)?.amount ?? 0,
      currency: (r as any).currency || (r.dealId as any)?.currency || "USD",
      commissionAmount: r.commissionAmount,
      rateApplied: `${(Number(r.rateApplied) * 100).toFixed(2)}%`,
      calculationNote: r.calculationNote,
      createdAt: (r as any).createdAt.toISOString()
    }));

    const csv = toCSV(data, fields);
    
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=commissions-export-${new Date().toISOString().split('T')[0]}.csv`);
    res.status(200).send(csv);
  }
);

export default router;
