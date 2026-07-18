import { Navbar } from "../landing/Navbar";
import { Footer } from "../landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Shield, Database, FileText } from "lucide-react";

const SECTIONS = [
  {
    icon: Database,
    title: "Information We Collect",
    content:
      "We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we're collecting it and how it will be used.",
  },
  {
    icon: Shield,
    title: "Use of Information",
    content:
      "We only retain collected information for as long as necessary to provide you with your requested service. What data we store, we protect within commercially acceptable means to prevent loss and theft, as well as unauthorized access, disclosure, copying, use or modification.",
  },
  {
    icon: Shield,
    title: "Data Sharing",
    content:
      "We don't share any personally identifying information publicly or with third-parties, except when required to by law. Your data stays within your workspace and is never sold or monetized.",
  },
  {
    icon: Shield,
    title: "Your Rights",
    content:
      "You are free to refuse our request for your personal information, with the understanding that we may be unable to provide you with some of your desired services. You may request deletion of your data at any time by contacting us.",
  },
];

export function PrivacyPage() {
  usePageMeta({ title: "Privacy Policy", description: "Learn how CommissionKit collects and uses your data.", robots: "index, follow" });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
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
      </main>
      <Footer />
    </>
  );
}
