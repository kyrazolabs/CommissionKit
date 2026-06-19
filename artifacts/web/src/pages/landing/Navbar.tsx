import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Analytics } from "@/lib/analytics";

export function Navbar({ containerRef }: { containerRef?: React.RefObject<HTMLDivElement | null> }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = containerRef?.current || window;

    const handleScroll = () => {
      const scrollPos = containerRef?.current ? containerRef.current.scrollTop : window.scrollY;
      setScrolled(scrollPos > 20);
    };

    el.addEventListener("scroll", handleScroll as any);
    return () => el.removeEventListener("scroll", handleScroll as any);
  }, [containerRef]);

  return (
    <>
      <header className={`fixed top-3 left-1/2 -translate-x-1/2 md:w-[calc(100%-60px)] w-[calc(100%)] max-w-[1440px] z-50 transition-all duration-300 ${scrolled
          ? "bg-transparent border-transparent "
          : "bg-transparent border-transparent pt-6 "
        }`}>
        <div className="flex justify-between items-center w-full px-6 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-8">
            <a href="/home" className="flex items-center gap-2">
              <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="h-6" />
              <span className="text-xl font-bold text-foreground tracking-tight">Commission<span className="text-primary">Kit</span></span>
            </a>

            <nav className="hidden md:flex gap-6 items-center">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Features</a>
              <a href="#solutions" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Solutions</a>
              <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a>
              <a href="/commission-calculator" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Calculator</a>
              <a href="https://docs.commissionk.it" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Documentations</a>
            </nav>
          </div>

          <div className="hidden md:flex items-center gap-2">
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
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 bg-background flex flex-col pt-28 px-6 transition-transform duration-300 md:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex flex-col gap-6 text-lg font-medium text-foreground">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Features</a>
          <a href="#solutions" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Solutions</a>
          <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Pricing</a>
          <a href="/commission-calculator" onClick={() => setMobileMenuOpen(false)} className="border-b border-border pb-4">Calculator</a>
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
