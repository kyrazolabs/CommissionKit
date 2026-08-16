import { useState, useEffect } from "react";
import { Menu, X, ChevronDown, LayoutGrid, Cable, Plug, ArrowRight, Bot, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics } from "@/lib/analytics";

const FEATURES_LINKS = [
  { name: "Features", desc: "Commission plans, deals, payouts", href: "/features" },
  { name: "Solutions", desc: "By role and team size", href: "/solutions" },
  { name: "MCP Integration", desc: "Connect your AI tools via MCP", href: "https://docs.commissionkit.co/guides/mcp", icon: "terminal" as const },
  { name: "CGent", desc: "AI agent for Telegram and Slack", href: "#", badge: "Soon", icon: "bot" as const },
];

const INTEGRATIONS = [
  { name: "Odoo", desc: "Sales orders, reps, invoices", href: "/integrations/odoo", badge: "ERP", img: "/plugins/odoo.webp" },
  { name: "HubSpot", desc: "Pipeline & contact sync", href: "/integrations/hubspot", badge: "CRM", img: "/plugins/hubspot.webp" },
  { name: "Salesforce", desc: "Opportunities & owners", href: "/integrations/salesforce", badge: "CRM", img: "/plugins/salesforce.webp" },
  { name: "Custom REST API", desc: "Any REST endpoint", href: "/integrations/custom", badge: "API", icon: true },
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const containerClasses = scrolled && !mobileMenuOpen
    ? "mt-4 max-w-7xl bg-card/95 backdrop-blur-sm shadow-sm border border-card-border " +
      (productOpen ? "rounded-xl " : "rounded-xl")
    : "mt-2 max-w-7xl bg-transparent border-transparent rounded-none " + (productOpen ? "max-w-7xl bg-card/95! backdrop-blur-sm shadow-sm" : "");

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className={`mx-2 xl:mx-auto px-4 transition-all duration-300 ${containerClasses}`}>

          {/* Top bar */}
          <div className="flex justify-between items-center w-full py-3">
            <div className="flex items-center gap-8">
              <a href="/home" className="flex items-center gap-2">
                <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="h-6" />
                <span className="text-xl font-bold text-foreground tracking-tight">Commission<span className="text-primary">Kit</span></span>
              </a>

              <nav className="hidden lg:flex gap-6 items-center">
                {/* Product trigger */}
                <button
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onMouseEnter={() => setProductOpen(true)}
                  onClick={() => setProductOpen(!productOpen)}
                >
                  Product
                  <ChevronDown className={`size-3.5 transition-transform ${productOpen ? "rotate-180" : ""}`} />
                </button>

                <a href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
                <a href="/careers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Careers</a>
                <a href="/blog" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Blog</a>
                <a href="/calculator" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Calculator</a>
                <a href="https://docs.commissionkit.co" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Docs</a>
              </nav>
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" className="font-bold text-primary hover:text-primary/80 hover:bg-primary/5" size="sm" asChild>
                <a href="/login" onClick={() => Analytics.landingCTAClick("navbar_login")}>Log In</a>
              </Button>
              <Button className="font-bold shadow-sm" size="sm" asChild>
                <a href="/register" onClick={() => Analytics.landingCTAClick("navbar_start")}>Start Now</a>
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="lg:hidden text-foreground" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
            </Button>
          </div>

          {/* Product dropdown — expands the navbar with animation */}
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${productOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
            <div className="overflow-hidden">
              <div
                className="py-6"
                onMouseLeave={() => setProductOpen(false)}
              >
                <div className="grid grid-cols-5 gap-6 max-w-7xl">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <LayoutGrid className="size-4 text-primary" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Platform</span>
                    </div>
                    <div className="space-y-1">
                      {FEATURES_LINKS.map((item) => (
                        <a key={item.name} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.badge ? "cursor-default" : "hover:bg-muted"}`}
                          onClick={item.badge ? (e) => e.preventDefault() : () => setProductOpen(false)}>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-base font-medium ${item.badge ? "text-muted-foreground" : "text-foreground"}`}>{item.name}</span>
                              {item.badge && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Cable className="size-4 text-primary" />
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Integrations</span>
                    </div>
                    <div className="space-y-1">
                      {INTEGRATIONS.map((item) => (
                        <a key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setProductOpen(false)}>
                          {item.img ? (
                            <img src={item.img} alt={item.name} className="size-6 object-contain shrink-0" />
                          ) : (
                            <div className="size-6 rounded bg-muted flex items-center justify-center shrink-0">
                              <Plug className="size-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-medium text-foreground">{item.name}</span>
                              <span className="text-xs font-medium px-1.5 rounded text-muted-foreground">
                                {item.badge}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>

                  {/* ── 3rd column: Rep Portal visual card ── */}
                  <div className="col-span-3">
                    <a
                      href="/portal"
                      className="group flex items-center gap-6 rounded-xl border border-card-border bg-card p-3 hover:border-primary/30 transition-all duration-300 hover:shadow-sm"
                      onClick={() => setProductOpen(false)}
                    >
                      {/* Image frame — fixed aspect-ratio, 3D frame with internal scroll */}
                      <div
                        className="relative w-[45%] aspect-video shrink-0 rounded-lg overflow-hidden bg-sidebar mx-0.5"
                        style={{
                          transform: 'perspective(900px) rotateY(-1deg) scale(1.06)',
                          transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}
                      >
                        <div className="absolute inset-x-0 top-0" style={{ animation: 'scroll-screenshot 7s ease-in-out infinite' }}>
                          <img
                            src="/screenshots/rep-portal-dashboard.png"
                            alt="Rep Portal dashboard preview"
                            className="w-full rounded-lg"
                          />
                        </div>
                        {/* Glow on hover via group */}
                        <div className="absolute inset-0 rounded-lg bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      </div>

                      {/* Text area — right side */}
                      <div className="flex-1 flex flex-col justify-center py-1 space-y-2.5">
                        <div>
                          <h4 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                            Transparent earnings. Zero questions.
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                            Self-serve commission dashboard for your reps. No corporate login or IT tickets. Just a unique access code.
                          </p>
                        </div>

                        {/* Feature pills */}
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5">
                            Real-time earnings
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5">
                            Deal breakdowns
                          </span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 rounded-md px-1.5 py-0.5">
                            Payout history
                          </span>
                        </div>

                        {/* CTA */}
                        <div className="flex items-center gap-1 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                          See the Rep Portal
                          <ArrowRight className="size-3" />
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div className={`fixed inset-0 z-40 bg-background flex flex-col pt-20 px-6 transition-transform duration-300 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col gap-6 text-lg font-medium text-foreground">
          <div className="pl-4 flex flex-col gap-4 border-b border-border pb-4">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</span>
            <a href="/features" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary">Features</a>
            <a href="/solutions" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary">Solutions</a>
            <a href="https://docs.commissionkit.co/guides/mcp" className="text-sm font-medium text-muted-foreground hover:text-primary">
              MCP Integration
            </a>
            <span className="text-sm font-medium text-muted-foreground/60 flex items-center gap-2">
              CGent
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">Soon</span>
            </span>
            <a href="/portal" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary">CKit Portal</a>
            <div className="mt-2 pt-2 border-t border-border/60">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Integrations</span>
              <div className="flex flex-col gap-3 mt-3">
                <a href="/integrations/odoo" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary">Odoo ERP</a>
                <a href="/integrations/hubspot" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary">HubSpot CRM</a>
                <a href="/integrations/salesforce" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary">Salesforce CRM</a>
                <a href="/integrations/custom" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-primary">Custom REST API</a>
              </div>
            </div>
          </div>
          <a href="/pricing" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Pricing</a>
          <a href="/careers" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Careers</a>
          <a href="/blog" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Blog</a>
          <a href="/calculator" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Calculator</a>
          <a href="https://docs.commissionkit.co" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Docs</a>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          <Button variant="outline" size="lg" asChild className="w-full justify-center">
            <a href="/login" onClick={() => Analytics.landingCTAClick("navbar_mobile_login")}>Log In</a>
          </Button>
          <Button size="lg" asChild className="w-full justify-center">
            <a href="/register" onClick={() => Analytics.landingCTAClick("navbar_mobile_start")}>Start Now</a>
          </Button>
        </div>
      </div>
    </>
  );
}
