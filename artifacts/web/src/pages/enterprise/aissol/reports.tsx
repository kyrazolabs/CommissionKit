import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, AreaChart, Area } from "recharts";
import { DollarSign, TrendingUp, Briefcase, Percent, FileText, Layers, FolderKanban, Users, PieChart as PieIcon, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const COLORS = ["#0D9488", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1", "#84CC16"];

const ChartTooltip = ({ active, payload, label, currency }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-lg text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <div className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium">{entry.name === "Projects" ? entry.value : formatCurrency(entry.value, currency)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export function AissolReportsPage() {
  usePageMeta({ title: "Reports", description: "Enterprise commission reports", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const currency = activeWorkspace?.currency || "SAR";

  const { data: reports, isLoading } = useQuery({
    queryKey: ["aissol-reports", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/enterprise/reports`),
    enabled: !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
    staleTime: 0,
  });

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (!hasPermission("analytics", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <PieIcon className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view reports.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  const exec = reports?.executiveSummary;
  const projects = reports?.projectBreakdown ?? [];
  const reps = reports?.repBreakdown ?? [];
  const trends = reports?.monthlyTrends ?? [];

  if (!exec) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <FileText className="size-10 text-muted-foreground/40" />
        <h3 className="text-lg font-medium">No report data</h3>
        <p className="text-sm text-muted-foreground">Run commission calculations to generate report data.</p>
      </div>
    );
  }

  const projectPieData = projects.slice(0, 6).map((p: any) => ({ name: p.name, value: p.commission }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">Enterprise</p>
        <h1 className="text-[28px] font-semibold tracking-tight">Executive Reports</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Projects, commissions, and performance insights.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Projects", value: exec.totalProjects, icon: FolderKanban, tip: "Number of projects in this workspace.", tag: exec.totalProjects > 0 ? `${exec.totalProjects} tracked` : "No data" },
          { label: "Total Value", value: formatCurrency(exec.totalValue, currency), icon: DollarSign, tip: "Sum of all project values.", tag: currency },
          { label: "Total Commissions", value: formatCurrency(exec.totalCommission, currency), icon: TrendingUp, tip: "Total commission earned across all invoices.", tag: `${exec.commissionRatio}% of value` },
          { label: "Invoices Tracked", value: exec.totalInvoices, icon: FileText, tip: "Total invoices across all projects.", tag: exec.totalProjects > 0 ? `${(exec.totalInvoices / exec.totalProjects).toFixed(1)} per project` : "—" },
          { label: "Overall GM", value: `${exec.gmOverall}%`, icon: Percent, tip: "Average gross margin = (Value − Cost) / Value × 100.", tag: "Weighted average" },
          { label: "Avg Project", value: formatCurrency(exec.avgProjectSize, currency), icon: Briefcase, tip: "Average project value.", tag: "Mean value" },
          { label: "Commission Rate", value: `${exec.commissionRatio}%`, icon: Layers, tip: "Total commission as percentage of total project value.", tag: "Effective rate" },
          { label: "Active Reps", value: reps.length, icon: Users, tip: "Reps with commission activity.", tag: reps.length > 0 ? "Earning" : "No activity" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-card-border rounded-2xl px-[22px] py-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-muted-foreground">{stat.label}</span>
                <Tooltip><TooltipTrigger asChild><div className="cursor-help"><Info className="size-3 text-muted-foreground/50" /></div></TooltipTrigger><TooltipContent side="top"><p className="text-xs">{stat.tip}</p></TooltipContent></Tooltip>
              </div>
              <div className="flex size-7 items-center justify-center rounded-[10px] bg-secondary">
                <stat.icon className="size-3.5 text-primary" />
              </div>
            </div>
            <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none">{stat.value}</div>
            <p className="text-[11px] text-muted-foreground mt-1.5">{stat.tag}</p>
          </div>
        ))}
      </div>

      {/* Trends */}
      {trends.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl p-[22px]" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="mb-6">
            <h3 className="text-[14.5px] font-semibold text-foreground">Monthly Trends</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Project value and commission over time</p>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer>
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="enterpriseValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} /></linearGradient>
                  <linearGradient id="enterpriseComm" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={COLORS[3]} stopOpacity={0.3} /><stop offset="95%" stopColor={COLORS[3]} stopOpacity={0} /></linearGradient>
                </defs>
                <XAxis dataKey="period" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                <RechartsTooltip content={<ChartTooltip currency={currency} />} />
                <Area type="monotone" dataKey="value" name="Value" stroke={COLORS[0]} strokeWidth={2} fill="url(#enterpriseValue)" />
                <Area type="monotone" dataKey="commission" name="Commission" stroke={COLORS[3]} strokeWidth={2} fill="url(#enterpriseComm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Two columns: Projects table + Rep chart */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Commission by Rep */}
        {reps.length > 0 && (
          <div className="bg-card border border-card-border rounded-2xl p-[22px]" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="mb-6">
              <h3 className="text-[14.5px] font-semibold text-foreground">Commission by Rep</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Total commission earned per sales rep</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <BarChart data={reps.slice(0, 8)} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" opacity={0.5} />
                  <XAxis type="number" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} width={70} />
                <RechartsTooltip content={<ChartTooltip currency={currency} />} />
                  <Bar dataKey="commission" name="Commission" fill={COLORS[0]} radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Project Breakdown Pie */}
        {projectPieData.length > 0 && (
          <div className="bg-card border border-card-border rounded-2xl p-[22px]" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="mb-6">
              <h3 className="text-[14.5px] font-semibold text-foreground">Commission by Project</h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">Top projects by commission earned</p>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={projectPieData} cx="50%" cy="45%" innerRadius={55} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                    {projectPieData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <RechartsTooltip formatter={(v: number) => formatCurrency(v, currency)} />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Projects Table */}
      {projects.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-[22px] py-[18px] border-b border-border">
            <h3 className="text-[14.5px] font-semibold text-foreground">Project Performance</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">All projects with value, cost, GM%, and commission</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/60">
                  {["Project", "Value", "Cost", "GM%", "Commission", "Invoices", "Period"].map(h => (
                    <th key={h} className="px-[22px] py-3 text-left text-[11.5px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map((p: any, i: number) => (
                  <tr key={i} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-[22px] py-3.5 text-[13px] font-semibold text-foreground">{p.name}</td>
                    <td className="px-[22px] py-3.5 text-[13px] font-medium">{formatCurrency(p.value, p.currency)}</td>
                    <td className="px-[22px] py-3.5 text-[13px] text-muted-foreground">{formatCurrency(p.cost, p.currency)}</td>
                    <td className="px-[22px] py-3.5 text-[13px] font-medium text-emerald-600">{p.gm}%</td>
                    <td className="px-[22px] py-3.5 text-[13px] font-medium text-primary">{p.commission > 0 ? formatCurrency(p.commission, p.currency) : "—"}</td>
                    <td className="px-[22px] py-3.5 text-[13px] text-muted-foreground">{p.invoices}</td>
                    <td className="px-[22px] py-3.5 text-[13px] text-muted-foreground">{p.period}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
