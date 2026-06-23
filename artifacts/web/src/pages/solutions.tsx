import { useRef } from "react";
import { Navbar } from "./landing/Navbar";
import { Footer } from "./landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/pages/landing/hooks";
import {
  Building2,
  BarChart3,
  ArrowRightLeft,
  Rocket,
  Factory,
  Users,
  CreditCard,
  Globe,
  ArrowRight,
  Zap,
  ShieldCheck,
} from "lucide-react";

const SOLUTIONS = [
  {
    icon: Building2,
    title: "Finance Teams",
    desc: "Replace error-prone spreadsheets with an automated commission engine. Close the books faster with audit-ready calculations and a complete trail for every payout.",
    highlights: [
      "Eliminate shadow accounting and manual reconciliation",
      "Audit-ready calculation logs for every run",
      "Batch processing for month-end close",
    ],
  },
  {
    icon: BarChart3,
    title: "Sales Operations",
    desc: "Design and manage commission plans that actually motivate your team. Test plan scenarios before rollout and get real-time visibility into rep performance.",
    highlights: [
      "Flat, tiered, and accelerator plan structures",
      "Plan scenario modeling and forecasting",
      "Rep performance dashboards and leaderboards",
    ],
  },
  {
    icon: ArrowRightLeft,
    title: "Revenue Operations",
    desc: "Unify your revenue data pipeline. Ingest deals from any source, assign them to the right reps, and generate payout-ready commission calculations automatically.",
    highlights: [
      "CSV/XLSX bulk import with column mapping",
      "Flexible deal assignment and attribution",
      "API and webhook integrations",
    ],
  },
  {
    icon: Rocket,
    title: "Startups & Scale-ups",
    desc: "Launch your first commission plan in minutes. Start with simple flat-rate structures and graduate to tiered plans as your team grows — all on the same platform.",
    highlights: [
      "14-day free trial, no credit card required",
      "Simple setup with guided onboarding",
      "Scales from 2 reps to 2,000",
    ],
  },
  {
    icon: Factory,
    title: "Enterprise",
    desc: "Custom commission engines for complex organizational structures. Matrix-based calculations, multi-level hierarchies, and dedicated support for your unique requirements.",
    highlights: [
      "Custom engine development (Aissol matrix engine)",
      "Dedicated support and SLA guarantees",
      "SSO, advanced RBAC, and audit compliance",
    ],
  },
  {
    icon: Users,
    title: "Agencies & Service Firms",
    desc: "Track commissions across client engagements and project-based revenue. Flexible plans that adapt to your unique billing and compensation models.",
    highlights: [
      "Project-based commission attribution",
      "Multi-currency support for global clients",
      "Transparent rep portal for distributed teams",
    ],
  },
];

const DIFFERENTIATORS = [
  {
    icon: Zap,
    title: "10x Faster Close",
    desc: "What used to take finance teams days now takes minutes. Automated runs process thousands of deals instantly.",
  },
  {
    icon: ShieldCheck,
    title: "100% Audit-Ready",
    desc: "Every calculation step is logged. Every adjustment is tracked. Your auditors will thank you.",
  },
  {
    icon: Globe,
    title: "Global by Default",
    desc: "Multi-currency, multi-language, timezone-aware. Built for teams that work across borders.",
  },
  {
    icon: CreditCard,
    title: "Transparent Pricing",
    desc: "No per-rep fees. No surprise overages. Simple plan-based pricing that scales with your needs.",
  },
];

export function SolutionsPage() {
  usePageMeta({
    title: "Solutions — CommissionKit",
    description:
      "Commission management solutions for finance teams, sales ops, startups, and enterprises. Automate commissions at any scale.",
    robots: "index, follow",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });
  const isMobile = useIsMobile();

  const paddingLeft = useTransform(scrollY, [0, 400], ["0px", isMobile ? "12px" : "56px"]);
  const paddingRight = useTransform(scrollY, [0, 400], ["0px", isMobile ? "12px" : "56px"]);
  const paddingTop = useTransform(scrollY, [0, 400], ["0px", isMobile ? "56px" : "56px"]);
  const paddingBottom = useTransform(scrollY, [0, 400], ["0px", isMobile ? "90px" : "50px"]);
  const borderRadius = useTransform(scrollY, [0, 400], ["0px", "16px"]);
  const borderWidth = useTransform(scrollY, [0, 400], ["0px", "1px"]);
  const maxWidth = useTransform(scrollY, [0, 800], ["2560px", isMobile ? "100%" : "1400px"]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar selection:bg-primary/20 selection:text-primary">
      <Navbar containerRef={containerRef} />
      <motion.div style={{ paddingLeft, paddingRight, paddingTop, paddingBottom }} className="flex flex-1 overflow-hidden justify-center items-start w-full">
        <motion.div
          ref={containerRef}
          style={{ borderRadius, borderWidth, maxWidth }}
          className="w-full mx-auto h-full bg-background overflow-y-auto overflow-x-hidden border-card-border relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 md:pt-32 pb-16 md:pb-28 w-full">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
                <Users className="size-3.5 text-primary" />
                Built for Teams of Every Size
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
                Commission Management for Every Team
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you are a 5-person startup or a 5,000-person enterprise, CommissionKit
                adapts to your commission structure — not the other way around.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-20">
              {SOLUTIONS.map((solution) => {
                const Icon = solution.icon;
                return (
                  <div
                    key={solution.title}
                    className="p-6 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors flex flex-col"
                  >
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{solution.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{solution.desc}</p>
                    <ul className="space-y-2 mt-auto">
                      {solution.highlights.map((h) => (
                        <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="size-3 text-primary shrink-0 mt-0.5" />
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-border pt-16">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                  Why Teams Choose CommissionKit
                </h2>
                <p className="text-muted-foreground">
                  Purpose-built for commission management — not a repurposed spreadsheet or generic tool.
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {DIFFERENTIATORS.map((d) => {
                  const Icon = d.icon;
                  return (
                    <div key={d.title} className="text-center p-5">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto mb-3">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-1.5 text-sm">{d.title}</h3>
                      <p className="text-xs text-muted-foreground">{d.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        </motion.div>
      </motion.div>
      <Footer scrollY={scrollY} />
    </div>
  );
}
