import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "wouter";
import { useWorkspace } from "@/hooks/use-workspace";
import { apiFetch } from "@/lib/api";
import type { AuditEvent, AuditFilters, AuditLogResponse } from "@/types/audit-log";

function buildAuditLogParams(filters: AuditFilters, page: number, limit: number): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));

  if (filters.search) params.set("search", filters.search);
  if (filters.dateRange.from) params.set("startDate", filters.dateRange.from);
  if (filters.dateRange.to) params.set("endDate", filters.dateRange.to);
  if (filters.userId) params.set("userId", filters.userId);
  if (filters.actions.length > 0) params.set("action", filters.actions.join(","));
  if (filters.resourceTypes.length > 0) params.set("resourceType", filters.resourceTypes.join(","));
  params.set("sort", "desc");

  return params.toString();
}

export function useAuditLog(filters: AuditFilters, page: number, limit = 25) {
  const { activeWorkspace } = useWorkspace();
  const { t } = useTranslation();

  const queryString = buildAuditLogParams(filters, page, limit);

  return useQuery<AuditLogResponse>({
    queryKey: ["audit-log", activeWorkspace?.id, filters, page, limit],
    queryFn: async () => {
      if (!activeWorkspace?.id) throw new Error("No active workspace");

      const data = await apiFetch(`/api/audit-log?${queryString}`);

      return {
        data: data.data as AuditEvent[],
        pagination: {
          page: data.pagination?.page ?? page,
          limit: data.pagination?.limit ?? limit,
          total: data.pagination?.total ?? 0,
          totalPages: data.pagination?.totalPages ?? 1,
        },
      };
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 1000 * 30, // 30 seconds
  });
}

function parseDateParam(raw: string | undefined, key: "from" | "to"): string | undefined {
  if (!raw) return undefined;
  const date = new Date(raw);
  if (isNaN(date.getTime())) return undefined;
  return raw;
}

export function useAuditLogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: AuditFilters = {
    search: searchParams.get("search") || "",
    dateRange: {
      from: parseDateParam(searchParams.get("startDate") ?? undefined, "from"),
      to: parseDateParam(searchParams.get("endDate") ?? undefined, "to"),
    },
    userId: searchParams.get("userId") || "",
    actions: searchParams.get("actions")
      ? String(searchParams.get("actions")).split(",").filter(Boolean)
      : [],
    resourceTypes: searchParams.get("resourceTypes")
      ? String(searchParams.get("resourceTypes")).split(",").filter(Boolean)
      : [],
  };

  function updateFilters(partial: Partial<AuditFilters>) {
    // Clone ALL existing params so we don't drop unrelated filters
    const next = new URLSearchParams(searchParams.toString());

    if (partial.search !== undefined) {
      if (partial.search) next.set("search", partial.search);
      else next.delete("search");
    }

    if (partial.dateRange !== undefined) {
      if (partial.dateRange.from) next.set("startDate", partial.dateRange.from);
      else next.delete("startDate");
      if (partial.dateRange.to) next.set("endDate", partial.dateRange.to);
      else next.delete("endDate");
    }

    if (partial.userId !== undefined) {
      if (partial.userId) next.set("userId", partial.userId);
      else next.delete("userId");
    }

    if (partial.actions !== undefined) {
      if (partial.actions.length > 0) next.set("actions", partial.actions.join(","));
      else next.delete("actions");
    }

    if (partial.resourceTypes !== undefined) {
      if (partial.resourceTypes.length > 0)
        next.set("resourceTypes", partial.resourceTypes.join(","));
      else next.delete("resourceTypes");
    }

    setSearchParams(next);
  }

  function clearFilters() {
    setSearchParams({});
  }

  return { filters, updateFilters, clearFilters };
}
