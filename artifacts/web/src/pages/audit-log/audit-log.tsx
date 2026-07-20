import { useState } from "react";
import { useSearchParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AuditLogFilters } from "@/components/audit-log/audit-log-filters";
import { AuditLogTable } from "@/components/audit-log/audit-log-table";
import { AuditLogExportDropdown } from "@/components/audit-log/audit-log-export-dropdown";
import { useAuditLog, useAuditLogFilters } from "@/hooks/use-audit-log";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useTranslation } from "react-i18next";
import { ScrollText } from "lucide-react";
import type { AuditFilters } from "@/types/audit-log";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 25;

export default function AuditLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(DEFAULT_PAGE);
  const { filters } = useAuditLogFilters();
  const { data, isLoading, error } = useAuditLog(filters, page, DEFAULT_LIMIT);

  usePageMeta({
    title: "Audit Log — CommissionKit",
    description: "Track all changes made in your CommissionKit workspace.",
  });

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center rounded-lg bg-primary/10 text-primary size-10">
            <ScrollText className="size-5" />
          </div>
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight">Audit Log</h1>
            <p className="text-sm text-muted-foreground">
              Track all changes made in your workspace.
            </p>
          </div>
        </div>
        <AuditLogExportDropdown filters={filters} />
      </div>

      <Card className="rounded-xl border border-card-border bg-card">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-[15px] font-semibold leading-snug tracking-tight">
              Events
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <AuditLogFilters />
          <AuditLogTable
            events={data?.data ?? []}
            isLoading={isLoading}
            page={page}
            totalPages={data?.pagination.totalPages ?? 1}
            total={data?.pagination.total ?? 0}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
