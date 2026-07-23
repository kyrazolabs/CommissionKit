import { Router } from "express";
import { Types } from "mongoose";
import { AuditEvent } from "@workspace/db";
import { requirePermission, type AuthenticatedRequest } from "../../middleware/auth";

const router = Router();

function serializeEvent(event: any) {
  return {
    id: event._id.toString(),
    workspaceId: event.workspaceId.toString(),
    userId: event.userId,
    userName: event.userName,
    userEmail: event.userEmail,
    action: event.action,
    resourceType: event.resourceType,
    resourceId: event.resourceId ? event.resourceId.toString() : null,
    resourceName: event.resourceName,
    changes: event.changes,
    metadata: event.metadata,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    timestamp: event.timestamp.toISOString(),
  };
}

router.get(
  "/",
  ...requirePermission("audit_log", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const {
      page,
      limit,
      userId,
      action,
      resourceType,
      resourceId,
      search,
      startDate,
      endDate,
      sort,
    } = req.query as Record<string, string | undefined>;

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(500, Math.max(1, Number(limit) || 50));

    const filter: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (userId) filter.userId = userId;
    if (action) filter.action = { $in: action.split(",") };
    if (resourceType) filter.resourceType = { $in: resourceType.split(",") };
    if (resourceId) filter.resourceId = resourceId;
    if (search) filter.resourceName = { $regex: search, $options: "i" };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const sortDirection = sort === "asc" ? 1 : -1;
    const skip = (pageNum - 1) * limitNum;

    const [events, total] = await Promise.all([
      AuditEvent.find(filter)
        .sort({ timestamp: sortDirection })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditEvent.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      data: events.map(serializeEvent),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  },
);

router.get(
  "/export",
  ...requirePermission("audit_log", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const {
      userId,
      action,
      resourceType,
      resourceId,
      search,
      startDate,
      endDate,
      month,
      format,
    } = req.query as Record<string, string | undefined>;

    const filter: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (userId) filter.userId = userId;
    if (action) filter.action = { $in: action.split(",") };
    if (resourceType) filter.resourceType = { $in: resourceType.split(",") };
    if (resourceId) filter.resourceId = resourceId;
    if (search) filter.resourceName = { $regex: search, $options: "i" };

    let monthLabel = "";
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const monthStart = new Date(y, m - 1, 1);
      const monthEnd = new Date(y, m, 0, 23, 59, 59, 999);
      filter.timestamp = { $gte: monthStart, $lte: monthEnd };
      monthLabel = new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
    } else if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
      monthLabel = startDate || endDate || "export";
    }

    const events = await AuditEvent.find(filter)
      .sort({ timestamp: -1 })
      .lean();

    const isPdf = format === "pdf";
    const safeFilename = month && /^\d{4}-\d{2}$/.test(month)
      ? `audit-log-${month}`
      : "audit-log";

    if (isPdf) {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(16);
      doc.text("Audit Log Report", pageWidth / 2, 20, { align: "center" });
      doc.setFontSize(10);
      if (monthLabel) {
        doc.text(`Period: ${monthLabel}`, pageWidth / 2, 28, { align: "center" });
      }
      doc.text(`Total Events: ${events.length}`, pageWidth / 2, 34, { align: "center" });

      if (events.length === 0) {
        doc.setFontSize(12);
        doc.text("No audit events found for this period.", pageWidth / 2, 50, { align: "center" });
      } else {
        const rows = events.map((event: any) => [
          event.timestamp ? new Date(event.timestamp).toISOString().replace("T", " ").substring(0, 19) : "",
          event.userEmail ?? "",
          event.action,
          event.resourceType,
          event.resourceName ?? "",
          JSON.stringify(event.changes ?? []).substring(0, 80),
        ]);

        autoTable(doc, {
          head: [["Timestamp", "User", "Action", "Resource", "Name", "Changes"]],
          body: rows,
          startY: 40,
          theme: "grid",
          headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 7 },
          bodyStyles: { fontSize: 7, cellPadding: 2 },
          columnStyles: {
            0: { cellWidth: 38 },
            1: { cellWidth: 35 },
            2: { cellWidth: 18 },
            3: { cellWidth: 20 },
            5: { cellWidth: 50 },
          },
        });
      }

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    // CSV export (default)
    const header = ["timestamp", "userEmail", "action", "resourceType", "resourceId", "resourceName", "changes", "ipAddress", "userAgent"];
    const rows = events.map((event: any) => [
      event.timestamp.toISOString(),
      event.userEmail ?? "",
      event.action,
      event.resourceType,
      event.resourceId ? event.resourceId.toString() : "",
      event.resourceName ?? "",
      JSON.stringify(event.changes ?? []),
      event.ipAddress ?? "",
      event.userAgent ?? "",
    ]);

    const escapeCsv = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csv = [header.join(","), ...rows.map((row) => row.map(escapeCsv).join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.csv"`);
    res.send(csv);
  },
);

router.get(
  "/:id",
  ...requirePermission("audit_log", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = req.params;
    const eventId = Array.isArray(id) ? id[0] : id;

    const event = await AuditEvent.findOne({
      _id: new Types.ObjectId(eventId),
      workspaceId: new Types.ObjectId(workspaceId),
    }).lean();

    if (!event) {
      res.status(404).json({ error: "Audit event not found" });
      return;
    }

    res.json(serializeEvent(event));
  },
);

export default router;
