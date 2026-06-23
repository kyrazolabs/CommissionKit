import { useRef } from "react";
import { Navbar } from "../landing/Navbar";
import { Footer } from "../landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/pages/landing/hooks";
import { Shield, Lock, Eye, Cloud, Search, Mail } from "lucide-react";

const FEATURES = [
  { title: "Data Encryption", desc: "All data is encrypted at rest using AES-256 and in transit using TLS 1.3.", icon: Lock },
  { title: "Isolated Workspaces", desc: "Multi-tenant architecture ensures strict data isolation between different organization accounts.", icon: Shield },
  { title: "Continuous Monitoring", desc: "We perform automated security scanning and real-time threat detection across our infrastructure.", icon: Eye },
  { title: "Cloud Infrastructure", desc: "Hosted on industry-leading cloud providers with SOC2 and ISO 27001 certifications.", icon: Cloud },
];

const PRACTICES = [
  {
    icon: Search,
    title: "Security Audits",
    content:
      "We regularly undergo third-party security audits and penetration testing to ensure our systems remain resilient against emerging threats. Our team is committed to maintaining the highest standards of data integrity.",
  },
  {
    icon: Mail,
    title: "Responsible Disclosure",
    content:
      "If you believe you have found a security vulnerability in CommissionKit, please contact our security team immediately at security@commissionk.it. We appreciate your help in keeping our community safe.",
  },
];

export function SecurityPage() {
  usePageMeta({ title: "Security", description: "CommissionKit security practices and data protection information.", robots: "index, follow" });

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
          <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 md:pt-32 pb-16 md:pb-28 w-full">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
                <Shield className="size-3.5 text-primary" />
                Trust & Compliance
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Enterprise-Grade Security</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We protect your financial and team data with industry-leading security practices.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 mb-16">
              {FEATURES.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="p-6 rounded-xl border border-border bg-card">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                      <Icon className="size-5" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              {PRACTICES.map((section) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="p-6 rounded-xl border border-border bg-card">
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground mb-2">{section.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <p className="text-xs text-muted-foreground/60">
                Last updated: May 16, 2024
              </p>
            </div>
          </main>
        </motion.div>
      </motion.div>
      <Footer scrollY={scrollY} />
    </div>
  );
}
