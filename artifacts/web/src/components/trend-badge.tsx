import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  trend: number;
  className?: string;
}

export function TrendBadge({ trend, className }: TrendBadgeProps) {
  if (trend > 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400",
          className
        )}
      >
        <TrendingUp className="size-3" />
        +{trend.toFixed(1)}%
      </span>
    );
  }

  if (trend < 0) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-semibold text-destructive",
          className
        )}
      >
        <TrendingDown className="size-3" />
        {trend.toFixed(1)}%
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground",
        className
      )}
    >
      <Minus className="size-3" />
      0.0%
    </span>
  );
}
