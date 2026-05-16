import { useInView, fadeIn } from "./hooks";

const LOGO_SLOTS = [
  { id: "acme", w: 80, label: "Acme Corp" },
  { id: "vertex", w: 72, label: "Vertex" },
  { id: "northstar", w: 90, label: "NorthStar" },
  { id: "apex", w: 64, label: "Apex" },
  { id: "meridian", w: 86, label: "Meridian" },
  { id: "skyline", w: 76, label: "Skyline" },
];

function WordmarkPlaceholder({ label, w }: { label: string; w: number }) {
  return (
    <svg width={w} height={22} viewBox={`0 0 ${w} 22`} fill="none" aria-label={label}>
      <text
        x="0"
        y="16"
        fontFamily="'Inter', -apple-system, sans-serif"
        fontSize="13"
        fontWeight="700"
        letterSpacing="0.06em"
        fill="currentColor"
      >
        {label.toUpperCase()}
      </text>
    </svg>
  );
}

export function SocialProof() {
  const { ref, inView } = useInView(0.15);

  return (
    <section className="bg-white border-y border-slate-200 py-12 px-6">
      <div ref={ref} className="max-w-[1000px] mx-auto" style={fadeIn(inView)}>
        <p className="text-center text-xs font-semibold tracking-widest uppercase text-slate-400 mb-8">
          Trusted by modern sales teams
        </p>

        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          {LOGO_SLOTS.map((s) => (
            <div key={s.id} className="text-slate-400 hover:text-slate-900 transition-colors">
              <WordmarkPlaceholder label={s.label} w={s.w} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
