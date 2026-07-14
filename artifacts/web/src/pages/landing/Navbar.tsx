import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics } from "@/lib/analytics";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className={`mx-2 md:mx-auto px-4 transition-all duration-300 ${
          scrolled && !mobileMenuOpen
            ? "mt-4 max-w-7xl rounded-xl bg-card/95 backdrop-blur-sm shadow-sm border border-card-border"
            : "mt-2 max-w-7xl bg-transparent rounded-none shadow-none border border-transparent"
        }`}>
          <div className="flex justify-between items-center w-full py-3">
          <div className="flex items-center gap-8">
            <a href="/home" className="flex items-center gap-2">
              <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="h-6" />
              <span className="text-xl font-bold text-foreground tracking-tight">Commission<span className="text-primary">Kit</span></span>
            </a>

            <nav className="hidden lg:flex gap-6 items-center">
              <a href="/features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="/solutions" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Solutions</a>
              <a href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
              <a href="/careers" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Careers</a>
              <a href="/blog" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Blog</a>
              <a href="/calculator" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Calculator</a>
              <a href="https://docs.commissionk.it" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Docs</a>
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

          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-background flex flex-col pt-20 px-6 transition-transform duration-300 lg:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex flex-col gap-6 text-lg font-medium text-foreground">
          <a href="/features" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Features</a>
          <a href="/solutions" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Solutions</a>
          <a href="/pricing" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Pricing</a>
          <a href="/careers" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Careers</a>
          <a href="/blog" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Blog</a>
          <a href="/calculator" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Calculator</a>
          <a href="https://docs.commissionk.it" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Docs</a>
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
