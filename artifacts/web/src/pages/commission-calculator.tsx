import { useState, useEffect } from "react";
import { Navbar } from "@/pages/landing/Navbar";
import { Footer } from "@/pages/landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Calculator, ArrowRight, Percent, DollarSign, TrendingUp, BarChart3, Users, Shield, Trash2, Mail, LoaderCircle, X } from "lucide-react";
import { Analytics } from "@/lib/analytics";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

type PlanType = "flat" | "tiered" | "accelerator";

interface Tier {
  from: number;
  to: number | null;
  rate: number;
}

interface CalcResult {
  commission: number;
  effectiveRate: number;
  note: string;
  breakdown: string[];
}

function calculateCommission(
  amount: number,
  type: PlanType,
  flatRate: number,
  threshold: number,
  accelRate: number,
  tiers: { from: number; to: number | null; rate: number }[],
): CalcResult {
  const rateDecimal = flatRate / 100;
  const accelDecimal = accelRate / 100;

  if (type === "flat") {
    const commission = amount * rateDecimal;
    return {
      commission,
      effectiveRate: rateDecimal,
      note: `Commission: ${formatCurrency(commission)}`,
      breakdown: [`Flat rate of ${flatRate.toFixed(2)}% applied to ${formatCurrency(amount)}`],
    };
  }

  if (type === "accelerator") {
    if (amount > threshold) {
      const commission = amount * accelDecimal;
      return {
        commission,
        effectiveRate: accelDecimal,
        note: `Commission: ${formatCurrency(commission)}`,
        breakdown: [
          `Deal of ${formatCurrency(amount)} exceeds ${formatCurrency(threshold)} threshold`,
          `Accelerator rate of ${accelRate.toFixed(2)}% applied to the full deal amount`,
        ],
      };
    }
    const commission = amount * rateDecimal;
    return {
      commission,
      effectiveRate: rateDecimal,
      note: `Commission: ${formatCurrency(commission)}`,
      breakdown: [
        `Deal of ${formatCurrency(amount)} is below the ${formatCurrency(threshold)} threshold`,
        `Base rate of ${flatRate.toFixed(2)}% applied`,
      ],
    };
  }

  if (type === "tiered" && tiers.length > 0) {
    let remaining = amount;
    let totalCommission = 0;
    const lines: string[] = [];

    for (const tier of tiers) {
      if (remaining <= 0) break;
      const tierTop = tier.to !== null ? tier.to : Infinity;
      const tierBottom = tier.from;
      const allocated = amount - remaining;
      const tierStart = Math.max(tierBottom, allocated);
      const tierEnd = Math.min(tierTop, amount);
      const applicable = Math.max(0, tierEnd - tierStart);
      if (applicable <= 0) continue;
      const commission = applicable * (tier.rate / 100);
      totalCommission += commission;
      lines.push(
        `${tier.rate.toFixed(2)}% on ${formatCurrency(applicable)}`
        + (tier.to !== null ? ` (${formatCurrency(tier.from)} – ${formatCurrency(tier.to)})` : ` (${formatCurrency(tier.from)}+)`),
      );
      remaining -= applicable;
    }

    const effectiveRate = amount > 0 ? totalCommission / amount : 0;
    return {
      commission: totalCommission,
      effectiveRate,
      note: `Commission: ${formatCurrency(totalCommission)}`,
      breakdown: lines,
    };
  }

  return { commission: 0, effectiveRate: 0, note: "No calculation", breakdown: [] };
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);
}

function formatPercent(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

export function CommissionCalculator() {
  usePageMeta({
    title: "Free Sales Commission Calculator",
    description: "Calculate sales commissions instantly with our free online calculator. Supports flat rate, tiered, and accelerator commission structures. No signup required.",
    keywords: "commission pay calculator, calculating commissions, calculator commission, commissions calculator, payroll commission calculator, commission on sales calculator, sales commission calculator, sales and commission calculator",
    robots: "index, follow",
  });

  useEffect(() => {
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = "smooth"; };
  }, []);

  const [planType, setPlanType] = useState<PlanType>("flat");
  const [dealAmount, setDealAmount] = useState("50000");
  const [flatRate, setFlatRate] = useState("5");
  const [threshold, setThreshold] = useState("25000");
  const [accelRate, setAccelRate] = useState("10");
  const [tiers, setTiers] = useState<Tier[]>([
    { from: 0, to: 25000, rate: 5 },
    { from: 25000, to: null, rate: 10 },
  ]);
  const [result, setResult] = useState<CalcResult | null>(null);
  const [calculated, setCalculated] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadEmail, setLeadEmail] = useState("");
  const [leadName, setLeadName] = useState("");
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadError, setLeadError] = useState("");

  // Pre-fill email from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setLeadEmail(emailParam);
  }, []);

  function handleCalculate(e: React.FormEvent) {
    e.preventDefault();
    const amount = parseFloat(dealAmount);
    if (isNaN(amount) || amount <= 0) return;

    Analytics.calculatorUsed();

    setResult(calculateCommission(
      amount,
      planType,
      parseFloat(flatRate) || 0,
      parseFloat(threshold) || 0,
      parseFloat(accelRate) || 0,
      tiers,
    ));
    setCalculated(true);
  }

  function addTier() {
    const last = tiers[tiers.length - 1];
    const nextFrom = last.to !== null ? last.to : last.from + 25000;
    setTiers([...tiers, { from: nextFrom, to: null, rate: 10 }]);
  }

  function updateTier(index: number, field: keyof Tier, value: number | null) {
    setTiers((prev) => {
      const updated = prev.map((t, i) => (i !== index ? t : { ...t, [field]: value }));
      if (field === "to" && value !== null && index + 1 < updated.length) {
        updated[index + 1] = { ...updated[index + 1], from: value };
      }
      return updated;
    });
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return;
    setTiers(tiers.filter((_, i) => i !== index));
  }

  function handleReset() {
    setCalculated(false);
    setResult(null);
    setLeadCaptured(false);
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLeadError("");
    const trimmedEmail = leadEmail.trim();
    if (!trimmedEmail) {
      setLeadError("Please enter your email address.");
      return;
    }
    setIsSubmittingLead(true);
    try {
      await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, name: leadName.trim() || undefined, source: "calculator" }),
      });
      setLeadCaptured(true);
    } catch {
      setLeadError("Something went wrong. Please try again.");
    } finally {
      setIsSubmittingLead(false);
    }
  }

  const amount = parseFloat(dealAmount) || 0;

  const content = (
    <>
      {/* Hero */}
      <section className="bg-transparent border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-32 pb-12 sm:pb-16 text-center">
          <Badge variant="secondary" className="mb-5 sm:mb-6 text-primary bg-primary/10 border-primary/20 hover:bg-primary/15">
            <Calculator className="size-3.5 mr-1.5" />
            Free Tool — No Signup Required
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground tracking-tight mb-3 sm:mb-4">
            Sales Commission Calculator
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            See exactly what your reps earn. Choose from flat rate, tiered, or accelerator commission plans and get an instant breakdown.
          </p>
        </div>
      </section>

      {/* Calculator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-6 sm:-mt-8 pb-12 sm:pb-16">
        <Card className="overflow-hidden">
          <Tabs value={planType} onValueChange={(v) => { setPlanType(v as PlanType); setCalculated(false); setResult(null); }}>
            <TabsList className="w-full rounded-none border-b border-card-border bg-muted/30 p-0 h-auto grid grid-cols-3">
              {(["flat", "tiered", "accelerator"] as const).map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className="rounded-none data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/[0.03] py-4 px-4 h-auto text-center flex-col gap-0.5"
                >
                  <span className="text-xs sm:text-sm font-medium capitalize">{t === "flat" ? "Flat Rate" : t === "tiered" ? "Tiered" : "Base + Accelerator"}</span>
                  <span className="hidden md:inline text-xs text-muted-foreground/70 font-normal">
                    {t === "flat" ? "A single percentage on every deal" : t === "tiered" ? "Marginal rates like tax brackets" : "Higher rate on the full deal above a threshold"}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            <form onSubmit={handleCalculate}>
              <CardContent className="p-5 sm:p-6 md:p-8">
                <div className="w-full sm:max-w-xs mb-6">
                  <Label htmlFor="deal-amount" className="text-sm font-medium text-foreground">Deal Amount</Label>
                  <div className="relative mt-1.5">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input id="deal-amount" type="number" step="any" min="0" value={dealAmount} onChange={(e) => setDealAmount(e.target.value)} className="pl-9" placeholder="50000" />
                  </div>
                </div>

                <TabsContent value="flat" className="mt-0">
                  <div className="w-full sm:max-w-xs">
                    <Label htmlFor="flat-rate" className="text-sm font-medium text-foreground">Commission Rate</Label>
                    <div className="relative mt-1.5">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input id="flat-rate" type="number" step="any" min="0" max="100" value={flatRate} onChange={(e) => setFlatRate(e.target.value)} className="pl-9" placeholder="5" />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tiered" className="mt-0 space-y-3">
                  <Label className="text-sm font-medium text-foreground">Volume Tiers</Label>
                  <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground font-medium px-2">
                    <span>From</span>
                    <span>To</span>
                    <span>Rate</span>
                    <span className="w-8" />
                  </div>
                  {tiers.map((tier, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-1 sm:gap-2 items-center">
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                        <Input type="number" step="any" min="0" value={tier.from} onChange={(e) => updateTier(i, "from", parseFloat(e.target.value) || 0)} className="pl-7 text-sm" />
                      </div>
                      <div className="relative">
                        <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                        <Input type="number" step="any" min="0" value={tier.to ?? ""} onChange={(e) => updateTier(i, "to", e.target.value ? parseFloat(e.target.value) : null)} className="pl-7 text-sm" placeholder="∞" />
                      </div>
                      <div className="relative">
                        <Percent className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                        <Input type="number" step="any" min="0" max="100" value={tier.rate} onChange={(e) => updateTier(i, "rate", parseFloat(e.target.value) || 0)} className="pl-7 text-sm" />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="size-8 sm:size-9" onClick={() => removeTier(i)} disabled={tiers.length <= 1}>
                        <Trash2 className="size-3.5 sm:size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <button type="button" onClick={addTier} className="text-sm text-primary font-medium hover:text-primary/80 transition-colors mt-1 px-2">+ Add tier</button>
                </TabsContent>

                <TabsContent value="accelerator" className="mt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="flat-rate" className="text-sm font-medium text-foreground">Base Rate</Label>
                      <div className="relative mt-1.5">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input id="flat-rate" type="number" step="any" min="0" max="100" value={flatRate} onChange={(e) => setFlatRate(e.target.value)} className="pl-9" placeholder="5" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="threshold" className="text-sm font-medium text-foreground">Accelerator Threshold</Label>
                      <div className="relative mt-1.5">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input id="threshold" type="number" step="any" min="0" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="pl-9" placeholder="25000" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="accel-rate" className="text-sm font-medium text-foreground">Accelerator Rate</Label>
                      <div className="relative mt-1.5">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input id="accel-rate" type="number" step="any" min="0" max="100" value={accelRate} onChange={(e) => setAccelRate(e.target.value)} className="pl-9" placeholder="10" />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-8">
                  <Button type="submit" className="font-bold shadow-sm">
                    <Calculator className="size-4 mr-2" />
                    Calculate Commission
                  </Button>
                  {calculated && (
                    <Button type="button" variant="outline" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </CardContent>
            </form>
          </Tabs>
        </Card>

        {result && (
          <div className="mt-6 sm:mt-8 space-y-6 sm:space-y-8">
            {/* Headline cards — always visible */}
            <Card>
              <CardContent className="p-5 sm:p-6 md:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Commission</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(result.commission)}</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/60">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Effective Rate</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{formatPercent(result.effectiveRate)}</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 rounded-xl bg-muted/30 border border-border/60">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1">Deal Amount</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{formatCurrency(amount)}</p>
                  </div>
                </div>

                {/* Breakdown + gated sections — only when lead is captured */}
                {leadCaptured && result.breakdown.length > 0 && (
                  <div className="border-t border-border/60 pt-5 sm:pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">Calculation Breakdown</h3>
                    <ul className="space-y-2">
                      {result.breakdown.map((line, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                          <ArrowRight className="size-4 text-primary shrink-0 mt-0.5" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email gate — shown when lead not yet captured */}
            {!leadCaptured && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
                <CardContent className="p-6 sm:p-8 md:p-10 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="flex size-12 rounded-full bg-primary/10 items-center justify-center">
                      <Mail className="size-5 text-primary" />
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                    See the Full Breakdown
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto mb-6">
                    Enter your email to unlock the complete calculation details and see how CommissionKit can automate this for you.
                  </p>
                  <form onSubmit={handleLeadSubmit} className="max-w-sm mx-auto space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                      <Input
                        type="email"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        placeholder="Your work email"
                        className="pl-9"
                        aria-label="Email address"
                      />
                    </div>
                    <Input
                      type="text"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      placeholder="Your name (optional)"
                      aria-label="Your name"
                    />
                    {leadError && (
                      <p className="text-xs text-destructive text-left">{leadError}</p>
                    )}
                    <Button
                      type="submit"
                      className="w-full font-bold shadow-sm"
                      disabled={isSubmittingLead}
                    >
                      {isSubmittingLead ? (
                        <>
                          <LoaderCircle className="size-4 mr-2 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        "See Full Breakdown"
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground">No spam, just your results.</p>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Full results — shown only when lead is captured */}
            {leadCaptured && (
              <>
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
                  <CardContent className="p-6 sm:p-8 md:p-10 text-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2 tracking-tight">
                      Automate This Entire Process
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mb-6 sm:mb-8">
                      Stop calculating commissions manually. CommissionKit automates everything — from deal tracking to payouts.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 text-left">
                      <Card className="border-border/60">
                        <CardContent className="p-3 sm:p-4">
                          <BarChart3 className="size-5 text-primary mb-2" />
                          <h4 className="font-semibold text-foreground text-sm">Import & Track Deals</h4>
                          <p className="text-xs text-muted-foreground mt-1">Bulk import from CSV or XLSX.</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardContent className="p-3 sm:p-4">
                          <TrendingUp className="size-5 text-primary mb-2" />
                          <h4 className="font-semibold text-foreground text-sm">Auto-Calculate</h4>
                          <p className="text-xs text-muted-foreground mt-1">Run period-based calculations in one click.</p>
                        </CardContent>
                      </Card>
                      <Card className="border-border/60">
                        <CardContent className="p-3 sm:p-4">
                          <Users className="size-5 text-primary mb-2" />
                          <h4 className="font-semibold text-foreground text-sm">Rep Self-Service</h4>
                          <p className="text-xs text-muted-foreground mt-1">Give every rep a portal to view their earnings.</p>
                        </CardContent>
                      </Card>
                    </div>
                    <Button className="font-bold shadow-sm w-full sm:w-auto" asChild>
                      <a href="/register">Start Your Free Trial</a>
                    </Button>
                    <p className="text-xs text-muted-foreground mt-3">No credit card required · 14-day free trial · Cancel anytime</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-8 sm:size-10 rounded-lg bg-red-100 dark:bg-red-900/20 items-center justify-center">
                          <X className="size-4 sm:size-5 text-red-500" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">Doing It Manually</h3>
                      </div>
                      <ul className="space-y-2">
                        {["Error-prone spreadsheets", "Missed deals and commissions", "Reps can't see their earnings", "Hours wasted every pay period"].map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><X className="size-4 text-red-400 shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.02] to-transparent">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex size-8 sm:size-10 rounded-lg bg-primary/10 items-center justify-center">
                          <Check className="size-4 sm:size-5 text-primary" />
                        </div>
                        <h3 className="font-semibold text-foreground text-sm sm:text-base">With CommissionKit</h3>
                      </div>
                      <ul className="space-y-2">
                        {["Automated, error-free calculations", "Every deal tracked and attributed", "Real-time rep visibility via portal", "Payouts done in minutes, not days"].map((item) => (
                          <li key={item} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="size-4 text-primary shrink-0" /> {item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center border-t border-border/60 pt-8 sm:pt-10">
                  <Badge variant="secondary" className="mb-4 text-primary bg-primary/10 border-primary/20 hover:bg-primary/15">
                    <Shield className="size-3.5 mr-1.5" />
                    14-Day Free Trial
                  </Badge>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Ready to simplify your commission process?</h3>
                  <p className="text-sm sm:text-base text-muted-foreground mb-6">Join teams that trust CommissionKit to manage millions in commissions.</p>
                  <Button className="font-bold shadow-sm w-full sm:w-auto" asChild>
                    <a href="/register">Get Started Free</a>
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </section>
    </>
  );

  return (
    <>
      <Navbar />
      <main className="pt-16">
        {content}
      </main>
      <Footer />
    </>
  );
}
