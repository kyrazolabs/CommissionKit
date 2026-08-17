import { ArrowDown, ArrowUp } from "lucide-react";
import type { SortDirection } from "@/hooks/use-table-sort";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps {
  label: string;
  column: string;
  sortColumn: string | null;
  sortDirection: SortDirection;
  onSort: (column: string) => () => void;
  align?: "left" | "center" | "right";
  className?: string;
}

export function SortableTableHead({
  label,
  column,
  sortColumn,
  sortDirection,
  onSort,
  align = "left" as const,
  className,
}: SortableTableHeadProps) {
  const isActive = sortColumn === column;

  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[align];

  return (
    <th
      className={cn(
        "px-3 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none transition-colors hover:text-foreground",
        alignClass,
        isActive ? "text-foreground" : "",
        className,
      )}
      onClick={onSort(column)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSort(column)();
        }
      }}
      tabIndex={0}
      role="columnheader"
      aria-sort={
        isActive
          ? sortDirection === "asc"
            ? "ascending"
            : sortDirection === "desc"
              ? "descending"
              : "none"
          : "none"
      }
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && sortDirection === "asc" && <ArrowUp className="size-3" />}
        {isActive && sortDirection === "desc" && <ArrowDown className="size-3" />}
        {!isActive && (
          <span className="text-muted-foreground/30">
            <ArrowUp className="size-3" />
          </span>
        )}
      </span>
    </th>
  );
}
