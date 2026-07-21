import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  label: string;
  value: string | string[];
  valueClassName?: string;
  onRemove: () => void;
  className?: string;
}

export function FilterChip({ label, value, valueClassName, onRemove, className }: FilterChipProps) {
  const displayValue = Array.isArray(value) ? value.join(", ") : value;
  const tooLong = displayValue.length > 30;
  const shown = tooLong ? displayValue.slice(0, 30) + "…" : displayValue;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-sidebar-border bg-sidebar-accent px-2.5 py-0.5 text-xs font-medium text-sidebar-accent-foreground transition-colors",
        className
      )}
    >
      <span className="text-muted-foreground">{label}:</span>
      <span className={cn("max-w-[160px] truncate", valueClassName)}>{shown}</span>
      <button
        type="button"
        className="ml-0.5 rounded-full p-0.5 text-sidebar-accent-foreground hover:bg-sidebar-border hover:text-sidebar-foreground"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
