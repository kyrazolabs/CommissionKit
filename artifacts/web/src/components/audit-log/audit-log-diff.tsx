import { cn } from "@/lib/utils";
import type { AuditEvent } from "@/types/audit-log";

interface AuditLogDiffProps {
  event: AuditEvent;
}

const ACTION_LABELS: Record<string, string> = {
  create: "Created",
  update: "Updated",
  delete: "Deleted",
  bulk_create: "Bulk created",
  invite_sent: "Invite sent",
  invite_accepted: "Invite accepted",
  role_change: "Role changed",
  login: "Logged in",
  logout: "Logged out",
  password_changed: "Password changed",
  approved: "Approved",
  rejected: "Rejected",
  mark_paid: "Marked paid",
};

export function AuditLogDiff({ event }: AuditLogDiffProps) {
  if (!event.changes?.length) {
    return (
      <span className="text-[12px] text-muted-foreground">
        {ACTION_LABELS[event.action] ?? event.action}
      </span>
    );
  }

  return (
    <div className="space-y-1">
      <span className="text-[12px] text-muted-foreground">
        {event.changes.length} field{event.changes.length !== 1 ? "s" : ""} changed
      </span>
    </div>
  );
}

export function DiffRow({ change }: { change: { field: string; from?: unknown; to?: unknown } }) {
  const { field, from, to } = change;

  // Format scalar values for display
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

export { ACTION_LABELS };
