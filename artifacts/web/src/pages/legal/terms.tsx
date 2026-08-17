import { AlertTriangle, FileText, Globe, Scale, Shield } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Footer } from "../landing/Footer";
import { Navbar } from "../landing/Navbar";

const SECTIONS = [
  {
    icon: FileText,
    title: "Use License",
    content:
      "Permission is granted to temporarily download one copy of the materials (information or software) on CommissionKit's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.",
  },
  {
    icon: AlertTriangle,
    title: "Disclaimer",
    content:
      "The materials on CommissionKit's website are provided on an 'as is' basis. CommissionKit makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.",
  },
  {
    icon: Shield,
    title: "Limitations",
    content:
      "In no event shall CommissionKit or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CommissionKit's website.",
  },
  {
    icon: Globe,
    title: "Governing Law",
    content:
      "These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which CommissionKit operates and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.",
  },
];

export function TermsPage() {
  usePageMeta({
    title: "Terms of Service",
    description: "CommissionKit terms of service and usage agreement.",
    robots: "index, follow",
  });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground mb-6">
              <Scale className="size-3.5 text-primary" />
              Legal
            </div>
            <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              By accessing CommissionKit, you agree to these terms. Please read them carefully.
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
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {section.content}
                      </p>
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
      </main>
      <Footer />
    </>
  );
}
