import {
  AlertOctagon,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Key,
  Layers,
  Link2,
  Lock,
  MessageSquareOff,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RepAvatar } from "@/components/rep-avatar";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { usePageMeta } from "@/hooks/use-page-meta";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Footer } from "@/pages/landing/Footer";
import { Navbar } from "@/pages/landing/Navbar";

// ─── Sample Data ─────────────────────────────────────────────────────────────

const SAMPLE_SUMMARY = {
  repId: "rep_demo_001",
  repName: "Sarah Chen",
  email: "sarah.chen@acme.com",
  workspaceName: "Acme Corp",
  planName: "Enterprise Accelerator",
  period: "2026-07",
  totalCommission: 12_450,
  totalRevenue: 415_000,
  totalDeals: 8,
  dealBreakdown: [
    {
      dealId: "d1",
      dealName: "Enterprise Suite Renewal",
      dealAmount: 120_000,
      closeDate: "2026-07-08",
      rateApplied: 0.05,
      commissionAmount: 6_000,
      currency: "USD",
    },
    {
      dealId: "d2",
      dealName: "Pro Plan Expansion",
      dealAmount: 85_000,
      closeDate: "2026-07-15",
      rateApplied: 0.04,
      commissionAmount: 3_400,
      currency: "USD",
    },
    {
      dealId: "d3",
      dealName: "Starter Onboarding",
      dealAmount: 36_000,
      closeDate: "2026-07-22",
      rateApplied: 0.03,
      commissionAmount: 1_080,
      currency: "USD",
    },
    {
      dealId: "d4",
      dealName: "Mid-Market Upsell",
      dealAmount: 74_000,
      closeDate: "2026-07-28",
      rateApplied: 0.045,
      commissionAmount: 1_970,
      currency: "USD",
    },
    {
      dealId: "d5",
      dealName: "SMB Add-on",
      dealAmount: 24_000,
      closeDate: "2026-07-30",
      rateApplied: 0.03,
      commissionAmount: 720,
      currency: "USD",
    },
    {
      dealId: "d6",
      dealName: "Support Extension",
      dealAmount: 48_000,
      closeDate: "2026-07-18",
      rateApplied: 0.04,
      commissionAmount: 1_920,
      currency: "USD",
    },
    {
      dealId: "d7",
      dealName: "Security Module",
      dealAmount: 18_000,
      closeDate: "2026-07-05",
      rateApplied: 0.03,
      commissionAmount: 540,
      currency: "USD",
    },
    {
      dealId: "d8",
      dealName: "Analytics Bundle",
      dealAmount: 10_000,
      closeDate: "2026-07-12",
      rateApplied: 0.02,
      commissionAmount: 200,
      currency: "USD",
    },
  ] satisfies Array<{
    dealId: string;
    dealName: string;
    dealAmount: number;
    closeDate: string;
    rateApplied: number;
    commissionAmount: number;
    currency: string;
  }>,
  monthlyHistory: [
    { period: "2026-02", totalCommission: 4_200 },
    { period: "2026-03", totalCommission: 6_800 },
    { period: "2026-04", totalCommission: 5_100 },
    { period: "2026-05", totalCommission: 9_400 },
    { period: "2026-06", totalCommission: 11_200 },
    { period: "2026-07", totalCommission: 12_450 },
  ],
  currency: "USD",
};

const SAMPLE_PAYOUTS = [
  {
    id: "p1",
    period: "2026-07",
    commissionAmount: 12_450,
    adjustments: 0,
    finalAmount: 12_450,
    status: "paid",
    paymentDate: "2026-08-15",
    currency: "USD",
  },
  {
    id: "p2",
    period: "2026-06",
    commissionAmount: 11_200,
    adjustments: -250,
    finalAmount: 10_950,
    status: "paid",
    paymentDate: "2026-07-15",
    currency: "USD",
  },
  {
    id: "p3",
    period: "2026-05",
    commissionAmount: 9_400,
    adjustments: 0,
    finalAmount: 9_400,
    status: "paid",
    paymentDate: "2026-06-15",
    currency: "USD",
  },
  {
    id: "p4",
    period: "2026-04",
    commissionAmount: 5_100,
    adjustments: 0,
    finalAmount: 5_100,
    status: "paid",
    paymentDate: "2026-05-15",
    currency: "USD",
  },
];

// ─── Demo Dashboard ─────────────────────────────────────────────────────────────

function DemoDashboard() {
  const [period, setPeriod] = useState("2026-07");

  const last6Months = (() => {
    const months: Array<{ period: string; totalCommission: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(2026, 7 - i, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = SAMPLE_SUMMARY.monthlyHistory.find((m) => m.period === periodStr);
      months.push(existing ?? { period: periodStr, totalCommission: 0 });
    }
    return months;
  })();

  const payouts = SAMPLE_PAYOUTS;

  const PAYOUT_STATUS_CLASSES: Record<string, string> = {
    paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    approved: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    disputed: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  return (
    <div className="space-y-6">
      {/* Rep header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex items-center gap-3">
          <RepAvatar name="Sarah Chen" size={48} className="rounded-full shrink-0" />
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{SAMPLE_SUMMARY.repName}</h2>
            <p className="text-sm text-muted-foreground">{SAMPLE_SUMMARY.email}</p>
          </div>
        </div>
        <Badge
          variant="outline"
          className="self-start sm:self-auto border-primary/30 text-primary font-medium"
        >
          {SAMPLE_SUMMARY.planName}
        </Badge>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <StatCard
          label="Estimated Commission"
          value={formatCurrency(SAMPLE_SUMMARY.totalCommission, SAMPLE_SUMMARY.currency)}
          icon={CreditCard}
          tooltip="Commission earned this period"
          trendLabel="July 2026"
        />
        <StatCard
          label="Revenue Closed"
          value={formatCurrency(SAMPLE_SUMMARY.totalRevenue, SAMPLE_SUMMARY.currency)}
          icon={BarChart3}
          tooltip="Total deal value this period"
        />
        <StatCard
          label="Deals Won"
          value={String(SAMPLE_SUMMARY.totalDeals)}
          icon={Layers}
          tooltip="Number of closed-won deals this period"
        />
      </div>

      {/* Earnings history */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 text-primary" />
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
              Earnings History
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">Commission earned over the last 6 months</p>
        </div>
        <CardContent className="pt-4">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last6Months} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="portalCommissionShadow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(val) => {
                    const [y, m] = val.split("-");
                    return new Date(+y, +m - 1, 1).toLocaleString("en", { month: "short" });
                  }}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(v: number) => [
                    formatCurrency(v, SAMPLE_SUMMARY.currency),
                    "Commission",
                  ]}
                  labelFormatter={(l) => {
                    const [y, m] = (l as string).split("-");
                    const d = new Date(+y, +m - 1, 1);
                    return `${d.toLocaleString("en", { month: "long" })} ${y}`;
                  }}
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    fontSize: 13,
                  }}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                <Line
                  type="monotone"
                  dataKey="totalCommission"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Deal breakdown */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <Layers className="size-4 text-primary" />
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
              Deal Breakdown
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">Per-deal commission for July 2026</p>
        </div>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Deal</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Commission</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {SAMPLE_SUMMARY.dealBreakdown.map((deal) => (
                <TableRow key={deal.dealId}>
                  <TableCell>
                    <span className="font-medium text-sm">{deal.dealName}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(deal.dealAmount, deal.currency)}
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatPercent(deal.rateApplied)}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold text-primary tabular-nums">
                    {formatCurrency(deal.commissionAmount, deal.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Payout history */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="px-5 pt-5 pb-0">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="size-4 text-primary" />
            <h3 className="text-[15px] font-semibold leading-snug tracking-tight">
              Payout History
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">Recent commission payouts</p>
        </div>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Adjustments</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Paid On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="text-sm text-muted-foreground">{p.period}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    {formatCurrency(p.commissionAmount, p.currency)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm tabular-nums",
                      p.adjustments < 0
                        ? "text-destructive"
                        : p.adjustments > 0
                          ? "text-green-600"
                          : "text-muted-foreground",
                    )}
                  >
                    {p.adjustments !== 0
                      ? `${p.adjustments > 0 ? "+" : ""}${formatCurrency(p.adjustments, p.currency)}`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">
                    {formatCurrency(p.finalAmount, p.currency)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        PAYOUT_STATUS_CLASSES[p.status] ?? PAYOUT_STATUS_CLASSES.pending,
                      )}
                    >
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.paymentDate ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left py-6 flex items-center justify-between gap-4 focus:outline-none"
      >
        <span className="text-base font-semibold text-foreground leading-snug">{question}</span>
        <ChevronDown
          className={`size-5 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? 300 : 0, opacity: open ? 1 : 0 }}
      >
        <p className="text-sm text-muted-foreground leading-relaxed pb-6">{answer}</p>
      </div>
    </div>
  );
}

// ─── How It Works Step ────────────────────────────────────────────────────────

function HowStep({
  number,
  icon: Icon,
  title,
  description,
}: {
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="p-8 lg:p-10 bg-card relative overflow-hidden">
      <div className="absolute top-4 right-6 text-[72px] font-black text-primary/10 tabular-nums leading-none select-none pointer-events-none">
        {String(number).padStart(2, "0")}
      </div>
      <div className="flex items-center gap-3 mb-3 relative">
        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
          <Icon className="size-4 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground tracking-tight">{title}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed relative">{description}</p>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-5 space-y-2">
      <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="size-5" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function RepPortalLanding() {
  usePageMeta({
    title: "Sales Rep Portal — CommissionKit",
    description:
      "Give every salesperson a login-free dashboard showing their commission earnings, deal-by-deal breakdowns, and payout history. They check it themselves.",
    keywords:
      "sales commission portal, rep commission dashboard, commission transparency software, sales rep portal software, commission tracking with rep portal, self-service commission portal, reduce commission disputes, commission management software with rep portal, real-time commission visibility, sales rep commission tracking, how to give reps commission visibility, commission dispute resolution, self-serve commission dashboard for sales reps, commission software with dispute management, sales rep portal with access code login",
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Helmet>
        <title>Sales Rep Portal — CommissionKit</title>
        <meta
          name="description"
          content="Give every salesperson a login-free dashboard showing their commission earnings, deal-by-deal breakdowns, and payout history. They check it themselves. Your finance team stops answering the same question 40 times a month."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://commissionkit.co/portal" />
      </Helmet>

      <Navbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 sm:pt-32 sm:pb-24">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[0.95]">
              Your reps shouldn't need to ask what they earned.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              The Rep Portal gives every salesperson a login-free dashboard showing their commission
              earnings, deal-by-deal breakdowns, and payout history. They check it themselves. Your
              finance team stops answering the same question 40 times a month.
            </p>
            <div className="flex flex-row gap-3 justify-center">
              <a href="/register">
                <Button className="font-semibold">
                  Start Free Trial
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </a>
              <a href="/pricing">
                <Button variant="outline" className="font-medium">
                  See pricing
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* ── Live Demo ────────────────────────────────────────────────── */}
        <section className="bg-muted/30 border-y border-card-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center mb-10">
              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-4">
                Live demo
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-3">
                See it in action
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto text-sm">
                This is what your team sees. Real data, real-time. No login required.
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-card overflow-hidden">
              {/* Demo browser chrome */}
              <div className="flex items-center gap-1.5 px-4 py-3 border-b border-card-border bg-muted/40">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-amber-400" />
                <div className="size-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-3 h-6 rounded bg-background border border-border text-xs text-muted-foreground flex items-center px-3">
                  commissionkit.co/portal/demo
                </div>
              </div>
              {/* Demo content */}
              <div className="p-4 md:p-6 bg-sidebar overflow-y-auto aspect-9/16 md:aspect-video">
                <DemoDashboard />
              </div>
            </div>
          </div>
        </section>

        {/* ── Feature Grid ──────────────────────────────────────────────── */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-bold tracking-widest uppercase text-primary mb-4">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight mb-3">
              Everything a rep needs to know
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto text-sm">
              One place for earnings, deal breakdowns, and payout history.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon={Zap}
              title="Real-time earnings"
              description="See earnings as deals close. Commissions update automatically after each calculation run."
            />
            <FeatureCard
              icon={Key}
              title="No corporate login"
              description="Access via unique code, not IT. No SSO setup, no IT tickets."
            />
            <FeatureCard
              icon={FileText}
              title="Deal breakdowns"
              description="Every deal, itemized. Reps see exactly which deals generated commission, what plan applied, the deal amount, and the calculated payout."
            />
            <FeatureCard
              icon={Wallet}
              title="Payout history"
              description="Full payout timeline. Every approved and paid payout, with dates and amounts. Finance doesn't need to dig through accounting software."
            />
            <FeatureCard
              icon={AlertOctagon}
              title="Dispute submission"
              description="Dispute a commission, in the tool. If a rep thinks a deal was miscalculated, they submit a dispute right from the portal."
            />
            <FeatureCard
              icon={TrendingUp}
              title="Monthly trends"
              description="Earnings over time. A bar chart showing monthly revenue and commission side by side. Reps see their trajectory."
            />
          </div>
        </section>

        {/* ── Pain-Point Section ─────────────────────────────────────────── */}
        <section className="bg-card border-y border-card-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="max-w-2xl mx-auto text-center space-y-6">
              <div className="inline-flex size-14 rounded-xl bg-primary/10 text-primary items-center justify-center">
                <MessageSquareOff className="size-6" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                The question that eats your finance team's week
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You know the one. "Hey, what's my commission for this month?" It comes from reps
                over Slack, email, text, and in person. Sometimes the same rep asks twice in one
                week. Finance pulls up a spreadsheet, cross-references the deal list, checks the
                plan rules, and sends back a number. Then the rep asks about a specific deal. Then
                another rep asks the same thing. We built the Rep Portal because this cycle
                shouldn't exist. The data is already in CommissionKit. The calculation already
                happened. The only missing piece was giving reps a way to see it themselves. Now
                when a rep asks "what did I earn?", the answer is: log in and check.
              </p>
            </div>
          </div>
        </section>

        {/* ── How It Works ──────────────────────────────────────────────── */}
        <section className="bg-background py-24 px-6 border-b border-border/60">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-4">
                How it works
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[0.95] text-foreground tracking-tight font-display">
                How the Rep Portal works
              </h2>
              <p className="text-base text-muted-foreground mt-4 max-w-105 mx-auto leading-relaxed">
                Three steps to full transparency for your entire sales team.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60 border border-border/60 rounded-2xl overflow-hidden shadow-sm">
              <HowStep
                number={1}
                icon={Link2}
                title="Admin shares a secure link"
                description="Each rep gets a unique portal link. No CommissionKit login required for the rep — just an email and a password set on first access."
              />
              <HowStep
                number={2}
                icon={Eye}
                title="Reps see every deal and calculation"
                description="Every closed-won deal appears with the rate applied and the resulting commission. No black boxes."
              />
              <HowStep
                number={3}
                icon={Wallet}
                title="Payout history, always available"
                description="Reps can see their full payout history, any adjustments, and upcoming payments — any time, from any device."
              />
            </div>
          </div>
        </section>

        {/* ── Trust Section ─────────────────────────────────────────────── */}
        <section className="bg-card border-y border-card-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                Built for teams who ate commission accuracy seriously
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                CommissionKit is made by a small team that spent years watching sales organizations
                struggle with spreadsheet-based commission tracking. We built the Rep Portal because
                transparency isn't a nice-to-have. Reps who can see their earnings trust the
                numbers. Reps who trust the numbers spend less time questioning them and more time
                selling. Your data stays yours. Portal access is scoped to each rep's own records.
                Access codes can be regenerated or revoked at any time. All portal sessions use
                separate JWT authentication, isolated from your main workspace. We're self-funded,
                which means we answer to our users, not to investors asking us to ship faster than
                we should.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ────────────────────────────────────────────────────── */}
        <section className="bg-background py-24 px-6 border-b border-border/60">
          <div className="max-w-190 mx-auto">
            <div className="text-center mb-16">
              <p className="text-xs font-bold tracking-widest uppercase text-primary mb-4">FAQ</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-[0.95] text-foreground tracking-tight font-display">
                Questions we get asked a lot
              </h2>
            </div>
            <div className="border-y border-border/60 rounded-xl bg-card/40 px-6">
              <FAQItem
                question="Does a rep need a CommissionKit account to access the portal?"
                answer="No. Reps access the portal using a unique link and their own portal password. They have a completely separate login from your admin CommissionKit account."
              />
              <FAQItem
                question="Can reps see other reps' data?"
                answer="No. Each rep only sees their own deals, calculations, and payout history. Complete isolation."
              />
              <FAQItem
                question="When does the portal update?"
                answer="After a commission run is approved by an admin, the portal reflects the latest calculations immediately."
              />
              <FAQItem
                question="What happens if I disagree with a calculation?"
                answer="Reps can submit a dispute directly from the portal. Finance and admin get notified, can review the calculation, and respond — all inside CommissionKit."
              />
              <FAQItem
                question="Can the portal handle multi-currency commissions?"
                answer="Yes. If your plan includes deals in multiple currencies, the portal shows each deal's currency, the exchange rate used, and the converted commission in your workspace currency."
              />
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ────────────────────────────────────────────────── */}
        <section className="border-t border-card-border">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center space-y-6">
            <div className="space-y-3">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                Stop being your reps' commission calculator.
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
                Set up CommissionKit in under 30 minutes. Import your deals, configure your plans,
                run your first calculation. Then give every rep their access code and watch the
                "what's my commission?" messages stop. Free for 14 days. No credit card required.
              </p>
            </div>
            <div className="flex flex-row gap-3 justify-center">
              <a href="/register">
                <Button className="font-semibold">
                  Start Free Trial
                  <ArrowRight className="size-4 ml-2" />
                </Button>
              </a>
              <a href="/contact">
                <Button variant="outline" className="font-medium">
                  Talk to Sales
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              No credit card required · Set up in under 30 minutes · Cancel anytime
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
