import { motion, type Variants } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;

const wordVariant: Variants = {
  hidden: { opacity: 0, y: "0.35em", filter: "blur(10px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 1, ease: EASE },
  },
};

interface AnimatedWordsProps {
  text: string;
  className?: string;
  inView: boolean;
  stagger?: number;
  delay?: number;
}

export function AnimatedWords({
  text,
  className,
  inView,
  stagger = 0.07,
  delay = 0,
}: AnimatedWordsProps) {
  const words = text.split(" ");
  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };

  return (
    <motion.span
      className={className}
      variants={container}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block" style={{ whiteSpace: "pre" }}>
          <motion.span variants={wordVariant} className="inline-block">
            {w}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

interface AnimatedBlockProps {
  children: React.ReactNode;
  className?: string;
  inView: boolean;
  delay?: number;
  y?: number;
}

export function AnimatedBlock({
  children,
  className,
  inView,
  delay = 0,
  y = 16,
}: AnimatedBlockProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: "blur(8px)" }}
      animate={
        inView
          ? { opacity: 1, y: 0, filter: "blur(0px)" }
          : { opacity: 0, y, filter: "blur(8px)" }
      }
      transition={{ duration: 0.6, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}