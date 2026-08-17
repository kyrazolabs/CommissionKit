import { Download, FileDown, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/month-picker";
import { useWorkspace } from "@/hooks/use-workspace";
import { rawFetch } from "@/lib/api";
import type { AuditFilters } from "@/types/audit-log";

interface AuditLogExportDropdownProps {
  filters: AuditFilters;
}

export function AuditLogExportDropdown({ filters }: AuditLogExportDropdownProps) {
  const { activeWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState<string | null>(null);

  async function exportAs(format: "csv" | "pdf") {
    if (!activeWorkspace?.id) return;
    setLoading(format);
    try {
      const params = new URLSearchParams();
      params.set("month", month);
      params.set("format", format);
      if (filters.search) params.set("search", filters.search);
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.actions.length > 0) params.set("action", filters.actions.join(","));
      if (filters.resourceTypes.length > 0)
        params.set("resourceType", filters.resourceTypes.join(","));

      const res = await rawFetch(`/api/audit-log/export?${params.toString()}`);
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `audit-log-${month}.${format}`;
      const downloadUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);
      toast.success(t("auditLog.export.success"));
      setOpen(false);
    } catch (err) {
      toast.error(
        t("auditLog.export.failed", {
          error: err instanceof Error ? err.message : "Unknown error",
        }),
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
        <Download className="size-3.5" />
        {t("auditLog.export.button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Export Audit Log</DialogTitle>
            <DialogDescription>
              Select a month and format to export the audit log.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Month</Label>
              <MonthPicker value={month} onChange={setMonth} />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline" onClick={() => exportAs("csv")} disabled={!!loading}>
              {loading === "csv" ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 size-4" />
              )}
              Export CSV
            </Button>
            <Button onClick={() => exportAs("pdf")} disabled={!!loading}>
              {loading === "pdf" ? (
                <LoaderCircle className="mr-2 size-4 animate-spin" />
              ) : (
                <FileDown className="mr-2 size-4" />
              )}
              Export PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
