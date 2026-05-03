import { useState } from "react";
import { Check, Zap, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

const BASE_URL = import.meta.env.BASE_URL.replace(/\/$/, "");

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "$49",
    period: "/month",
    description: "Perfect for small sales teams getting started.",
    icon: Zap,
    features: [
      "Up to 5 sales reps",
      "Unlimited commission plans",
      "Deal & commission tracking",
      "Monthly calculation runs",
      "Email support",
    ],
    priceId: "price_starter",
    highlighted: false,
  },
  {
    id: "growth",
    name: "Growth",
    price: "$149",
    period: "/month",
    description: "For growing teams that need more power.",
    icon: Building2,
    features: [
      "Up to 25 sales reps",
      "Advanced tiered plans",
      "Accelerator & clawback rules",
      "Rep self-service portal",
      "Priority support",
      "CSV export",
    ],
    priceId: "price_growth",
    highlighted: true,
  },
];

export function BillingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  const handleCheckout = async (priceId: string, planId: string) => {
    if (!session) {
      toast({ title: "Not signed in", description: "Please sign in first.", variant: "destructive" });
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await fetch(`${BASE_URL}/api/billing/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ priceId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const { url } = await res.json();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Checkout failed", description: err.message, variant: "destructive" });
      setLoadingPlan(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">Account</p>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">Billing & Plans</h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          Choose the plan that fits your team. Upgrade or downgrade at any time.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 max-w-3xl">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card
              key={plan.id}
              className={plan.highlighted ? "border-primary shadow-md ring-1 ring-primary" : ""}
            >
              <CardHeader className="pb-3">
                {plan.highlighted && (
                  <div className="mb-2">
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 mb-1">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <CardDescription className="mt-1">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="pb-4">
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleCheckout(plan.priceId, plan.id)}
                  disabled={loadingPlan !== null}
                >
                  {loadingPlan === plan.id ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Redirecting…</>
                  ) : (
                    `Get ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        Payments are processed securely by Stripe. You can cancel at any time from your account settings.
      </p>
    </div>
  );
}
