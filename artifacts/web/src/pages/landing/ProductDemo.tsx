import { motion } from "framer-motion";
import { ArrowRight, Pause, Play, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useCalendly } from "@/hooks/use-calendly";
import { Analytics } from "@/lib/analytics";
import { type CursorStep, SCENES } from "./ProductDemo-scenes";
import { ProductDemoCursor } from "./ProductDemoCursor";
import { ProductDemoFrame } from "./ProductDemoFrame";

export function ProductDemo() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [cursorX, setCursorX] = useState(280);
  const [cursorY, setCursorY] = useState(140);
  const [clicking, setClicking] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [paused, setPaused] = useState(false);
  const [completed, setCompleted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openCalendly = useCalendly();

  const currentScene = SCENES[sceneIndex];
  const totalScenes = SCENES.length;

  const advance = useCallback(() => {
    if (!currentScene) return;

    const currentStep: CursorStep = currentScene.steps[stepIndex];

    if (currentStep) {
      setCursorX(currentStep.x);
      setCursorY(currentStep.y);
      setCursorVisible(true);

      if (currentStep.action === "click") {
        setClicking(true);
        setTimeout(() => setClicking(false), 200);
      } else {
        setClicking(false);
      }

      const nextStepIndex = stepIndex + 1;
      if (nextStepIndex < currentScene.steps.length) {
        timerRef.current = setTimeout(() => setStepIndex(nextStepIndex), currentStep.delay);
      } else {
        timerRef.current = setTimeout(() => {
          setCursorVisible(false);
          const nextScene = sceneIndex + 1;
          if (nextScene < totalScenes) {
            setTimeout(() => {
              setSceneIndex(nextScene);
              setStepIndex(0);
              setCursorVisible(true);
            }, 500);
          } else {
            setCompleted(true);
          }
        }, currentStep.delay);
      }
    }
  }, [currentScene, stepIndex, sceneIndex, totalScenes]);

  useEffect(() => {
    if (paused || completed) return;
    const t = setTimeout(advance, 300);
    return () => clearTimeout(t);
  }, [sceneIndex, stepIndex, paused, completed, advance]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const restart = () => {
    setSceneIndex(0);
    setStepIndex(0);
    setCompleted(false);
    setCursorVisible(true);
    setPaused(false);
  };

  return (
    <div className="relative group w-full">
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, hsl(var(--primary) / 0.10), transparent 60%)",
        }}
      />

      {/* Frame + scene content */}
      <div className="relative z-10 w-full">
        <ProductDemoFrame sceneKey={currentScene?.id ?? ""}>
          {/* Scene title badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="text-[11px] font-bold text-foreground">{currentScene?.title}</span>
            {currentScene?.badge && (
              <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                {currentScene.badge}
              </span>
            )}
          </div>

          {currentScene?.component}
        </ProductDemoFrame>

        {/* Cursor */}
        <ProductDemoCursor x={cursorX} y={cursorY} clicking={clicking} visible={cursorVisible} />

        {/* Progress dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
          {SCENES.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setSceneIndex(i);
                setStepIndex(0);
                setCursorVisible(true);
                setCompleted(false);
              }}
              className={`size-2 rounded-full transition-all ${
                i === sceneIndex
                  ? "bg-primary scale-125"
                  : i < sceneIndex
                    ? "bg-primary/40"
                    : "bg-muted-foreground/25 hover:bg-muted-foreground/40"
              }`}
              aria-label={`Scene ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-40">
        <button
          onClick={() => setPaused(!paused)}
          className="size-7 rounded-md bg-card/80 backdrop-blur-sm border border-card-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label={paused ? "Play" : "Pause"}
        >
          {paused ? (
            <Play className="size-3 text-foreground" />
          ) : (
            <Pause className="size-3 text-foreground" />
          )}
        </button>
        <button
          onClick={restart}
          className="size-7 rounded-md bg-card/80 backdrop-blur-sm border border-card-border flex items-center justify-center hover:bg-muted transition-colors"
          aria-label="Restart"
        >
          <RefreshCw className="size-3 text-foreground" />
        </button>
      </div>

      {/* Completion overlay */}
      {completed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center z-50 rounded-xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-background/75 backdrop-blur-sm" />
          <div className="relative z-10 text-center px-8 max-w-[260px]">
            <h4 className="text-sm font-bold text-foreground mb-1.5">That's CommissionKit</h4>
            <p className="text-[11px] text-muted-foreground mb-5 leading-relaxed">
              See it with your team's data in a 20-minute walkthrough.
            </p>
            <div className="flex flex-col gap-2">
              <Button
                size="sm"
                className="w-full font-bold shadow-md text-xs h-8 group/btn"
                onClick={() => {
                  Analytics.landingCTAClick("product_demo_calendly");
                  openCalendly();
                }}
              >
                Book a Demo
                <ArrowRight className="ml-1.5 size-3 transition-transform group-hover/btn:translate-x-0.5" />
              </Button>
              <button
                onClick={restart}
                className="text-[10px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                <RefreshCw className="size-2.5" />
                Replay
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
