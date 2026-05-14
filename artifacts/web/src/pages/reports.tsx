import { useState } from "react";
import { useGetReports, getGetReportsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Download, Calendar as CalendarIcon, TrendingUp, DollarSign, Target, PieChart as PieIcon } from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatCurrency, formatNumber } from "@/lib/format";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const COLORS = ['#0D9488', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export function ReportsPage() {
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "USD";
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [interval, setInterval] = useState<"day" | "month">("day");

  const queryParams = {
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    interval
  };

  const { data: reportData, isLoading } = useGetReports(
    queryParams,
    { query: { queryKey: [...getGetReportsQueryKey(queryParams)] } }
  );

  const handleExportPdf = () => {
    window.print();
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover text-popover-foreground border border-border p-3 rounded-lg shadow-lg text-sm">
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="font-medium">
                {entry.name === 'Deals' ? entry.value : formatCurrency(entry.value, currency)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const exec = reportData?.executiveSummary;

  return (
    <>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report, #printable-report * {
            visibility: visible;
          }
          #printable-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100vw;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .print-hide {
            display: none !important;
          }
          /* Ensure charts render nicely */
          .recharts-responsive-container {
            width: 100% !important;
          }
          /* Strip dark mode styles on print */
          .bg-card { background: white !important; border-color: #e5e7eb !important; box-shadow: none !important; }
          .text-foreground { color: black !important; }
          .text-muted-foreground { color: #4b5563 !important; }
          .border-card-border { border-color: #e5e7eb !important; }
          .border-border { border-color: #e5e7eb !important; }
        }
      `}</style>
      
      <div className="space-y-7" id="printable-report">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <p className="text-[12px] font-semibold text-primary mb-1">Analytics</p>
            <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">Executive Report</h1>
            <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
              Data-driven insights for compensation and revenue decisions.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 print-hide">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm">
               <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"ghost"}
                    className={cn(
                      "w-[260px] justify-start text-left font-normal text-[13px] h-8",
                      !dateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} -{" "}
                          {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              <div className="w-px h-5 bg-border mx-1" />

              <Select value={interval} onValueChange={(v: "day" | "month") => setInterval(v)}>
                <SelectTrigger className="w-[110px] h-8 border-none bg-transparent shadow-none text-[13px] focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button size="sm" onClick={handleExportPdf} disabled={isLoading || !reportData} className="h-10 px-4 shadow-sm">
              <Download className="mr-2 h-[15px] w-[15px]" />
              <span className="text-[13px]">Print Report</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-32 col-span-1 rounded-2xl" />
            <Skeleton className="h-32 col-span-1 rounded-2xl" />
            <Skeleton className="h-32 col-span-1 rounded-2xl" />
            <Skeleton className="h-32 col-span-1 rounded-2xl" />
            <Skeleton className="h-[400px] col-span-2 lg:col-span-4 rounded-2xl" />
            <Skeleton className="h-[300px] col-span-2 lg:col-span-4 rounded-2xl" />
          </div>
        ) : !reportData || !exec ? (
          <div className="bg-card border border-card-border rounded-2xl flex flex-col items-center justify-center p-16 text-center" style={{ boxShadow: "var(--shadow-card)" }}>
            <FileText className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold text-foreground">No data available</h3>
            <p className="text-sm text-muted-foreground mt-1">There is no report data for the selected date range.</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              <div className="bg-card border border-card-border rounded-2xl px-[22px] py-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[12px] font-medium text-muted-foreground">Pipeline Revenue</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-secondary"><TrendingUp className="h-3.5 w-3.5 text-primary" /></div>
                </div>
                <div className="text-[26px] font-bold tracking-tight text-foreground leading-none">{formatCurrency(exec.totalRevenue, currency)}</div>
              </div>
              <div className="bg-card border border-card-border rounded-2xl px-[22px] py-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[12px] font-medium text-muted-foreground">Commissions Paid</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-secondary"><DollarSign className="h-3.5 w-3.5 text-primary" /></div>
                </div>
                <div className="text-[26px] font-bold tracking-tight text-foreground leading-none">{formatCurrency(exec.totalCommission, currency)}</div>
              </div>
              <div className="bg-card border border-card-border rounded-2xl px-[22px] py-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[12px] font-medium text-muted-foreground">Effective Win Rate</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-secondary"><Target className="h-3.5 w-3.5 text-primary" /></div>
                </div>
                <div className="text-[26px] font-bold tracking-tight text-foreground leading-none">{exec.winRate.toFixed(1)}%</div>
              </div>
              <div className="bg-card border border-card-border rounded-2xl px-[22px] py-5" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="text-[12px] font-medium text-muted-foreground">Avg Deal Size</span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-[10px] bg-secondary"><PieIcon className="h-3.5 w-3.5 text-primary" /></div>
                </div>
                <div className="text-[26px] font-bold tracking-tight text-foreground leading-none">{formatCurrency(exec.avgDealSize, currency)}</div>
              </div>
            </div>

            {/* Trends Chart */}
            <div className="bg-card border border-card-border rounded-2xl p-[22px]" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mb-6">
                <h3 className="text-[14.5px] font-bold text-foreground">Revenue & Margin Trends</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">Tracking pipeline impact against commission cost</p>
              </div>
              
              <div className="h-[380px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.monthlyTrends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS[1]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS[1]} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="period" 
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(val) => {
                        if (interval === "month") return format(new Date(val + "-01"), "MMM yyyy");
                        return format(new Date(val), "MMM d");
                      }}
                    />
                    <YAxis 
                      yAxisId="left"
                      stroke="#888888" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} 
                    />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.5} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="revenue" 
                      name="Revenue" 
                      stroke={COLORS[0]} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorRevenue)" 
                    />
                    <Area 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="commission" 
                      name="Commission" 
                      stroke={COLORS[1]} 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorCommission)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Top Performers Table */}
              <div className="col-span-2 bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="px-[22px] py-[18px] border-b border-border">
                  <h3 className="text-[14.5px] font-bold text-foreground">Rep Performance Matrix</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Decision metrics for sales leadership</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-muted/60">
                        {["Representative", "Deals Won", "Win Rate", "Revenue Driven", "Commissions Paid", "Effective Rate"].map((h) => (
                          <th key={h} className="px-[22px] py-3 text-left text-[11.5px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.topPerformers.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-sm text-muted-foreground">No rep data available for this period.</td></tr>
                      ) : reportData.topPerformers.map((rep, i) => {
                        const effRate = rep.revenue > 0 ? (rep.commission / rep.revenue) * 100 : 0;
                        return (
                          <tr key={rep.name} className="border-t border-border hover:bg-muted/30 transition-colors">
                            <td className="px-[22px] py-3.5 text-[13.5px] font-semibold text-foreground flex items-center gap-2">
                              {i === 0 && <span className="text-[10px] font-bold text-primary bg-secondary rounded px-1 py-0.5 print-hide">#1</span>}
                              {rep.name}
                            </td>
                            <td className="px-[22px] py-3.5 text-[13px] font-medium text-foreground">{formatNumber(rep.dealsWon)}</td>
                            <td className="px-[22px] py-3.5 text-[13px] font-medium text-foreground">{rep.winRate.toFixed(1)}%</td>
                            <td className="px-[22px] py-3.5 text-[13px] font-medium text-foreground">{formatCurrency(rep.revenue, currency)}</td>
                            <td className="px-[22px] py-3.5 text-[13px] font-medium text-foreground">{formatCurrency(rep.commission, currency)}</td>
                            <td className="px-[22px] py-3.5 text-[13px] font-medium text-muted-foreground">{effRate.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Deal Stages Pie */}
              <div className="col-span-2 lg:col-span-1 bg-card border border-card-border rounded-2xl p-[22px]" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="mb-6">
                  <h3 className="text-[14.5px] font-bold text-foreground">Pipeline Health</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">Overall distribution of deal outcomes</p>
                </div>
                <div className="h-[300px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.dealStages}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {reportData.dealStages.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            
          </div>
        )}
      </div>
    </>
  );
}
