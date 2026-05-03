export function LogoB() {
  return (
    <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Option B — Chart Wordmark</div>

      {/* Main logo */}
      <div className="flex flex-col items-center gap-6">
        {/* Large version */}
        <div className="flex items-center gap-3">
          {/* Custom SVG icon: rising bars */}
          <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
            <rect width="52" height="52" rx="14" fill="#0D9488" />
            {/* Bar chart going up-right */}
            <rect x="10" y="32" width="7" height="10" rx="2" fill="rgba(255,255,255,0.5)" />
            <rect x="20" y="24" width="7" height="18" rx="2" fill="rgba(255,255,255,0.75)" />
            <rect x="30" y="16" width="7" height="26" rx="2" fill="white" />
            {/* Upward arrow on top right bar */}
            <path d="M37 10L41 14M41 14H37M41 14V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="leading-none">
            <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 300, fontSize: 28, color: "#111827", letterSpacing: "-1px", lineHeight: 1 }}>
              commission
            </div>
            <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 800, fontSize: 28, color: "#0D9488", letterSpacing: "-1px", lineHeight: 1, marginTop: 2 }}>
              KIT
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-64 h-px bg-gray-200" />

        {/* Medium version */}
        <div className="flex items-center gap-2.5">
          <svg width="30" height="30" viewBox="0 0 52 52" fill="none">
            <rect width="52" height="52" rx="14" fill="#0D9488" />
            <rect x="10" y="32" width="7" height="10" rx="2" fill="rgba(255,255,255,0.5)" />
            <rect x="20" y="24" width="7" height="18" rx="2" fill="rgba(255,255,255,0.75)" />
            <rect x="30" y="16" width="7" height="26" rx="2" fill="white" />
            <path d="M37 10L41 14M41 14H37M41 14V10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 300, fontSize: 16, color: "#111827", letterSpacing: "-0.5px" }}>
            commission<span style={{ fontWeight: 800, color: "#0D9488" }}>KIT</span>
          </span>
        </div>

        {/* Inline horizontal rule version */}
        <div className="flex items-center gap-0">
          <svg width="20" height="20" viewBox="0 0 52 52" fill="none">
            <rect width="52" height="52" rx="14" fill="#0D9488" />
            <rect x="10" y="32" width="7" height="10" rx="2" fill="rgba(255,255,255,0.5)" />
            <rect x="20" y="24" width="7" height="18" rx="2" fill="rgba(255,255,255,0.75)" />
            <rect x="30" y="16" width="7" height="26" rx="2" fill="white" />
          </svg>
          <span style={{ fontFamily: "system-ui", fontSize: 11, color: "#6B7280", marginLeft: 8, fontWeight: 500 }}>Favicon / App icon scale</span>
        </div>
      </div>

      <div className="mt-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200">
        <span style={{ fontFamily: "system-ui", fontSize: 12, color: "#0F766E", fontWeight: 500 }}>Rising bars icon · Light/bold split wordmark · Tall contrast</span>
      </div>
    </div>
  );
}
