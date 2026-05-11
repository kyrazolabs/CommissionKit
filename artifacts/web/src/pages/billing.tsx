import { useState, useEffect } from "react";
import { Check, Zap, Building2, Infinity as InfinityIcon, Loader2, ExternalLink, Crown, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";
import { useBillingStatus } from "@/hooks/use-billing-status";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

// ─── Real Stripe price IDs ────────────────────────────────────────────────────
const plans = [
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
    priceId: "price_1TSwQIBA7ra9J8VO3P4tgtLi",
    highlighted: false,
    badge: null as string | null,
    mode: "subscription" as const,
  },
  {
    id: "flex",
    name: "Flex",
    price: "$12",
    period: "/rep/mo",
    description: "Best for small or variable teams (3–8 reps).",
    icon: InfinityIcon,
    iconBg: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    features: [
      "Pay only for active reps",
      "All Growth features included",
      "Unlimited commission plans",
      "Rep self-service portal",
      "Perfect for seasonal teams",
    ],
    priceId: "price_1TVwYcBA7ra9J8VOvNnoscbn",
    highlighted: false,
    badge: "Most Flexible",
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
    priceId: "price_1TSwQHBA7ra9J8VOxFgWrEHg",
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
    priceId: "price_1TVwbbBA7ra9J8VOok7hEjEG",
    highlighted: false,
    badge: "Save 17%",
    mode: "subscription" as const,
  },
];

// ─── Types ────────────────────────────────────────────────────────────────────
import { type SubscriptionStatus } from "@/hooks/use-billing-status";

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

export function BillingPage() {
  const { session } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const { sub } = useBillingStatus();

  const [loadingPlan, setLoadingPlan]   = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  // Check for success/cancel query params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
      const plan = params.get("plan");
      toast({
        title: "Payment successful!",
        description: `Your ${plan} plan is now active.`,
      });
      // Clean URL
      window.history.replaceState({}, "", "/billing");
    }
    if (params.get("checkout") === "cancelled") {
      toast({ title: "Checkout cancelled", description: "No charge was made." });
      window.history.replaceState({}, "", "/billing");
    }
  }, []);

  const handleCheckout = async (priceId: string, planId: string, mode: "subscription" | "payment") => {
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
        body: JSON.stringify({ priceId, mode }),
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

  const currentPlan = sub?.plan ?? "free";

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">Account</p>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">Billing & Plans</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Choose the plan that fits your team. Upgrade, downgrade, or switch to annual at any time.
        </p>
      </div>

      {/* Status banner */}
      {sub && <StatusBanner sub={sub} />}

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

      {/* Plan cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent  = currentPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-shadow",
                plan.highlighted && "border-primary shadow-md ring-1 ring-primary",
                isCurrent && "ring-2 ring-primary/60",
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold border whitespace-nowrap",
                    plan.id === "annual"
                      ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800/40"
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
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => handleCheckout(plan.priceId, plan.id, plan.mode)}
                    disabled={loadingPlan !== null}
                  >
                    {loadingPlan === plan.id ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting…</>
                    ) : currentPlan !== "free" ? (
                      "Switch Plan"
                    ) : (
                      `Get ${plan.name}`
                    )}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Positioning Note */}
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            Choosing between Flex and Growth?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>Flex</strong> is best for teams <strong>under 8 reps</strong> or teams that fluctuate seasonally. 
            <strong> Growth</strong> is the most cost-effective for stable teams of <strong>8 or more reps</strong>.
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Payments processed securely by Stripe. Subscriptions renew automatically and can be cancelled any time via the billing portal.
      </p>
    </div>
  );
}
