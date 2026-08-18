import { useMemo } from "react";

const STYLE = "shapes";
const COLORS = "f0fdfa,ccfbf1,99f6e4,5eead4,14b8a6,0d9488";

interface WorkspaceAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function WorkspaceAvatar({ name, size = 64, className }: WorkspaceAvatarProps) {
  const src = useMemo(() => {
    const params = new URLSearchParams({
      seed: name,
      size: String(size),
      backgroundColor: COLORS,
    });
    return `https://api.dicebear.com/9.x/${STYLE}/svg?${params}`;
  }, [name, size]);

  return <img src={src} alt={name} width={size} height={size} className={className} />;
}
