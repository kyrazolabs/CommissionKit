interface AnimatedWordsProps {
  text: string;
  className?: string;
  inView?: boolean;
  stagger?: number;
  delay?: number;
}

export function AnimatedWords({ text, className }: AnimatedWordsProps) {
  return (
    <span className={className} aria-label={text}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block" style={{ whiteSpace: "pre" }}>
          {w}
          {i < text.split(" ").length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </span>
  );
}

interface AnimatedBlockProps {
  children: React.ReactNode;
  className?: string;
  inView?: boolean;
  delay?: number;
  y?: number;
}

export function AnimatedBlock({ children, className }: AnimatedBlockProps) {
  return <div className={className}>{children}</div>;
}
