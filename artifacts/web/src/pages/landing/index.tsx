import { useEffect } from "react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { SocialProof } from "./SocialProof";
import { HowItWorks } from "./HowItWorks";
import { ValueProps } from "./ValueProps";
import { FeatureDeepDives } from "./FeatureDeepDives";
import { Integrations } from "./Integrations";
import { GlobalSupport } from "./GlobalSupport";
import { Demo } from "./Demo";
import { Pricing } from "./Pricing";
import { CustomEngine } from "./CustomEngine";
import { FAQ } from "./FAQ";
import { FinalCTA } from "./FinalCTA";
import { Footer } from "./Footer";
import { Analytics } from "@/lib/analytics";
import { usePageMeta } from "@/hooks/use-page-meta";

export function LandingPage() {
  usePageMeta({
    title: "CommissionKit — Sales Commission Platform",
    description: "Automate sales commissions for your team. Track reps, deals, and payouts — all in one place.",
    keywords: "commissions systems, commission systems, commission software, commissions software, software for commission sales, commission sales software, sales rep commission software, sales commission management software",
    robots: "index, follow",
  });

  useEffect(() => {
    Analytics.landingView();
    document.documentElement.style.scrollBehavior = "smooth";
    return () => { document.documentElement.style.scrollBehavior = "smooth"; };
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto">
          <Hero />
          <SocialProof />
          <HowItWorks />
          <ValueProps />
          <FeatureDeepDives />
          <Integrations />
          <GlobalSupport />
          {/* WARNING: Do not delete this component — leave it as is. */}
          {/* <Demo /> */}
          <Pricing />
          <CustomEngine />
          <FAQ />
          <FinalCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
