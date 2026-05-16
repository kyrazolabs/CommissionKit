import { Play } from "lucide-react";
import { useInView, fadeIn } from "./hooks";

export function Demo() {
  const { ref, inView } = useInView();

  return (
    <section className="bg-slate-50 py-28 px-6 border-b border-slate-200" id="demo">
      <div ref={ref} className="max-w-[1000px] mx-auto">
        <div className="text-center mb-16" style={fadeIn(inView)}>
          <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold leading-tight text-slate-900 tracking-tight mb-4">
            See CommissionKit in action
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Watch how a RevOps manager runs a full quarter's commission in under 3 minutes.
          </p>
        </div>

        {/* Video Placeholder Container */}
        <div
          className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-xl group cursor-pointer"
          style={{ aspectRatio: "16/9", ...fadeIn(inView, 200) }}
        >
          {/* Decorative gradients inside placeholder */}
          <div className="absolute inset-0 bg-gradient-to-tr from-teal-900/40 via-slate-900 to-slate-800" />
          
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-teal-500 flex items-center justify-center shadow-[0_0_40px_rgba(20,184,166,0.4)] group-hover:scale-110 group-hover:bg-teal-400 transition-all duration-300">
              <Play className="size-6 text-white ml-1" fill="currentColor" />
            </div>
            <p className="text-white/80 font-medium mt-4 text-sm tracking-wide">
              Watch the 3-minute demo
            </p>
          </div>

          {/* TODO: Replace above with actual iframe when ready */}
          {/* <iframe src="https://www.youtube.com/embed/your-video-id" title="Product Demo" className="absolute inset-0 w-full h-full" allowFullScreen></iframe> */}
        </div>

        {/* Quick stats under video */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 border-t border-slate-200 pt-16">
          {[
            { label: "Average setup time", value: "< 30 mins" },
            { label: "Time saved per month", value: "14 hours" },
            { label: "Dispute reduction", value: "99%" },
          ].map((stat, i) => (
            <div key={stat.label} className="text-center" style={fadeIn(inView, 300 + i * 100)}>
              <div className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500 uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
