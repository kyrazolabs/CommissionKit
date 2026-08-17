export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none">
      <rect width="56" height="56" rx="14" fill="#111827" />
      <line
        x1="16"
        y1="40"
        x2="40"
        y2="16"
        stroke="#0D9488"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <circle cx="20" cy="20" r="5" fill="#0D9488" />
      <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
      <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
    </svg>
  );
}

export function Logo() {
  return (
    <a href="#" className="flex items-center gap-2.5 no-underline">
      <LogoMark size={32} />
      <span className="font-semibold text-[17px]" style={{ color: "#EDEDED" }}>
        Commission<span style={{ color: "#0D9488" }}>Kit</span>
      </span>
    </a>
  );
}
