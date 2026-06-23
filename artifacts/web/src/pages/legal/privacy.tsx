import { useRef } from "react";
import { Navbar } from "../landing/Navbar";
import { Footer } from "../landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { motion, useScroll, useTransform } from "framer-motion";
import { useIsMobile } from "@/pages/landing/hooks";
import { Shield, Eye, Database, FileText, Lock, UserCheck } from "lucide-react";

const SECTIONS = [
  {
    icon: Database,
    title: "Information We Collect",
    content:
      "We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.",
  },
  {
    icon: Eye,
    title: "Use of Information",
    content:
      "We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.",
  },
  {
    icon: Lock,
    title: "Data Sharing",
    content:
      "We don't share any personally identifying information publicly or with third-parties, except when required to by law. Your data stays within your workspace and is never sold or monetized.",
  },
  {
    icon: UserCheck,
    title: "Your Rights",
    content:
      "You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services. You may request deletion of your data at any time by contacting us.",
  },
];

export function PrivacyPage() {
  usePageMeta({ title: "Privacy Policy", description: "Learn how CommissionKit collects and uses your data.", robots: "index, follow" });

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
                Legal
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Privacy Policy</h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your privacy is important to us. Here is how we collect, use, and protect your information.
              </p>
            </div>

            <div className="space-y-6">
              {SECTIONS.map((section, i) => {
                const Icon = section.icon;
                return (
                  <div key={section.title} className="p-6 rounded-xl border border-border bg-card">
                    <div className="flex items-start gap-4">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                        <Icon className="size-5" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground mb-2">
                          {i + 1}. {section.title}
                        </h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">{section.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 flex items-center gap-2 text-xs text-muted-foreground/60">
              <FileText className="size-3" />
              Last updated: May 16, 2024
            </div>
          </main>
        </motion.div>
      </motion.div>
      <Footer scrollY={scrollY} />
    </div>
  );
}
