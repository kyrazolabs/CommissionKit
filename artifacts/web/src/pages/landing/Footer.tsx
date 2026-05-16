import { Percent } from "lucide-react";

export function Footer() {
  return (
    <footer className="w-full shrink-0 bg-sidebar">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-6 py-4 max-w-[1440px] mx-auto gap-4">
        
        <div className="flex items-center gap-6">
          
          <p className="hidden md:block text-[11px] text-muted-foreground/80 font-medium tracking-wide">
            © {new Date().getFullYear()} COMMISSIONKIT. ALL RIGHTS RESERVED.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 items-center">
          <a href="/privacy" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">Privacy</a>
          <a href="/terms" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">Terms</a>
          <a href="/security" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">Security</a>
          <a href="mailto:sales@commissionkit.com" className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">Contact</a>
        </nav>

        <p className="md:hidden text-[10px] text-muted-foreground/70 font-medium tracking-wide">
          © {new Date().getFullYear()} COMMISSIONKIT
        </p>

      </div>
    </footer>
  );
}
