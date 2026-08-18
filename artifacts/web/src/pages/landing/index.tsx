import { useEffect } from "react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Analytics } from "@/lib/analytics";
import { CustomEngine } from "./CustomEngine";
import { Demo } from "./Demo";
import { FAQ } from "./FAQ";
import { FeatureDeepDives } from "./FeatureDeepDives";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { GlobalSupport } from "./GlobalSupport";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { Integrations } from "./Integrations";
import { McpSupport } from "./McpSupport";
import { Navbar } from "./Navbar";
import { Pricing } from "./Pricing";
import { SocialProof } from "./SocialProof";
import { TheProblem } from "./TheProblem";
import { ValueProps } from "./ValueProps";

export function LandingPage() {
  usePageMeta({
    title: "CommissionKit — Sales Commission Platform",
    description:
      "Automate sales commissions for your team. Track reps, deals, and payouts — all in one place.",
    keywords:
      "commissions systems, commission systems, commission software, commissions software, software for commission sales, commission sales software, sales rep commission software, sales commission management software",
    robots: "index, follow",
  });

  useEffect(() => {
    Analytics.landingView();
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <Hero />
        <TheProblem />
        <SocialProof />
        <HowItWorks />
        <ValueProps />
        <FeatureDeepDives />
        <Integrations />
        <McpSupport />
        <GlobalSupport />
        <Demo />
        <Pricing />
        <CustomEngine />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
