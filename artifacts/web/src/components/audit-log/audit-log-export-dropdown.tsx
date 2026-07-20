import { useState } from "react";
import { Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useWorkspace } from "@/hooks/use-workspace";
import { rawFetch } from "@/lib/api";
import type { AuditFilters } from "@/types/audit-log";

interface AuditLogExportDropdownProps {
  filters: AuditFilters;
}

export function AuditLogExportDropdown({ filters }: AuditLogExportDropdownProps) {
  const { activeWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<string | null>(null);

  async function exportAs(format: "csv" | "pdf") {
    if (!activeWorkspace?.id) return;

    setLoading(format);
    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", "10000");
      if (filters.search) params.set("search", filters.search);
      if (filters.dateRange.from) params.set("startDate", filters.dateRange.from);
      if (filters.dateRange.to) params.set("endDate", filters.dateRange.to);
      if (filters.userId) params.set("userId", filters.userId);
      if (filters.actions.length > 0) params.set("action", filters.actions.join(","));
      if (filters.resourceTypes.length > 0) params.set("resourceType", filters.resourceTypes.join(","));
      params.set("sort", "desc");

      const res = await rawFetch(`/api/audit-log/export?${params.toString()}`);

      if (!res.ok) throw new Error(await res.text());

      if (format === "csv") {
        const blob = await res.blob();
        const contentDisposition = res.headers.get("Content-Disposition");
        const filename = contentDisposition
          ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
          : "audit-log.csv";
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        toast.success(t("auditLog.export.success"));
      } else {
        toast.info(t("auditLog.export.comingSoon"));
      }
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="size-3.5" />
          {t("auditLog.export.button")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => exportAs("csv")}
          disabled={!!loading}
          className="gap-2"
        >
          {loading === "csv" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {t("auditLog.export.csv")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => exportAs("pdf")}
          disabled={!!loading}
          className="gap-2"
        >
          {loading === "pdf" ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <Download className="size-3.5" />
          )}
          {t("auditLog.export.pdf")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
