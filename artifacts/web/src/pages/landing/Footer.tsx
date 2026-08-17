import { Linkedin, Twitter } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto w-full px-4 py-6 border-t border-border bg-sidebar">
      <div className="flex flex-col justify-between items-center w-full max-w-6xl mx-auto gap-4">
        <div className="flex items-center gap-6">
          <p className="text-[11px] text-muted-foreground/80 font-medium tracking-wide">
            © {new Date().getFullYear()} COMMISSIONKIT. ALL RIGHTS RESERVED.
          </p>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 items-center">
          <a
            href="/privacy"
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Terms
          </a>
          <a
            href="/security"
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Security
          </a>
          <a
            href="/careers"
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Careers
          </a>
          <a
            href="/contact"
            className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors"
          >
            Contact
          </a>
          <a
            href="https://x.com/commissionkit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="X (Twitter)"
          >
            <Twitter className="size-3.5" />
          </a>
          <a
            href="https://www.linkedin.com/company/commisionkit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="LinkedIn"
          >
            <Linkedin className="size-3.5" />
          </a>
        </nav>
      </div>
    </footer>
  );
}
