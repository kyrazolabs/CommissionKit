import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import type { AuditEvent } from "@/types/audit-log";

interface AuditLogDiffProps {
  event: AuditEvent;
}

export function AuditLogDiff({ event }: AuditLogDiffProps) {
  const { t } = useTranslation();

  const key = `auditLog.actionDescriptions.${event.action}` as const;
  const description = t(key);

  if (!event.changes?.length) {
    return (
      <span className="text-[12px] text-muted-foreground">
        {description !== key ? description : event.action}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <span className="text-[12px] text-muted-foreground">
        {t("auditLog.table.fieldsChanged", { count: event.changes.length })}
      </span>
    </div>
  );
}

export function DiffRow({ change }: { change: { field: string; from?: unknown; to?: unknown } }) {
  const { field, from, to } = change;

  const fmt = (v: unknown): string => {
    if (v === null || v === undefined) return "—";
    if (typeof v === "boolean") return v ? "true" : "false";
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  return (
    <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-x-2 gap-y-0.5 text-xs items-start">
      <span className="text-muted-foreground font-medium capitalize text-right truncate max-w-25" title={field}>
        {field}:
      </span>
      <span
        className="text-destructive/80 bg-destructive/5 px-1.5 py-0.5 rounded truncate dark:bg-destructive/10"
        title={fmt(from)}
      >
        {fmt(from)}
      </span>
      <span className="text-muted-foreground">→</span>
      <span
        className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-1.5 py-0.5 rounded truncate dark:bg-emerald-500/10"
        title={fmt(to)}
      >
        {fmt(to)}
      </span>
    </div>
  );
}
