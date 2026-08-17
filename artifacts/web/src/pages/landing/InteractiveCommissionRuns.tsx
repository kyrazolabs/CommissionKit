import { ArrowRight, Calculator, Check, DollarSign, Percent, Play } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export function InteractiveCommissionRuns() {
  const [planType, setPlanType] = useState<"flat" | "tiered" | "accelerator">("tiered");
  const [amount, setAmount] = useState("75000");
  const [flatRate, setFlatRate] = useState("5");
  const [threshold, setThreshold] = useState("50000");
  const [accelRate, setAccelRate] = useState("8");
  const [tiers, setTiers] = useState([
    { from: 0, to: 50000, rate: 5 },
    { from: 50000, to: 100000, rate: 8 },
    { from: 100000, to: null, rate: 12 },
  ]);
  const [ran, setRan] = useState(false);
  const [result, setResult] = useState<{ commission: number; breakdown: string[] }>({
    commission: 0,
    breakdown: [],
  });

  function calc() {
    const a = parseFloat(amount) || 0;
    if (a <= 0) return;

    if (planType === "flat") {
      const c = a * (parseFloat(flatRate) / 100);
      setResult({ commission: c, breakdown: [`${flatRate}% on ${fmtCurrency(a)}`] });
    } else if (planType === "accelerator") {
      const t = parseFloat(threshold) || 0;
      const rate = a > t ? parseFloat(accelRate) / 100 : parseFloat(flatRate) / 100;
      const c = a * rate;
      setResult({
        commission: c,
        breakdown:
          a > t
            ? [
                `Deal exceeds ${fmtCurrency(t)} threshold`,
                `Accelerator rate of ${accelRate}% applied to full amount`,
              ]
            : [`Deal below ${fmtCurrency(t)} threshold`, `Base rate of ${flatRate}% applied`],
      });
    } else {
      let remaining = a;
      let total = 0;
      const lines: string[] = [];
      for (const t of tiers) {
        if (remaining <= 0) break;
        const top = t.to ?? Infinity;
        const applicable = Math.min(remaining, top - t.from);
        if (applicable <= 0) continue;
        const c = applicable * (t.rate / 100);
        total += c;
        lines.push(
          `${t.rate}% on ${fmtCurrency(applicable)} (${fmtCurrency(t.from)} – ${t.to ? fmtCurrency(t.to) : "∞"})`,
        );
        remaining -= applicable;
      }
      setResult({ commission: total, breakdown: lines });
    }
    setRan(true);
  }

  return (
    <Card className="overflow-hidden border-card-border shadow-sm h-[460px] flex flex-col">
      <div className="px-5 py-3 border-b border-card-border bg-muted/20 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-[8px] bg-primary/10">
          <Play className="size-3.5 text-primary" />
        </div>
        <span className="text-[13px] font-semibold text-foreground">Commission Run Engine</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Interactive Demo
        </Badge>
      </div>
      <Tabs
        value={planType}
        onValueChange={(v) => {
          setPlanType(v as typeof planType);
          setRan(false);
        }}
        className="flex-1 min-h-0 flex flex-col"
      >
        <TabsList className="w-full rounded-none border-b border-card-border bg-transparent p-0 h-auto grid grid-cols-3 shrink-0">
          {(["flat", "tiered", "accelerator"] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-none border-b-2 border-transparent  data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/[0.04] py-3 px-2 h-auto text-xs font-medium capitalize"
            >
              {t === "flat" ? "Flat" : t === "tiered" ? "Tiered" : "Accelerator"}
            </TabsTrigger>
          ))}
        </TabsList>

        <CardContent className="p-5 flex-1 overflow-auto custom-scrollbar">
          <div className="mb-4">
            <Label className="text-xs font-medium text-muted-foreground">Deal Amount</Label>
            <div className="relative mt-1">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setRan(false);
                }}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          <TabsContent value="flat" className="mt-0">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Rate</Label>
              <div className="relative mt-1">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={flatRate}
                  onChange={(e) => {
                    setFlatRate(e.target.value);
                    setRan(false);
                  }}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tiered" className="mt-0 space-y-1.5">
            {tiers.map((t, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr] gap-1.5 items-center">
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={t.from}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      const next = tiers.map((x, j) => (j === i ? { ...x, from: v } : x));
                      if (i > 0 && v < tiers[i - 1].from) next[i - 1] = { ...next[i - 1], to: v };
                      setTiers(next);
                      setRan(false);
                    }}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={t.to ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? parseFloat(e.target.value) : null;
                      const next = tiers.map((x, j) => {
                        if (j !== i) return x;
                        return { ...x, to: v };
                      });
                      if (v !== null && i + 1 < next.length)
                        next[i + 1] = { ...next[i + 1], from: v };
                      setTiers(next);
                      setRan(false);
                    }}
                    className="pl-7 h-8 text-xs"
                    placeholder="∞"
                  />
                </div>
                <div className="relative">
                  <Percent className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <Input
                    type="number"
                    value={t.rate}
                    onChange={(e) => {
                      setTiers(
                        tiers.map((x, j) =>
                          j === i ? { ...x, rate: parseFloat(e.target.value) || 0 } : x,
                        ),
                      );
                      setRan(false);
                    }}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="accelerator" className="mt-0 space-y-3">
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Base Rate</Label>
              <div className="relative mt-1">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={flatRate}
                  onChange={(e) => {
                    setFlatRate(e.target.value);
                    setRan(false);
                  }}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Threshold</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => {
                    setThreshold(e.target.value);
                    setRan(false);
                  }}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium text-muted-foreground">Accelerator Rate</Label>
              <div className="relative mt-1">
                <Percent className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="number"
                  value={accelRate}
                  onChange={(e) => {
                    setAccelRate(e.target.value);
                    setRan(false);
                  }}
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </TabsContent>

          <Button
            onClick={calc}
            className="w-full rounded-xl text-[13px] font-semibold mt-4"
            size="sm"
          >
            <Calculator className="size-3.5 mr-1.5" />
            Calculate Commission
          </Button>

          {ran && (
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10 animate-in fade-in">
              <div className="flex items-baseline gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Commission:</span>
                <span className="text-xl font-bold text-foreground tabular-nums">
                  {fmtCurrency(result.commission)}
                </span>
              </div>
              <div className="space-y-1.5">
                {result.breakdown.map((line, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="size-3 text-primary shrink-0 mt-0.5" />
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Tabs>
    </Card>
  );
}
