import { useState } from "react";
import { useInView } from "./hooks";
import { Button } from "@/components/ui/button";
import { ArrowRight, Star, ShieldCheck, Mail } from "lucide-react";
import { Analytics } from "@/lib/analytics";
import { AnimatedWords, AnimatedBlock } from "./AnimatedText";

const TRUST_METRICS = [
  { value: "8 days", label: "→ 4 hours", sub: "per cycle" },
  { value: "99%", label: "fewer disputes", sub: "vs. sheets" },
  { value: "<30 min", label: "to go live", sub: "no consultants" },
];

export function Hero() {
  const { ref: inViewRef, inView } = useInView();
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Analytics.landingCTAClick("hero_start");
    const params = new URLSearchParams();
    if (email.trim()) params.set("email", email.trim());
    window.location.href = `/register${params.toString() ? `?${params}` : ""}`;
  };

  return (
    <section className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden" id="hero">
      {/* Ambient gradient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[460px] pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.16), transparent 62%)",
        }}
      />
      {/* Subtle curves */}
      <img
        src="/decorative/left-curves.svg"
        alt=""
        aria-hidden
        className="absolute left-0 top-1/2 -translate-y-1/2 w-[30%] max-w-[360px] opacity-[0.10] dark:opacity-[0.06] pointer-events-none z-0"
      />
      <img
        src="/decorative/right-curves.svg"
        alt=""
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 w-[30%] max-w-[360px] opacity-[0.10] dark:opacity-[0.06] pointer-events-none z-0 -scale-x-100"
      />

      <div ref={inViewRef} className="max-w-4xl mx-auto text-center relative z-10 py-20">
        {/* Rating + trust pill */}
        <AnimatedBlock inView={inView} delay={0} className="inline-flex">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/60 dark:bg-white/5 backdrop-blur-sm border border-border/60 text-xs font-medium text-foreground mb-6">
            <div className="flex">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star key={i} className="size-3 fill-primary text-primary" />
              ))}
            </div>
            <span className="text-muted-foreground">Loved by finance & RevOps teams</span>
            <span className="h-3 w-px bg-border" />
            <span className="text-primary font-semibold">14-day free trial</span>
          </div>
        </AnimatedBlock>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-[-0.07em] text-foreground leading-[0.95] font-display">
          <AnimatedWords text="Run commissions in minutes." inView={inView} delay={0.15} />
          <br />
          <AnimatedWords text="Not days." className="text-primary" inView={inView} delay={0.75} />
        </h1>

        <AnimatedBlock inView={inView} delay={1.1} y={20}>
          <p
            className="text-base md:text-lg text-muted-foreground mt-6 mb-8 leading-relaxed max-w-xl mx-auto"
          >
            One click processes every rep, every deal, every plan. The commission runs
            that used to swallow 8 days now finish in 4 hours — flawlessly, every time.
          </p>
        </AnimatedBlock>

        {/* Email capture form */}
        <AnimatedBlock inView={inView} delay={1.3} y={20}>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto"
          >
          <div className="focus relative w-full sm:flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none z-10" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email"
              className="w-full h-10 pl-10 pr-3 rounded-lg bg-white/70 dark:bg-white/5 backdrop-blur-sm border border-border/60 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
              aria-label="Email address"
            />
          </div>
          <Button type="submit" size="md" className="w-full h-9 sm:w-auto font-bold shadow-lg shrink-0 group">
              Start Free Trial
              <ArrowRight className="ml-1.5 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </form>
        </AnimatedBlock>

        <AnimatedBlock inView={inView} delay={1.5} y={12}>
          <p className="mt-5 text-xs text-muted-foreground/70 flex items-center justify-center gap-3 flex-wrap">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> No credit card required</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Set up in under 10 minutes</span>
            <span className="hidden sm:inline text-border">·</span>
            <span>Cancel anytime</span>
          </p>
        </AnimatedBlock>

        {/* Trust metrics bar */}
        <AnimatedBlock inView={inView} delay={1.7} y={20} className="mt-12 grid grid-cols-3 gap-3 max-w-lg mx-auto">
          {TRUST_METRICS.map((m) => (
            <div
              key={m.label}
              className="rounded-lg bg-white/50 dark:bg-white/5 backdrop-blur-sm border border-border/60 px-3 py-3.5 text-center"
            >
              <div className="text-xl md:text-2xl font-bold text-foreground tracking-tight font-display tabular-nums">
                {m.value}
              </div>
              <div className="text-[11px] font-semibold text-primary mt-0.5">{m.label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>
            </div>
          ))}
        </AnimatedBlock>
      </div>
    </section>
  );
}
