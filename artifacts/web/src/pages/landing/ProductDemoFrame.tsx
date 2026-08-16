import { AnimatePresence, motion } from "framer-motion";

interface FrameProps {
  children: React.ReactNode;
  sceneKey: string;
}

export function ProductDemoFrame({ children, sceneKey }: FrameProps) {
  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-card-border shadow-2xl bg-card"
      style={{ aspectRatio: "16/10" }}
    >
      {/* Dot-grid background */}
      <div
        className="h-full w-full p-4 relative"
        style={{
          backgroundImage: "radial-gradient(circle, hsl(var(--border) / 0.4) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={sceneKey}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10 h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
