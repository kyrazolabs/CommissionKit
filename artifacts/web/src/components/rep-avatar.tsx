import { useMemo } from "react";

const STYLE = "notionists";
const COLORS = "f0fdfa,f0f9ff,fefce8,fdf2f8,f0fdf4";

interface RepAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function RepAvatar({ name, size = 64, className }: RepAvatarProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      seed: name,
      size: String(size),
      radius: "50",
      backgroundColor: COLORS,
    });
    return `https://api.dicebear.com/9.x/${STYLE}/svg?${params}`;
  }, [name, size]);

  return <img src={src} alt={name} width={size} height={size} className={className} />;
}
