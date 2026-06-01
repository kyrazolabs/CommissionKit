import { Router } from "express";
import { Workspace } from "@workspace/db";
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

  const { invoiceNumber, amount, currency, period } = req.body;
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

export default router;
