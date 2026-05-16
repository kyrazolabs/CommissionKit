import { useInView, fadeIn } from "./hooks";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLANS_MONTHLY = [
  {
    id: "lite",
    name: "Lite",
    price: 19,
    period: "/mo",
    tagline: "Cheaper plan for small teams that need the basics.",
    reps: "Includes up to 5 reps",
    features: [
      "Up to 2 commission plans",
      "Deal & commission tracking",
      "Unlimited calculation runs",
      "Email support",
    ],
    highlighted: false,
    badge: "Lowest Price",
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    period: "/mo",
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
    price: 99,
    period: "/mo",
    tagline: "For stable teams of 8+ reps.",
    reps: "Includes up to 50 reps",
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
];

export function Pricing() {
  const { ref, inView } = useInView();

  return (
    <section className="py-24 px-6 md:px-12 bg-white/50 backdrop-blur-sm border-t border-border/60" id="pricing">
      <div ref={ref} className="max-w-[1440px] mx-auto">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <h2 className="text-3xl lg:text-[32px] font-bold text-foreground mb-4 tracking-tight">
            Simple, predictable pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the perfect plan for your revenue team.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-center">
          {PLANS_MONTHLY.map((plan, i) => {
            
            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-muted/30 border-2 border-primary shadow-md md:-translate-y-4"
                    : "bg-white border shadow-sm"
                }`}
                style={fadeIn(inView, i * 100)}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {plan.badge}
                  </div>
                )}

                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-6">{plan.tagline}</p>
                
                <div className="mb-2">
                  <span className="text-4xl font-extrabold text-foreground tracking-tight">${plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>

                {plan.id === "growth" && (
                  <div className="mb-6">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                      Or $990/year — Get 2 months free
                    </span>
                  </div>
                )}
                
                {plan.id !== "growth" && <div className="h-[22px] mb-6" />}
                
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
        <div className="text-center mt-12" style={fadeIn(inView, 400)}>
          <p className="text-sm text-muted-foreground font-medium bg-muted/50 inline-block px-4 py-2 rounded-lg border">
            <Plus className="size-4 inline-block align-text-bottom mr-1" />
            $4 per additional rep/month on all plans
          </p>
        </div>
      </div>
    </section>
  );
}
