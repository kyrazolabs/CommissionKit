import { Navbar } from "../landing/Navbar";
import { Footer } from "../landing/Footer";
import { usePageMeta } from "@/hooks/use-page-meta";


export function TermsPage() {
  usePageMeta({ title: "Terms of Service", description: "CommissionKit terms of service and usage agreement.", robots: "index, follow" });
  return (
    <div className="min-h-screen flex flex-col bg-sidebar selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-8 tracking-tight">Terms of Service</h1>
        <div className="prose prose-slate max-w-none text-muted-foreground space-y-6">
          <p className="text-lg leading-relaxed">
            By accessing the website at CommissionKit, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
          </p>
          
          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">1. Use License</h2>
          <p>
            Permission is granted to temporarily download one copy of the materials (information or software) on CommissionKit's website for personal, non-commercial transitory viewing only.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">2. Disclaimer</h2>
          <p>
            The materials on CommissionKit's website are provided on an 'as is' basis. CommissionKit makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">3. Limitations</h2>
          <p>
            In no event shall CommissionKit or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on CommissionKit's website.
          </p>

          <h2 className="text-2xl font-semibold text-foreground mt-12 mb-4">4. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which CommissionKit operates and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
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
