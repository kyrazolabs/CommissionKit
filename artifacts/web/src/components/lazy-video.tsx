import { useEffect, useRef, useState } from "react";

interface LazyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  src: string;
}

export function LazyVideo({ src, className, ...props }: LazyVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoaded(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {loaded ? (
        <video
          className="rounded-xl shadow-lg w-full border border-border/30 transition-transform hover:scale-[1.02] duration-500"
          autoPlay
          loop
          muted
          playsInline
          {...props}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div className="rounded-xl shadow-lg w-full border border-border/30 bg-muted/20 aspect-video" />
      )}
    </div>
  );
}
