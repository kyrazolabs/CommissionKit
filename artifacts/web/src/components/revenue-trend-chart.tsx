import { useTranslation } from "react-i18next";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/format";

interface RevenueTrendChartProps {
  data: Array<{ period: string; revenue?: number; commission?: number; deals?: number }>;
  currency: string;
  className?: string;
}

function ChartTooltipContent({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  const [year, month] = (label || "").split("-");
  const d = new Date(Number(year), Number(month) - 1, 1);
  const monthLabel = `${d.toLocaleString("en", { month: "short" })} ${year}`;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
      <p className="text-[11px] font-semibold text-foreground mb-1">{monthLabel}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-[11px] text-muted-foreground">
          {p.name === "revenue" ? "Revenue: " : "Commission: "}
          <span className="font-medium text-foreground">{formatCurrency(p.value, currency)}</span>
        </p>
      ))}
    </div>
  );
}

export function RevenueTrendChart({ data, currency, className }: RevenueTrendChartProps) {
  const { t } = useTranslation();

  // Always generate last 6 months, filling empty months with 0
  const chartData = (() => {
    const now = new Date();
    const months: Array<{ period: string; revenue: number; commission: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = data.find((m) => m.period === periodStr);
      months.push({
        period: periodStr,
        revenue: existing?.revenue ?? 0,
        commission: existing?.commission ?? 0,
      });
    }
    return months;
  })();

  return (
    <div className={className}>
      <div className="h-50">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="period"
              tickFormatter={(val) => {
                const [y, m] = val.split("-");
                return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en", {
                  month: "short",
                });
              }}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11 }}
              stroke="hsl(var(--muted-foreground))"
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              content={<ChartTooltipContent currency={currency} />}
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--chart-4))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--chart-4))" }}
            />
            <Line
              type="monotone"
              dataKey="commission"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--chart-1))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
