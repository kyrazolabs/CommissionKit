import { Navbar } from "./landing/Navbar";
import { Footer } from "./landing/Footer";
import { Shield, Lock, Eye, Cloud } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";


export function SecurityPage() {
  usePageMeta({ title: "Security", description: "CommissionKit security practices and data protection information.", robots: "index, follow" });
  const features = [
    {
      title: "Data Encryption",
      desc: "All data is encrypted at rest using AES-256 and in transit using TLS 1.3.",
      icon: Lock
    },
    {
      title: "Isolated Workspaces",
      desc: "Multi-tenant architecture ensures strict data isolation between different organization accounts.",
      icon: Shield
    },
    {
      title: "Continuous Monitoring",
      desc: "We perform automated security scanning and real-time threat detection across our infrastructure.",
      icon: Eye
    },
    {
      title: "Cloud Infrastructure",
      desc: "Hosted on industry-leading cloud providers with SOC2 and ISO 27001 certifications.",
      icon: Cloud
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-sidebar selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight text-center">Enterprise-Grade Security</h1>
        <p className="text-xl text-muted-foreground mb-16 text-center max-w-2xl mx-auto">
          We protect your financial and team data with industry-leading security practices.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {features.map(f => (
            <div key={f.title} className="p-8 rounded-2xl border bg-white shadow-sm">
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <f.icon className="size-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">Security Audits</h2>
          <p>
            We regularly undergo third-party security audits and penetration testing to ensure our systems remain resilient against emerging threats. Our team is committed to maintaining the highest standards of data integrity.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">Responsible Disclosure</h2>
          <p>
            If you believe you have found a security vulnerability in CommissionKit, please contact our security team immediately at security@commissionkit.com. We appreciate your help in keeping our community safe.
          </p>

          <p className="mt-12 text-sm italic">
            Last updated: May 16, 2024
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
