export function LogoA() {
  return (
    <div className="min-h-screen bg-[#F4F7F6] flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Option A — Monogram Mark</div>

      {/* Main logo */}
      <div className="flex flex-col items-center gap-6">
        {/* Large version */}
        <div className="flex items-center gap-4">
          <div
            className="flex items-center justify-center rounded-[18px] shadow-lg"
            style={{ width: 64, height: 64, background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)" }}
          >
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <text x="4" y="26" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="22" fill="white" letterSpacing="-1">CK</text>
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 800, fontSize: 26, color: "#111827", letterSpacing: "-0.5px" }}>
              Commission<span style={{ color: "#0D9488" }}>Kit</span>
            </span>
            <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 400, fontSize: 11, color: "#6B7280", letterSpacing: "2px", textTransform: "uppercase", marginTop: 3 }}>
              Commission Tracking
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-64 h-px bg-gray-200" />

        {/* Small version */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-[10px]"
            style={{ width: 36, height: 36, background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)" }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <text x="2" y="15" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="13" fill="white" letterSpacing="-0.5">CK</text>
            </svg>
          </div>
          <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 700, fontSize: 15, color: "#111827", letterSpacing: "-0.3px" }}>
            Commission<span style={{ color: "#0D9488" }}>Kit</span>
          </span>
        </div>

        {/* Icon only */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-[8px]"
            style={{ width: 24, height: 24, background: "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <text x="1" y="11" fontFamily="system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="9" fill="white" letterSpacing="-0.3">CK</text>
            </svg>
          </div>
          <span style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontWeight: 500, fontSize: 12, color: "#6B7280" }}>Favicon / App icon scale</span>
        </div>
      </div>

      <div className="mt-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200">
        <span style={{ fontFamily: "system-ui", fontSize: 12, color: "#0F766E", fontWeight: 500 }}>Bold monogram · Gradient square · Teal accent wordmark</span>
      </div>
    </div>
  );
}
