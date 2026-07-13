import { Footer } from "./landing/Footer";
import { Navbar } from "./landing/Navbar";
import { usePageMeta } from "@/hooks/use-page-meta";
import { getActiveJobs } from "@/lib/jobs";
import { Link } from "wouter";
import { MapPin, Clock, ArrowRight, Briefcase } from "lucide-react";

export function CareersPage() {
  usePageMeta({
    title: "Careers",
    description: "Join CommissionKit. We're building the future of sales commission management.",
    robots: "index, follow",
  });

  const jobs = getActiveJobs();

  return (
    <>
      <Navbar />
      <main className="pt-36 md:pt-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 sm:pt-24 md:pt-32 pb-16 md:pb-28 w-full">
          {/* Hero */}
          <div className="mb-16 md:mb-20">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Join the team
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl">
              We're building the platform that helps sales teams get paid what they deserve. If you're passionate about sales, fintech, and great product experiences, we'd love to hear from you.
            </p>
          </div>

          {/* Culture / Values */}
          <div className="grid gap-6 md:grid-cols-3 mb-16 md:mb-20">
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Clock className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Flexible & Remote</h3>
              <p className="text-sm text-muted-foreground">Work from anywhere on your own schedule. Results matter more than hours logged.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <Briefcase className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Fair Compensation</h3>
              <p className="text-sm text-muted-foreground">Competitive commissions and recurring revenue share. The better you perform, the more you earn.</p>
            </div>
            <div className="p-6 rounded-xl border border-border bg-card">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <MapPin className="size-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Global Impact</h3>
              <p className="text-sm text-muted-foreground">Help sales teams across the GCC, Europe, and beyond eliminate commission chaos.</p>
            </div>
          </div>

          {/* Open Positions */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 tracking-tight">Open positions</h2>
            <p className="text-muted-foreground mb-8">
              {jobs.length} open {jobs.length === 1 ? "position" : "positions"} right now
            </p>

            {jobs.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-border rounded-xl">
                <Briefcase className="size-10 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No open positions at the moment</p>
                <p className="text-sm text-muted-foreground/70 mt-1">Check back soon or follow us on LinkedIn for updates.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <Link
                    key={job.slug}
                    href={`/careers/${job.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground text-lg group-hover:text-primary transition-colors">
                          {job.title}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {job.type === "contract" ? "Contract" : job.type === "full-time" ? "Full-time" : "Part-time"}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          <Clock className="size-3" />
                          {job.schedule === "full-time" ? "Full-time" : "Part-time"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Briefcase className="size-3.5" />
                          {job.department}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="size-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="size-3.5" />
                          {job.schedule === "full-time" ? "Full-time" : "Part-time"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-primary shrink-0">
                      View & Apply
                      <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
