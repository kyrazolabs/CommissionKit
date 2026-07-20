import { useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuditLogFilters } from "@/hooks/use-audit-log";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTranslation } from "react-i18next";
import { FilterChip } from "./filter-chip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import { DateRangePicker } from "@/components/ui/date-picker";
import type { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { AUDIT_ACTIONS, AUDIT_RESOURCE_TYPES } from "@/types/audit-log";

export function AuditLogFilters() {
  const { t } = useTranslation();
  const { filters, updateFilters, clearFilters } = useAuditLogFilters();
  const { activeWorkspace } = useWorkspace();
  const [localSearch, setLocalSearch] = useState(filters.search);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const hasActiveFilters =
    !!filters.search ||
    !!filters.dateRange.from ||
    !!filters.dateRange.to ||
    !!filters.userId ||
    filters.actions.length > 0 ||
    filters.resourceTypes.length > 0;

  function handleSearchChange(value: string) {
    setLocalSearch(value);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      updateFilters({ search: value });
    }, 350);
  }

  function parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  function handleDateRangeChange(range: DateRange | undefined) {
    updateFilters({
      dateRange: {
        from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
        to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
      },
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("auditLog.filters.searchPlaceholder")}
            value={localSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 pr-9"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch("");
                updateFilters({ search: "" });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <Select
          value={filters.userId || "__all__"}
          onValueChange={(v) => updateFilters({ userId: v === "__all__" ? "" : v })}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("auditLog.filters.allUsers")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">{t("auditLog.filters.allUsers")}</SelectItem>
            {activeWorkspace?.members?.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="lg" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="size-3.5" />
            {t("auditLog.filters.clear")}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <DateRangePicker
          from={filters.dateRange.from ? parseLocalDate(filters.dateRange.from) : undefined}
          to={filters.dateRange.to ? parseLocalDate(filters.dateRange.to) : undefined}
          onRangeChange={handleDateRangeChange}
          className="w-[260px]"
        />

        <MultiSelect
          options={AUDIT_ACTIONS.map((a) => ({ value: a, label: a.replace(/_/g, " ") }))}
          selected={filters.actions}
          onChange={(actions) => updateFilters({ actions })}
          placeholder={t("auditLog.filters.allActions")}
          className="w-[150px]"
        />

        <MultiSelect
          options={AUDIT_RESOURCE_TYPES.map((r) => ({ value: r, label: r }))}
          selected={filters.resourceTypes}
          onChange={(resourceTypes) => updateFilters({ resourceTypes })}
          placeholder={t("auditLog.filters.allResources")}
          className="w-[170px]"
        />
      </div>

      {hasActiveFilters && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {filters.search && (
            <FilterChip
              label={t("auditLog.filters.searchChip")}
              value={filters.search}
              onRemove={() => {
                setLocalSearch("");
                updateFilters({ search: "" });
              }}
            />
          )}
          {(filters.dateRange.from || filters.dateRange.to) && (
            <FilterChip
              label={t("auditLog.filters.dateChip")}
              value={`${filters.dateRange.from || "…"} – ${filters.dateRange.to || "…"}`}
              onRemove={() =>
                updateFilters({ dateRange: { from: undefined, to: undefined } })
              }
            />
          )}
          {filters.actions.map((a) => (
            <FilterChip
              key={a}
              label={t("auditLog.filters.actionChip")}
              value={a.replace(/_/g, " ")}
              onRemove={() =>
                updateFilters({
                  actions: filters.actions.filter((x) => x !== a),
                })
              }
            />
          ))}
          {filters.resourceTypes.map((r) => (
            <FilterChip
              key={r}
              label={t("auditLog.filters.resourceChip")}
              value={r}
              onRemove={() =>
                updateFilters({
                  resourceTypes: filters.resourceTypes.filter((x) => x !== r),
                })
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
