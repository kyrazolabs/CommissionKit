import { useMemo, useState, useEffect, useCallback } from "react";
import { 
  Check, Zap, Building2, Infinity as InfinityIcon, Loader2, 
  ExternalLink, Crown, AlertTriangle, CheckCircle2, Gift, 
  Users, FileText, UserRound 
} from "lucide-react";
import * as TanStackReactQuery from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { apiFetch } from "@/lib/api";
import { useBillingStatus, type SubscriptionStatus } from "@/hooks/use-billing-status";
import { useRole } from "@/hooks/use-role";
import { Skeleton } from "@/components/ui/skeleton";

const EXTRA_REP_UNIT_MONTHLY_USD = 8;
const EXTRA_REP_UNIT_YEARLY_USD = 80;

// ─── Stripe price IDs (mirror API env: STRIPE_* → VITE_STRIPE_* for Vite) ───
const STRIPE_PRICE = {
  starter: {
    monthly: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID ?? "price_1TSwQIBA7ra9J8VO3P4tgtLi",
    yearly: import.meta.env.VITE_STRIPE_STARTER_ANNUAL_PRICE_ID ?? "",
  },
  growth: {
    monthly: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID ?? "price_1TSwQHBA7ra9J8VOxFgWrEHg",
    yearly: import.meta.env.VITE_STRIPE_GROWTH_ANNUAL_PRICE_ID ?? "price_1TVwbbBA7ra9J8VOok7hEjEG",
  },
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRO_PRICE_ID ?? "",
    yearly: import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
  },
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    priceMonthlyUsd: 49,
    priceYearlyUsd: 490,
    description: "Perfect for testing the product or tiny teams.",
    icon: Zap,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    features: [
      "Up to 10 sales reps",
      "Up to 3 commission plans",
      "Deal & commission tracking",
      "Unlimited calculation runs",
      "Email support (48h response)",
    ],
    priceIdMonthly: STRIPE_PRICE.starter.monthly,
    priceIdYearly: STRIPE_PRICE.starter.yearly,
    highlighted: false,
    badge: null as string | null,
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthlyUsd: 99,
    priceYearlyUsd: 990,
    description: "For stable teams of 8+ reps.",
    icon: Building2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    features: [
      "Up to 30 sales reps",
      "Unlimited commission plans",
      "Advanced tiered plans",
      "Accelerator & clawback rules",
      "Rep self-service portal",
      "Priority support (24h)",
      "CSV export",
    ],
    priceIdMonthly: STRIPE_PRICE.growth.monthly,
    priceIdYearly: STRIPE_PRICE.growth.yearly,
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthlyUsd: 249,
    priceYearlyUsd: 2490,
    description: "For serious sales organizations with advanced needs.",
    icon: Crown,
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    features: [
      "Up to 100 sales reps",
      "Everything in Growth",
      "SAML/SSO Authentication",
      "Custom API limits",
      "Dedicated account manager",
      "Custom legal terms",
    ],
    priceIdMonthly: STRIPE_PRICE.pro.monthly,
    priceIdYearly: STRIPE_PRICE.pro.yearly,
    highlighted: false,
    badge: "Best Value",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatCap(n: number): string {
  return n === -1 ? "Unlimited" : String(n);
}

function usagePercent(used: number, cap: number): number {
  if (cap <= 0 || cap === -1) return 0;
  return Math.min(100, Math.round((used / cap) * 100));
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

function StatusBanner({ sub }: { sub: SubscriptionStatus }) {
  if (sub.plan === "free") return null;

  const isActive   = sub.status === "active";
  const isPastDue  = sub.status === "past_due";
  const isCanceled = sub.status === "canceled";



  if (isPastDue) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/20">
        <AlertTriangle className="size-4 text-red-600 shrink-0" />
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          Payment failed : please update your payment method to keep access.
        </p>
      </div>
    );
  }

  if (sub.cancelAtPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/40 dark:bg-orange-900/20">
        <AlertTriangle className="size-4 text-orange-600 shrink-0" />
        <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
          Your <strong>{sub.plan}</strong> plan cancels on{" "}
          <strong>{formatDate(sub.currentPeriodEnd)}</strong>. Reactivate in the portal to keep access.
        </p>
      </div>
    );
  }

  if (isActive && sub.currentPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/40 dark:bg-green-900/20">
        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          <strong className="capitalize">{sub.plan}</strong> plan active : renews{" "}
          <strong>{formatDate(sub.currentPeriodEnd)}</strong>.
        </p>
      </div>
    );
  }

  return null;
}

type PlanLimitsRow = { reps: number; plans: number; members: number };

function BillingUsageCard({
  repsLoading,
  plansLoading,
  membersLoading,
  sub,
  limits,
  planBaseLimits,
  repsCount,
  plansCount,
  membersCount,
}: {
  repsLoading: boolean;
  plansLoading: boolean;
  membersLoading: boolean;
  sub: SubscriptionStatus | null;
  limits: PlanLimitsRow | null;
  planBaseLimits: PlanLimitsRow | null;
  repsCount: number | null;
  plansCount: number | null;
  membersCount: number | null;
}) {
  const currentPlan = sub?.plan ?? "free";
  const hasSub = sub && currentPlan !== "free";

  return (
    <Card className="border-border bg-card/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Usage & Limits</CardTitle>
            <CardDescription className="text-xs">
              Plan: <span className="capitalize text-foreground font-semibold">{currentPlan}</span>
            </CardDescription>
          </div>
          {hasSub && (
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Zap className="size-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Sales Reps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <UserRound className="size-3.5 text-muted-foreground" />
              Sales Representatives
            </div>
            <div className="text-muted-foreground">
              {repsLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <span className="text-foreground font-semibold">{repsCount ?? 0}</span>
                  {" / "}
                  {formatCap(limits?.reps ?? 0)}
                </>
              )}
            </div>
          </div>
          <Progress value={usagePercent(repsCount ?? 0, limits?.reps ?? 0)} className="h-1.5" />
          {limits && planBaseLimits && limits.reps > planBaseLimits.reps && (
             <p className="text-[10px] text-primary font-medium">
               Includes {limits.reps - planBaseLimits.reps} extra rep seats from your add-on.
             </p>
          )}
        </div>

        {/* Commission Plans */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <FileText className="size-3.5 text-muted-foreground" />
              Commission Plans
            </div>
            <div className="text-muted-foreground">
              {plansLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <span className="text-foreground font-semibold">{plansCount ?? 0}</span>
                  {" / "}
                  {formatCap(limits?.plans ?? 0)}
                </>
              )}
            </div>
          </div>
          <Progress value={usagePercent(plansCount ?? 0, limits?.plans ?? 0)} className="h-1.5" />
        </div>

        {/* Members */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <Users className="size-3.5 text-muted-foreground" />
              Workspace Members
            </div>
            <div className="text-muted-foreground">
              {membersLoading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <>
                  <span className="text-foreground font-semibold">{membersCount ?? 0}</span>
                  {" / "}
                  {formatCap(limits?.members ?? 0)}
                </>
              )}
            </div>
          </div>
          <Progress value={usagePercent(membersCount ?? 0, limits?.members ?? 0)} className="h-1.5" />
        </div>
      </CardContent>
    </Card>
  );
}



export function BillingPage() {
  const queryClient = TanStackReactQuery.useQueryClient();
  const { session } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { sub, limits, planBaseLimits, refetch } = useBillingStatus();
  const { hasPermission, isLoading: roleLoading } = useRole();

  const [showLocalCurrency, setShowLocalCurrency] = useState(false);
  const [rates, setRates] = useState<Record<string, number>>({});
  const workspaceCurrency = activeWorkspace?.currency || "USD";

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    apiFetch(`/api/billing/rates`)
      .then((data) => setRates(data))
      .catch((err) => console.error("Failed to fetch rates", err));
  }, [activeWorkspace?.id]);

  const { data: reps = [], isLoading: repsLoading } = TanStackReactQuery.useQuery({
    queryKey: ["reps", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/reps`),
    enabled: Boolean(activeWorkspace?.id),
  });
  
  const { data: commissionPlans = [], isLoading: plansLoading } = TanStackReactQuery.useQuery({
    queryKey: ["commission-plans", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/plans`),
    enabled: Boolean(activeWorkspace?.id),
  });

  const [membersCount, setMembersCount] = useState<number | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchMemberCount = useCallback(async () => {
    if (!activeWorkspace?.id) {
      setMembersCount(null);
      return;
    }
    try {
      const data = await apiFetch(`/api/workspaces/${activeWorkspace.id}/members`);
      setMembersCount(Array.isArray(data) ? data.length : 0);
    } catch {
      setMembersCount(null);
    } finally {
      setMembersLoading(false);
    }
  }, [activeWorkspace?.id]);

  const [loadingPlan, setLoadingPlan]   = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => {
     // Default to growth if not subscribed, otherwise use current plan
     const currentPlan = sub?.plan ?? "free";
     if (currentPlan === "free" || currentPlan === "annual") return "growth";
     return currentPlan;
  });

  const [payYearly, setPayYearly] = useState(false);
  const [extraReps, setExtraReps] = useState("0");
  const [addonSaving, setAddonSaving] = useState(false);

  useEffect(() => {
    void fetchMemberCount();
  }, [fetchMemberCount]);

  useEffect(() => {
    if (sub?.extraRepSeats) setExtraReps(String(sub.extraRepSeats));
  }, [sub?.extraRepSeats]);

  // Monthly tiers + optional Growth Annual swap (yearly is Growth-only)
  const displayPlans = useMemo(() => {
    return plans;
  }, []);

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!hasPermission("billing", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Crown className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view billing information.</p>
      </div>
    );
  }

  const currentPlan = sub?.plan ?? "free";
  const ACTIVE_BILLING_SUB_STATUSES = new Set([
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "paused",
  ]);
  const alreadySubscribed = Boolean(
    sub &&
    currentPlan !== "free" &&
    sub.status && ACTIVE_BILLING_SUB_STATUSES.has(sub.status)
  );

  const repsCount = Array.isArray(reps) ? reps.length : null;
  const plansCount = Array.isArray(commissionPlans) ? commissionPlans.length : null;

  const handleCheckout = async (priceId: string, plan: string, mode: string, extraQty: number) => {
    if (!activeWorkspace?.id) return;
    setLoadingPlan(plan);
    try {
      const { url } = await apiFetch(`/api/billing/checkout`, {
        method: "POST",
        body: JSON.stringify({ priceId, mode, extraReps: extraQty }),
      });
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Checkout Error", description: err.message, variant: "destructive" });
      setLoadingPlan(null);
    }
  };

  const handleUpdateAddonReps = async () => {
    if (!activeWorkspace?.id) return;
    const qty = Math.max(0, Math.floor(Number(extraReps || 0)));
    setAddonSaving(true);
    try {
      await apiFetch(`/api/billing/extra-reps`, {
        method: "POST",
        body: JSON.stringify({ quantity: qty }),
      });

      toast({ title: "Updated", description: `You now have ${qty} extra rep seats.` });
      await refetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAddonSaving(false);
    }
  };

  const handlePortal = async () => {
    if (!activeWorkspace?.id) return;
    setPortalLoading(true);
    try {
      const { url } = await apiFetch(`/api/billing/portal`, {
        method: "POST",
      });
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Could not open portal", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handlePayYearlyChange = (checked: boolean) => {
    setPayYearly(checked);
  };


  const selectedPlan = displayPlans.find((p) => p.id === selectedPlanId) ?? null;
  const extraRepsQty = Math.max(0, Math.floor(Number(extraReps || 0)));
  
  const extraRepUnitDisplayUsd = payYearly
    ? EXTRA_REP_UNIT_YEARLY_USD
    : EXTRA_REP_UNIT_MONTHLY_USD;
  const extraRepsAddonTotalUsd = extraRepsQty * extraRepUnitDisplayUsd;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Account</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Billing & Plans</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {alreadySubscribed
              ? "You’re subscribed. Use Manage subscription to change your plan or add-on seats : new checkout is disabled so you aren’t charged twice."
              : "Choose a plan, add extra reps if you need them, then continue to secure checkout."}
          </p>
        </div>
      </div>
      
      {!alreadySubscribed && sub?.trialUsed === false && (
        <div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Zap className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">14-Day Free Trial Available</p>
            <p className="text-xs text-blue-800/80 dark:text-blue-200/60 mt-0.5">
              Start any plan today and you won't be charged for the first 14 days. This is a one-time offer for your workspace.
            </p>
          </div>
        </div>
      )}

      {/* Growth yearly upsell : only for workspaces not already on a paid subscription */}
      {!alreadySubscribed && (
      <div
        className={cn(
          "flex items-start gap-3 sm:gap-4 rounded-xl border p-4 sm:p-4 transition-all",
          payYearly
            ? "border-primary/40 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent shadow-sm ring-1 ring-primary/15"
            : "border-border bg-muted/20 hover:bg-muted/35",
        )}
      >
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gift className="size-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Pay yearly, get 2 months free</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Annual billing is now available for <strong className="text-foreground">Starter, Growth, and Pro</strong>. Save up to 17% on your total subscription costs.
              </p>
            </div>
            <div className="flex items-center gap-2.5 sm:shrink-0">
              <Checkbox
                id="pay-yearly-growth"
                checked={payYearly}
                onCheckedChange={(v) => handlePayYearlyChange(v === true)}
                className="shrink-0"
              />
              <Label
                htmlFor="pay-yearly-growth"
                className="text-sm font-medium leading-none cursor-pointer text-foreground"
              >
                I want annual billing
              </Label>
            </div>
          </div>
          {payYearly && (
            <p className="text-[11px] text-primary font-medium">
              You’re viewing yearly pricing across all plans.
            </p>
          )}
        </div>
      </div>
      )}

      {/* Status banner */}
      {sub && <StatusBanner sub={sub} />}

      {activeWorkspace && (
        <BillingUsageCard
          repsLoading={repsLoading}
          plansLoading={plansLoading}
          membersLoading={membersLoading}
          sub={sub}
          limits={limits}
          planBaseLimits={planBaseLimits}
          repsCount={repsCount}
          plansCount={plansCount}
          membersCount={membersCount}
        />
      )}

      {/* Manage subscription button (for paying customers) */}
      {sub && sub.plan !== "free" && (
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-4">
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">{sub.plan} Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Billing portal: update payment method, invoices, or cancel.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="gap-2 shrink-0">
            {portalLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
            Manage Subscription
          </Button>
        </div>
      )}

      {alreadySubscribed && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/20">
          <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5 dark:text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">New checkout is turned off</p>
            <p className="text-xs text-amber-900/85 dark:text-amber-200/90 mt-1 leading-relaxed">
              You already have an active paid subscription on this workspace. Starting another Stripe checkout would create a <strong>second subscription</strong> and charge you again. To <strong>change your base plan</strong> (for example Growth to Growth Annual), use{" "}
              <strong>Manage Subscription</strong> above.
            </p>
          </div>
        </div>
      )}

      {/* Add-on management for active subscribers */}
      {alreadySubscribed && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Manage Add-ons
            </CardTitle>
            <CardDescription className="text-xs">
              Add or remove extra rep seats on your current plan.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 space-y-1 w-full">
              <Label htmlFor="addon-reps" className="text-xs font-medium">Extra rep seats</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="addon-reps"
                  type="number"
                  min={0}
                  value={extraReps}
                  onChange={(e) => setExtraReps(e.target.value)}
                  className="max-w-[120px]"
                />
                <span className="text-xs text-muted-foreground">total add-on seats</span>
              </div>
            </div>
            <Button
              className="sm:shrink-0 w-full sm:w-auto"
              onClick={() => void handleUpdateAddonReps()}
              disabled={addonSaving}
            >
              {addonSaving ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save add-on"
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Choose a Plan</h2>
        {workspaceCurrency !== "USD" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="currency-toggle" className="text-sm text-muted-foreground">
              Show in {
                workspaceCurrency === "SAR" ? "Riyal" : 
                workspaceCurrency === "AED" ? "Dirham" : 
                workspaceCurrency
              }
            </Label>
            <Switch
              id="currency-toggle"
              checked={showLocalCurrency}
              onCheckedChange={setShowLocalCurrency}
            />
          </div>
        )}
      </div>

      <div
        className={cn(
          "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
          alreadySubscribed && "opacity-75",
        )}
      >
        {displayPlans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent  = currentPlan === plan.id;
          const isSelected = selectedPlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-shadow",
                !alreadySubscribed && "cursor-pointer",
                plan.highlighted && "border-primary shadow-md ring-1 ring-primary",
                isCurrent && "ring-2 ring-primary/60",
                isSelected && !isCurrent && "ring-2 ring-primary",
              )}
              onClick={() => {
                if (alreadySubscribed) return;
                if (isCurrent) return;
                setSelectedPlanId(plan.id);
              }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border whitespace-nowrap",
                    plan.id === "pro"
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40"
                      : "bg-primary text-primary-foreground border-primary",
                  )}>
                    {isCurrent ? "✓ Current Plan" : plan.badge}
                  </span>
                </div>
              )}

              <CardHeader className="pb-3 pt-7">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={cn("flex size-8 items-center justify-center rounded-lg", plan.iconBg)}>
                    <Icon className={cn("size-4", plan.iconColor)} />
                  </div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold text-foreground">
                    {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] ? (
                      <span className="flex items-baseline gap-1">
                        <span className="text-xl text-muted-foreground font-normal">≈</span>
                        {formatCurrency((payYearly ? plan.priceYearlyUsd : plan.priceMonthlyUsd) * rates[workspaceCurrency], workspaceCurrency)}
                      </span>
                    ) : (
                      "$" + (payYearly ? plan.priceYearlyUsd : plan.priceMonthlyUsd)
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">{payYearly ? "/year" : "/month"}</span>
                </div>
                <CardDescription className="mt-1 text-[13px]">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="pb-4 flex-1">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-foreground">
                      <Check className={cn("size-3.5 shrink-0", plan.iconColor)} />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                {isCurrent ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    <Check className="mr-2 size-4" />
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    className={cn("w-full")}
                    variant={isSelected || plan.highlighted ? "default" : "outline"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (alreadySubscribed) return;
                      setSelectedPlanId(plan.id);
                    }}
                    disabled={loadingPlan !== null || alreadySubscribed}
                  >
                    {isSelected ? "Selected" : alreadySubscribed ? "Use portal" : "Select Plan"}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Selection + add-on + pay */}
      <Card className={cn("border-border", alreadySubscribed && "opacity-80")}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Checkout</CardTitle>
          <CardDescription className="text-xs">
            {alreadySubscribed
              ? "Checkout is only for new subscriptions. Use Manage subscription above for plan or add-on changes."
              : sub?.trialUsed === false 
                ? "Start your 14-day free trial. Select a plan above, choose add-ons, then pay securely with Stripe."
                : "Select a plan above, choose add-ons, then pay securely with Stripe."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedPlan ? (
                  <>
                    Selected plan: <span className="capitalize">{selectedPlan.name}</span>
                  </>
                ) : (
                  "No plan selected"
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                You can adjust add-ons before checkout.
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">Add-on: Extra reps</p>
              <p className="text-xs text-muted-foreground">
                {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] ? (
                  <>
                    <span className="mr-1">≈</span>
                    {formatCurrency(extraRepUnitDisplayUsd * rates[workspaceCurrency], workspaceCurrency)}
                  </>
                ) : (
                  formatCurrency(extraRepUnitDisplayUsd)
                )} per extra rep
                {payYearly ? " / year" : " / month"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter how many additional reps you want to add.
              {payYearly ? (
                <>
                  {" "}
                  Your add-on will be billed <strong className="text-foreground">yearly</strong> to match your plan.
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Input
                type="number"
                min={0}
                step={1}
                value={extraReps}
                onChange={(e) => setExtraReps(e.target.value)}
                className="max-w-[140px]"
                disabled={!selectedPlan || alreadySubscribed}
              />
              <span className="text-xs text-muted-foreground">reps</span>
            </div>
            {extraRepsQty > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-background/80 p-3">
                <span className="text-xs font-medium text-foreground">
                  Add-on total ({extraRepsQty} × {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] 
                    ? `≈${formatCurrency(extraRepUnitDisplayUsd * rates[workspaceCurrency], workspaceCurrency)}` 
                    : formatCurrency(extraRepUnitDisplayUsd)})
                </span>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] ? (
                    <>
                      <span className="mr-1 font-normal text-muted-foreground text-[10px]">≈</span>
                      {formatCurrency(extraRepsAddonTotalUsd * rates[workspaceCurrency], workspaceCurrency)}
                    </>
                  ) : (
                    formatCurrency(extraRepsAddonTotalUsd)
                  )}
                  <span className="text-xs font-normal text-muted-foreground ml-1">
                    {payYearly ? " / year" : " / month"}
                  </span>
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedPlan ? (
              <>
                Plan subscription at Stripe checkout, plus{" "}
                {extraRepsQty > 0 ? (
                  <>
                    <strong>{extraRepsQty}</strong> extra rep{extraRepsQty === 1 ? "" : "s"} at{" "}
                    <strong>
                      {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] 
                        ? `≈${formatCurrency(extraRepsAddonTotalUsd * rates[workspaceCurrency], workspaceCurrency)}` 
                        : formatCurrency(extraRepsAddonTotalUsd)}
                    </strong>
                    {payYearly ? " / year" : " / month"} (
                    {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] 
                      ? `≈${formatCurrency(extraRepUnitDisplayUsd * rates[workspaceCurrency], workspaceCurrency)}` 
                      : formatCurrency(extraRepUnitDisplayUsd)} each).
                  </>
                ) : (
                  <>no extra-rep add-on.</>
                )}
              </>
            ) : (
              "Select a plan to continue."
            )}
          </p>
          <Button
            className="sm:w-auto w-full"
            onClick={() => {
              if (!selectedPlan) {
                toast({ title: "Select a plan", description: "Pick a plan above to continue.", variant: "destructive" });
                return;
              }
              const priceId = payYearly ? selectedPlan.priceIdYearly : selectedPlan.priceIdMonthly;
              if (!priceId) {
                toast({ title: "Plan not configured", description: "This billing period is missing a Stripe price ID.", variant: "destructive" });
                return;
              }
              handleCheckout(priceId, selectedPlan.id, "subscription", extraRepsQty);
            }}
            disabled={loadingPlan !== null || !selectedPlan || alreadySubscribed}
          >
            {loadingPlan ? (
              <><Loader2 className="mr-2 size-4 animate-spin" />Redirecting…</>
            ) : alreadySubscribed ? (
              "Subscribed : use portal"
            ) : (
              "Continue to payment"
            )}
          </Button>
        </CardFooter>
      </Card>


      <p className="text-xs text-muted-foreground">
        Payments processed securely by Stripe. Subscriptions renew automatically and can be cancelled any time via the billing portal.
      </p>
    </div>
  );
}
