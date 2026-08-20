import {
  CreateRepBody,
  DeleteRepParams,
  GetRepParams,
  ListRepsQueryParams,
  SendPortalLinkParams,
  UpdateRepBody,
  UpdateRepParams,
} from "@workspace/api-zod";
import { CommissionResult, CommissionRun, Payout, Plan, Rep, Workspace } from "@workspace/db";
import { repPortalTemplate } from "@workspace/email-templates";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { randomBytes } from "crypto";
import { Router } from "express";
import mongoose, { Types } from "mongoose";
import { auth } from "../../lib/auth";
import { checkLimits } from "../../lib/limits";
import { logger } from "../../lib/logger";
import { type AuthenticatedRequest, requirePermission } from "../../middleware/auth";

const router = Router();

/** Generates a unique 24-char hex portal access code */
function generateAccessCode(): string {
  return randomBytes(12).toString("hex");
}

/** Builds the public portal URL for a given access code */
function portalUrl(accessCode: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/portal/${accessCode}`;
}

/** Sends the portal invite email to a rep (fire-and-forget) */
async function sendPortalLinkEmail(
  rep: {
    name: string;
    email: string;
    portalAccessCode: string;
    portalUsername: string;
    portalPassword?: string;
  },
  workspaceName: string,
): Promise<void> {
  try {
    const html = repPortalTemplate({
      repName: rep.name,
      workspaceName,
      portalUrl: portalUrl(rep.portalAccessCode),
      portalUsername: rep.portalUsername,
      portalPassword: rep.portalPassword,
    });
    await sendMediumPriorityEmail({
      to: rep.email,
      subject: `${workspaceName} has shared your commission portal`,
      html,
      meta: { type: "rep_portal_link", repEmail: rep.email },
    });
  } catch (err) {
    console.error("[Reps] Failed to send portal link email:", err);
  }
}

router.get(
  "/reps",
  ...requirePermission("reps", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const query = ListRepsQueryParams.parse(req.query);
    const conditions: any = { workspaceId: new Types.ObjectId(workspaceId) };

    if (query.search !== undefined && query.search.trim() !== "") {
      const searchRegex = new RegExp(query.search.trim(), "i");
      conditions.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));

    const [reps, total] = await Promise.all([
      Rep.find(conditions)
        .populate("planId")
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Rep.countDocuments(conditions),
    ]);

    res.json({
      data: reps.map((r) => ({
        id: r._id,
        name: r.name,
        email: r.email,
        role: r.role,
        planId: r.planId ? ((r.planId as any)._id ?? r.planId) : null,
        planName: r.planId ? ((r.planId as any).name ?? null) : null,
        portalAccessCode: r.portalAccessCode ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  },
);

router.post(
  "/reps",
  ...requirePermission("reps", "create"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const limits = await checkLimits(workspaceId, "reps");
    if (!limits.allowed) {
      res.status(403).json({
        error: `You have reached the limit of ${limits.limit} sales reps for your current plan.`,
      });
      return;
    }

    const body = CreateRepBody.parse(req.body);

    // Generate a unique portal access code
    const accessCode = generateAccessCode();

    const rep = await Rep.create({
      workspaceId: new Types.ObjectId(workspaceId),
      name: body.name,
      email: body.email,
      role: body.role,
      planId: body.planId ? new Types.ObjectId(body.planId) : null,
      portalAccessCode: accessCode,
    });

    let planName: string | null = null;
    if (rep.planId) {
      const plan = await Plan.findById(rep.planId);
      planName = plan?.name ?? null;
    }

    // Send the portal link email (non-blocking)
    const workspace = await Workspace.findById(workspaceId);
    const workspaceName = workspace?.name ?? "Your team";

    // Ensure the rep has a unique readable username
    let username = rep.portalUsername;
    if (!username) {
      let baseUsername = rep.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ".")
        .replace(/\.+/g, ".")
        .replace(/^\.|\.$/g, "");
      if (!baseUsername) baseUsername = "user";

      // Check if base username is already taken globally
      let isUnique = false;
      let suffix = "";
      while (!isUnique) {
        const candidate = suffix ? `${baseUsername}.${suffix}` : baseUsername;
        const existing = await Rep.findOne({ portalUsername: candidate });
        if (!existing) {
          username = candidate;
          isUnique = true;
        } else {
          // If taken, append a random 3-character hex string
          suffix = randomBytes(2).toString("hex").substring(0, 3);
        }
      }

      rep.portalUsername = username;
      await rep.save();
    }

    // Generate a random temporary password
    const tempPassword = randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
    const portalEmail = `${username}@portal.commissionkit.io`;

    // Create or Update the Better Auth user
    try {
      const db = mongoose.connection.db;
      if (db) {
        // Find any existing auth user linked to this rep (by repId) or using this email
        const existingUser = await db.collection("user").findOne({
          $or: [{ repId: rep._id.toString() }, { email: portalEmail }],
        });

        if (existingUser) {
          logger.info(
            { portalEmail, repId: rep._id },
            "Found existing auth user, clearing old records...",
          );
          const actualId = existingUser.id || existingUser._id.toString();
          // Delete old user, accounts, and sessions to avoid duplicate email conflicts
          await db.collection("user").deleteOne({ _id: existingUser._id });
          await db
            .collection("account")
            .deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
          await db
            .collection("session")
            .deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
        }
      }

      logger.info({ portalEmail, repId: rep._id }, "Creating fresh portal user in Better Auth");

      // Use signUpEmail to properly hash the password and create all necessary records
      await auth.api.signUpEmail({
        headers: req.headers,
        body: {
          email: portalEmail,
          password: tempPassword,
          name: rep.name,
          mustChangePassword: true,
          repId: rep._id.toString(),
        },
      });

      logger.info({ portalEmail }, "Successfully synced portal user to Better Auth");
    } catch (err: any) {
      logger.error(
        {
          err: err.message,
          portalEmail,
          repId: rep._id,
        },
        "Failed to sync portal user to Better Auth",
      );
      // This is the cause of login failures if it hits here
    }
    sendPortalLinkEmail(
      {
        name: rep.name,
        email: rep.email,
        portalAccessCode: rep.portalAccessCode ?? accessCode,
        portalUsername: username as string,
        portalPassword: tempPassword,
      },
      workspaceName,
    );

    res.status(201).json({
      id: rep._id,
      name: rep.name,
      email: rep.email,
      role: rep.role,
      planId: rep.planId,
      planName,
      portalAccessCode: accessCode,
      createdAt: rep.createdAt.toISOString(),
    });
  },
);

router.get(
  "/reps/:id",
  ...requirePermission("reps", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = GetRepParams.parse(req.params);
    const rep = await Rep.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    }).populate("planId");

    if (!rep) {
      res.status(404).json({ error: "Rep not found" });
      return;
    }
    res.json({
      id: rep._id,
      name: rep.name,
      email: rep.email,
      role: rep.role,
      planId: rep.planId ? ((rep.planId as any)._id ?? rep.planId) : null,
      planName: rep.planId ? ((rep.planId as any).name ?? null) : null,
      portalAccessCode: rep.portalAccessCode ?? null,
      createdAt: rep.createdAt.toISOString(),
    });
  },
);

router.put(
  "/reps/:id",
  ...requirePermission("reps", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = UpdateRepParams.parse(req.params);
    const body = UpdateRepBody.parse(req.body);
    const rep = await Rep.findOneAndUpdate(
      { _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) },
      {
        name: body.name,
        email: body.email,
        role: body.role,
        planId: body.planId ? new Types.ObjectId(body.planId) : null,
        // We no longer save password in the Rep model
      },
      { new: true },
    );

    if (!rep) {
      res.status(404).json({ error: "Rep not found" });
      return;
    }

    let planName: string | null = null;
    if (rep.planId) {
      const plan = await Plan.findById(rep.planId);
      planName = plan?.name ?? null;
    }

    res.json({
      id: rep._id,
      name: rep.name,
      email: rep.email,
      role: rep.role,
      planId: rep.planId,
      planName,
      portalAccessCode: rep.portalAccessCode ?? null,
      createdAt: rep.createdAt.toISOString(),
    });
  },
);

router.delete(
  "/reps/:id",
  ...requirePermission("reps", "delete"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = DeleteRepParams.parse(req.params);
    await Rep.deleteOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    res.status(204).send();
  },
);

/**
 * POST /reps/:id/send-portal-link
 * (Re)sends the portal link email to the rep. Rotates the access code on resend.
 * Admin only.
 */
router.post(
  "/reps/:id/send-portal-link",
  ...requirePermission("reps", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = SendPortalLinkParams.parse(req.params);

    const rep = await Rep.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });

    if (!rep) {
      res.status(404).json({ error: "Rep not found" });
      return;
    }

    // Only generate a new access code if one doesn't exist yet
    // This prevents breaking existing links just because an invite was resent
    let newCode = rep.portalAccessCode;
    if (!newCode) {
      newCode = generateAccessCode();
      rep.portalAccessCode = newCode;
      await rep.save();
    }

    // Ensure the rep has a unique readable username
    let username = rep.portalUsername;
    if (!username) {
      let baseUsername = rep.name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ".")
        .replace(/\.+/g, ".")
        .replace(/^\.|\.$/g, "");
      if (!baseUsername) baseUsername = "user";

      // Check if base username is already taken globally
      let isUnique = false;
      let suffix = "";
      while (!isUnique) {
        const candidate = suffix ? `${baseUsername}.${suffix}` : baseUsername;
        const existing = await Rep.findOne({ portalUsername: candidate });
        if (!existing) {
          username = candidate;
          isUnique = true;
        } else {
          // If taken, append a random 3-character hex string
          suffix = randomBytes(2).toString("hex").substring(0, 3);
        }
      }

      rep.portalUsername = username;
      await rep.save();
    }

    // Generate a random temporary password
    const tempPassword = randomBytes(6).toString("hex"); // e.g. "a1b2c3d4e5f6"
    const portalEmail = `${username}@portal.commissionkit.io`;

    // Create or Update the Better Auth user
    try {
      const db = mongoose.connection.db;
      if (db) {
        // Find any existing auth user linked to this rep (by repId) or using this email
        const existingUser = await db.collection("user").findOne({
          $or: [{ repId: rep._id.toString() }, { email: portalEmail }],
        });

        if (existingUser) {
          logger.info(
            { portalEmail, repId: rep._id },
            "Found existing auth user, clearing old records...",
          );
          const actualId = existingUser.id || existingUser._id.toString();
          // Delete old user, accounts, and sessions to avoid duplicate email conflicts
          await db.collection("user").deleteOne({ _id: existingUser._id });
          await db
            .collection("account")
            .deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
          await db
            .collection("session")
            .deleteMany({ userId: { $in: [existingUser._id, existingUser._id.toString()] } });
        }
      }

      logger.info({ portalEmail, repId: rep._id }, "Creating fresh portal user in Better Auth");

      // Use signUpEmail to properly hash the password and create all necessary records
      await auth.api.signUpEmail({
        headers: req.headers,
        body: {
          email: portalEmail,
          password: tempPassword,
          name: rep.name,
          mustChangePassword: true,
          repId: rep._id.toString(),
        },
      });

      logger.info({ portalEmail }, "Successfully synced portal user to Better Auth");
    } catch (err: any) {
      logger.error(
        {
          err: err.message,
          portalEmail,
          repId: rep._id,
        },
        "Failed to sync portal user to Better Auth",
      );
      // This is the cause of login failures if it hits here
    }

    const workspace = await Workspace.findById(workspaceId);
    const workspaceName = workspace?.name ?? "Your team";

    await sendPortalLinkEmail(
      {
        name: rep.name,
        email: rep.email,
        portalAccessCode: newCode,
        portalUsername: username as string,
        portalPassword: tempPassword,
      },
      workspaceName,
    );

    res.json({ ok: true, portalAccessCode: newCode });
  },
);

/**
 * GET /reps/:id/export
 * Exports commission details for a specific rep for a given month.
 * Supports CSV and PDF formats.
 * Query params: month (YYYY-MM, required), format ("csv" | "pdf", required)
 */
router.get(
  "/reps/:id/export",
  ...requirePermission("reps", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = GetRepParams.parse(req.params);
    const month = req.query.month as string | undefined;
    const format = req.query.format as string | undefined;

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      res
        .status(400)
        .json({ error: "Missing or invalid 'month' parameter. Expected format: YYYY-MM" });
      return;
    }
    if (!format || !["csv", "pdf"].includes(format)) {
      res
        .status(400)
        .json({ error: "Missing or invalid 'format' parameter. Expected: 'csv' or 'pdf'" });
      return;
    }

    const rep = await Rep.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    if (!rep) {
      res.status(404).json({ error: "Rep not found" });
      return;
    }

    // Find commission runs for the workspace in this month period
    const runs = await CommissionRun.find({
      workspaceId: new Types.ObjectId(workspaceId),
      period: month,
    });
    const runIds = runs.map((r) => r._id);

    // Find commission results for this rep
    const results = await CommissionResult.find({
      repId: new Types.ObjectId(id),
      runId: { $in: runIds },
    })
      .populate("dealId")
      .sort({ createdAt: 1 });

    // Find payouts for this rep in the month
    const [y, m] = month.split("-").map(Number);
    const periodStart = new Date(y, m - 1, 1);
    const periodEnd = new Date(y, m, 0, 23, 59, 59, 999);

    const payouts = await Payout.find({
      workspaceId: new Types.ObjectId(workspaceId),
      repId: new Types.ObjectId(id),
      periodStart: { $gte: periodStart },
      periodEnd: { $lte: periodEnd },
    }).sort({ createdAt: 1 });

    const monthLabel = new Date(y, m - 1, 1).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
    const safeName = rep.name.replace(/[^a-zA-Z0-9_-]/g, "_");

    if (format === "csv") {
      const lines: string[] = [];
      const escapeCsv = (v: unknown): string => {
        if (v === null || v === undefined) return "";
        const s = String(v).replace(/"/g, '""');
        return s.includes(",") || s.includes("\n") || s.includes('"') ? `"${s}"` : s;
      };

      lines.push(`Commission Report - ${rep.name}`);
      lines.push(`Period: ${monthLabel}`);
      lines.push(`Email: ${rep.email}, Role: ${rep.role}`);
      lines.push("");

      lines.push("COMMISSION DETAILS");
      lines.push(
        "Deal Name,Deal Amount,Currency,Rate Applied,Commission Amount,Calculation Note,Close Date",
      );
      for (const r of results) {
        const deal = r.dealId as any;
        lines.push(
          [
            escapeCsv(deal?.name ?? "Unknown"),
            deal?.amount ?? 0,
            (r as any).currency || deal?.currency || "USD",
            `${((r.rateApplied ?? 0) * 100).toFixed(2)}%`,
            r.commissionAmount,
            escapeCsv(r.calculationNote),
            deal?.closeDate ?? "",
          ].join(","),
        );
      }

      lines.push("");

      lines.push("PAYOUTS");
      lines.push(
        "Status,Commission Amount,Adjustments,Final Amount,Payment Method,Scheduled Date,Actual Payment Date",
      );
      if (payouts.length === 0) {
        lines.push("No payouts found for this period");
      } else {
        for (const p of payouts) {
          lines.push(
            [
              p.status,
              p.commissionAmount,
              p.adjustments ?? 0,
              p.finalAmount,
              p.paymentMethod ?? "",
              p.scheduledPaymentDate
                ? new Date(p.scheduledPaymentDate).toISOString().split("T")[0]
                : "",
              p.actualPaymentDate ? new Date(p.actualPaymentDate).toISOString().split("T")[0] : "",
            ].join(","),
          );
        }
      }

      lines.push("");

      const totalCommission = results.reduce((sum, r) => sum + r.commissionAmount, 0);
      lines.push("SUMMARY");
      lines.push(`Total Deals,${results.length}`);
      lines.push(`Total Commission,${totalCommission}`);

      const csv = lines.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}-commissions-${month}.csv"`,
      );
      res.status(200).send(csv);
      return;
    }

    // PDF export
    const { jsPDF } = await import("jspdf");
    const { default: autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text("Commission Report", pageWidth / 2, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(rep.name, pageWidth / 2, 28, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Period: ${monthLabel}`, pageWidth / 2, 36, { align: "center" });
    doc.text(`Email: ${rep.email}  |  Role: ${rep.role}`, pageWidth / 2, 42, { align: "center" });

    const dealRows = results.map((r) => {
      const deal = r.dealId as any;
      return [
        deal?.name ?? "Unknown",
        deal?.amount?.toString() ?? "0",
        (r as any).currency || deal?.currency || "USD",
        `${((r.rateApplied ?? 0) * 100).toFixed(2)}%`,
        r.commissionAmount.toFixed(2),
        r.calculationNote?.substring(0, 60) ?? "",
        deal?.closeDate ?? "",
      ];
    });

    autoTable(doc, {
      head: [["Deal Name", "Amount", "Currency", "Rate", "Commission", "Note", "Close Date"]],
      body: dealRows,
      startY: 50,
      theme: "grid",
      headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        1: { halign: "right" },
        3: { halign: "right" },
        4: { halign: "right" },
      },
    });

    let currentY = (doc as any).lastAutoTable?.finalY ?? 60;

    if (payouts.length > 0) {
      currentY += 10;
      doc.setFontSize(12);
      doc.text("Payouts", 14, currentY);
      currentY += 6;

      const payoutRows = payouts.map((p) => [
        p.status,
        p.commissionAmount.toFixed(2),
        (p.adjustments ?? 0).toFixed(2),
        p.finalAmount.toFixed(2),
        p.paymentMethod ?? "\u2014",
        p.scheduledPaymentDate
          ? new Date(p.scheduledPaymentDate).toISOString().split("T")[0]
          : "\u2014",
        p.actualPaymentDate ? new Date(p.actualPaymentDate).toISOString().split("T")[0] : "\u2014",
      ]);

      autoTable(doc, {
        head: [["Status", "Commission", "Adjustments", "Final", "Method", "Scheduled", "Paid"]],
        body: payoutRows,
        startY: currentY,
        theme: "grid",
        headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          1: { halign: "right" },
          2: { halign: "right" },
          3: { halign: "right" },
        },
      });

      currentY = (doc as any).lastAutoTable?.finalY ?? currentY;
    } else {
      currentY += 10;
      doc.setFontSize(10);
      doc.text("No payouts found for this period.", 14, currentY);
      currentY += 8;
    }

    currentY += 12;
    doc.setFontSize(12);
    doc.text("Summary", 14, currentY);
    currentY += 6;
    doc.setFontSize(10);
    const totalComm = results.reduce((sum, r) => sum + r.commissionAmount, 0);
    doc.text(`Total Deals: ${results.length}`, 14, currentY);
    currentY += 6;
    doc.text(`Total Commission: ${totalComm.toFixed(2)}`, 14, currentY);

    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeName}-commissions-${month}.pdf"`,
    );
    res.status(200).send(pdfBuffer);
  },
);

export default router;
