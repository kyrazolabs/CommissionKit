import { useState } from "react";
import { Navbar } from "./landing/Navbar";
import { Footer } from "./landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Check, Plus, Clock } from "lucide-react";
import { Analytics } from "@/lib/analytics";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 49.99,
    priceYearly: 499.99,
    discountMonthly: 19.99,
    discountYearly: 199.99,
    tagline: "Perfect for testing the product or tiny teams.",
    reps: "Includes up to 10 reps",
    features: [
      "Up to 3 workspace members",
      "Up to 3 commission plans",
      "Deal & commission tracking",
      "Unlimited calculation runs",
      "Rep self-service portal",
      "ERP/CRM integrations",
      "Email support (48h response)",
    ],
    highlighted: false,
    badge: null as string | null,
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 99.99,
    priceYearly: 999.99,
    discountMonthly: 39.99,
    discountYearly: 399.99,
    tagline: "For stable teams of 10+ reps.",
    reps: "Includes up to 30 reps",
    features: [
      "Up to 15 workspace members",
      "Unlimited commission plans",
      "Advanced tiered plans",
      "Accelerator & clawback rules",
      "Payout tracking & disputes",
      "CSV import & export",
      "ERP/CRM integrations",
      "Priority support",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "pro",
    name: "Professional",
    priceMonthly: 249.99,
    priceYearly: 2499.99,
    discountMonthly: 99.99,
    discountYearly: 999.99,
    tagline: "For serious sales organizations with advanced needs.",
    reps: "Includes up to 100 reps",
    features: [
      "Up to 50 workspace members",
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

const FAQ = [
  {
    q: "Can I change plans later?",
    a: "Yes. You can upgrade or downgrade at any time. When upgrading, you will be charged the prorated difference for the remainder of your billing period. When downgrading, the new rate takes effect at the start of your next billing cycle.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes. Every plan includes a 14-day free trial. No credit card is required to get started. You can explore all features during the trial period.",
  },
  {
    q: "What counts as a rep?",
    a: "A rep is any sales representative tracked in the platform. Only reps with assigned deals count toward your plan limit. Workspace members who are not reps do not count toward the rep limit.",
  },
  {
    q: "Do you offer custom plans?",
    a: "Yes. Our Business plan is fully customizable for larger organizations. Contact our sales team at sales@commissionk.it to discuss your requirements for custom commission engines, SSO, and dedicated infrastructure.",
  },
  {
    q: "How does billing work?",
    a: "You can choose monthly or annual billing. Annual billing includes approximately 17% savings and 2 months free. All prices are in USD. We accept all major credit cards.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no long-term contracts or cancellation fees. If you cancel, you will retain access through the end of your current billing period.",
  },
];

export function PricingPage() {
  usePageMeta({
    title: "Pricing — CommissionKit",
    description: "Simple, predictable pricing for commission management. Plans start at $19.99/month. 14-day free trial, no credit card required.",
    robots: "index, follow",
  });

  const [payYearly, setPayYearly] = useState(false);

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
              <Clock className="size-3.5 text-primary" />
              Pricing
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              Simple, predictable pricing
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your revenue team.
              <span className="text-primary font-medium"> Includes a 14-day free trial.</span>
            </p>
          </div>

          {/* Launch offer banner */}
          <div className="mb-10 max-w-5xl mx-auto">
            <div className="inline-flex w-full items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 border border-primary/30 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Limited-Time Launch Offer — 60% Off Forever</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Lock in 60% off forever — limited time for new customers. Applied automatically.</p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-primary/20 px-3 py-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">60% OFF</span>
            </div>
          </div>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mb-16">
            <Label
              htmlFor="pricing-billing-toggle"
              className={`text-sm font-medium ${!payYearly ? "text-foreground" : "text-muted-foreground"}`}
            >
              Monthly
            </Label>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 rounded-full border border-border/60">
              <Checkbox
                id="pricing-billing-toggle"
                checked={payYearly}
                onCheckedChange={(v) => setPayYearly(v === true)}
                className="size-4"
              />
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider">Save 17%</span>
            </div>
            <Label
              htmlFor="pricing-billing-toggle"
              className={`text-sm font-medium ${payYearly ? "text-foreground" : "text-muted-foreground"}`}
            >
              Yearly
            </Label>
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start mb-16">
            {PLANS.map((plan) => {
              const price = payYearly ? plan.priceYearly : plan.priceMonthly;
              const discountPrice = payYearly ? plan.discountYearly : plan.discountMonthly;
              const period = payYearly ? "/yr" : "/mo";

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl p-8 flex flex-col h-full ${
                    plan.highlighted
                      ? "bg-muted/30 border-2 border-primary shadow-md md:-translate-y-4"
                      : "bg-white border shadow-sm"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                      {plan.badge}
                    </div>
                  )}

                  <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{plan.tagline}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-primary tracking-tight">${discountPrice}</span>
                      <span className="text-sm text-muted-foreground">{period}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg text-muted-foreground line-through">${price}</span>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">60% OFF</span>
                    </div>
                    {payYearly && (
                      <p className="text-[11px] font-bold text-primary mt-1">Includes 2 months free</p>
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
                    className={`w-full font-bold ${plan.highlighted ? "shadow-sm" : ""}`}
                    onClick={() => Analytics.landingPricingCTAClick(plan.id)}
                  >
                    {plan.id === "pro" ? "Contact Sales" : plan.highlighted ? "Start Free Trial" : "Get Started"}
                  </Button>
                </div>
              );
            })}
          </div>

          {/* Business tier */}
          <div className="max-w-5xl mx-auto mb-20">
            <div className="rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">Business</h3>
                <p className="text-sm text-muted-foreground mb-4 md:mb-0">
                  Custom commission engines, SSO/SAML, dedicated infrastructure, and priority support for large organizations.
                </p>
                <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-foreground">
                  <li className="flex items-center gap-2"><Check className="size-4 text-primary shrink-0" /> Unlimited reps & members</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-primary shrink-0" /> SAML/SSO & SCIM</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-primary shrink-0" /> Custom Commission Engine</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-primary shrink-0" /> Dedicated account manager</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-primary shrink-0" /> Custom legal & SLA terms</li>
                  <li className="flex items-center gap-2"><Check className="size-4 text-primary shrink-0" /> On-premise deployment option</li>
                </ul>
              </div>
              <Button size="md" className="font-bold shadow-sm shrink-0" asChild>
                <a href="mailto:sales@commissionk.it" onClick={() => Analytics.landingPricingCTAClick("business")}>Contact Sales</a>
              </Button>
            </div>
          </div>

          {/* Extra reps add-on */}
          <div className="text-center mb-20">
            <p className="text-sm font-medium inline-flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-lg border">
              <Plus className="size-4 inline-block" />
              <span className="text-primary font-bold">${payYearly ? "32" : "3.20"}</span>
              <span className="text-muted-foreground">per additional rep/{payYearly ? "year" : "month"}</span>
              <span className="text-xs text-muted-foreground line-through">${payYearly ? "79.99" : "7.99"}</span>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">60% OFF</span>
            </p>
          </div>

          {/* FAQ */}
          <div className="max-w-3xl mx-auto border-t border-border pt-16">
            <h2 className="text-2xl font-bold text-foreground mb-10 tracking-tight text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q} className="p-5 rounded-xl border border-border bg-card">
                  <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </main>
      </main>
      <Footer />
    </>
  );
}
