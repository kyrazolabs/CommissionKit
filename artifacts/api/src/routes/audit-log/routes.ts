import { AuditEvent } from "@workspace/db";
import { Router } from "express";
import { Types } from "mongoose";
import { type AuthenticatedRequest, requirePermission } from "../../middleware/auth";

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
      AuditEvent.find(filter).sort({ timestamp: sortDirection }).skip(skip).limit(limitNum).lean(),
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
    const { userId, action, resourceType, resourceId, search, startDate, endDate, month, format } =
      req.query as Record<string, string | undefined>;

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
      monthLabel = new Date(y, m - 1, 1).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
    } else if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
      monthLabel = startDate || endDate || "export";
    }

    const events = await AuditEvent.find(filter).sort({ timestamp: -1 }).lean();

    const isPdf = format === "pdf";
    const safeFilename = month && /^\d{4}-\d{2}$/.test(month) ? `audit-log-${month}` : "audit-log";

    if (isPdf) {
      const { jsPDF } = await import("jspdf");
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
      const filterText =
        activeFilters.length > 0 ? activeFilters.join("  |  ") : "No filters applied — full export";
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

      // --- Events Summary Table ---
      if (events.length === 0) {
        doc.setFontSize(11);
        doc.setTextColor(100, 100, 100);
        doc.text("No audit events found for this period.", pageWidth / 2, y + 10, {
          align: "center",
        });
      } else {
        // Summary table — compact, no overflowing Changes column
        const summaryRows = events.map((event: any, i: number) => [
          String(i + 1),
          event.timestamp
            ? new Date(event.timestamp).toISOString().replace("T", " ").substring(0, 16)
            : "",
          (event.userName || event.userEmail || "").substring(0, 32),
          event.action,
          event.resourceType,
          (event.resourceName || event.resourceId?.toString() || "").substring(0, 38),
        ]);

        autoTable(doc, {
          head: [["#", "Timestamp", "User", "Action", "Resource", "Name"]],
          body: summaryRows,
          startY: y,
          theme: "grid",
          headStyles: {
            fillColor: [13, 148, 136],
            textColor: [255, 255, 255],
            fontSize: 7.5,
            cellPadding: 2,
          },
          bodyStyles: { fontSize: 7, cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 } },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          columnStyles: {
            0: { cellWidth: 8, halign: "right" },
            1: { cellWidth: 28 },
            2: { cellWidth: 32 },
            3: { cellWidth: 16 },
            4: { cellWidth: 20 },
            5: { cellWidth: 40 },
          },
          didDrawPage: (data: any) => {
            const pc = doc.getNumberOfPages();
            doc.setFontSize(7.5);
            doc.setTextColor(120, 120, 120);
            doc.text(`Page ${data.pageNumber} of ${pc}`, pageWidth - 20, pageHeight - 8, {
              align: "right",
            });
            doc.text(`Generated: ${generatedAt}`, 14, pageHeight - 8);
          },
          didParseCell: (data: any) => {
            // Color-code action column
            if (data.column.index === 3) {
              const action = data.cell.raw;
              if (action === "create") data.cell.styles.textColor = [13, 148, 136];
              else if (action === "update") data.cell.styles.textColor = [59, 130, 246];
              else if (action === "delete") data.cell.styles.textColor = [239, 68, 68];
            }
          },
        });
      }

      // --- Detailed Changes Section ---
      const eventsWithChanges = events.filter((e: any) => e.changes && e.changes.length > 0);
      if (eventsWithChanges.length > 0) {
        doc.addPage();
        let dy = 22;

        const marginX = 14;
        const contentWidth = pageWidth - marginX * 2;

        // Column layout for change rows (relative to marginX)
        const col: any = {
          field: marginX + 6,
          fieldW: 34,
        };
        col.from = col.field + 36;
        col.fromW = (contentWidth - 36 - 14 - 20) / 2;
        col.arrow = col.from + col.fromW + 4;
        col.to = col.arrow + 10;
        col.toW = col.fromW;

        const drawSectionHeader = (continued: boolean) => {
          doc.setFontSize(14);
          doc.setTextColor(13, 148, 136);
          doc.text(`Detailed Changes${continued ? " (cont'd)" : ""}`, marginX, dy);
          dy += 7;
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`${eventsWithChanges.length} event(s) with changes recorded`, marginX, dy);
          dy += 5;
          doc.setDrawColor(13, 148, 136);
          doc.setLineWidth(0.5);
          doc.line(marginX, dy, pageWidth - marginX, dy);
          dy += 8;
        };

        const drawChangeColumnHeaders = () => {
          doc.setFontSize(7);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(120, 120, 120);
          doc.text("FIELD", col.field, dy);
          doc.text("FROM", col.from, dy);
          doc.text("TO", col.to, dy);
          doc.setFont("helvetica", "normal");
          dy += 2;
          doc.setDrawColor(225, 228, 232);
          doc.setLineWidth(0.2);
          doc.line(marginX, dy, pageWidth - marginX, dy);
          dy += 4;
        };

        drawSectionHeader(false);

        for (let i = 0; i < eventsWithChanges.length; i++) {
          const event: any = eventsWithChanges[i];
          const ts = event.timestamp ? new Date(event.timestamp).toUTCString() : "";
          const user =
            `${event.userName} (${event.userEmail})` ||
            event.userName ||
            event.userEmail ||
            "system";
          const name = event.resourceName || event.resourceId?.toString() || "";

          // Pre-wrap every change value so we can measure the real card height
          // (no more silent truncation — the full audit trail survives on paper)
          const wrappedChanges = event.changes.map((ch: any) => {
            const fromVal = ch.from !== undefined ? JSON.stringify(ch.from) : "(empty)";
            const toVal = ch.to !== undefined ? JSON.stringify(ch.to) : "(empty)";
            const fromLines = doc.splitTextToSize(fromVal, col.fromW);
            const toLines = doc.splitTextToSize(toVal, col.toW);
            const fieldLines = doc.splitTextToSize(ch.field, col.fieldW);
            const lineCount = Math.max(fromLines.length, toLines.length, fieldLines.length);
            return { field: fieldLines, from: fromLines, to: toLines, lineCount };
          });

          const headerHeight = 16;
          const rowsHeight = wrappedChanges.reduce(
            (sum: number, c: any) => sum + c.lineCount * 4.2 + 2.5,
            0,
          );
          const cardHeight = headerHeight + 14 + rowsHeight + 6;

          // Start the whole card on a fresh page rather than splitting it awkwardly
          if (dy + Math.min(cardHeight, pageHeight - 42) > pageHeight - 18) {
            doc.addPage();
            dy = 22;
            drawSectionHeader(true);
          }

          // --- Event header card ---
          doc.setFillColor(245, 247, 250);
          doc.setDrawColor(225, 228, 232);
          doc.setLineWidth(0.3);
          doc.roundedRect(marginX - 6, dy, contentWidth + 12, headerHeight, 2, 2, "FD");

          doc.setFontSize(8);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(13, 148, 136);
          doc.text(`#${i + 1}`, marginX, dy + 6);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(60, 60, 60);
          doc.text(ts, marginX + 12, dy + 6);
          doc.text(user, marginX + 60, dy + 6);

          let actionColor = [100, 100, 100];
          if (event.action === "create") actionColor = [13, 148, 136];
          else if (event.action === "update") actionColor = [59, 130, 246];
          else if (event.action === "delete") actionColor = [239, 68, 68];
          doc.setTextColor(actionColor[0], actionColor[1], actionColor[2]);
          doc.setFont("helvetica", "bold");
          doc.text(event.action.toUpperCase(), marginX, dy + 12);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(event.resourceType, marginX + 22, dy + 12);
          if (name) {
            doc.setTextColor(60, 60, 60);
            doc.text(name.substring(0, 60), marginX + contentWidth - 4, dy + 12, {
              align: "right",
            });
          }
          dy += headerHeight + 4;

          // --- Column headers for this event's changes ---
          drawChangeColumnHeaders();

          // --- Change rows: alternating shading, fully wrapped text (nothing cut) ---
          wrappedChanges.forEach((c: any, idx: number) => {
            const rowH = c.lineCount * 4.2 + 2.5;

            if (dy + rowH > pageHeight - 18) {
              doc.addPage();
              dy = 22;
              drawSectionHeader(true);
              drawChangeColumnHeaders();
            }

            if (idx % 2 === 1) {
              doc.setFillColor(249, 250, 251);
              doc.rect(marginX - 6, dy - 3, contentWidth + 12, rowH, "F");
            }

            doc.setFontSize(7);
            doc.setTextColor(80, 80, 80);
            doc.text(c.field, col.field, dy + 1);
            doc.setTextColor(239, 68, 68);
            doc.text(c.from, col.from, dy + 1);
            doc.setTextColor(160, 160, 160);
            doc.text("\u2192", col.arrow, dy + 1);
            doc.setTextColor(13, 148, 136);
            doc.text(c.to, col.to, dy + 1);

            dy += rowH;
          });

          // Divider between event cards
          dy += 3;
          doc.setDrawColor(235, 237, 240);
          doc.setLineWidth(0.2);
          doc.line(marginX, dy, pageWidth - marginX, dy);
          dy += 7;
        }
      }

      const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
      res.send(pdfBuffer);
      return;
    }

    // CSV export (default)
    const header = [
      "timestamp",
      "userEmail",
      "action",
      "resourceType",
      "resourceId",
      "resourceName",
      "changes",
      "ipAddress",
      "userAgent",
    ];
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
