import { Fragment, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyDescription, EmptyTitle, EmptyContent, EmptyMedia } from "@/components/ui/empty";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { DiffRow } from "./audit-log-diff";
import type { AuditEvent } from "@/types/audit-log";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Plus,
  Trash2,
  Copy,
} from "lucide-react";

// Semantic action styles - color communicates meaning
const ACTION_STYLES: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    className?: string;
    tooltip: string;
  }
> = {
  create: { label: "Create", variant: "default", tooltip: "New record created" },
  update: { label: "Update", variant: "secondary", tooltip: "Record modified" },
  delete: { label: "Delete", variant: "destructive", tooltip: "Record permanently removed" },
  bulk_create: {
    label: "Bulk Create",
    variant: "outline",
    className: "border-purple-500/50 text-purple-600 dark:text-purple-400",
    tooltip: "Multiple records imported at once",
  },
  invite_sent: { label: "Invite Sent", variant: "secondary", tooltip: "Invitation email sent to user" },
  invite_accepted: { label: "Invite Accepted", variant: "secondary", tooltip: "User accepted invitation" },
  role_change: {
    label: "Role Change",
    variant: "outline",
    className: "border-slate-400/50 text-slate-600 dark:text-slate-400",
    tooltip: "User permission level changed",
  },
  login: {
    label: "Login",
    variant: "outline",
    className: "border-slate-400/50 text-slate-600 dark:text-slate-400",
    tooltip: "User signed in",
  },
  logout: {
    label: "Logout",
    variant: "outline",
    className: "border-slate-400/50 text-slate-600 dark:text-slate-400",
    tooltip: "User signed out",
  },
  password_changed: {
    label: "Password Changed",
    variant: "outline",
    className: "border-slate-400/50 text-slate-600 dark:text-slate-400",
    tooltip: "User updated their password",
  },
  approved: { label: "Approved", variant: "default", tooltip: "Record approved" },
  rejected: { label: "Rejected", variant: "destructive", tooltip: "Record rejected" },
  mark_paid: { label: "Marked Paid", variant: "default", tooltip: "Payment marked as completed" },
};

interface AuditLogTableProps {
  events: AuditEvent[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

function copyToClipboard(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast.success(`${label} copied`);
    })
    .catch(() => {
      toast.error("Failed to copy");
    });
}

export function AuditLogTable({
  events,
  isLoading,
  page,
  totalPages,
  total,
  onPageChange,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </EmptyMedia>
        <EmptyTitle>No audit events found</EmptyTitle>
        <EmptyDescription>
          No events match your current filters. Try adjusting your search or clearing filters.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-3">
        <div className="rounded-md border border-card-border bg-card overflow-hidden">
          <Table>
          <TableHeader>
            <TableRow className="border-b border-card-border hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead className="w-[160px]">Timestamp</TableHead>
              <TableHead className="w-[100px]">Action</TableHead>
              <TableHead className="w-[120px]">User</TableHead>
              <TableHead className="w-[120px]">Resource</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event, index) => {
              const isExpanded = expandedId === event.id;
              const style = ACTION_STYLES[event.action] ?? {
                label: event.action,
                variant: "outline" as const,
                tooltip: event.action,
              };

              return (
                <Fragment key={event.id}>
                  <TableRow
                    onClick={() => toggleExpanded(event.id)}
                    className={cn(
                      "cursor-pointer transition-colors even:bg-muted/10",
                      isExpanded ? "bg-muted/50" : "hover:bg-muted/20"
                    )}
                  >
                    <TableCell className="w-10 py-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            data-testid={`expand-${event.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpanded(event.id);
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronRight className={cn("size-4 transform duration-150", isExpanded ? "rotate-90" : "rotate-0")} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isExpanded ? "Hide details" : "View details"}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums text-muted-foreground">
                      <TimestampCell timestamp={event.timestamp} />
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div>
                            <Badge
                              variant={style.variant}
                              className={cn("text-xs capitalize", style.className)}
                            >
                              {style.label}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {style.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="text-sm font-medium text-foreground truncate max-w-30"
                            title={event.userName || "Unknown"}
                          >
                            {event.userName || "-"}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {event.userName || "Unknown"}
                          {event.userEmail && `\n(${event.userEmail})`}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className="text-xs capitalize">
                            {event.resourceType}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          {event.resourceType}
                          {event.resourceName && `\n${event.resourceName}`}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <DetailsCell event={event} />
                    </TableCell>
                  </TableRow>

                  <tr className="border-b border-border hover:bg-transparent">
                    <td colSpan={6} className="p-0 border-t-0">
                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ maxHeight: isExpanded ? 500 : 0, opacity: isExpanded ? 1 : 0 }}
                      >
                        <div className="px-4 py-3 bg-muted/20 border-t space-y-3">
                          {/* Resource + User full info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                            <span className="text-muted-foreground">
                              <span className="font-medium">Resource:</span> {event.resourceType}
                              {event.resourceName && <> - {event.resourceName}</>}
                            </span>
                            
                              <CopyButton
                                text={event.resourceId ?? ""}
                                label="Resource ID"
                              />
                            <span className="text-muted-foreground">
                              <span className="font-medium">User:</span> {event.userName || "Unknown"}
                              {event.userEmail && <> ({event.userEmail})</>}
                            </span>
                          </div>

                          {/* Field-level diffs */}
                          {event.changes && event.changes.length > 0 && (
                            <div className="space-y-1">
                              {event.changes.map((change, i) => (
                                <DiffRow key={i} change={change} />
                              ))}
                            </div>
                          )}

                          {/* Metadata */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            {event.ipAddress && (
                              <span className="inline-flex items-center gap-1">
                                <span className="font-medium">IP:</span> {event.ipAddress}
                                
                                  <CopyButton text={event.ipAddress} label="IP address" />
                                
                              </span>
                            )}
                            {event.userAgent && (
                              <span className="truncate max-w-75" title={event.userAgent}>
                                <span className="font-medium">UA:</span> {event.userAgent}
                              </span>
                            )}
                            <span>
                              <span className="font-medium">Time:</span>{" "}
                              {format(new Date(event.timestamp), "MMM d, yyyy HH:mm:ss zzz")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-muted-foreground">
            {total.toLocaleString()} event{total !== 1 ? "s" : ""} total
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="size-8 p-0"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm tabular-nums px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="size-8 p-0"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}

function ActionBadge({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? {
    label: action,
    variant: "outline" as const,
    tooltip: action,
  };
  return (
    <Badge
      variant={style.variant}
      className={cn("text-xs capitalize", style.className)}
    >
      {style.label}
    </Badge>
  );
}

function TimestampCell({ timestamp }: { timestamp: string }) {
  const date = new Date(timestamp);
  const relative = formatDistanceToNow(date, { addSuffix: true });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span>{format(date, "MMM d, yyyy HH:mm:ss")}</span>
      </TooltipTrigger>
      <TooltipContent>{relative}</TooltipContent>
    </Tooltip>
  );
}

function DetailsCell({ event }: { event: AuditEvent }) {
  const hasChanges = event.changes && event.changes.length > 0;
  const isCreate = event.action === "create";
  const isDelete = event.action === "delete";

  let icon = null;
  let text = "";

  if (hasChanges) {
    icon = <Pencil className="size-3 text-muted-foreground/60" />;
    text = `${event.changes!.length} field${event.changes!.length !== 1 ? "s" : ""} changed`;
  } else if (isCreate) {
    icon = <Plus className="size-3 text-muted-foreground/60" />;
    text = "Created";
  } else if (isDelete) {
    icon = <Trash2 className="size-3 text-muted-foreground/60" />;
    text = "Deleted";
  } else {
    text = "-";
  }

  if (!icon && text === "-") {
    return <span className="text-sm text-muted-foreground">{text}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground cursor-pointer hover:underline decoration-muted-foreground/30 underline-offset-4">
          {icon}
          {text}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {hasChanges
          ? "Click to see what changed"
          : isCreate
            ? "New record was created"
            : isDelete
              ? "Record was deleted"
              : event.action}
      </TooltipContent>
    </Tooltip>
  );
}

function CopyButton({ text, label }: { text: string; label: string }) {
  if (!text) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(text, label);
          }}
          className="inline-flex items-center justify-center size-6 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label={`Copy ${label}`}
        >
          <Copy className="size-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent>Copy {label}</TooltipContent>
    </Tooltip>
  );
}
