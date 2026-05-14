import { useMemo, useState, useEffect, useCallback } from "react";
import { Check, Zap, Building2, Infinity as InfinityIcon, Loader2, ExternalLink, Crown, AlertTriangle, CheckCircle2, Gift, Users, FileText, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListReps,
  getListRepsQueryKey,
  useListPlans,
  getListPlansQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { useBillingStatus, type SubscriptionStatus } from "@/hooks/use-billing-status";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

/** Shown add-on math in UI. Stripe uses your price IDs at checkout. */
const EXTRA_REP_UNIT_MONTHLY_USD = 4;
const EXTRA_REP_UNIT_YEARLY_USD = 40;

// ─── Stripe price IDs (mirror API env: STRIPE_* → VITE_STRIPE_* for Vite) ───
const STRIPE_PRICE = {
  starter: import.meta.env.VITE_STRIPE_STARTER_PRICE_ID ?? "price_1TSwQIBA7ra9J8VO3P4tgtLi",
  lite: import.meta.env.VITE_STRIPE_LITE_PRICE_ID ?? "",
  growth: import.meta.env.VITE_STRIPE_GROWTH_PRICE_ID ?? "price_1TSwQHBA7ra9J8VOxFgWrEHg",
  annual: import.meta.env.VITE_STRIPE_ANNUAL_PRICE_ID ?? "price_1TVwbbBA7ra9J8VOok7hEjEG",
};

const plans = [
  {
    id: "lite",
    name: "Lite",
    price: "$19",
    period: "/month",
    description: "Cheaper plan for small teams that need the basics.",
    icon: InfinityIcon,
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    features: [
      "Up to 5 sales reps",
      "Up to 2 commission plans",
      "Deal & commission tracking",
      "Unlimited calculation runs",
      "Email support",
    ],
    priceId: STRIPE_PRICE.lite,
    highlighted: false,
    badge: "Lowest Price",
    mode: "subscription" as const,
  },
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    period: "/month",
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
    priceId: STRIPE_PRICE.starter,
    highlighted: false,
    badge: null as string | null,
    mode: "subscription" as const,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$99",
    period: "/month",
    description: "For stable teams of 8+ reps.",
    icon: Building2,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    features: [
      "Up to 50 sales reps",
      "Unlimited commission plans",
      "Advanced tiered plans",
      "Accelerator & clawback rules",
      "Rep self-service portal",
      "Priority support (24h)",
      "CSV export",
    ],
    priceId: STRIPE_PRICE.growth,
    highlighted: true,
    badge: "Most Popular",
    mode: "subscription" as const,
  },
  {
    id: "annual",
    name: "Growth Annual",
    price: "$990",
    period: "/year",
    description: "Committed teams saving 17% vs monthly.",
    icon: Crown,
    iconBg: "bg-purple-50 dark:bg-purple-900/20",
    iconColor: "text-purple-600 dark:text-purple-400",
    features: [
      "Everything in Growth",
      "2 months free vs monthly",
      "Quarterly commission audit",
      "Dedicated onboarding call",
    ],
    priceId: STRIPE_PRICE.annual,
    highlighted: false,
    badge: "Save 17%",
    mode: "subscription" as const,
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
      <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-800/40 dark:bg-red-900/20">
        <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
        <p className="text-sm font-medium text-red-800 dark:text-red-300">
          Payment failed — please update your payment method to keep access.
        </p>
      </div>
    );
  }

  if (sub.cancelAtPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 dark:border-orange-800/40 dark:bg-orange-900/20">
        <AlertTriangle className="h-4 w-4 text-orange-600 shrink-0" />
        <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
          Your <strong>{sub.plan}</strong> plan cancels on{" "}
          <strong>{formatDate(sub.currentPeriodEnd)}</strong>. Reactivate in the portal to keep access.
        </p>
      </div>
    );
  }

  if (isActive && sub.currentPeriodEnd) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 dark:border-green-800/40 dark:bg-green-900/20">
        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        <p className="text-sm font-medium text-green-800 dark:text-green-300">
          <strong className="capitalize">{sub.plan}</strong> plan active — renews{" "}
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
  limits: PlanLimitsRow;
  planBaseLimits: PlanLimitsRow;
  repsCount: number | null;
  plansCount: number | null;
  membersCount: number | null;
}) {
  const planName = sub?.plan ?? "free";
  const extraPurchased = sub?.extraRepSeats ?? 0;
  const repsUsed = repsCount ?? 0;
  const plansUsed = plansCount ?? 0;
  const membersUsed = membersCount ?? 0;
  const showDash = (n: number | null) => (n === null ? "—" : String(n));

  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Usage & limits</CardTitle>
        <CardDescription className="text-xs">
          Current workspace caps for your{" "}
          <span className="font-medium capitalize text-foreground">{planName}</span> plan
          {extraPurchased > 0 ? " (including purchased extra rep seats)." : "."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <UserRound className="h-4 w-4 shrink-0 text-primary" />
              Sales reps
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {repsLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
              ) : limits.reps === -1 ? (
                <>
                  {showDash(repsCount)} / <span className="text-foreground font-medium">Unlimited</span>
                </>
              ) : (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{repsUsed}</span>
                    <span>/</span>
                    <span>{limits.reps}</span>
                  </div>
                  <span className="text-[10px] font-medium text-primary/80">
                    {Math.max(0, limits.reps - repsUsed)} remaining
                  </span>
                </div>
              )}
            </span>
          </div>
          {limits.reps !== -1 && (
            <Progress value={usagePercent(repsUsed, limits.reps)} className="h-1.5" />
          )}
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Included with plan: <strong className="text-foreground">{formatCap(planBaseLimits.reps)}</strong>{" "}
            sales rep{planBaseLimits.reps === 1 ? "" : "s"}.
            {extraPurchased > 0 ? (
              <>
                {" "}
                Purchased <strong className="text-foreground">{extraPurchased}</strong> extra rep seat
                {extraPurchased === 1 ? "" : "s"} (add-on). You can change add-on quantity from{" "}
                <strong className="text-foreground">Manage subscription</strong> when Stripe Customer Portal exposes it.
              </>
            ) : (
              <> No extra rep add-on on this subscription.</>
            )}
          </p>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <FileText className="h-4 w-4 shrink-0 text-primary" />
              Commission plans
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {plansLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
              ) : limits.plans === -1 ? (
                <>
                  <span className="font-medium text-foreground">{plansUsed}</span>
                  {" / "}
                  <span className="text-foreground font-medium">Unlimited</span>
                </>
              ) : (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{plansUsed}</span>
                    <span>/</span>
                    <span>{limits.plans}</span>
                  </div>
                  <span className="text-[10px] font-medium text-primary/80">
                    {Math.max(0, limits.plans - plansUsed)} remaining
                  </span>
                </div>
              )}
            </span>
          </div>
          {limits.plans !== -1 && (
            <Progress value={usagePercent(plansUsed, limits.plans)} className="h-1.5" />
          )}
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Users className="h-4 w-4 shrink-0 text-primary" />
              Team members
            </span>
            <span className="text-sm tabular-nums text-muted-foreground">
              {membersLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin inline" />
              ) : limits.members === -1 ? (
                <>
                  {membersCount ?? 0} / <span className="text-foreground font-medium">Unlimited</span>
                </>
              ) : (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-foreground">{membersUsed}</span>
                    <span>/</span>
                    <span>{limits.members}</span>
                  </div>
                  <span className="text-[10px] font-medium text-primary/80">
                    {Math.max(0, limits.members - membersUsed)} remaining
                  </span>
                </div>
              )}
            </span>
          </div>
          {limits.members !== -1 && (
            <Progress value={usagePercent(membersUsed, limits.members)} className="h-1.5" />
          )}
          <p className="text-[11px] text-muted-foreground">
            Count includes active and pending invites (same limit as the Team page).
          </p>
        </div>

        <div className="rounded-lg border border-dashed border-border/80 bg-muted/15 px-3 py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-medium text-foreground">Purchased extra rep seats (add-on)</span>
            <span className="tabular-nums font-semibold text-foreground">{extraPurchased}</span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
            These seats are added on top of your plan’s included reps and appear in the sales rep cap above after checkout or portal sync.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function BillingPage() {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { sub, limits, planBaseLimits, refetch } = useBillingStatus();

  const currentPlan = sub?.plan ?? "free";
  const ACTIVE_BILLING_SUB_STATUSES = new Set([
    "active",
    "trialing",
    "past_due",
    "unpaid",
    "paused",
  ]);
  const alreadySubscribed =
    Boolean(sub) &&
    currentPlan !== "free" &&
    ACTIVE_BILLING_SUB_STATUSES.has(sub.status);

  const { data: reps, isLoading: repsLoading } = useListReps({
    query: {
      queryKey: getListRepsQueryKey(),
      enabled: Boolean(activeWorkspace?.id),
    },
  });
  const { data: commissionPlans, isLoading: plansLoading } = useListPlans({
    query: {
      queryKey: getListPlansQueryKey(),
      enabled: Boolean(activeWorkspace?.id),
    },
  });

  const repsCount = Array.isArray(reps) ? reps.length : null;
  const plansCount = Array.isArray(commissionPlans) ? commissionPlans.length : null;

  const [membersCount, setMembersCount] = useState<number | null>(null);
  const [membersLoading, setMembersLoading] = useState(false);

  const fetchMemberCount = useCallback(async () => {
    if (!activeWorkspace?.id) {
      setMembersCount(null);
      return;
    }
    setMembersLoading(true);
    try {
      const res = await fetch(
        `${API_URL}/api/workspaces/${activeWorkspace.id}/members`,
        { credentials: "include" },
      );
      if (res.ok) {
        const data = await res.json();
        setMembersCount(Array.isArray(data) ? data.length : 0);
      } else {
        setMembersCount(null);
      }
    } catch {
      setMembersCount(null);
    } finally {
      setMembersLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    void fetchMemberCount();
  }, [fetchMemberCount]);

  const [loadingPlan, setLoadingPlan]   = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  /** When true, show Growth Annual instead of monthly Growth (only yearly offering). */
  const [payYearly, setPayYearly] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [extraReps, setExtraReps] = useState<string>("0");
  const [addonRepsQty, setAddonRepsQty] = useState("0");
  const [addonSaving, setAddonSaving] = useState(false);

  // Check for success/cancel query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      const plan = params.get("plan");
      toast({
        title: "Payment successful!",
        description: `Your ${plan} plan is now active.`,
      });
      window.history.replaceState({}, "", "/billing");
      void refetch();
      void queryClient.invalidateQueries({ queryKey: getListRepsQueryKey() });
      void queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
      void fetchMemberCount();
    }
    if (params.get("checkout") === "cancelled") {
      toast({ title: "Checkout cancelled", description: "No charge was made." });
      window.history.replaceState({}, "", "/billing");
    }
  }, [toast, refetch, queryClient, fetchMemberCount]);

  useEffect(() => {
    if (sub?.extraRepSeats !== undefined) {
      setAddonRepsQty(String(sub.extraRepSeats));
    }
  }, [sub?.extraRepSeats]);

  const handleUpdateAddonReps = async () => {
    if (!session) {
      toast({ title: "Not signed in", variant: "destructive" });
      return;
    }
    if (!activeWorkspace?.id) {
      toast({ title: "No workspace selected", variant: "destructive" });
      return;
    }
    const q = Math.max(0, Math.min(500, Math.floor(Number(addonRepsQty || 0))));
    if (!Number.isFinite(q)) {
      toast({
        title: "Invalid amount",
        description: "Enter a whole number between 0 and 500.",
        variant: "destructive",
      });
      return;
    }
    setAddonSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/billing/extra-reps`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": activeWorkspace.id,
        },
        body: JSON.stringify({ quantity: q }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Update failed");
      }
      const data = (await res.json()) as { extraRepSeats: number };
      toast({
        title: "Extra rep seats updated",
        description: `Add-on is now ${data.extraRepSeats} seat${data.extraRepSeats === 1 ? "" : "s"}. Stripe may prorate the change on your next invoice.`,
      });
      void refetch();
      void queryClient.invalidateQueries({ queryKey: getListRepsQueryKey() });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Update failed";
      toast({
        title: "Could not update add-on",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setAddonSaving(false);
    }
  };

  const handleCheckout = async (priceId: string, planId: string, mode: "subscription" | "payment", extraRepsQty: number) => {
    if (alreadySubscribed) {
      toast({
        title: "You already have a subscription",
        description:
          "Use Manage subscription to change your base plan, or use Extra rep seats below to change add-ons. Another checkout would bill you twice.",
        variant: "destructive",
      });
      return;
    }
    if (!session) {
      toast({ title: "Not signed in", description: "Please sign in first.", variant: "destructive" });
      return;
    }
    if (!activeWorkspace?.id) {
      toast({ title: "No workspace selected", variant: "destructive" });
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await fetch(`${API_URL}/api/billing/checkout`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": activeWorkspace.id,
        },
        body: JSON.stringify({ priceId, mode, extraReps: extraRepsQty }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Checkout failed");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    if (!activeWorkspace?.id) return;
    setPortalLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/billing/portal`, {
        method: "POST",
        credentials: "include",
        headers: { "x-workspace-id": activeWorkspace.id },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Portal error");
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Could not open portal", description: err.message, variant: "destructive" });
    } finally {
      setPortalLoading(false);
    }
  };

  const handlePayYearlyChange = (checked: boolean) => {
    setPayYearly(checked);
    setSelectedPlanId((prev) => {
      if (checked && prev === "growth") return "annual";
      if (!checked && prev === "annual") return "growth";
      return prev;
    });
  };

  // Monthly tiers + optional Growth Annual swap (yearly is Growth-only)
  const displayPlans = useMemo(() => {
    const filtered = plans.filter((p) => {
      if (p.id === "lite" && !p.priceId) return false;
      if (payYearly) return p.id !== "growth";
      return p.id !== "annual";
    });
    return filtered;
  }, [payYearly]);

  const selectedPlan = displayPlans.find((p) => p.id === selectedPlanId) ?? null;
  const extraRepsQty = Math.max(0, Math.floor(Number(extraReps || 0)));
  const isAnnualGrowth = selectedPlan?.id === "annual";
  const extraRepUnitDisplayUsd = isAnnualGrowth
    ? EXTRA_REP_UNIT_YEARLY_USD
    : EXTRA_REP_UNIT_MONTHLY_USD;
  const extraRepsAddonTotalUsd = extraRepsQty * extraRepUnitDisplayUsd;

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Account</p>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">Billing & Plans</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {alreadySubscribed
              ? "You’re subscribed. Use Manage subscription to change your plan or add-on seats — new checkout is disabled so you aren’t charged twice."
              : "Choose a plan, add extra reps if you need them, then continue to secure checkout."}
          </p>
        </div>
      </div>

      {/* Growth yearly upsell — only for workspaces not already on a paid subscription */}
      {!alreadySubscribed && (
      <div
        className={cn(
          "flex items-start gap-3 sm:gap-4 rounded-xl border p-4 sm:p-4 transition-all",
          payYearly
            ? "border-primary/40 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent shadow-sm ring-1 ring-primary/15"
            : "border-border bg-muted/20 hover:bg-muted/35",
        )}
      >
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Gift className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Pay yearly, get 2 months free</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xl">
                Applies to <strong className="text-foreground">Growth</strong> only: see <strong className="text-foreground">Growth Annual</strong> below with the same features and a lower effective monthly rate.
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
              You’re viewing yearly pricing — the Growth card is replaced by Growth Annual.
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
        <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground capitalize">{sub.plan} Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Billing portal: update payment method, invoices, or cancel.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePortal} disabled={portalLoading} className="gap-2 shrink-0">
            {portalLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />}
            Manage Subscription
          </Button>
        </div>
      )}

      {alreadySubscribed && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
          <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 dark:text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">New checkout is turned off</p>
            <p className="text-xs text-amber-900/85 dark:text-amber-200/90 mt-1 leading-relaxed">
              You already have an active paid subscription on this workspace. Starting another Stripe checkout would create a <strong>second subscription</strong> and charge you again. To <strong>change your base plan</strong> (for example Growth to Growth Annual), use{" "}
              <strong>Manage subscription</strong>. To <strong>add or remove extra rep seats</strong> on this subscription, use the form below.
            </p>
          </div>
        </div>
      )}

      {alreadySubscribed && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Extra rep seats (this subscription)</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Set the <strong>total</strong> number of paid extra rep seats (0–500). Stripe updates your existing subscription and may create prorations (usually on your next invoice).{" "}
              {currentPlan === "annual" ? (
                <>This plan uses your <strong>yearly</strong> extra-rep Stripe price.</>
              ) : (
                <>This plan uses your <strong>monthly</strong> extra-rep Stripe price.</>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2 flex-1 max-w-[200px]">
              <Label htmlFor="addon-reps-qty">Total extra rep seats</Label>
              <Input
                id="addon-reps-qty"
                type="number"
                min={0}
                max={500}
                step={1}
                value={addonRepsQty}
                onChange={(e) => setAddonRepsQty(e.target.value)}
              />
            </div>
            <Button
              type="button"
              className="sm:shrink-0 w-full sm:w-auto"
              onClick={() => void handleUpdateAddonReps()}
              disabled={addonSaving}
            >
              {addonSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border whitespace-nowrap",
                    plan.id === "annual" || plan.id === "lite"
                      ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/40"
                      : "bg-primary text-primary-foreground border-primary",
                  )}>
                    {isCurrent ? "✓ Current Plan" : plan.badge}
                  </span>
                </div>
              )}

              <CardHeader className="pb-3 pt-7">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", plan.iconBg)}>
                    <Icon className={cn("h-4 w-4", plan.iconColor)} />
                  </div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-1 text-[13px]">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="pb-4 flex-1">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[13px] text-foreground">
                      <Check className={cn("h-3.5 w-3.5 shrink-0", plan.iconColor)} />
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
                    <Check className="mr-2 h-4 w-4" />
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
          <CardTitle className="text-sm font-bold">Checkout</CardTitle>
          <CardDescription className="text-xs">
            {alreadySubscribed
              ? "Checkout is only for new subscriptions. Use Manage subscription above for plan or add-on changes."
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
                {formatCurrency(extraRepUnitDisplayUsd)} per extra rep
                {isAnnualGrowth ? " / year" : " / month"}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter how many additional reps you want to add.
              {isAnnualGrowth ? (
                <>
                  {" "}
                  With <strong className="text-foreground">Growth Annual</strong>, the add-on uses your{" "}
                  <strong className="text-foreground">yearly</strong> extra-rep Stripe price.
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
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-background/80 px-3 py-2">
                <span className="text-xs font-medium text-foreground">
                  Add-on total ({extraRepsQty} × {formatCurrency(extraRepUnitDisplayUsd)})
                </span>
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatCurrency(extraRepsAddonTotalUsd)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {isAnnualGrowth ? " / year" : " / month"}
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
                    <strong>{formatCurrency(extraRepsAddonTotalUsd)}</strong>
                    {isAnnualGrowth ? " / year" : " / month"} ({formatCurrency(extraRepUnitDisplayUsd)} each).
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
              if (!selectedPlan.priceId) {
                toast({ title: "Plan not configured", description: "This plan is missing a Stripe price ID.", variant: "destructive" });
                return;
              }
              handleCheckout(selectedPlan.priceId, selectedPlan.id, selectedPlan.mode, extraRepsQty);
            }}
            disabled={loadingPlan !== null || !selectedPlan || alreadySubscribed}
          >
            {loadingPlan ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting…</>
            ) : alreadySubscribed ? (
              "Subscribed — use portal"
            ) : (
              "Continue to payment"
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Positioning Note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Choosing between Lite and Growth?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Lite</strong> fits small teams that want core tracking with tight limits.
            <strong> Growth</strong> is built for larger teams that need advanced commission structures and exports.
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Payments processed securely by Stripe. Subscriptions renew automatically and can be cancelled any time via the billing portal.
      </p>
    </div>
  );
}
