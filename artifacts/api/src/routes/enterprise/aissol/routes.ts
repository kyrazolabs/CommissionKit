import { Router } from "express";
import { Workspace, CommissionResult, Rep } from "@workspace/db";
import { AissolProject, AissolInvoice, AissolCommissionMatrix } from "@workspace/db/schema/aissol";
import { Types } from "mongoose";
import { requirePermission, type AuthenticatedRequest } from "../../../middleware/auth";

const router = Router();

function ensureAissolWorkspace(req: AuthenticatedRequest, res: any, next: any) {
  const workspaceId = req.workspaceId!;
  Workspace.findById(workspaceId).then((ws) => {
    const engine = (ws as any)?.commissionEngine || "standard";
    if (engine !== "aissol") {
      return res.status(404).json({ error: "AISSOL engine not enabled for this workspace" });
    }
    next();
  }).catch(() => res.status(500).json({ error: "Failed to verify workspace engine" }));
}

// ─── Projects ──────────────────────────────────────────────────────────────────

router.get("/projects", ...requirePermission("deals", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const projects = await AissolProject.find({
    workspaceId: new Types.ObjectId(req.workspaceId!),
  }).sort({ createdAt: -1 });
  res.json(projects);
});

router.post("/projects", ...requirePermission("deals", "create"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { repId, name, totalValue, totalCost, currency, period, status } = req.body;
  if (!repId || !name || !period || totalValue == null || totalCost == null) {
    res.status(400).json({ error: "repId, name, period, totalValue, and totalCost are required" });
    return;
  }

  const project = await AissolProject.create({
    workspaceId: new Types.ObjectId(req.workspaceId!),
    repId: new Types.ObjectId(repId),
    name,
    totalValue: Number(totalValue),
    totalCost: Number(totalCost),
    currency: currency || "SAR",
    period,
    status: status || "active",
  });

  res.status(201).json(project);
});

// ─── Export (must be before /:id to avoid route conflict) ─────────────────────

router.get("/projects/export", ...requirePermission("deals", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const projects = await AissolProject.find({
    workspaceId: new Types.ObjectId(req.workspaceId!),
  }).sort({ createdAt: -1 });

  const csv = [
    "Name,Rep ID,Total Value,Total Cost,Currency,Period,Status,GM%",
    ...projects.map((p) => {
      const gm = p.totalValue > 0 ? (((p.totalValue - p.totalCost) / p.totalValue) * 100).toFixed(2) : "0.00";
      return `"${p.name}",${p.repId},${p.totalValue},${p.totalCost},${p.currency},${p.period},${p.status},${gm}`;
    }),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=projects-export-${new Date().toISOString().split("T")[0]}.csv`);
  res.send(csv);
});

router.get("/projects/:id/invoices/export", ...requirePermission("deals", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const invoices = await AissolInvoice.find({
    projectId: new Types.ObjectId(String(id)),
  }).sort({ createdAt: -1 });

  const csv = [
    "Invoice Number,Amount,Currency,Period",
    ...invoices.map((inv) =>
      `"${inv.invoiceNumber}",${inv.amount},${inv.currency},${inv.period}`,
    ),
  ].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename=invoices-export-${new Date().toISOString().split("T")[0]}.csv`);
  res.send(csv);
});

router.get("/projects/:id", ...requirePermission("deals", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const project = await AissolProject.findOne({
    _id: new Types.ObjectId(String(id)),
    workspaceId: new Types.ObjectId(req.workspaceId!),
  });
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const invoices = await AissolInvoice.find({ projectId: project._id }).sort({ createdAt: -1 });

  res.json({
    ...project.toObject(),
    invoices,
  });
});

router.put("/projects/:id", ...requirePermission("deals", "edit"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const update = await AissolProject.findOneAndUpdate(
    { _id: new Types.ObjectId(String(id)), workspaceId: new Types.ObjectId(req.workspaceId!) },
    { $set: req.body },
    { new: true },
  );
  if (!update) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(update);
});

router.delete("/projects/:id", ...requirePermission("deals", "delete"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const project = await AissolProject.findOneAndDelete({
    _id: new Types.ObjectId(String(id)),
    workspaceId: new Types.ObjectId(req.workspaceId!),
  });
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  await AissolInvoice.deleteMany({ projectId: project._id });
  res.status(204).send();
});

// ─── Invoices ──────────────────────────────────────────────────────────────────

router.get("/projects/:id/invoices", ...requirePermission("deals", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const invoices = await AissolInvoice.find({
    projectId: new Types.ObjectId(String(id)),
  }).sort({ createdAt: -1 });
  res.json(invoices);
});

router.post("/projects/:id/invoices", ...requirePermission("deals", "create"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const project = await AissolProject.findOne({
    _id: new Types.ObjectId(String(id)),
    workspaceId: new Types.ObjectId(req.workspaceId!),
  });
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const { invoiceNumber, amount, currency, period, notes, dueDate, paymentStatus } = req.body;
  if (!invoiceNumber || amount == null) {
    res.status(400).json({ error: "invoiceNumber and amount are required" });
    return;
  }

  const invoice = await AissolInvoice.create({
    workspaceId: new Types.ObjectId(req.workspaceId!),
    projectId: project._id,
    repId: project.repId,
    invoiceNumber,
    amount: Number(amount),
    currency: currency || project.currency || "SAR",
    period: period || project.period,
    notes: notes || undefined,
    dueDate: dueDate || undefined,
    paymentStatus: paymentStatus || "unpaid",
  });

  res.status(201).json(invoice);
});

router.delete("/projects/:id/invoices/:invoiceId", ...requirePermission("deals", "delete"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id, invoiceId } = req.params;
  const invoice = await AissolInvoice.findOneAndDelete({
    _id: new Types.ObjectId(String(invoiceId)),
    projectId: new Types.ObjectId(String(id)),
  });
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }
  res.status(204).send();
});

router.put("/projects/:id/invoices/:invoiceId", ...requirePermission("deals", "edit"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { id, invoiceId } = req.params;
  const { invoiceNumber, amount, currency, paymentStatus, dueDate, notes } = req.body;

  const invoice = await AissolInvoice.findOne({
    _id: new Types.ObjectId(String(invoiceId)),
    projectId: new Types.ObjectId(String(id)),
  });
  if (!invoice) { res.status(404).json({ error: "Invoice not found" }); return; }

  if (invoice.paymentStatus === "paid" && paymentStatus !== "paid") {
    res.status(400).json({ error: "Paid invoices cannot be changed back to unpaid." });
    return;
  }

  if (invoiceNumber !== undefined) invoice.invoiceNumber = invoiceNumber;
  if (amount !== undefined) invoice.amount = Number(amount);
  if (currency !== undefined) invoice.currency = currency;
  if (paymentStatus !== undefined) invoice.paymentStatus = paymentStatus;
  if (dueDate !== undefined) invoice.dueDate = dueDate;
  if (notes !== undefined) invoice.notes = notes;

  await invoice.save();
  res.json(invoice);
});

// ─── Commission Matrix ────────────────────────────────────────────────────────

router.get("/commission-matrix", ...requirePermission("plans", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const matrix = await AissolCommissionMatrix.findOne({
    workspaceId: new Types.ObjectId(req.workspaceId!),
  });

  res.json({
    exists: !!matrix,
    slabs: matrix?.slabs ?? [],
    gmBrackets: matrix?.gmBrackets ?? [],
    rates: matrix?.rates ?? {},
  });
});

router.put("/commission-matrix", ...requirePermission("plans", "create"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const { slabs, gmBrackets, rates } = req.body;
  if (!slabs || !gmBrackets || !rates) {
    res.status(400).json({ error: "slabs, gmBrackets, and rates are required" });
    return;
  }

  const matrix = await AissolCommissionMatrix.findOneAndUpdate(
    { workspaceId: new Types.ObjectId(req.workspaceId!) },
    { slabs, gmBrackets, rates },
    { upsert: true, new: true },
  );

  res.json({
    slabs: matrix.slabs,
    gmBrackets: matrix.gmBrackets,
    rates: matrix.rates,
  });
});

// ─── Rep Summary ───────────────────────────────────────────────────────────────

router.get("/reps/:repId/summary", ...requirePermission("reps", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const workspaceId = req.workspaceId!;
  const { repId } = req.params;
  const { period } = req.query as { period?: string };

  const rep = await Rep.findById(String(repId));
  if (!rep) { res.status(404).json({ error: "Rep not found" }); return; }

  const workspace = await Workspace.findById(rep.workspaceId);

  const allProjects = await AissolProject.find({ workspaceId: new Types.ObjectId(req.workspaceId!), repId: new Types.ObjectId(String(repId)) });
  const allProjectIds = allProjects.map(p => p._id);
  const allInvoices = await AissolInvoice.find({ projectId: { $in: allProjectIds } });

  const allInvIds = allInvoices.map(inv => inv._id);
  const results = await CommissionResult.find({ dealId: { $in: allInvIds } }).populate({ path: "runId", match: { status: "completed" } });

  const invCommissionMap = new Map<string, number>();
  for (const r of results) {
    if (!(r as any).runId) continue;
    const vid = r.dealId.toString();
    invCommissionMap.set(vid, (invCommissionMap.get(vid) ?? 0) + Number(r.commissionAmount));
  }

  // Build monthly history from ALL projects (past 6 months)
  const monthlyHistoryMap = new Map<string, number>();
  for (const project of allProjects) {
    const projInvoices = allInvoices.filter(inv => inv.projectId.toString() === project._id.toString());
    let projCommission = 0;
    for (const inv of projInvoices) {
      projCommission += invCommissionMap.get(inv._id.toString()) ?? 0;
    }
    monthlyHistoryMap.set(project.period, (monthlyHistoryMap.get(project.period) ?? 0) + projCommission);
  }

  const monthlyHistory = (() => {
    const result: { period: string; totalCommission: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      result.push({ period: key, totalCommission: monthlyHistoryMap.get(key) ?? 0 });
    }
    return result;
  })();

  // Summary for selected period only
  const selectedProjects = period ? allProjects.filter(p => p.period === period) : allProjects;
  let totalCommission = 0;
  let totalValue = 0;
  const projectRows: any[] = [];

  for (const project of selectedProjects) {
    const projInvoices = allInvoices.filter(inv => inv.projectId.toString() === project._id.toString());
    let projCommission = 0;
    for (const inv of projInvoices) {
      projCommission += invCommissionMap.get(inv._id.toString()) ?? 0;
    }
    totalCommission += projCommission;
    totalValue += Number(project.totalValue);

    projectRows.push({
      name: project.name, period: project.period,
      value: Number(project.totalValue), cost: Number(project.totalCost),
      gm: project.totalValue > 0 ? Math.round(((project.totalValue - project.totalCost) / project.totalValue * 100) * 10) / 10 : 0,
      commission: projCommission, invoiceCount: projInvoices.length,
      currency: project.currency, status: project.status,
    });
  }

  res.json({
    repName: (rep as any).name || "Unknown",
    email: (rep as any).email || "",
    workspaceName: workspace?.name || null,
    totalCommission, totalValue,
    totalProjects: selectedProjects.length,
    totalInvoices: allInvoices.filter(inv => selectedProjects.some(p => p._id.toString() === inv.projectId.toString())).length,
    projectBreakdown: projectRows,
    monthlyHistory,
  });
});

// ─── Reports ───────────────────────────────────────────────────────────────────

router.get("/reports", ...requirePermission("analytics", "read"), ensureAissolWorkspace, async (req: AuthenticatedRequest, res) => {
  const workspaceId = req.workspaceId!;
  const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

  const projectQuery: any = { workspaceId: new Types.ObjectId(workspaceId) };
  const projects = await AissolProject.find(projectQuery).sort({ createdAt: -1 });
  const invoices = await AissolInvoice.find({ projectId: { $in: projects.map(p => p._id) } });

  const invoiceMap = new Map<string, typeof invoices>();
  for (const inv of invoices) {
    const key = inv.projectId.toString();
    if (!invoiceMap.has(key)) invoiceMap.set(key, []);
    invoiceMap.get(key)!.push(inv);
  }

  const reps = await Rep.find({ workspaceId: new Types.ObjectId(workspaceId) });
  const repMap = new Map(reps.map(r => [r._id.toString(), r.name]));

  const invoiceIds = invoices.map(inv => inv._id);
  const allResults = await CommissionResult.find({
    dealId: { $in: invoiceIds },
  }).populate({ path: "runId", match: { status: "completed" } });

  const invoiceCommissionMap = new Map<string, number>();
  for (const r of allResults) {
    if (!(r as any).runId) continue;
    const invId = r.dealId.toString();
    invoiceCommissionMap.set(invId, (invoiceCommissionMap.get(invId) ?? 0) + Number(r.commissionAmount));
  }

  let totalValue = 0;
  let totalCost = 0;
  let totalCommission = 0;
  let totalInvoices = 0;
  const projectRows: any[] = [];
  const repCommissions = new Map<string, number>();
  const repNames = new Map<string, string>();

  const trendsMap = new Map<string, { period: string; value: number; commission: number; count: number }>();

  for (const project of projects) {
    const projValue = Number(project.totalValue);
    const projCost = Number(project.totalCost);
    const projInvoices = invoiceMap.get(project._id.toString()) ?? [];

    let projCommission = 0;
    for (const inv of projInvoices) {
      projCommission += invoiceCommissionMap.get(inv._id.toString()) ?? 0;
    }

    totalValue += projValue;
    totalCost += projCost;
    totalCommission += projCommission;
    totalInvoices += projInvoices.length;

    const gmPercent = projValue > 0 ? ((projValue - projCost) / projValue * 100) : 0;

    projectRows.push({
      name: project.name,
      value: projValue,
      cost: projCost,
      gm: Math.round(gmPercent * 10) / 10,
      commission: projCommission,
      invoices: projInvoices.length,
      currency: project.currency,
      period: project.period,
      status: project.status,
    });

    const repId = project.repId.toString();
    repCommissions.set(repId, (repCommissions.get(repId) ?? 0) + projCommission);
    repNames.set(repId, repMap.get(repId) ?? "Unknown");

    const pKey = project.period;
    if (!trendsMap.has(pKey)) trendsMap.set(pKey, { period: pKey, value: 0, commission: 0, count: 0 });
    const t = trendsMap.get(pKey)!;
    t.value += projValue;
    t.commission += projCommission;
    t.count++;
  }

  const repBreakdown = Array.from(repCommissions.entries())
    .map(([id, comm]) => ({ repId: id, name: repNames.get(id) ?? "Unknown", commission: comm }))
    .sort((a, b) => b.commission - a.commission);

  const gmOverall = totalValue > 0 ? ((totalValue - totalCost) / totalValue * 100) : 0;
  const avgProjectSize = projects.length > 0 ? totalValue / projects.length : 0;
  const commissionRatio = totalValue > 0 ? (totalCommission / totalValue * 100) : 0;

  res.json({
    executiveSummary: {
      totalProjects: projects.length,
      totalValue,
      totalCost,
      totalCommission,
      totalInvoices,
      gmOverall: Math.round(gmOverall * 10) / 10,
      avgProjectSize,
      commissionRatio: Math.round(commissionRatio * 100) / 100,
    },
    projectBreakdown: projectRows,
    repBreakdown,
    monthlyTrends: Array.from(trendsMap.values()).sort((a, b) => a.period.localeCompare(b.period)),
  });
});

export default router;
