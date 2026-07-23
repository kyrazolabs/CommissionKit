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
      const pageHeight = doc.internal.pageSize.getHeight();
      const generatedAt = new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC";
      let y = 20;

      // --- Header ---
      doc.setFontSize(18);
      doc.setTextColor(13, 148, 136);
      doc.text("Audit Log Report", pageWidth / 2, y, { align: "center" });
      y += 8;
      doc.setFontSize(9);
      doc.setTextColor(128, 128, 128);
      doc.text("CommissionKit", pageWidth / 2, y, { align: "center" });
      y += 6;

      // Info block (2-column)
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8.5);
      doc.text(`Period: ${monthLabel || "All time"}`, 14, y);
      doc.text(`Generated: ${generatedAt}`, pageWidth / 2, y);
      y += 4.5;
      doc.text(`Workspace: ${workspaceId}`, 14, y);
      doc.text(`Total Events: ${events.length}`, pageWidth / 2, y);
      y += 5;

      // Divider line
      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.5);
      doc.line(14, y, pageWidth - 14, y);
      y += 6;

      // --- Filter Context ---
      const activeFilters: string[] = [];
      if (month && /^\d{4}-\d{2}$/.test(month)) activeFilters.push(`Period: ${monthLabel}`);
      if (userId) activeFilters.push("User filter: active");
      if (action) activeFilters.push(`Actions: ${action}`);
      if (resourceType) activeFilters.push(`Resource types: ${resourceType}`);
      if (search) activeFilters.push(`Search: "${search}"`);
      const filterText = activeFilters.length > 0
        ? activeFilters.join("  |  ")
        : "No filters applied — full export";
      doc.setFontSize(7.5);
      doc.setTextColor(120, 120, 120);
      doc.text(`Filters: ${filterText}`, 14, y);
      y += 7;

      // --- Summary Statistics ---
      if (events.length > 0) {
        const actionCounts: Record<string, number> = {};
        const resourceCounts: Record<string, number> = {};
        for (const e of events) {
          actionCounts[e.action] = (actionCounts[e.action] || 0) + 1;
          resourceCounts[e.resourceType] = (resourceCounts[e.resourceType] || 0) + 1;
        }
        const actionSummary = Object.entries(actionCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} (${v})`)
          .join(", ");
        const resourceSummary = Object.entries(resourceCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([k, v]) => `${k} (${v})`)
          .join(", ");

        doc.setFontSize(9);
        doc.setTextColor(13, 148, 136);
        doc.text("Summary", 14, y);
        y += 4.5;
        doc.setFontSize(7.5);
        doc.setTextColor(60, 60, 60);
        doc.text(`By Action: ${actionSummary}`, 14, y);
        y += 3.5;
        doc.text(`By Resource: ${resourceSummary}`, 14, y);
        y += 6;
      } else {
        y += 2;
      }

      // --- Events Table ---
      if (events.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("No audit events found for this period.", pageWidth / 2, y + 10, { align: "center" });
      } else {
        const formatChanges = (changes: any[]): string => {
          if (!changes || changes.length === 0) return "";
          return changes.map(c => {
            const from = c.from !== undefined ? JSON.stringify(c.from) : "(empty)";
            const to = c.to !== undefined ? JSON.stringify(c.to) : "(empty)";
            return `${c.field}: ${from} \u2192 ${to}`;
          }).join("\n");
        };

        const rows = events.map((event: any) => [
          event.timestamp ? new Date(event.timestamp).toISOString().replace("T", " ").substring(0, 16) : "",
          (event.userName || event.userEmail || "").substring(0, 35),
          event.action,
          event.resourceType,
          (event.resourceName || "").substring(0, 40),
          formatChanges(event.changes ?? []),
        ]);

        autoTable(doc, {
          head: [["Timestamp", "User", "Action", "Resource", "Name", "Changes"]],
          body: rows,
          startY: y,
          theme: "grid",
          headStyles: { fillColor: [13, 148, 136], textColor: [255, 255, 255], fontSize: 7.5, cellPadding: 2 },
          bodyStyles: { fontSize: 7, cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 } },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: {
            0: { cellWidth: 34 },
            1: { cellWidth: 32 },
            2: { cellWidth: 16 },
            3: { cellWidth: 20 },
            4: { cellWidth: 28 },
            5: { cellWidth: "wrap" },
          },
          didDrawPage: (data: any) => {
            const pc = doc.getNumberOfPages();
            doc.setFontSize(7.5);
            doc.setTextColor(120, 120, 120);
            doc.text(`Page ${data.pageNumber} of ${pc}`, pageWidth - 20, pageHeight - 8, { align: "right" });
            doc.text(`Generated: ${generatedAt}`, 14, pageHeight - 8);
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
