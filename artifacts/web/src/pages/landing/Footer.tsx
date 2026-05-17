import { motion, useTransform, MotionValue } from "framer-motion";
import { useIsMobile } from "./hooks";

interface FooterProps {
  scrollY?: MotionValue<number>;
}

export function Footer({ scrollY }: FooterProps) {
  const isMobile = useIsMobile();
  const travelDistance = isMobile ? 90 : 50;

  // Animate from travelDistance to 0, and opacity from 0 to 1 over scroll range [0, 400]
  const footerY = scrollY ? useTransform(scrollY, [0, 400], [travelDistance, 0]) : 0;
  const footerOpacity = scrollY ? useTransform(scrollY, [0, 400], [0, 1]) : 1;

  return (
    <motion.div
      style={{ y: footerY, opacity: footerOpacity }}
      className={`${
        scrollY ? "fixed bottom-0 left-0 right-0 z-50" : "w-full mt-auto"
      } flex justify-center pointer-events-none`}
    >
      <footer className="pointer-events-auto md:w-[calc(100%-60px)] w-[calc(100%)] max-w-[1440px] shrink-0 bg-transparent border-transparent">
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
    </motion.div>
  );
}

