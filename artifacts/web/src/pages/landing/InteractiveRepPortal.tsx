import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts";
import { User, TrendingUp, DollarSign, BarChart3, Activity } from "lucide-react";

const monthlyData = [
  { month: "Jan", revenue: 42500, commission: 3825 },
  { month: "Feb", revenue: 38000, commission: 3420 },
  { month: "Mar", revenue: 52000, commission: 4940 },
  { month: "Apr", revenue: 61000, commission: 6235 },
  { month: "May", revenue: 47500, commission: 4275 },
  { month: "Jun", revenue: 68000, commission: 7820 },
];

const dealBreakdown = [
  { deal: "Acme Corp", revenue: 28000, commission: 2240, plan: "Enterprise" },
  { deal: "Globex", revenue: 18500, commission: 1480, plan: "Standard" },
  { deal: "Initech", revenue: 12500, commission: 750, plan: "Standard" },
  { deal: "Umbrella", revenue: 9000, commission: 450, plan: "Flat 5%" },
];

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
      <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-[11px] text-muted-foreground">
          {p.name === "revenue" ? "Revenue: " : "Commission: "}
          <span className="font-medium text-foreground">{fmtCurrency(p.value)}</span>
        </p>
      ))}
    </div>
  );
}

export function InteractiveRepPortal() {
  const [tab, setTab] = useState("overview");

  const totalCommission = monthlyData.reduce((s, m) => s + m.commission, 0);
  const totalRevenue = monthlyData.reduce((s, m) => s + m.revenue, 0);

  return (
    <Card className="overflow-hidden border-card-border shadow-sm h-[460px] flex flex-col">
      <div className="px-5 py-3 border-b border-card-border bg-muted/20 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-[8px] bg-primary/10">
          <User className="size-3.5 text-primary" />
        </div>
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">SD</div>
          <div>
            <span className="text-[13px] font-semibold text-foreground">Sarah Davis</span>
            <span className="text-[11px] text-muted-foreground ml-1.5">Senior AE</span>
          </div>
        </div>
        <Badge variant="secondary" className="ml-auto text-[10px]">Interactive Demo</Badge>
      </div>

      <div className="grid grid-cols-3 divide-x divide-card-border border-b border-card-border">
        {[
          { label: "YTD Earnings", value: fmtCurrency(totalCommission), icon: DollarSign, color: "text-primary" },
          { label: "YTD Revenue", value: fmtCurrency(totalRevenue), icon: TrendingUp, color: "text-blue-500" },
          { label: "Deals Closed", value: "14", icon: Activity, color: "text-amber-500" },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <s.icon className={`size-3 ${s.color}`} />
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-[17px] font-bold text-foreground tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-card-border bg-transparent p-0 h-auto grid grid-cols-2 shrink-0">
          {(["overview", "deals"] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-none border-b-2 border-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/4 py-2.5 px-2 h-auto text-xs font-medium capitalize"
            >
              {t === "overview" ? "Earnings" : "Deal Breakdown"}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <CardContent className="p-4 overflow-auto custom-scrollbar">
            <div className="flex items-center gap-1.5 mb-3">
              <BarChart3 className="size-3.5 text-primary" />
              <span className="text-[12px] font-semibold text-foreground">Monthly Earnings</span>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} fill="hsl(var(--muted))" />
                  <Bar dataKey="commission" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-muted" />
                <span className="text-[10px] text-muted-foreground">Revenue</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="size-2.5 rounded-sm bg-primary" />
                <span className="text-[10px] text-muted-foreground">Commission</span>
              </div>
            </div>
          </CardContent>
        </TabsContent>

        <TabsContent value="deals" className="mt-0">
          <CardContent className="p-0 overflow-auto custom-scrollbar flex-1 min-h-0">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/40">
                  {["Deal", "Plan", "Revenue", "Commission"].map((h) => (
                    <th key={h} className="p-3 text-left text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dealBreakdown.map((d) => (
                  <tr key={d.deal} className="border-t border-card-border hover:bg-muted/20 transition-colors">
                    <td className="p-3 text-[12px] font-medium text-foreground">{d.deal}</td>
                    <td className="p-3">
                      <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">{d.plan}</span>
                    </td>
                    <td className="p-3 text-[12px] tabular-nums text-foreground">{fmtCurrency(d.revenue)}</td>
                    <td className="p-3 text-[12px] tabular-nums font-semibold text-primary">{fmtCurrency(d.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
