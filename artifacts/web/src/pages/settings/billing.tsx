import { useMemo, useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
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
import { NumberInput } from "@/components/number-input";
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
import { usePageMeta } from "@/hooks/use-page-meta";


const EXTRA_REP_UNIT_MONTHLY_USD = 8;
const EXTRA_REP_UNIT_YEARLY_USD = 80;
const EXTRA_REP_DISCOUNT_MONTHLY = 3.20;
const EXTRA_REP_DISCOUNT_YEARLY = 32;

// ─── Stripe price IDs (mirror API env: STRIPE_* → STRIPE_* for Vite) ───
const STRIPE_PRICE = {
  starter: {
    monthly: import.meta.env.STRIPE_STARTER_PRICE_ID ?? "",
    yearly: import.meta.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? "",
  },
  growth: {
    monthly: import.meta.env.STRIPE_GROWTH_PRICE_ID ?? "",
    yearly: import.meta.env.STRIPE_GROWTH_ANNUAL_PRICE_ID ?? "",
  },
  pro: {
    monthly: import.meta.env.STRIPE_PRO_PRICE_ID ?? "",
    yearly: import.meta.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
  },
};

const plans = [
  {
    id: "starter",
    name: "Starter",
    priceMonthlyUsd: 49.99,
    priceYearlyUsd: 499.99,
    discountMonthly: 19.99,
    discountYearly: 199.99,
    description: "Perfect for testing the product or tiny teams.",
    icon: Zap,
    iconBg: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    features: [
      "Up to 10 sales reps",
      "Up to 3 workspace members",
      "Up to 3 commission plans",
      "Deal & commission tracking",
      "Unlimited calculation runs",
      "ERP/CRM integrations",
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
    priceMonthlyUsd: 99.99,
    priceYearlyUsd: 999.99,
    discountMonthly: 39.99,
    discountYearly: 399.99,
    description: "For stable teams of 10+ reps.",
    icon: Building2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    features: [
      "Up to 30 sales reps",
      "Up to 15 workspace members",
      "Unlimited commission plans",
      "Advanced tiered plans",
      "Accelerator & clawback rules",
      "ERP/CRM integrations",
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
    priceMonthlyUsd: 249.99,
    priceYearlyUsd: 2499.99,
    discountMonthly: 99.99,
    discountYearly: 999.99,
    description: "For serious sales organizations with advanced needs.",
    icon: Crown,
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    features: [
      "Up to 100 sales reps",
      "Up to 50 workspace members",
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
  const { t } = useTranslation();
  if (sub.plan === "free") return null;

  const isActive   = sub.status === "active";
  const isPastDue  = sub.status === "past_due";
  const isCanceled = sub.status === "canceled";



  if (isPastDue) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-800/40 dark:bg-red-900/20">
        <AlertTriangle className="size-4 text-red-600 shrink-0" />
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          {t("billing.paymentFailed")}
        </p>
      </div>
    );
  }

  if (sub.cancelAtPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-800/40 dark:bg-orange-900/20">
        <AlertTriangle className="size-4 text-orange-600 shrink-0" />
        <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
          {t("billing.planCancels", { plan: sub.plan, date: formatDate(sub.currentPeriodEnd) })}
        </p>
      </div>
    );
  }

  if (isActive && sub.currentPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-800/40 dark:bg-green-900/20">
        <CheckCircle2 className="size-4 text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          {t("billing.planActive", { plan: sub.plan, date: formatDate(sub.currentPeriodEnd) })}
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
  const { t } = useTranslation();

  return (
    <Card className="border-border bg-card/50 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">{t("billing.usageAndLimits")}</CardTitle>
            <CardDescription className="text-xs">
              {t("billing.planLabel", { plan: currentPlan })}
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
              {t("billing.salesReps")}
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
               {t("billing.includesExtraSeats", { count: limits.reps - planBaseLimits.reps })}
             </p>
          )}
        </div>

        {/* Commission Plans */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 font-medium text-foreground">
              <FileText className="size-3.5 text-muted-foreground" />
              {t("billing.commissionPlans")}
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
              {t("billing.workspaceMembers")}
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
  const { t } = useTranslation();
  usePageMeta({ title: t("billing.title"), description: "Manage your CommissionKit subscription and billing details.", robots: "noindex, nofollow" });
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
     if (currentPlan === "free") return "growth";
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
      <div className="space-y-8 max-w-5xl">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-72 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!hasPermission("billing", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Crown className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("common.accessDenied")}</h2>
        <p className="text-sm text-muted-foreground">{t("billing.accessDenied")}</p>
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
      toast({ title: t("billing.checkoutError"), description: err.message, variant: "destructive" });
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

      toast({ title: t("billing.updated"), description: t("billing.updatedDescription", { count: qty }) });
      await refetch();
    } catch (err: any) {
      toast({ title: t("common.error"), description: err.message, variant: "destructive" });
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
      toast({ title: t("billing.couldNotOpenPortal"), description: err.message, variant: "destructive" });
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
    ? EXTRA_REP_DISCOUNT_YEARLY
    : EXTRA_REP_DISCOUNT_MONTHLY;
  const extraRepsAddonTotalUsd = extraRepsQty * extraRepUnitDisplayUsd;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">{t("sidebar.account")}</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">{t("billing.billingAndPlans")}</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {alreadySubscribed
              ? t("billing.alreadySubscribedDescription")
              : t("billing.choosePlanDescription")}
          </p>
        </div>
      </div>
      
      {!alreadySubscribed && sub?.trialUsed === false && (
        <div className="flex items-start gap-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
            <Zap className="size-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{t("billing.freeTrialAvailable")}</p>
            <p className="text-xs text-blue-800/80 dark:text-blue-200/60 mt-0.5">
              {t("billing.freeTrialDescription")}
            </p>
          </div>
        </div>
      )}

      {/* Launch offer banner */}
      <div className="flex items-start gap-4 rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary">
          <Gift className="size-4" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Limited-Time Launch Offer — 60% Off Forever</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Lock in 60% off for life on any plan. Applied automatically — no code needed.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/20 px-3 py-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">60% OFF</span>
      </div>

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
              <p className="text-sm font-semibold text-foreground">{t("billing.payYearlyTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                {t("billing.payYearlyDescription")}
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
                {t("billing.iWantAnnual")}
              </Label>
            </div>
          </div>
          {payYearly && (
            <p className="text-[11px] text-primary font-medium">
              {t("billing.viewingYearlyPricing")}
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
            <p className="text-sm font-semibold text-foreground capitalize">{sub.plan} {t("billing.plan")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("billing.billingPortalDescription")}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="gap-2 shrink-0">
            {portalLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ExternalLink className="size-3.5" />}
            {t("billing.manageSubscription")}
          </Button>
        </div>
      )}

      {alreadySubscribed && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/20">
          <AlertTriangle className="size-4 text-amber-700 shrink-0 mt-0.5 dark:text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{t("billing.checkoutDisabled")}</p>
            <p className="text-xs text-amber-900/85 dark:text-amber-200/90 mt-1 leading-relaxed">
              {t("billing.checkoutDisabledDescription")}
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
              {t("billing.manageAddons")}
            </CardTitle>
            <CardDescription className="text-xs">
              {t("billing.manageAddonsDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 space-y-1 w-full">
              <Label htmlFor="addon-reps" className="text-xs font-medium">{t("billing.extraRepSeats")}</Label>
              <div className="flex items-center gap-3">
                <NumberInput
                  id="addon-reps"
                  decimals={0}
                  value={extraReps}
                  onChange={(e) => setExtraReps(e.target.value)}
                  className="max-w-[120px]"
                />
                <span className="text-xs text-muted-foreground">{t("billing.totalAddonSeats")}</span>
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
                  {t("common.saving")}
                </>
              ) : (
                t("billing.saveAddon")
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plan cards */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">{t("billing.choosePlan")}</h2>
        {workspaceCurrency !== "USD" && (
          <div className="flex items-center gap-2">
            <Label htmlFor="currency-toggle" className="text-sm text-muted-foreground">
              {t("billing.showInCurrency", { currency: workspaceCurrency === "SAR" ? "Riyal" : workspaceCurrency === "AED" ? "Dirham" : workspaceCurrency })}
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
                    {isCurrent ? t("billing.currentPlanBadge") : plan.badge}
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
                  <span className="text-3xl font-semibold text-primary">
                    {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] ? (
                      <span className="flex items-baseline gap-1">
                        <span className="text-xl text-muted-foreground font-normal">≈</span>
                        {formatCurrency((payYearly ? plan.discountYearly : plan.discountMonthly) * rates[workspaceCurrency], workspaceCurrency)}
                      </span>
                    ) : (
                      "$" + (payYearly ? plan.discountYearly : plan.discountMonthly)
                    )}
                  </span>
                  <span className="text-sm text-muted-foreground">{payYearly ? t("billing.perYear") : t("billing.perMonth")}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm text-muted-foreground line-through">
                    {showLocalCurrency && workspaceCurrency !== "USD" ? (
                      "≈" + formatCurrency((payYearly ? plan.priceYearlyUsd : plan.priceMonthlyUsd) * (rates[workspaceCurrency] || 1), workspaceCurrency)
                    ) : (
                      "$" + (payYearly ? plan.priceYearlyUsd : plan.priceMonthlyUsd)
                    )}
                  </span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">60% OFF</span>
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
                    {t("billing.currentPlan")}
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
                    {isSelected ? t("billing.selected") : alreadySubscribed ? t("billing.usePortal") : t("billing.selectPlan")}
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
          <CardTitle className="text-sm font-semibold">{t("billing.checkout")}</CardTitle>
          <CardDescription className="text-xs">
            {alreadySubscribed
              ? t("billing.checkoutDisabledForSubscribed")
              : sub?.trialUsed === false 
                ? t("billing.checkoutTrialDescription")
                : t("billing.checkoutDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {selectedPlan ? (
                  <>
                    {t("billing.selectedPlan")}: <span className="capitalize">{selectedPlan.name}</span>
                  </>
                ) : (
                  t("billing.noPlanSelected")
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("billing.canAdjustBeforeCheckout")}
              </p>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold">{t("billing.addonExtraReps")}</p>
              <p className="text-xs text-muted-foreground">
                {showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] ? (
                  <>
                    <span className="mr-1">≈</span>
                    {formatCurrency(extraRepUnitDisplayUsd * rates[workspaceCurrency], workspaceCurrency)}
                  </>
                ) : (
                  formatCurrency(extraRepUnitDisplayUsd)
                )} {t("billing.perExtraRep")}
                <span className="text-xs text-muted-foreground line-through ml-1">
                  {payYearly ? "$79.99" : "$7.99"}
                </span>
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded ml-1.5">60% OFF</span>
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("billing.enterExtraRepsDescription")}
              {payYearly ? (
                <>
                  {" "}
                  {t("billing.billedYearly")}
                </>
              ) : null}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <NumberInput
                decimals={0}
                value={extraReps}
                onChange={(e) => setExtraReps(e.target.value)}
                className="max-w-[140px]"
                disabled={!selectedPlan || alreadySubscribed}
              />
              <span className="text-xs text-muted-foreground">{t("billing.repsLabel")}</span>
            </div>
            {extraRepsQty > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-background/80 p-3">
                <span className="text-xs font-medium text-foreground">
                  {t("billing.addonTotal", { count: extraRepsQty, price: showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] 
                    ? `≈${formatCurrency(extraRepUnitDisplayUsd * rates[workspaceCurrency], workspaceCurrency)}` 
                    : formatCurrency(extraRepUnitDisplayUsd) })}
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
                    {payYearly ? t("billing.perYear") : t("billing.perMonth")}
                  </span>
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedPlan ? (
              <>{t("billing.stripeCheckoutSummary", { reps: extraRepsQty, annual: payYearly, priceFormatted: showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] 
                      ? `≈${formatCurrency(extraRepsAddonTotalUsd * rates[workspaceCurrency], workspaceCurrency)}` 
                      : formatCurrency(extraRepsAddonTotalUsd), perUnitFormatted: showLocalCurrency && workspaceCurrency !== "USD" && rates[workspaceCurrency] 
                      ? `≈${formatCurrency(extraRepUnitDisplayUsd * rates[workspaceCurrency], workspaceCurrency)}` 
                      : formatCurrency(extraRepUnitDisplayUsd) })}</>
            ) : (
              t("billing.selectPlanDescription")
            )}
          </p>
          <Button
            className="sm:w-auto w-full"
            onClick={() => {
              if (!selectedPlan) {
                toast({ title: t("billing.selectPlanTitle"), description: t("billing.selectPlanDescription"), variant: "destructive" });
                return;
              }
              const priceId = payYearly ? selectedPlan.priceIdYearly : selectedPlan.priceIdMonthly;
              if (!priceId) {
                toast({ title: t("billing.planNotConfigured"), description: t("billing.planNotConfiguredDescription"), variant: "destructive" });
                return;
              }
              handleCheckout(priceId, selectedPlan.id, "subscription", extraRepsQty);
            }}
            disabled={loadingPlan !== null || !selectedPlan || alreadySubscribed}
          >
            {loadingPlan ? (
              <><Loader2 className="mr-2 size-4 animate-spin" />{t("billing.redirecting")}</>
            ) : alreadySubscribed ? (
              t("billing.subscribedUsePortal")
            ) : (
              t("billing.continueToPayment")
            )}
          </Button>
        </CardFooter>
      </Card>


      <p className="text-xs text-muted-foreground">
        {t("billing.stripeFooter")}
      </p>
    </div>
  );
}
