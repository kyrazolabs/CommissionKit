import { Clock, Mail, MapPin, MessageCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Footer } from "./landing/Footer";
import { Navbar } from "./landing/Navbar";

export function ContactPage() {
  usePageMeta({
    title: "Contact",
    description:
      "Get in touch with the CommissionKit team for sales, support, or general inquiries.",
    keywords:
      "contact sales commission software, commission management support, sales comp help, get commission software demo",
    robots: "index, follow",
  });

  return (
    <>
      <Navbar />
      <main className="pt-16">
        <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-16 w-full">
          <h1 className="text-4xl font-bold text-foreground mb-4 tracking-tight">Contact Us</h1>
          <p className="text-muted-foreground text-lg mb-12 max-w-2xl">
            Have questions about CommissionKit? We are here to help. Reach out for sales inquiries,
            support, or anything else.
          </p>

          <div className="grid gap-6 md:grid-cols-2 mb-16">
            <a
              href="mailto:sales@commissionkit.co"
              className="flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                <Mail className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Sales</h3>
                <p className="text-sm text-muted-foreground">sales@commissionkit.co</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Inquiries about plans, pricing, and demos.
                </p>
              </div>
            </a>

            <a
              href="mailto:support@commissionkit.co"
              className="flex items-start gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/30 transition-colors group"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
                <MessageCircle className="size-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Support</h3>
                <p className="text-sm text-muted-foreground">support@commissionkit.co</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Technical help and troubleshooting.
                </p>
              </div>
            </a>
          </div>

          <div className="border-t border-border pt-12 space-y-6">
            <div className="flex items-start gap-3">
              <Clock className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Response Time</h3>
                <p className="text-sm text-muted-foreground">
                  We typically respond within 2 hours during business hours (Mon–Fri, 9am–6pm EST).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="size-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground">Location</h3>
                <p className="text-sm text-muted-foreground">
                  CommissionKit is a fully remote team serving customers worldwide.
                </p>
              </div>
            </div>
          </div>
        </main>
      </main>
      <Footer />
    </>
  );
}
