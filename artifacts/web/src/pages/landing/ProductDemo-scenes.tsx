import { DollarSign, Users, Briefcase, Wallet, TrendingUp, Upload, CheckCircle2, BarChart3, Calendar } from "lucide-react";
import { RevenueTrendChart } from "@/components/revenue-trend-chart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// ── Types ──

export interface CursorStep {
  x: number;
  y: number;
  action: "move" | "click" | "hover";
  delay: number;
}

export interface SceneData {
  id: string;
  title: string;
  badge?: string;
  steps: CursorStep[];
  component: React.ReactNode;
}

// ── Shared helpers ──

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(n);
}

function StatTile({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 flex flex-col justify-center ${accent ? "border-primary/20 bg-primary/5" : "border-card-border bg-card"}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`size-3 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
      </div>
      <div className={`text-base font-bold tracking-tight tabular-nums ${accent ? "text-primary" : "text-foreground"}`}>
        {value}
      </div>
    </div>
  );
}

// ── Demo Data ──

const TREND_DATA = [
  { period: "2025-01", revenue: 42000, commission: 3780 },
  { period: "2025-02", revenue: 38000, commission: 3420 },
  { period: "2025-03", revenue: 52000, commission: 4940 },
  { period: "2025-04", revenue: 61000, commission: 6235 },
  { period: "2025-05", revenue: 47500, commission: 4275 },
  { period: "2025-06", revenue: 68000, commission: 7820 },
];

const DEALS = [
  { deal: "Acme Corp Q2", rep: "Sarah Davis", amount: 28000, commission: 2240, status: "Won" },
  { deal: "Globex Expansion", rep: "Mike Chen", amount: 18500, commission: 1480, status: "Won" },
  { deal: "Initech Platform", rep: "Sarah Davis", amount: 12500, commission: 750, status: "Pending" },
  { deal: "Umbrella Corp", rep: "Alex Kim", amount: 9000, commission: 450, status: "Won" },
  { deal: "Stark Industries", rep: "Mike Chen", amount: 34000, commission: 2720, status: "Won" },
];

const RUN_RESULTS = [
  { rep: "Sarah Davis", deals: 14, revenue: 85000, commission: 7650 },
  { rep: "Mike Chen", deals: 11, revenue: 62000, commission: 5580 },
  { rep: "Alex Kim", deals: 9, revenue: 41000, commission: 3690 },
  { rep: "Jordan Lee", deals: 7, revenue: 28000, commission: 2520 },
];

const REP_EARNINGS = [
  { month: "Jan", earnings: 3780 },
  { month: "Feb", earnings: 3420 },
  { month: "Mar", earnings: 4940 },
  { month: "Apr", earnings: 6235 },
  { month: "May", earnings: 4275 },
  { month: "Jun", earnings: 7820 },
];

// ── Scene Components ──

function Scene1Dashboard() {
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Dashboard Overview</h3>
          <p className="text-[9px] text-muted-foreground">June 2026</p>
        </div>
        <Badge variant="outline" className="text-[9px] h-5 px-2 gap-1 font-normal">
          <Calendar className="size-2.5" />
          This month
        </Badge>
      </div>

      {/* Stat tiles — 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 flex-1">
        <StatTile icon={Users} label="Active Reps" value="12" />
        <StatTile icon={DollarSign} label="Commission" value="$47,250" accent />
        <StatTile icon={Briefcase} label="Deals Closed" value="48" />
        <StatTile icon={Wallet} label="Pending Payouts" value="$12,800" />
      </div>

      {/* Chart card */}
      <div className="rounded-lg border border-card-border bg-card p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <BarChart3 className="size-3 text-primary" />
          <span className="text-[10px] font-semibold text-foreground">Revenue Trend</span>
        </div>
        <div className="h-[60px]">
          <RevenueTrendChart data={TREND_DATA} currency="USD" />
        </div>
      </div>
    </div>
  );
}

function Scene2Deals() {
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">All Deals</h3>
          <p className="text-[9px] text-muted-foreground">5 deals · $102,000 total</p>
        </div>
        <Button size="sm" className="h-6 text-[9px] px-2.5 gap-1.5 rounded-md">
          <Upload className="size-2.5" />
          Import CSV
        </Button>
      </div>

      {/* Table — fills remaining space */}
      <div className="rounded-lg border border-card-border overflow-hidden flex-1">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Deal</th>
              <th className="text-left px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Rep</th>
              <th className="text-right px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-right px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Comm.</th>
              <th className="text-center px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {DEALS.map((d) => (
              <tr key={d.deal} className="border-t border-card-border/60 hover:bg-muted/20">
                <td className="px-2.5 py-2 font-medium text-foreground">{d.deal}</td>
                <td className="px-2.5 py-2 text-muted-foreground">{d.rep}</td>
                <td className="px-2.5 py-2 text-right tabular-nums text-foreground">{fmt(d.amount)}</td>
                <td className="px-2.5 py-2 text-right tabular-nums font-semibold text-primary">{fmt(d.commission)}</td>
                <td className="px-2.5 py-2 text-center">
                  <Badge variant={d.status === "Won" ? "default" : "secondary"} className="text-[8px] px-1.5 py-0 leading-normal">
                    {d.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Scene3Run() {
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Title bar */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold text-foreground">Commission Run</h3>
          <p className="text-[9px] text-muted-foreground">June 2026</p>
        </div>
      </div>

      {/* Results table */}
      <div className="rounded-lg border border-card-border overflow-hidden flex-1">
        <table className="w-full text-[9px]">
          <thead>
            <tr className="bg-muted/30">
              <th className="text-left px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Rep</th>
              <th className="text-center px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Deals</th>
              <th className="text-right px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Revenue</th>
              <th className="text-right px-2.5 py-2 font-semibold text-muted-foreground uppercase tracking-wider">Commission</th>
            </tr>
          </thead>
          <tbody>
            {RUN_RESULTS.map((r) => (
              <tr key={r.rep} className="border-t border-card-border/60 hover:bg-muted/20">
                <td className="px-2.5 py-2.5 font-medium text-foreground">{r.rep}</td>
                <td className="px-2.5 py-2.5 text-center tabular-nums text-muted-foreground">{r.deals}</td>
                <td className="px-2.5 py-2.5 text-right tabular-nums text-foreground">{fmt(r.revenue)}</td>
                <td className="px-2.5 py-2.5 text-right tabular-nums font-semibold text-primary">{fmt(r.commission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/10">
        <CheckCircle2 className="size-3 text-primary shrink-0" />
        <span className="text-[9px] text-muted-foreground">Total:</span>
        <span className="text-[11px] font-bold text-primary tabular-nums">$19,440</span>
        <span className="text-[8px] text-muted-foreground ml-auto">4 reps · 41 deals</span>
      </div>
    </div>
  );
}

function Scene4Portal() {
  return (
    <div className="flex flex-col h-full gap-3">
      {/* Rep profile header */}
      <div className="flex items-center gap-2.5 pb-2 border-b border-card-border">
        <div className="size-7 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground shrink-0">SD</div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground">Sarah Davis</p>
          <p className="text-[8px] text-muted-foreground">Senior AE</p>
        </div>
        <Badge className="text-[8px] px-1.5 py-0 h-4">June 2026</Badge>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-3 gap-2">
        <StatTile icon={DollarSign} label="YTD Earnings" value="$30,470" accent />
        <StatTile icon={Briefcase} label="Deals Closed" value="14" />
        <StatTile icon={TrendingUp} label="Avg Commission" value="$2,176" />
      </div>

      {/* Earnings chart */}
      <div className="rounded-lg border border-card-border bg-card p-3 flex-1 flex flex-col">
        <div className="text-[10px] font-semibold text-foreground mb-2">Monthly Earnings</div>
        <div className="flex items-end gap-1.5 flex-1">
          {REP_EARNINGS.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1 justify-end h-full">
              <div
                className="w-full rounded-sm bg-primary/70 min-h-[4px] transition-all"
                style={{ height: `${(m.earnings / 8000) * 100}%`, maxHeight: "100%" }}
              />
              <span className="text-[7px] text-muted-foreground leading-none">{m.month}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Scene Definitions ──

// Cursor coordinates are relative to the FULL frame (aspect 16:10).
// Frame has 16px padding on all sides, so usable area is roughly 16px–(W-16) horizontally, 16px–(H-16) vertically.
// The container is responsive, so we use proportional coordinates.
// For a ~600x375 frame at 16:10: usable area ~568x343.

export const SCENES: SceneData[] = [
  {
    id: "dashboard",
    title: "Dashboard Overview",
    badge: "June 2026",
    steps: [
      { x: 300, y: 140, action: "move", delay: 1200 },
      { x: 300, y: 140, action: "hover", delay: 1800 },
      { x: 300, y: 250, action: "move", delay: 600 },
      { x: 300, y: 250, action: "hover", delay: 2000 },
    ],
    component: <Scene1Dashboard />,
  },
  {
    id: "deals",
    title: "All Deals",
    badge: "5 deals",
    steps: [
      { x: 280, y: 100, action: "move", delay: 800 },
      { x: 280, y: 180, action: "move", delay: 1000 },
      { x: 280, y: 260, action: "move", delay: 1000 },
      { x: 460, y: 56, action: "move", delay: 600 },
      { x: 460, y: 56, action: "hover", delay: 600 },
      { x: 460, y: 56, action: "click", delay: 500 },
      { x: 250, y: 140, action: "move", delay: 1200 },
      { x: 250, y: 140, action: "hover", delay: 1500 },
    ],
    component: <Scene2Deals />,
  },
  {
    id: "run",
    title: "Commission Run",
    badge: "June 2026",
    steps: [
      { x: 280, y: 160, action: "move", delay: 800 },
      { x: 280, y: 230, action: "move", delay: 1200 },
      { x: 280, y: 300, action: "move", delay: 1200 },
      { x: 250, y: 340, action: "move", delay: 600 },
      { x: 250, y: 340, action: "hover", delay: 1800 },
    ],
    component: <Scene3Run />,
  },
  {
    id: "portal",
    title: "Sarah Davis",
    badge: "Rep Portal",
    steps: [
      { x: 300, y: 100, action: "move", delay: 800 },
      { x: 300, y: 100, action: "hover", delay: 1200 },
      { x: 300, y: 200, action: "move", delay: 800 },
      { x: 300, y: 200, action: "hover", delay: 1400 },
      { x: 200, y: 300, action: "move", delay: 800 },
      { x: 200, y: 300, action: "hover", delay: 1600 },
      { x: 500, y: 320, action: "move", delay: 600 },
    ],
    component: <Scene4Portal />,
  },
];
