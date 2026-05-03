export function LogoC() {
  return (
    <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Option C — Percentage Mark</div>

      {/* Main logo */}
      <div className="flex flex-col items-center gap-6">
        {/* Large version */}
        <div className="flex items-center gap-4">
          {/* Geometric percent / commission mark */}
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            {/* Background */}
            <rect width="56" height="56" rx="16" fill="#111827" />
            {/* Diagonal line */}
            <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
            {/* Top-left circle (small) */}
            <circle cx="20" cy="20" r="5" fill="#0D9488" />
            {/* Bottom-right circle (larger) */}
            <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
            {/* Inner dot */}
            <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
          </svg>

          <div className="flex flex-col leading-none">
            <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 26, color: "#111827", letterSpacing: "-0.5px" }}>
              Commission<span style={{ color: "#0D9488" }}>Kit</span>
            </span>
            <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 400, fontSize: 10, color: "#9CA3AF", letterSpacing: "2.5px", textTransform: "uppercase", marginTop: 4 }}>
              Sales Commission Platform
            </span>
          </div>
        </div>

        {/* Dark background version */}
        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl" style={{ background: "#111827" }}>
          <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#1F2937" />
            <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="5" fill="#0D9488" />
            <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
            <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
          </svg>
          <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 16, color: "white", letterSpacing: "-0.3px" }}>
            Commission<span style={{ color: "#2DD4BF" }}>Kit</span>
          </span>
        </div>

        {/* Small scale */}
        <div className="flex items-center gap-2">
          <svg width="22" height="22" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="16" fill="#111827" />
            <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="5" fill="#0D9488" />
            <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
            <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
          </svg>
          <span style={{ fontFamily: "system-ui", fontSize: 11, color: "#6B7280", fontWeight: 500 }}>Favicon / App icon scale</span>
        </div>
      </div>

      <div className="mt-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200">
        <span style={{ fontFamily: "system-ui", fontSize: 12, color: "#0F766E", fontWeight: 500 }}>% commission mark · Dark icon · Sleek minimal geometry</span>
      </div>
    </div>
  );
}
