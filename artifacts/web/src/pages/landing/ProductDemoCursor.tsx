import { motion } from "framer-motion";

interface CursorProps {
  x: number;
  y: number;
  clicking?: boolean;
  visible?: boolean;
}

export function ProductDemoCursor({ x, y, clicking = false, visible = true }: CursorProps) {
  return (
    <motion.div
      className="absolute top-0 left-0 pointer-events-none z-50"
      animate={{ x, y }}
      transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
      style={{ opacity: visible ? 1 : 0 }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g animate={{ scale: clicking ? 0.85 : 1 }} transition={{ duration: 0.1 }}>
          <path
            d="M3 3L10.5 20L13.5 13.5L20 10.5L3 3Z"
            fill="white"
            stroke="#1a1a1a"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M13.5 13.5L20 20" stroke="#1a1a1a" strokeWidth="1.5" strokeLinecap="round" />
        </motion.g>
      </svg>

      {clicking && (
        <motion.div
          className="absolute top-0 left-0 size-5 rounded-full border-2 border-primary/50 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0.5, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.4 }}
        />
      )}
    </motion.div>
  );
}
