import { useInView, fadeIn } from "./hooks";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 49,
    priceYearly: 490,
    tagline: "Perfect for testing the product or tiny teams.",
    reps: "Includes up to 10 reps",
    features: [
      "Up to 3 commission plans",
      "Deal & commission tracking",
      "Unlimited calculation runs",
      "Email support (48h response)",
    ],
    highlighted: false,
    badge: null as string | null,
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 99,
    priceYearly: 990,
    tagline: "For stable teams of 8+ reps.",
    reps: "Includes up to 30 reps",
    features: [
      "Unlimited commission plans",
      "Advanced tiered plans",
      "Accelerator & clawback rules",
      "Rep self-service portal",
      "Priority support",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 249,
    priceYearly: 2490,
    tagline: "For serious sales organizations with advanced needs.",
    reps: "Includes up to 100 reps",
    features: [
      "Everything in Growth",
      "SAML/SSO Authentication",
      "Custom API limits",
      "Dedicated account manager",
      "Custom legal terms",
    ],
    highlighted: false,
    badge: "Best Value",
  },
];

export function Pricing() {
  const { ref, inView } = useInView();
  const [payYearly, setPayYearly] = useState(false);

  return (
    <section className="py-24 px-6 md:px-12 bg-white/50 backdrop-blur-sm border-t border-border/60" id="pricing">
      <div ref={ref} className="max-w-[1440px] mx-auto">
        <div className="text-center mb-10" style={fadeIn(inView)}>
          <h2 className="text-3xl lg:text-[32px] font-bold text-foreground mb-4 tracking-tight">
            Simple, predictable pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your revenue team. <br /> <span className="text-primary font-medium">Includes a 14-day free trial.</span>
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center justify-center gap-3 mb-16" style={fadeIn(inView, 100)}>
          <Label 
            htmlFor="billing-toggle" 
            className={`text-sm font-medium ${!payYearly ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Monthly
          </Label>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-full border border-border/60">
            <Checkbox 
              id="billing-toggle" 
              checked={payYearly} 
              onCheckedChange={(v) => setPayYearly(v === true)}
              className="size-4"
            />
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Save 17%</span>
          </div>
          <Label 
            htmlFor="billing-toggle" 
            className={`text-sm font-medium ${payYearly ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Yearly
          </Label>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {PLANS.map((plan, i) => {
            const price = payYearly ? plan.priceYearly : plan.priceMonthly;
            const period = payYearly ? "/yr" : "/mo";

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-muted/30 border-2 border-primary shadow-md md:-translate-y-4"
                    : "bg-white border shadow-sm"
                }`}
                style={fadeIn(inView, i * 100 + 200)}
              >
                {/* Badge */}
                {(plan.badge || (payYearly && plan.id === "pro")) && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {payYearly && plan.id === "pro" ? "Best Value" : plan.badge}
                  </div>
                )}

                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.tagline}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-foreground tracking-tight">${price}</span>
                  <span className="text-sm text-muted-foreground">{period}</span>
                  {payYearly && (
                    <p className="text-[11px] font-bold text-primary mt-1">
                      Includes 2 months free
                    </p>
                  )}
                </div>
                
                <p className="text-xs font-semibold text-muted-foreground mb-8">{plan.reps}</p>
                
                <ul className="space-y-4 flex-grow mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className="size-5 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  size="lg" 
                  variant={plan.highlighted ? "default" : "outline"} 
                  className={`w-full font-bold ${plan.highlighted ? 'shadow-sm' : ''}`}
                >
                  {plan.id === "pro" ? "Contact Sales" : plan.highlighted ? "Start Free Trial" : "Get Started"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Extra reps add-on */}
        <div className="text-center mt-12" style={fadeIn(inView, 500)}>
          <p className="text-sm text-muted-foreground font-medium bg-muted/50 inline-block px-4 py-2 rounded-lg border">
            <Plus className="size-4 inline-block align-text-bottom mr-1" />
            ${payYearly ? "80" : "8"} per additional rep/{payYearly ? "year" : "month"} on all plans
          </p>
        </div>
      </div>
    </section>
  );
}
