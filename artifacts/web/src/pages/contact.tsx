import { Navbar } from "./landing/Navbar";
import { Footer } from "./landing/Footer";
import { Mail, MessageCircle, Clock, MapPin } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

export function ContactPage() {
  usePageMeta({ title: "Contact", description: "Get in touch with the CommissionKit team for sales, support, or general inquiries.", robots: "index, follow" });

  return (
    <div className="min-h-screen flex flex-col bg-sidebar selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
          Have questions about CommissionKit? We are here to help. Reach out for sales inquiries, support, or anything else.
        </p>

        <div className="grid gap-6 md:grid-cols-2 mb-16">
          <a
            href="mailto:sales@commissionk.it"
            className="flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
              <Mail className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Sales</h3>
              <p className="text-sm text-muted-foreground">sales@commissionk.it</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Inquiries about plans, pricing, and demos.</p>
            </div>
          </a>

          <a
            href="mailto:support@commissionk.it"
            className="flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Support</h3>
              <p className="text-sm text-muted-foreground">support@commissionk.it</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Technical help and troubleshooting.</p>
            </div>
          </a>
        </div>

        <div className="border-t border-border pt-12 space-y-6">
          <div className="flex items-start gap-3">
            <Clock className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">Response Time</h3>
              <p className="text-sm text-muted-foreground">We typically respond within 2 hours during business hours (Mon–Fri, 9am–6pm EST).</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground">Location</h3>
              <p className="text-sm text-muted-foreground">CommissionKit is a fully remote team serving customers worldwide.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
