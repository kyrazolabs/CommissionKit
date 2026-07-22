import { format } from "date-fns";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/format";
import { useTranslation } from "react-i18next";

interface RevenueTrendChartProps {
  data: Array<{
    period: string;
    revenue: number;
    commission: number;
    deals: number;
  }>;
  currency: string;
  className?: string;
}

export function RevenueTrendChart({
  data,
  currency,
  className,
}: RevenueTrendChartProps) {
  const { t } = useTranslation();

  // Take last 6 months
  const chartData = data.slice(-6);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      <ChartContainer
        config={{
          revenue: {
            label: t("dashboard.chart.revenue"),
            color: "hsl(var(--primary))",
          },
          commission: {
            label: t("dashboard.chart.commission"),
            color: "hsl(158 64% 36%)",
          },
        }}
      >
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart
            data={chartData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(var(--primary))"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="hsl(158 64% 36%)"
                  stopOpacity={0.15}
                />
                <stop
                  offset="95%"
                  stopColor="hsl(158 64% 36%)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(val: string) => {
                try {
                  return format(new Date(val + "-01"), "MMM");
                } catch {
                  return val;
                }
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(val: number) =>
                val >= 1000 ? `$${(val / 1000).toFixed(0)}k` : `$${val}`
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value: number, name: string) => [
                    formatCurrency(value, currency),
                    name === "revenue"
                      ? t("dashboard.chart.revenue")
                      : t("dashboard.chart.commission"),
                  ]}
                  labelFormatter={(label: string) => {
                    try {
                      return format(new Date(label + "-01"), "MMMM yyyy");
                    } catch {
                      return label;
                    }
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
            />
            <Area
              type="monotone"
              dataKey="commission"
              stroke="hsl(158 64% 36%)"
              strokeWidth={2}
              fill="url(#commissionGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "hsl(158 64% 36%)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
