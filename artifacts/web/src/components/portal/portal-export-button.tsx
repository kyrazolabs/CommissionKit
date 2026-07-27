import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PortalExportButtonProps {
  data: Record<string, string | number>[];
  filename: string;
  columns: { key: string; header: string }[];
}

export function PortalExportButton({
  data,
  filename,
  columns,
}: PortalExportButtonProps) {
  const { t } = useTranslation();

  const handleExport = () => {
    const header = columns.map((c) => c.header).join(",");
    const rows = data.map((row) =>
      columns.map((c) => {
        const val = row[c.key];
        const str = String(val ?? "");
        // Escape values containing commas or quotes
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
    >
      <Download className="size-3" />
      {t("common.export") ?? "Export"}
    </Button>
  );
}
