import { HelpTooltip } from "@/components/help-tooltip";
import { TrendBadge } from "@/components/trend-badge";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  trend?: number | null;
  trendLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  tooltip: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  trend,
  trendLabel,
  icon: Icon,
  tooltip,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn("bg-card border border-card-border rounded-2xl px-5.5 py-5", className)}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
          <HelpTooltip content={tooltip} />
        </div>
        <div className="flex size-7 items-center justify-center rounded-[10px] bg-secondary">
          <Icon className="size-3.5 text-primary" />
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-foreground leading-none tabular-nums">
        {value}
      </div>
      <div className="flex items-center gap-2 mt-1.5">
        {trend !== undefined && trend !== null && <TrendBadge trend={trend} />}
        {trendLabel && <span className="text-xs font-medium text-primary">{trendLabel}</span>}
      </div>
    </div>
  );
}
