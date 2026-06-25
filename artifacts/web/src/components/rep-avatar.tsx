import { useMemo } from "react";
import { Avatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

const avatarStyle = notionists;

interface RepAvatarProps {
  name: string;
  size?: number;
  className?: string;
}

export function RepAvatar({ name, size = 64, className }: RepAvatarProps) {
  const svg = useMemo(() => {
    const avatar = new Avatar(avatarStyle, {
      seed: name,
      size,
      radius: 50,
      backgroundColor: ["f0fdfa", "f0f9ff", "fefce8", "fdf2f8", "f0fdf4"],
    });
    return avatar.toDataUri();
  }, [name, size]);

  return (
    <img
      src={svg}
      alt={name}
      width={size}
      height={size}
      className={className}
    />
  );
}
